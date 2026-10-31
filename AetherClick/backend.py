"""
AetherClick - Apple Liquid Glass Precision Auto Clicker
Native Windows Backend Engine (Zero external dependencies)
Uses Windows user32.dll via ctypes with SendInput hardware injection,
desktop station access, high-DPI awareness, sub-millisecond precision,
global OS-level hotkeys, cursor positioning, and macro recording/playback.
"""

import sys
import os

# Redirect None streams in GUI/noconsole mode
if sys.stdout is None:
    try:
        sys.stdout = open(os.devnull, 'w', encoding='utf-8')
    except Exception:
        pass
if sys.stderr is None:
    try:
        sys.stderr = open(os.devnull, 'w', encoding='utf-8')
    except Exception:
        pass

import time
import json
import threading
import random
import http.server
import socketserver
import urllib.parse
import subprocess
import winsound
import webbrowser
import ctypes
from ctypes import wintypes

# Initialize Per-Monitor High DPI Awareness so coordinates match 1:1 on scaled displays
try:
    ctypes.windll.shcore.SetProcessDpiAwareness(2) # PROCESS_PER_MONITOR_DPI_AWARE
except Exception: 
    try:
        ctypes.windll.user32.SetProcessDPIAware()
    except Exception:
        pass

# Win32 Constants
user32 = ctypes.windll.user32
kernel32 = ctypes.windll.kernel32

# Mouse flags
MOUSEEVENTF_MOVE = 0x0001
MOUSEEVENTF_LEFTDOWN = 0x0002
MOUSEEVENTF_LEFTUP = 0x0004
MOUSEEVENTF_RIGHTDOWN = 0x0008
MOUSEEVENTF_RIGHTUP = 0x0010
MOUSEEVENTF_MIDDLEDOWN = 0x0020
MOUSEEVENTF_MIDDLEUP = 0x0040
MOUSEEVENTF_ABSOLUTE = 0x8000

INPUT_MOUSE = 0
INPUT_KEYBOARD = 1
INPUT_HARDWARE = 2

# 64-bit and 32-bit safe SendInput Structures
class MOUSEINPUT(ctypes.Structure):
    _fields_ = [
        ('dx', wintypes.LONG),
        ('dy', wintypes.LONG),
        ('mouseData', wintypes.DWORD),
        ('dwFlags', wintypes.DWORD),
        ('time', wintypes.DWORD),
        ('dwExtraInfo', ctypes.c_ulonglong)
    ]

class KEYBDINPUT(ctypes.Structure):
    _fields_ = [
        ('wVk', wintypes.WORD),
        ('wScan', wintypes.WORD),
        ('dwFlags', wintypes.DWORD),
        ('time', wintypes.DWORD),
        ('dwExtraInfo', ctypes.c_ulonglong)
    ]

class HARDWAREINPUT(ctypes.Structure):
    _fields_ = [
        ('uMsg', wintypes.DWORD),
        ('wParamL', wintypes.WORD),
        ('wParamH', wintypes.WORD)
    ]

class _INPUT_UNION(ctypes.Union):
    _fields_ = [
        ('mi', MOUSEINPUT),
        ('ki', KEYBDINPUT),
        ('hi', HARDWAREINPUT)
    ]

class INPUT(ctypes.Structure):
    _anonymous_ = ('u',)
    _fields_ = [
        ('type', wintypes.DWORD),
        ('u', _INPUT_UNION)
    ]

# Setup Win32 Function Signatures
user32.SendInput.argtypes = [wintypes.UINT, ctypes.POINTER(INPUT), ctypes.c_int]
user32.SendInput.restype = wintypes.UINT

user32.GetCursorPos.argtypes = [ctypes.POINTER(wintypes.POINT)]
user32.GetCursorPos.restype = wintypes.BOOL

user32.SetCursorPos.argtypes = [ctypes.c_int, ctypes.c_int]
user32.SetCursorPos.restype = wintypes.BOOL

user32.mouse_event.argtypes = [wintypes.DWORD, wintypes.DWORD, wintypes.DWORD, wintypes.DWORD, ctypes.c_ulonglong]
user32.mouse_event.restype = None

user32.GetAsyncKeyState.argtypes = [ctypes.c_int]
user32.GetAsyncKeyState.restype = wintypes.SHORT

user32.OpenInputDesktop.argtypes = [wintypes.DWORD, wintypes.BOOL, wintypes.DWORD]
user32.OpenInputDesktop.restype = wintypes.HANDLE

user32.SetThreadDesktop.argtypes = [wintypes.HANDLE]
user32.SetThreadDesktop.restype = wintypes.BOOL

user32.IsWindowVisible.argtypes = [wintypes.HWND]
user32.IsWindowVisible.restype = wintypes.BOOL

user32.GetWindowTextLengthW.argtypes = [wintypes.HWND]
user32.GetWindowTextLengthW.restype = ctypes.c_int

user32.GetWindowTextW.argtypes = [wintypes.HWND, wintypes.LPWSTR, ctypes.c_int]
user32.GetWindowTextW.restype = ctypes.c_int

user32.ShowWindow.argtypes = [wintypes.HWND, ctypes.c_int]
user32.ShowWindow.restype = wintypes.BOOL

user32.PostMessageW.argtypes = [wintypes.HWND, wintypes.UINT, wintypes.WPARAM, wintypes.LPARAM]
user32.PostMessageW.restype = wintypes.BOOL

# Virtual Key Codes map
VK_MAP = {
    'F1': 0x70, 'F2': 0x71, 'F3': 0x72, 'F4': 0x73,
    'F5': 0x74, 'F6': 0x75, 'F7': 0x76, 'F8': 0x77,
    'F9': 0x78, 'F10': 0x79, 'F11': 0x7A, 'F12': 0x7B,
    'ESC': 0x1B, 'SPACE': 0x20, 'TAB': 0x09, 'ENTER': 0x0D,
    'CTRL': 0x11, 'ALT': 0x12, 'SHIFT': 0x10,
    'PAGEUP': 0x21, 'PAGEDOWN': 0x22, 'HOME': 0x24, 'END': 0x23,
    'INSERT': 0x2D, 'DELETE': 0x2E,
}
for c in range(ord('A'), ord('Z') + 1):
    VK_MAP[chr(c)] = c
for c in range(ord('0'), ord('9') + 1):
    VK_MAP[chr(c)] = c

class ClickerState:
    def __init__(self):
        self.is_clicking = False
        self.click_thread = None
        self.total_clicks = 0
        self.clicks_in_window = []
        self.lock = threading.Lock()
        
        # Click Interval Settings
        self.interval_mode = 'fixed'  # 'fixed' or 'random'
        self.hours = 0
        self.minutes = 0
        self.seconds = 0
        self.milliseconds = 100  # Default 100ms (10 CPS)
        
        self.random_min_ms = 50
        self.random_max_ms = 150
        
        # Click Options
        self.mouse_button = 'left'  # 'left', 'right', 'middle'
        self.click_type = 'single'  # 'single', 'double', 'triple'
        
        # Repeat Settings
        self.repeat_mode = 'infinite'  # 'infinite' or 'count'
        self.repeat_count = 100
        
        # Cursor Location
        self.location_mode = 'current'  # 'current' or 'pick'
        self.pick_x = 0
        self.pick_y = 0
        
        # Hotkeys
        self.hotkey_autoclick = 'F6'
        self.hotkey_record = 'F7'
        self.hotkey_playback = 'F8'
        
        # Macro State
        self.is_recording = False
        self.is_playing_macro = False
        self.macro_events = []
        self.macro_thread = None
        self.macro_speed = 1.0
        self.macro_repeat_count = 1
        self.macro_schedules = []
        self.macro_schedule_time = None
        self.macro_schedule_label = ""
        
        # Global PC Notification System
        self.global_notifications = True
        self.global_audio = True

state = ClickerState()

_desktop_initialized_threads = set()
def ensure_desktop_access():
    """Ensure worker thread attaches to the active interactive input desktop once without leaking handles."""
    t_id = threading.get_ident()
    if t_id in _desktop_initialized_threads:
        return
    try:
        hDesk = user32.OpenInputDesktop(0, False, 0x01FF)
        if hDesk:
            user32.SetThreadDesktop(hDesk)
            user32.CloseDesktop(hDesk)
    except Exception:
        pass
    _desktop_initialized_threads.add(t_id)

def get_vk_from_name(name):
    name_clean = str(name).strip().upper()
    return VK_MAP.get(name_clean, 0x75) # Default F6

def get_cursor_position():
    pt = wintypes.POINT()
    if user32.GetCursorPos(ctypes.byref(pt)):
        return int(pt.x), int(pt.y)
    return 0, 0

def set_cursor_position(x, y):
    ensure_desktop_access()
    user32.SetCursorPos(int(x), int(y))

def simulate_click(button='left', click_type='single', x=None, y=None):
    """
    Simulate a hardware-level mouse click using SendInput first,
    falling back to mouse_event if needed.
    """
    ensure_desktop_access()
    if x is not None and y is not None:
        user32.SetCursorPos(int(x), int(y))
        
    down_flag = MOUSEEVENTF_LEFTDOWN
    up_flag = MOUSEEVENTF_LEFTUP
    if button == 'right':
        down_flag = MOUSEEVENTF_RIGHTDOWN
        up_flag = MOUSEEVENTF_RIGHTUP
    elif button == 'middle':
        down_flag = MOUSEEVENTF_MIDDLEDOWN
        up_flag = MOUSEEVENTF_MIDDLEUP

    repeats = 1
    if click_type == 'double':
        repeats = 2
    elif click_type == 'triple':
        repeats = 3

    for i in range(repeats):
        sent = False
        try:
            inp_down = INPUT()
            inp_down.type = INPUT_MOUSE
            inp_down.mi.dwFlags = down_flag
            
            inp_up = INPUT()
            inp_up.type = INPUT_MOUSE
            inp_up.mi.dwFlags = up_flag
            
            r1 = user32.SendInput(1, ctypes.byref(inp_down), ctypes.sizeof(INPUT))
            time.sleep(0.003)
            r2 = user32.SendInput(1, ctypes.byref(inp_up), ctypes.sizeof(INPUT))
            if r1 > 0 and r2 > 0:
                sent = True
        except Exception:
            sent = False

        if not sent:
            user32.mouse_event(down_flag, 0, 0, 0, 0)
            time.sleep(0.003)
            user32.mouse_event(up_flag, 0, 0, 0, 0)

        if i < repeats - 1:
            time.sleep(0.025)

def calculate_delay_seconds():
    if state.interval_mode == 'random':
        min_sec = max(0.001, state.random_min_ms / 1000.0)
        max_sec = max(min_sec, state.random_max_ms / 1000.0)
        return random.uniform(min_sec, max_sec)
    else:
        total_ms = (state.hours * 3600000) + (state.minutes * 60000) + (state.seconds * 1000) + state.milliseconds
        if total_ms < 1:
            total_ms = 1
        return total_ms / 1000.0

def clicker_loop():
    ensure_desktop_access()
    clicks_performed = 0
    while state.is_clicking:
        # Check target coordinate
        if state.location_mode == 'pick':
            set_cursor_position(state.pick_x, state.pick_y)
        
        # Fire click
        simulate_click(button=state.mouse_button, click_type=state.click_type)
        clicks_performed += 1
        
        # Update statistics
        now = time.time()
        with state.lock:
            state.total_clicks += 1
            state.clicks_in_window.append(now)
            # Purge clicks older than 1 second for CPS calculation
            state.clicks_in_window = [t for t in state.clicks_in_window if now - t <= 1.0]

        # Check repeat limit
        if state.repeat_mode == 'count' and clicks_performed >= state.repeat_count:
            state.is_clicking = False
            break

        # High-precision sleep without CPU pinning
        delay = calculate_delay_seconds()
        target_time = time.perf_counter() + delay
        while state.is_clicking and time.perf_counter() < target_time:
            remaining = target_time - time.perf_counter()
            if remaining > 0.002:
                time.sleep(0.001)
            elif remaining > 0.0004:
                time.sleep(0)

def get_resource_dir():
    # 1. Explicit argument passed via CLI
    if len(sys.argv) > 2 and os.path.isdir(sys.argv[2]):
        return sys.argv[2]
    
    # 2. Candidate paths
    candidates = []
    if getattr(sys, 'frozen', False):
        exe_dir = os.path.dirname(sys.executable)
        candidates.append(exe_dir)
        if hasattr(sys, '_MEIPASS'):
            candidates.append(sys._MEIPASS)
        candidates.append(os.path.abspath(os.path.join(exe_dir, '..')))
        candidates.append(os.path.abspath(os.path.join(exe_dir, '..', 'app')))
        candidates.append(os.path.abspath(os.path.join(exe_dir, '..', 'engine')))

    try:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        candidates.append(script_dir)
        candidates.append(os.path.abspath(os.path.join(script_dir, '..')))
    except Exception:
        pass

    candidates.append(os.getcwd())

    for c in candidates:
        if c and os.path.isdir(c) and os.path.isfile(os.path.join(c, 'index.html')):
            return c

    return candidates[0] if candidates else os.getcwd()

active_webview_window = None

def get_aether_hwnd():
    target_hwnd = None
    def enum_cb(hwnd, lparam):
        nonlocal target_hwnd
        if user32.IsWindowVisible(hwnd):
            length = user32.GetWindowTextLengthW(hwnd)
            if length > 0:
                buff = ctypes.create_unicode_buffer(length + 1)
                user32.GetWindowTextW(hwnd, buff, length + 1)
                val = buff.value
                if "AetherClick" in val and "Antigravity" not in val and "Visual Studio" not in val:
                    target_hwnd = hwnd
                    return False
        return True
    
    WNDENUMPROC = ctypes.WINFUNCTYPE(ctypes.c_bool, wintypes.HWND, wintypes.LPARAM)
    user32.EnumWindows(WNDENUMPROC(enum_cb), 0)
    return target_hwnd

def minimize_aether_window():
    global active_webview_window
    try:
        if active_webview_window:
            active_webview_window.minimize()
            return True
    except Exception:
        pass
    hwnd = get_aether_hwnd()
    if hwnd:
        user32.ShowWindow(hwnd, 6) # SW_MINIMIZE = 6
        return True
    try:
        base_dir = get_resource_dir()
        mgr_script = os.path.join(base_dir, 'window_mgr.ps1')
        if os.path.exists(mgr_script):
            creationflags = 0x08000000 # CREATE_NO_WINDOW
            subprocess.run(['powershell.exe', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', mgr_script, '-Action', 'minimize'], creationflags=creationflags, timeout=2)
            return True
    except Exception:
        pass
    return False

def close_aether_window():
    global active_webview_window
    try:
        if active_webview_window:
            active_webview_window.destroy()
    except Exception:
        pass
    hwnd = get_aether_hwnd()
    if hwnd:
        user32.PostMessageW(hwnd, 0x0010, 0, 0) # WM_CLOSE
    try:
        base_dir = get_resource_dir()
        mgr_script = os.path.join(base_dir, 'window_mgr.ps1')
        if os.path.exists(mgr_script):
            creationflags = 0x08000000 # CREATE_NO_WINDOW
            subprocess.run(['powershell.exe', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', mgr_script, '-Action', 'close'], creationflags=creationflags, timeout=2)
    except Exception:
        pass
    def _exit():
        time.sleep(0.3)
        os._exit(0)
    threading.Thread(target=_exit, daemon=True).start()
    return True

def notify_global(title, message, sound='start'):
    """
    Fires global notification across the Windows PC:
    1. Zero-latency acoustic feedback via winsound.Beep
    2. Native Windows 10/11 Toast Notification Banner in Action Center
    """
    def _run():
        if getattr(state, 'global_audio', True):
            try:
                if sound == 'start':
                    winsound.Beep(880, 50)   # A5
                    winsound.Beep(1175, 70)  # D6
                elif sound == 'stop':
                    winsound.Beep(988, 50)   # B5
                    winsound.Beep(659, 80)   # E5
                elif sound == 'record':
                    winsound.Beep(1046, 50)  # C6
                    time.sleep(0.04)
                    winsound.Beep(1046, 60)
                elif sound == 'playback':
                    winsound.Beep(784, 40)   # G5
                    winsound.Beep(988, 40)   # B5
                    winsound.Beep(1318, 65)  # E6
                elif sound == 'finish':
                    winsound.Beep(1046, 90)  # C6
            except Exception:
                pass

        if getattr(state, 'global_notifications', True):
            try:
                base_dir = get_resource_dir()
                ps_script = os.path.join(base_dir, 'notify.ps1')
                logo_file = os.path.join(base_dir, 'logo.png')
                if os.path.exists(ps_script):
                    creationflags = 0x08000000  # CREATE_NO_WINDOW
                    cmd = [
                        'powershell.exe',
                        '-NoProfile',
                        '-NonInteractive',
                        '-ExecutionPolicy', 'Bypass',
                        '-File', ps_script,
                        '-Title', str(title),
                        '-Message', str(message),
                        '-LogoPath', logo_file
                    ]
                    subprocess.run(cmd, creationflags=creationflags, timeout=3, capture_output=True)
            except Exception:
                pass

    threading.Thread(target=_run, daemon=True).start()

def start_clicker():
    with state.lock:
        if state.is_clicking:
            return
        state.is_clicking = True
        state.clicks_in_window.clear()
        state.click_thread = threading.Thread(target=clicker_loop, daemon=True)
        state.click_thread.start()
        
    cps_str = f"{1000.0 / state.milliseconds:.1f} CPS" if (state.interval_mode == 'fixed' and state.milliseconds > 0) else "Active"
    notify_global(
        "AetherClick — Clicker Started",
        f"AutoClicker active at {cps_str} [{state.hotkey_autoclick}] • {state.mouse_button.capitalize()} Click",
        sound='start'
    )

def stop_clicker():
    with state.lock:
        if not state.is_clicking:
            return
        state.is_clicking = False
        clicks = state.total_clicks
        
    notify_global(
        "AetherClick — Clicker Stopped",
        f"AutoClicker paused [{state.hotkey_autoclick}] • {clicks:,} total clicks recorded",
        sound='stop'
    )

def get_current_cps():
    now = time.time()
    with state.lock:
        state.clicks_in_window = [t for t in state.clicks_in_window if now - t <= 1.0]
        return len(state.clicks_in_window)

# Global Hotkey Listener Thread
def global_hotkey_listener():
    ensure_desktop_access()
    last_state = False
    last_record_state = False
    last_playback_state = False
    
    while True:
        try:
            # Check Start/Stop Clicker Hotkey
            vk = get_vk_from_name(state.hotkey_autoclick)
            is_pressed = (user32.GetAsyncKeyState(vk) & 0x8000) != 0
            if is_pressed and not last_state:
                if state.is_clicking:
                    stop_clicker()
                else:
                    start_clicker()
            last_state = is_pressed

            # Check Record Hotkey
            vk_rec = get_vk_from_name(state.hotkey_record)
            is_rec_pressed = (user32.GetAsyncKeyState(vk_rec) & 0x8000) != 0
            if is_rec_pressed and not last_record_state:
                toggle_macro_recording()
            last_record_state = is_rec_pressed

            # Check Playback Hotkey
            vk_play = get_vk_from_name(state.hotkey_playback)
            is_play_pressed = (user32.GetAsyncKeyState(vk_play) & 0x8000) != 0
            if is_play_pressed and not last_playback_state:
                toggle_macro_playback()
            last_playback_state = is_play_pressed

        except Exception:
            pass
        time.sleep(0.02)

# Macro Recording & Playback
def start_macro_recording():
    with state.lock:
        state.is_recording = True
        state.macro_events = []
    threading.Thread(target=macro_recorder_loop, daemon=True).start()
    notify_global(
        "AetherClick — Recording Active",
        f"Capturing mouse movements & clicks in background. Press {state.hotkey_record} to finish.",
        sound='record'
    )

def stop_macro_recording():
    with state.lock:
        state.is_recording = False
        count = len(state.macro_events)
    notify_global(
        "AetherClick — Recording Saved",
        f"Captured {count} actions ready for playback [{state.hotkey_record}].",
        sound='stop'
    )

def toggle_macro_recording():
    if state.is_recording:
        stop_macro_recording()
    else:
        start_macro_recording()

def macro_recorder_loop():
    ensure_desktop_access()
    start_time = time.time()
    last_x, last_y = get_cursor_position()
    
    # State tracking for mouse buttons
    last_lmb = False
    last_rmb = False
    last_mmb = False
    
    while state.is_recording:
        cur_time = time.time() - start_time
        cx, cy = get_cursor_position()
        
        # Track movement (smooth 3px threshold to avoid spamming)
        if abs(cx - last_x) >= 3 or abs(cy - last_y) >= 3:
            state.macro_events.append({
                'type': 'move',
                't': round(cur_time, 3),
                'x': cx,
                'y': cy
            })
            last_x, last_y = cx, cy

        # Track clicks
        lmb = (user32.GetAsyncKeyState(0x01) & 0x8000) != 0
        rmb = (user32.GetAsyncKeyState(0x02) & 0x8000) != 0
        mmb = (user32.GetAsyncKeyState(0x04) & 0x8000) != 0

        if lmb and not last_lmb:
            state.macro_events.append({'type': 'click', 'button': 'left', 't': round(cur_time, 3), 'x': cx, 'y': cy})
        if rmb and not last_rmb:
            state.macro_events.append({'type': 'click', 'button': 'right', 't': round(cur_time, 3), 'x': cx, 'y': cy})
        if mmb and not last_mmb:
            state.macro_events.append({'type': 'click', 'button': 'middle', 't': round(cur_time, 3), 'x': cx, 'y': cy})

        last_lmb, last_rmb, last_mmb = lmb, rmb, mmb
        time.sleep(0.015)

def start_macro_playback(repeats=None):
    if not state.macro_events:
        notify_global(
            "AetherClick — Notice",
            f"No sequence recorded yet! Press {state.hotkey_record} to record actions first.",
            sound='stop'
        )
        return
    with state.lock:
        if repeats is not None:
            state.macro_repeat_count = max(1, int(repeats))
        state.is_playing_macro = True
    threading.Thread(target=macro_playback_loop, daemon=True).start()
    repeats_str = f"{state.macro_repeat_count}x loop" if state.macro_repeat_count > 1 else "1x"
    notify_global(
        "AetherClick — Sequence Playing",
        f"Playing macro sequence ({repeats_str}). Press {state.hotkey_playback} to halt.",
        sound='playback'
    )

def stop_macro_playback():
    with state.lock:
        if not state.is_playing_macro:
            return
        state.is_playing_macro = False
    notify_global(
        "AetherClick — Playback Halted",
        f"Macro sequence playback stopped [{state.hotkey_playback}].",
        sound='stop'
    )

def toggle_macro_playback(repeats=None):
    if state.is_playing_macro:
        stop_macro_playback()
    else:
        start_macro_playback(repeats=repeats)

def macro_playback_loop():
    ensure_desktop_access()
    if not state.macro_events:
        state.is_playing_macro = False
        return
        
    speed = max(0.1, state.macro_speed)
    total_repeats = max(1, getattr(state, 'macro_repeat_count', 1))
    
    current_iter = 0
    while state.is_playing_macro and current_iter < total_repeats:
        start_time = time.time()
        for event in state.macro_events:
            if not state.is_playing_macro:
                break
            
            target_t = event['t'] / speed
            elapsed = time.time() - start_time
            if target_t > elapsed:
                time.sleep(target_t - elapsed)
                
            if event['type'] == 'move':
                set_cursor_position(event['x'], event['y'])
            elif event['type'] == 'click':
                simulate_click(button=event.get('button', 'left'), x=event.get('x'), y=event.get('y'))
                
        current_iter += 1
        if current_iter < total_repeats and state.is_playing_macro:
            time.sleep(0.08) # Micro-pause between sequence loops
            
    if state.is_playing_macro:
        notify_global(
            "AetherClick — Playback Complete",
            "Macro sequence finished successfully.",
            sound='finish'
        )
    state.is_playing_macro = False

def macro_scheduler_loop():
    ensure_desktop_access()
    while True:
        try:
            now = time.time()
            with state.lock:
                # Find due items in multi-schedule queue
                due_items = [s for s in state.macro_schedules if s['timestamp'] <= now]
                if due_items and not state.is_playing_macro:
                    earliest = due_items[0]
                    state.macro_schedules.remove(earliest)
                    repeats = earliest.get('repeats', 1)
                    label = earliest.get('label') or 'Scheduled Sequence'
                    notify_global(
                        "AetherClick — Scheduled Run",
                        f"Executing scheduled macro: {label} ({repeats}x loop)",
                        sound='playback'
                    )
                    if state.macro_events:
                        start_macro_playback(repeats=repeats)
                        
                # Keep state.macro_schedule_time synced to earliest upcoming schedule
                if state.macro_schedules:
                    state.macro_schedules.sort(key=lambda s: s['timestamp'])
                    state.macro_schedule_time = state.macro_schedules[0]['timestamp']
                    state.macro_schedule_label = state.macro_schedules[0]['label']
                else:
                    state.macro_schedule_time = None
                    state.macro_schedule_label = ""
        except Exception:
            pass
        time.sleep(0.5)

def detect_windows_dark_mode():
    try:
        import winreg
        key = winreg.OpenKey(
            winreg.HKEY_CURRENT_USER,
            r"Software\Microsoft\Windows\CurrentVersion\Themes\Personalize"
        )
        value, _ = winreg.QueryValueEx(key, "AppsUseLightTheme")
        winreg.CloseKey(key)
        return "light" if value == 1 else "dark"
    except Exception:
        return "dark"

# HTTP API Request Handler
class AetherRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=get_resource_dir(), **kwargs)

    def log_message(self, format, *args):
        pass

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == '/api/status':
            cx, cy = get_cursor_position()
            response = {
                'running': state.is_clicking,
                'total_clicks': state.total_clicks,
                'cps': get_current_cps(),
                'hotkey': state.hotkey_autoclick,
                'hotkey_record': state.hotkey_record,
                'hotkey_playback': state.hotkey_playback,
                'cursor': {'x': cx, 'y': cy},
                'is_recording': state.is_recording,
                'is_playing_macro': state.is_playing_macro,
                'macro_event_count': len(state.macro_events),
                'macro_schedule_time': state.macro_schedule_time,
                'macro_schedule_label': state.macro_schedule_label,
                'macro_schedules': list(state.macro_schedules),
                'macro_repeat_count': state.macro_repeat_count,
                'global_notifications': getattr(state, 'global_notifications', True),
                'global_audio': getattr(state, 'global_audio', True),
                'system_theme': detect_windows_dark_mode(),
                'settings': {
                    'interval_mode': state.interval_mode,
                    'hours': state.hours,
                    'minutes': state.minutes,
                    'seconds': state.seconds,
                    'milliseconds': state.milliseconds,
                    'random_min_ms': state.random_min_ms,
                    'random_max_ms': state.random_max_ms,
                    'mouse_button': state.mouse_button,
                    'click_type': state.click_type,
                    'repeat_mode': state.repeat_mode,
                    'repeat_count': state.repeat_count,
                    'location_mode': state.location_mode,
                    'pick_x': state.pick_x,
                    'pick_y': state.pick_y,
                    'macro_speed': state.macro_speed
                }
            }
            self.send_json(response)
        elif parsed.path == '/api/cursor':
            cx, cy = get_cursor_position()
            self.send_json({'x': cx, 'y': cy})
        elif parsed.path == '/api/macro/events':
            self.send_json({'events': state.macro_events, 'count': len(state.macro_events)})
        else:
            return super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length) if content_length > 0 else b'{}'
        try:
            data = json.loads(body.decode('utf-8'))
        except Exception:
            data = {}

        if parsed.path == '/api/start':
            if 'settings' in data:
                self.update_settings(data['settings'])
            start_clicker()
            self.send_json({'success': True, 'running': True})

        elif parsed.path == '/api/stop':
            stop_clicker()
            self.send_json({'success': True, 'running': False})

        elif parsed.path == '/api/toggle':
            if state.is_clicking:
                stop_clicker()
            else:
                start_clicker()
            self.send_json({'success': True, 'running': state.is_clicking})

        elif parsed.path == '/api/settings':
            self.update_settings(data)
            self.send_json({'success': True})

        elif parsed.path == '/api/reset_counter':
            with state.lock:
                state.total_clicks = 0
                state.clicks_in_window.clear()
            self.send_json({'success': True})

        elif parsed.path == '/api/hotkeys':
            if 'autoclick' in data:
                state.hotkey_autoclick = str(data['autoclick']).strip().upper()
            if 'record' in data:
                state.hotkey_record = str(data['record']).strip().upper()
            if 'playback' in data:
                state.hotkey_playback = str(data['playback']).strip().upper()
            self.send_json({'success': True, 'hotkeys': {
                'autoclick': state.hotkey_autoclick,
                'record': state.hotkey_record,
                'playback': state.hotkey_playback
            }})

        elif parsed.path == '/api/macro/record':
            action = data.get('action')
            if action == 'start':
                start_macro_recording()
            elif action == 'stop':
                stop_macro_recording()
            elif action == 'clear':
                state.macro_events = []
            self.send_json({
                'success': True,
                'is_recording': state.is_recording,
                'event_count': len(state.macro_events),
                'events': state.macro_events
            })

        elif parsed.path == '/api/macro/playback':
            action = data.get('action')
            if 'speed' in data and data['speed'] is not None:
                try:
                    state.macro_speed = float(data['speed'])
                except (ValueError, TypeError):
                    pass
            if 'repeats' in data and data['repeats'] is not None:
                try:
                    state.macro_repeat_count = max(1, int(data['repeats']))
                except (ValueError, TypeError):
                    pass
            if 'events' in data:
                state.macro_events = data['events']
                
            if action == 'start':
                start_macro_playback(repeats=state.macro_repeat_count)
            elif action == 'stop':
                stop_macro_playback()
            self.send_json({'success': True, 'is_playing_macro': state.is_playing_macro})

        elif parsed.path == '/api/notify':
            title = data.get('title', 'AetherClick')
            message = data.get('message', '')
            sound = data.get('sound', 'start')
            notify_global(title, message, sound=sound)
            self.send_json({'success': True})

        elif parsed.path == '/api/window/minimize':
            minimize_aether_window()
            self.send_json({'success': True})

        elif parsed.path == '/api/window/close':
            self.send_json({'success': True})
            close_aether_window()

        elif parsed.path == '/api/open_browser':
            target_url = data.get('url', '')
            if target_url and (target_url.startswith('http://') or target_url.startswith('https://')):
                threading.Thread(target=lambda: webbrowser.open(target_url), daemon=True).start()
            self.send_json({'success': True})

        elif parsed.path == '/api/macro/schedule':
            action = data.get('action')
            with state.lock:
                if action in ('add', 'set'):
                    ts = data.get('timestamp')
                    label = data.get('label', '')
                    repeats = max(1, int(data.get('repeats', 1)))
                    sched_id = data.get('id') or f"sched_{int(time.time()*1000)}_{random.randint(100,999)}"
                    if ts:
                        state.macro_schedules.append({
                            'id': sched_id,
                            'timestamp': float(ts),
                            'label': str(label),
                            'repeats': repeats
                        })
                        state.macro_schedules.sort(key=lambda s: s['timestamp'])
                elif action == 'add_multiple':
                    items = data.get('schedules', [])
                    for item in items:
                        ts = item.get('timestamp')
                        if ts:
                            state.macro_schedules.append({
                                'id': item.get('id') or f"sched_{int(time.time()*1000)}_{random.randint(100,999)}",
                                'timestamp': float(ts),
                                'label': str(item.get('label', '')),
                                'repeats': max(1, int(item.get('repeats', 1)))
                            })
                    state.macro_schedules.sort(key=lambda s: s['timestamp'])
                elif action == 'remove':
                    sched_id = data.get('id')
                    state.macro_schedules = [s for s in state.macro_schedules if s.get('id') != sched_id]
                elif action in ('cancel', 'clear'):
                    state.macro_schedules = []

                if state.macro_schedules:
                    state.macro_schedules.sort(key=lambda s: s['timestamp'])
                    state.macro_schedule_time = state.macro_schedules[0]['timestamp']
                    state.macro_schedule_label = state.macro_schedules[0]['label']
                else:
                    state.macro_schedule_time = None
                    state.macro_schedule_label = ""

            self.send_json({
                'success': True,
                'macro_schedule_time': state.macro_schedule_time,
                'macro_schedule_label': state.macro_schedule_label,
                'macro_schedules': state.macro_schedules
            })

        else:
            self.send_error(404, "API endpoint not found")

    def update_settings(self, data):
        with state.lock:
            if 'interval_mode' in data: state.interval_mode = data['interval_mode']
            if 'hours' in data: state.hours = max(0, int(data['hours']))
            if 'minutes' in data: state.minutes = max(0, int(data['minutes']))
            if 'seconds' in data: state.seconds = max(0, int(data['seconds']))
            if 'milliseconds' in data: state.milliseconds = max(0, int(data['milliseconds']))
            if 'random_min_ms' in data: state.random_min_ms = max(1, int(data['random_min_ms']))
            if 'random_max_ms' in data: state.random_max_ms = max(state.random_min_ms, int(data['random_max_ms']))
            if 'mouse_button' in data: state.mouse_button = data['mouse_button']
            if 'click_type' in data: state.click_type = data['click_type']
            if 'repeat_mode' in data: state.repeat_mode = data['repeat_mode']
            if 'repeat_count' in data: state.repeat_count = max(1, int(data['repeat_count']))
            if 'location_mode' in data:
                mode_str = str(data['location_mode']).strip().lower()
                state.location_mode = 'pick' if mode_str == 'pick' else 'current'
            if 'pick_x' in data: state.pick_x = int(data['pick_x'])
            if 'pick_y' in data: state.pick_y = int(data['pick_y'])
            if 'macro_speed' in data: state.macro_speed = float(data['macro_speed'])
            if 'global_notifications' in data: state.global_notifications = bool(data['global_notifications'])
            if 'global_audio' in data: state.global_audio = bool(data['global_audio'])

    def send_json(self, payload):
        body = json.dumps(payload).encode('utf-8')
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(body)

def run_server(port=5678, web_dir=None):
    res_dir = web_dir or get_resource_dir()
    try:
        os.chdir(res_dir)
    except Exception:
        pass
    socketserver.TCPServer.allow_reuse_address = True
    server = socketserver.TCPServer(('127.0.0.1', port), AetherRequestHandler)
    print(f"[AetherClick] Engine running on http://127.0.0.1:{port} (Root: {res_dir})")
    
    # Start global hotkey listener
    hotkey_thread = threading.Thread(target=global_hotkey_listener, daemon=True)
    hotkey_thread.start()

    # Start macro scheduler background engine
    scheduler_thread = threading.Thread(target=macro_scheduler_loop, daemon=True)
    scheduler_thread.start()
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[AetherClick] Shutting down.")
        server.server_close()

if __name__ == '__main__':
    port = 5678
    web_dir = None
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            pass
    if len(sys.argv) > 2 and os.path.isdir(sys.argv[2]):
        web_dir = sys.argv[2]
    run_server(port, web_dir)
