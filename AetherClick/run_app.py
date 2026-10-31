"""
AetherClick - Apple Liquid Glass Precision Auto Clicker
Standalone Native Desktop Executable Entry Point
"""
import sys
import os

# Redirect None streams in GUI/noconsole mode so print/log does not raise AttributeError
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

import multiprocessing
multiprocessing.freeze_support()

import time
import subprocess
import threading
import urllib.request
import webbrowser

# Import the core clicker engine
import backend

def get_resource_dir():
    if getattr(sys, 'frozen', False) and hasattr(sys, '_MEIPASS'):
        return sys._MEIPASS
    return os.path.dirname(os.path.abspath(__file__))

def is_backend_alive(port=5678):
    try:
        url = f"http://127.0.0.1:{port}/api/status"
        req = urllib.request.Request(url, headers={'User-Agent': 'AetherClick-Check'})
        with urllib.request.urlopen(req, timeout=0.6) as resp:
            return resp.status == 200
    except Exception:
        return False

def find_app_browser():
    """Find installed Chrome, Brave, or Chromium browser for standalone app mode."""
    candidates = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\BraveSoftware\Brave-Browser\Application\brave.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"),
        os.path.expandvars(r"%LOCALAPPDATA%\BraveSoftware\Brave-Browser\Application\brave.exe"),
    ]
    for c in candidates:
        if os.path.isfile(c):
            return c
    return None

def start_backend_thread():
    if not is_backend_alive(5678):
        t = threading.Thread(target=lambda: backend.run_server(5678), daemon=True)
        t.start()
        # Wait up to 3 seconds for backend to start
        for _ in range(30):
            if is_backend_alive(5678):
                break
            time.sleep(0.1)

def main():
    # 1. Start the native clicker engine in background
    start_backend_thread()

    target_url = "http://127.0.0.1:5678"
    browser = find_app_browser()

    if browser:
        temp_dir = os.path.join(os.environ.get('TEMP', os.path.expanduser('~')), 'AetherClick_AppProfile')
        os.makedirs(temp_dir, exist_ok=True)

        cmd = [
            browser,
            f"--app={target_url}",
            "--window-size=480,820",
            f"--user-data-dir={temp_dir}",
            "--disable-extensions",
            "--disable-features=Translate,OptimizationHints,MediaRouter",
            "--no-first-run",
            "--no-default-browser-check",
            "--window-position=center"
        ]
        
        proc = subprocess.Popen(cmd, creationflags=0)
        
        # Give window a moment to appear
        time.sleep(1.2)
        
        # Monitor the application window lifecycle
        # If the window closes (or process terminates), exit completely
        while True:
            time.sleep(0.8)
            hwnd = backend.get_aether_hwnd()
            # If the browser process ended and no window is found, exit
            if proc.poll() is not None and not hwnd:
                break
        
        os._exit(0)
    else:
        # Fallback to system default browser if no Chrome/Brave found
        webbrowser.open(target_url)
        try:
            while True:
                time.sleep(1)
        except (KeyboardInterrupt, SystemExit):
            os._exit(0)

if __name__ == '__main__':
    main()
