/**
 * AetherClick - Apple Liquid Glass Precision Auto Clicker
 * Frontend Application Controller
 */

// Global State
const appState = {
  theme: 'system', // 'system', 'light', 'dark'
  accentColor: '#0A84FF',
  accentName: 'Electric Blue',
  activeTab: 'tabClicker',
  running: false,
  totalClicks: 0,
  cps: 0,
  hotkey: 'F6',
  hotkeyRecord: 'F7',
  hotkeyPlayback: 'F8',
  audioEnabled: true,
  actionAudioEnabled: true,
  audioPreset: 'haptic', // 'haptic', 'liquid', 'mechanical', 'scifi'
  audioVolume: 0.7,
  currentLocMode: 'current',
  repeatMode: 'infinite',
  intervalMode: 'fixed',
  liveCursor: { x: 0, y: 0 },
  macroEvents: [],
  isRecording: false,
  isPlayingMacro: false,
  macroScheduleTime: null,
  macroScheduleLabel: '',
  macroSchedules: [],
  macroRepeatCount: 1,
  bindingHotkeyTarget: null, // 'clicker', 'record', 'playback'
  pendingKey: null,
};

// Web Audio API Multi-Profile Sound Engine
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playUiSound(type = 'tap') {
  if (!appState.actionAudioEnabled && type !== 'click') return;
  if (type === 'click' && !appState.audioEnabled) return;

  try {
    const ctx = getAudioContext();
    const t = ctx.currentTime;
    const vol = Math.max(0.01, Math.min(1.0, appState.audioVolume));

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(vol, t);
    masterGain.connect(ctx.destination);

    if (type === 'click') {
      // Rapid mechanical click for autoclicker
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200, t);
      osc.frequency.exponentialRampToValueAtTime(180, t + 0.035);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(t);
      osc.stop(t + 0.04);
      return;
    }

    const preset = appState.audioPreset || 'haptic';

    if (type === 'tap') {
      if (preset === 'haptic') {
        // Apple Haptic: crisp acoustic sine pop
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1500, t);
        osc.frequency.exponentialRampToValueAtTime(240, t + 0.03);
        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(t);
        osc.stop(t + 0.035);
      } else if (preset === 'liquid') {
        // Liquid Glass: acoustic water drop droplet
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(900, t);
        osc1.frequency.exponentialRampToValueAtTime(1450, t + 0.045);
        osc2.frequency.setValueAtTime(1800, t);
        osc2.frequency.exponentialRampToValueAtTime(2900, t + 0.045);
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(masterGain);
        osc1.start(t);
        osc2.start(t);
        osc1.stop(t + 0.055);
        osc2.stop(t + 0.055);
      } else if (preset === 'mechanical') {
        // Mechanical switch: sharp square click
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, t);
        osc.frequency.exponentialRampToValueAtTime(120, t + 0.025);
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.025);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(t);
        osc.stop(t + 0.03);
      } else if (preset === 'scifi') {
        // Sci-Fi: high-tech acoustic chirp
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(2200, t);
        osc.frequency.exponentialRampToValueAtTime(700, t + 0.04);
        gain.gain.setValueAtTime(0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(t);
        osc.stop(t + 0.045);
      }
    } else if (type === 'tab') {
      // Fluid double glass chime
      [659.25, 880.0].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + idx * 0.035);
        gain.gain.setValueAtTime(0.12, t + idx * 0.035);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + idx * 0.035 + 0.07);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(t + idx * 0.035);
        osc.stop(t + idx * 0.035 + 0.08);
      });
    } else if (type === 'tick' || type === 'timerTick') {
      // Tactile acoustic ratchet micro-tick for dial timer, sliders, rulers, and bar scrubbers
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1750, t);
      osc.frequency.exponentialRampToValueAtTime(320, t + 0.012);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.014);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(t);
      osc.stop(t + 0.015);
    } else if (type === 'switch') {
      // Toggle upward micro-pop
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, t);
      osc.frequency.exponentialRampToValueAtTime(940, t + 0.04);
      gain.gain.setValueAtTime(0.14, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(t);
      osc.stop(t + 0.05);
    } else if (type === 'start') {
      // Ascending crystalline triad chord (C5 -> E5 -> G5)
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + idx * 0.045);
        gain.gain.setValueAtTime(0.14, t + idx * 0.045);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + idx * 0.045 + 0.12);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(t + idx * 0.045);
        osc.stop(t + idx * 0.045 + 0.13);
      });
    } else if (type === 'stop') {
      // Gentle warm descending resolve (G4 -> C4)
      [659.25, 440.0].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + idx * 0.04);
        gain.gain.setValueAtTime(0.12, t + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + idx * 0.04 + 0.09);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(t + idx * 0.04);
        osc.stop(t + idx * 0.04 + 0.1);
      });
    } else if (type === 'schedule') {
      // Bell chime with harmonic shimmer (C6, 1046Hz)
      const osc = ctx.createOscillator();
      const oscH = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      oscH.type = 'sine';
      osc.frequency.setValueAtTime(1046.5, t);
      oscH.frequency.setValueAtTime(2093.0, t);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      osc.connect(gain);
      oscH.connect(gain);
      gain.connect(masterGain);
      osc.start(t);
      oscH.start(t);
      osc.stop(t + 0.36);
      oscH.stop(t + 0.36);
    }
  } catch (e) {}
}

function playAppleClickSound() {
  playUiSound('click');
}

// ==========================================================================
// APPLE DYNAMIC ISLAND LIQUID TOAST / ALERT SYSTEM
// ==========================================================================
let activeToastTimeout = null;

function showLiquidAlert(message, type = 'warning', title = null) {
  const container = document.getElementById('liquidToastContainer');
  if (!container) {
    console.warn('[LiquidAlert]', title, message);
    return;
  }

  // Clear existing toast if any
  if (activeToastTimeout) {
    clearTimeout(activeToastTimeout);
    activeToastTimeout = null;
  }
  container.innerHTML = '';

  const defaultTitles = {
    warning: 'Action Required',
    error: 'Notice',
    success: 'Success',
    info: 'AetherClick'
  };

  const toastTitle = title || defaultTitles[type] || 'Notice';

  // Crisp Apple SVG Icons
  const icons = {
    warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
  };

  const iconSvg = icons[type] || icons.warning;

  const toast = document.createElement('div');
  toast.className = `liquid-toast toast-${type}`;
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `
    <div class="toast-content">
      <div class="toast-icon-wrap">
        ${iconSvg}
      </div>
      <div class="toast-body">
        <div class="toast-title">${toastTitle}</div>
        <div class="toast-message">${message}</div>
      </div>
      <button type="button" class="toast-close-btn" title="Dismiss">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="toast-progress-bar"></div>
  `;

  const closeToast = () => {
    toast.classList.remove('toast-entered');
    toast.classList.add('toast-leaving');
    setTimeout(() => {
      if (toast.parentNode === container) {
        container.removeChild(toast);
      }
    }, 240);
  };

  toast.querySelector('.toast-close-btn').addEventListener('click', closeToast);

  container.appendChild(toast);

  // Sound feedback
  playUiSound(type === 'success' ? 'schedule' : (type === 'error' ? 'stop' : 'tap'));

  // Trigger enter animation smoothly
  requestAnimationFrame(() => {
    toast.classList.add('toast-entered');
  });

  // Auto-dismiss after 4.8 seconds
  activeToastTimeout = setTimeout(closeToast, 4800);

  // Global Web Notification fallback when window is backgrounded or minimized
  if ('Notification' in window) {
    if (Notification.permission === 'granted' && document.hidden) {
      try {
        new Notification(`AetherClick — ${toastTitle}`, {
          body: message,
          icon: 'logo.png'
        });
      } catch (e) {}
    } else if (Notification.permission === 'default') {
      try { Notification.requestPermission(); } catch (e) {}
    }
  }
}

// Override global window.alert to intercept any native modal alerts
window.alert = function(msg) {
  showLiquidAlert(msg, 'warning');
};

// ==========================================================================
// THEME MANAGEMENT (Apple Dark Obsidian & White Snow Glass)
// ==========================================================================

let systemThemeDetected = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

function initTheme() {
  const saved = localStorage.getItem('aether_theme') || 'system';
  setTheme(saved);

  // System appearance media query listener
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    systemThemeDetected = e.matches ? 'dark' : 'light';
    if (appState.theme === 'system') {
      applyThemeToDOM('system');
    }
  });

  document.getElementById('btnThemeSystem').addEventListener('click', () => setTheme('system'));
  document.getElementById('btnThemeLight').addEventListener('click', () => setTheme('light'));
  document.getElementById('btnThemeDark').addEventListener('click', () => setTheme('dark'));
}

function setTheme(theme) {
  appState.theme = theme;
  localStorage.setItem('aether_theme', theme);

  const indicator = document.getElementById('themeIndicator');
  const btns = {
    system: document.getElementById('btnThemeSystem'),
    light: document.getElementById('btnThemeLight'),
    dark: document.getElementById('btnThemeDark'),
  };

  Object.values(btns).forEach(b => {
    if (b) b.classList.remove('active');
  });

  const activeBtn = btns[theme];
  if (activeBtn) {
    activeBtn.classList.add('active');
    if (indicator) {
      // Calculate dynamic offset inside segmented bar
      const offset = activeBtn.offsetLeft - (activeBtn.parentElement?.offsetLeft || 0);
      indicator.style.transform = `translateX(${activeBtn.offsetLeft - 2}px)`;
    }
  }

  applyThemeToDOM(theme);
}

function applyThemeToDOM(theme) {
  const root = document.documentElement;
  let resolvedTheme = theme;
  if (theme === 'system') {
    resolvedTheme = systemThemeDetected;
  }
  root.setAttribute('data-theme', resolvedTheme);
}

// ==========================================================================
// NAVIGATION TABS WITH SPRING PILL
// ==========================================================================

function initNav() {
  const navTabs = document.getElementById('navTabs');
  const indicator = document.getElementById('navIndicator');
  if (!navTabs || !indicator) return;

  const tabBtns = navTabs.querySelectorAll('.nav-item');
  const panes = document.querySelectorAll('.tab-pane');

  function updateNavIndicator(activeBtn) {
    if (!activeBtn || !indicator || !navTabs) return;
    const navRect = navTabs.getBoundingClientRect();
    const btnRect = activeBtn.getBoundingClientRect();
    const pad = 3; // internal padding of segmented-nav

    // Bounding offset within the container
    let left = btnRect.left - navRect.left;
    let width = btnRect.width;

    // Strict boundary clamping so the pill NEVER protrudes past the container border
    if (left < pad) left = pad;
    const maxRight = navRect.width - pad;
    if (left + width > maxRight) {
      width = Math.max(10, maxRight - left);
    }

    indicator.style.width = `${Math.round(width)}px`;
    indicator.style.transform = `translateX(${Math.round(left)}px)`;
  }

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');
      appState.activeTab = targetId;

      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      updateNavIndicator(btn);

      panes.forEach(p => {
        p.classList.remove('active');
        if (p.id === targetId) p.classList.add('active');
      });
    });
  });

  // Initial indicator placement with multi-phase layout passes
  const initialActive = navTabs.querySelector('.nav-item.active') || tabBtns[0];
  if (initialActive) {
    updateNavIndicator(initialActive);
    requestAnimationFrame(() => updateNavIndicator(initialActive));
    setTimeout(() => updateNavIndicator(initialActive), 60);
    setTimeout(() => updateNavIndicator(initialActive), 250);
  }

  // Handle window resize and layout changes
  window.addEventListener('resize', () => {
    const active = navTabs.querySelector('.nav-item.active');
    if (active) updateNavIndicator(active);
  });

  if (window.ResizeObserver) {
    const ro = new ResizeObserver(() => {
      const active = navTabs.querySelector('.nav-item.active');
      if (active) updateNavIndicator(active);
    });
    ro.observe(navTabs);
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      const active = navTabs.querySelector('.nav-item.active');
      if (active) updateNavIndicator(active);
    });
  }
}

// ==========================================================================
// CORE CLICKER SETTINGS
// ==========================================================================

function initClickerSettings() {
  // Interval mode toggle (Fixed vs Random)
  const btnFixed = document.getElementById('btnModeFixed');
  const btnRandom = document.getElementById('btnModeRandom');
  const viewFixed = document.getElementById('intervalFixedView');
  const viewRandom = document.getElementById('intervalRandomView');

  btnFixed.addEventListener('click', () => {
    appState.intervalMode = 'fixed';
    btnFixed.classList.add('active');
    btnRandom.classList.remove('active');
    viewFixed.style.display = 'block';
    viewRandom.style.display = 'none';
    syncSettingsToBackend();
  });

  btnRandom.addEventListener('click', () => {
    appState.intervalMode = 'random';
    btnRandom.classList.add('active');
    btnFixed.classList.remove('active');
    viewFixed.style.display = 'none';
    viewRandom.style.display = 'block';
    syncSettingsToBackend();
  });

  // Presets
  document.querySelectorAll('.preset-chip[data-ms]').forEach(chip => {
    chip.addEventListener('click', () => {
      const ms = parseInt(chip.getAttribute('data-ms'), 10);
      document.getElementById('inpHours').value = 0;
      document.getElementById('inpMins').value = 0;
      document.getElementById('inpSecs').value = Math.floor(ms / 1000);
      document.getElementById('inpMillis').value = ms % 1000 || (ms < 1000 ? ms : 0);
      syncSettingsToBackend();
    });
  });

  // Repeat Tiles (Infinite vs Count)
  const tileInf = document.getElementById('tileRepeatInfinite');
  const tileCount = document.getElementById('tileRepeatCount');
  tileInf.addEventListener('click', () => {
    appState.repeatMode = 'infinite';
    tileInf.classList.add('selected');
    tileCount.classList.remove('selected');
    syncSettingsToBackend();
  });
  tileCount.addEventListener('click', () => {
    appState.repeatMode = 'count';
    tileCount.classList.add('selected');
    tileInf.classList.remove('selected');
    syncSettingsToBackend();
  });

  // Location Mode Switcher
  const tileLocCur = document.getElementById('tileLocCurrent');
  const tileLocPick = document.getElementById('tileLocPick');

  tileLocCur.addEventListener('click', () => {
    setLocationMode('current');
  });

  tileLocPick.addEventListener('click', (e) => {
    if (e.target.closest('#btnPickCoordinates')) return;
    setLocationMode('pick');
  });

  const coordsRow = document.querySelector('.coords-pick-row');
  if (coordsRow) {
    coordsRow.addEventListener('click', (e) => {
      if (!e.target.closest('#btnPickCoordinates')) {
        setLocationMode('pick');
      }
    });
  }

  // Numeric and Select Inputs Change
  ['inpHours', 'inpMins', 'inpSecs', 'inpMillis', 'inpRandMin', 'inpRandMax',
   'selMouseButton', 'selClickType', 'inpRepeatCount', 'inpCoordX', 'inpCoordY'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', syncSettingsToBackend);
      el.addEventListener('input', syncSettingsToBackend);
    }
  });

  // Start / Stop Clicker Buttons
  document.getElementById('btnStartClicker').addEventListener('click', handleStartClickerButton);
  document.getElementById('btnStopClicker').addEventListener('click', stopClicker);

  // Counter Reset
  document.getElementById('btnResetCounter').addEventListener('click', async () => {
    try {
      await fetch('/api/reset_counter', { method: 'POST' });
      appState.totalClicks = 0;
      updateHudUI();
    } catch (e) {}
  });

  // Screen Coordinate Picker
  document.getElementById('btnPickCoordinates').addEventListener('click', openCoordinatePicker);
}

function setLocationMode(mode) {
  const isPick = (mode === 'pick');
  appState.currentLocMode = isPick ? 'pick' : 'current';
  try {
    localStorage.setItem('aether_loc_mode', appState.currentLocMode);
  } catch (e) {}

  const tileLocCur = document.getElementById('tileLocCurrent');
  const tileLocPick = document.getElementById('tileLocPick');

  if (tileLocCur && tileLocPick) {
    if (isPick) {
      tileLocPick.classList.add('selected');
      tileLocCur.classList.remove('selected');
    } else {
      tileLocCur.classList.add('selected');
      tileLocPick.classList.remove('selected');
    }
  }

  syncSettingsToBackend();
}

function getSettingsPayload() {
  return {
    interval_mode: appState.intervalMode,
    hours: parseInt(document.getElementById('inpHours').value) || 0,
    minutes: parseInt(document.getElementById('inpMins').value) || 0,
    seconds: parseInt(document.getElementById('inpSecs').value) || 0,
    milliseconds: parseInt(document.getElementById('inpMillis').value) || 100,
    random_min_ms: parseInt(document.getElementById('inpRandMin').value) || 50,
    random_max_ms: parseInt(document.getElementById('inpRandMax').value) || 150,
    mouse_button: document.getElementById('selMouseButton').value,
    click_type: document.getElementById('selClickType').value,
    repeat_mode: appState.repeatMode,
    repeat_count: parseInt(document.getElementById('inpRepeatCount').value) || 100,
    location_mode: appState.currentLocMode,
    pick_x: parseInt(document.getElementById('inpCoordX').value) || 0,
    pick_y: parseInt(document.getElementById('inpCoordY').value) || 0,
    macro_speed: parseFloat(document.getElementById('selMacroSpeed')?.value || 1.0)
  };
}

let syncTimeout = null;
function syncSettingsToBackend() {
  clearTimeout(syncTimeout);
  syncTimeout = setTimeout(async () => {
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(getSettingsPayload())
      });
    } catch (e) {}
  }, 80);
}

// Start Clicker with graceful 1s countdown if clicked via GUI button
let countdownTimer = null;
let countdownSecs = 0;

function handleStartClickerButton() {
  if (countdownTimer) {
    cancelCountdown();
    return;
  }

  // If in 'current' mode and initiated by clicking inside the app window,
  // give the user 1 second to move their mouse to the target window/game!
  if (appState.currentLocMode === 'current') {
    startCountdown(1);
  } else {
    executeStartClicker();
  }
}

function startCountdown(seconds) {
  countdownSecs = seconds;
  const btnStart = document.getElementById('btnStartClicker');
  const spanText = btnStart ? btnStart.querySelector('span:not(.hotkey-badge)') : null;
  const origText = 'Start Clicking';

  if (spanText) spanText.textContent = `Starting in ${countdownSecs}s...`;
  if (btnStart) btnStart.style.opacity = '0.9';

  countdownTimer = setInterval(() => {
    countdownSecs--;
    if (countdownSecs <= 0) {
      clearInterval(countdownTimer);
      countdownTimer = null;
      if (spanText) spanText.textContent = origText;
      if (btnStart) btnStart.style.opacity = '1';
      executeStartClicker();
    } else {
      if (spanText) spanText.textContent = `Starting in ${countdownSecs}s...`;
    }
  }, 1000);
}

function cancelCountdown() {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
  const btnStart = document.getElementById('btnStartClicker');
  if (btnStart) {
    btnStart.style.opacity = '1';
    const spanText = btnStart.querySelector('span:not(.hotkey-badge)');
    if (spanText) spanText.textContent = 'Start Clicking';
  }
}

async function executeStartClicker() {
  try {
    const res = await fetch('/api/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: getSettingsPayload() })
    });
    const data = await res.json();
    if (data.running) {
      setRunningState(true);
    }
  } catch (e) {
    console.error('Failed to start clicker:', e);
  }
}

async function stopClicker() {
  cancelCountdown();
  try {
    const res = await fetch('/api/stop', { method: 'POST' });
    const data = await res.json();
    setRunningState(false);
  } catch (e) {
    console.error('Failed to stop clicker:', e);
  }
}

let isInitialClickerCheck = true;

function setRunningState(isRunning) {
  const previous = appState.running;
  if (!isRunning) {
    cancelCountdown();
  }
  appState.running = isRunning;
  const btnStart = document.getElementById('btnStartClicker');
  const btnStop = document.getElementById('btnStopClicker');
  const pulseNode = document.getElementById('hudPulseNode');
  const lblStatus = document.getElementById('lblHudStatus');

  if (isRunning) {
    if (btnStart) btnStart.style.display = 'none';
    if (btnStop) btnStop.style.display = 'flex';
    if (pulseNode) pulseNode.classList.add('active');
    const locText = appState.currentLocMode === 'pick'
      ? `Fixed (${document.getElementById('inpCoordX')?.value || 0}, ${document.getElementById('inpCoordY')?.value || 0})`
      : 'Cursor Position';
    if (lblStatus) {
      lblStatus.textContent = `Active (${locText})`;
      lblStatus.style.color = 'var(--apple-green)';
    }
  } else {
    if (btnStart) btnStart.style.display = 'flex';
    if (btnStop) btnStop.style.display = 'none';
    if (pulseNode) pulseNode.classList.remove('active');
    if (lblStatus) {
      lblStatus.textContent = 'Ready';
      lblStatus.style.color = 'var(--text-primary)';
    }
  }

  // Liquid Notification System: Notify when user starts or stops clicking
  if (!isInitialClickerCheck && previous !== isRunning) {
    if (isRunning) {
      const cpsDisplay = appState.cps ? `${appState.cps} CPS` : 'Active';
      showLiquidAlert(`Auto-clicking is active at ${cpsDisplay}. Press ${appState.hotkey || 'F6'} to pause.`, 'success', 'Clicker Started');
    } else {
      const clickCount = appState.totalClicks ? appState.totalClicks.toLocaleString() : '0';
      showLiquidAlert(`Auto-clicking paused. ${clickCount} total clicks recorded.`, 'info', 'Clicker Stopped');
    }
  }
  isInitialClickerCheck = false;
}

// ==========================================================================
// COORDINATE PICKER OVERLAY (Uses Real OS Screen Coordinates)
// ==========================================================================

function openCoordinatePicker(e) {
  e.stopPropagation();
  const overlay = document.getElementById('pickerOverlay');
  const label = document.getElementById('pickerCoordsLabel');
  overlay.classList.add('active');

  function updateDisplay(x, y) {
    label.textContent = `X: ${x}, Y: ${y}`;
  }

  function onMouseMove(ev) {
    const curX = appState.liveCursor.x || ev.screenX;
    const curY = appState.liveCursor.y || ev.screenY;
    updateDisplay(curX, curY);
  }

  function onClick(ev) {
    ev.preventDefault();
    ev.stopPropagation();
    const finalX = appState.liveCursor.x || ev.screenX;
    const finalY = appState.liveCursor.y || ev.screenY;

    document.getElementById('inpCoordX').value = finalX;
    document.getElementById('inpCoordY').value = finalY;

    setLocationMode('pick');
    cleanup();
  }

  function onKeyDown(ev) {
    if (ev.key === 'Escape') {
      cleanup();
    }
  }

  function cleanup() {
    overlay.classList.remove('active');
    window.removeEventListener('mousemove', onMouseMove);
    overlay.removeEventListener('click', onClick);
    window.removeEventListener('keydown', onKeyDown);
  }

  window.addEventListener('mousemove', onMouseMove);
  overlay.addEventListener('click', onClick);
  window.addEventListener('keydown', onKeyDown);
}

// ==========================================================================
// MACRO STUDIO CONTROLLER & NOTIFICATIONS
// ==========================================================================

let isInitialMacroCheck = true;

function setRecordingState(isRec, events = null) {
  const previous = appState.isRecording;
  appState.isRecording = isRec;
  if (events) {
    appState.macroEvents = events;
    renderMacroTimeline(events);
  }
  updateMacroUI();

  // Liquid Notification System: Notify when user starts or stops recording
  if (!isInitialMacroCheck && previous !== isRec) {
    if (isRec) {
      showLiquidAlert(`Recording actions in background. Move mouse and click freely. Press ${appState.hotkeyRecord || 'F7'} to finish.`, 'warning', 'Recording Started');
    } else {
      const count = events ? events.length : (appState.macroEvents ? appState.macroEvents.length : 0);
      showLiquidAlert(`Recording stopped. Captured ${count} precise actions ready for playback.`, 'success', 'Recording Finished');
    }
  }
}

function setPlaybackState(isPlaying) {
  const previous = appState.isPlayingMacro;
  appState.isPlayingMacro = isPlaying;
  updateMacroUI();

  // Liquid Notification System: Notify when user plays sequence or finishes playback
  if (!isInitialMacroCheck && previous !== isPlaying) {
    if (isPlaying) {
      const repeats = appState.macroRepeatCount || 1;
      const loopText = repeats > 1 ? ` (${repeats}x loop)` : '';
      showLiquidAlert(`Playing back recorded sequence${loopText}. Press ${appState.hotkeyPlayback || 'F8'} to halt.`, 'info', 'Playback Started');
    } else {
      showLiquidAlert('Macro sequence playback has finished or was stopped.', 'success', 'Playback Finished');
    }
  }
}

function initMacroStudio() {
  const btnRec = document.getElementById('btnRecordToggle');
  const btnPlay = document.getElementById('btnPlayMacroToggle');
  const selSpeed = document.getElementById('selMacroSpeed');
  const btnClear = document.getElementById('btnClearMacro');
  const btnExport = document.getElementById('btnExportMacro');
  const btnImport = document.getElementById('btnImportMacro');
  const inpFile = document.getElementById('inpFileMacro');

  btnRec.addEventListener('click', async () => {
    const action = appState.isRecording ? 'stop' : 'start';
    try {
      const res = await fetch('/api/macro/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      setRecordingState(data.is_recording, action === 'stop' ? data.events : null);
    } catch (e) {}
  });

  const inpRepeat = document.getElementById('inpMacroRepeatCount');
  const btnRepeatMinus = document.getElementById('btnMacroRepeatMinus');
  const btnRepeatPlus = document.getElementById('btnMacroRepeatPlus');

  btnRepeatMinus?.addEventListener('click', () => {
    if (!inpRepeat) return;
    const cur = parseInt(inpRepeat.value || '1', 10);
    inpRepeat.value = Math.max(1, cur - 1);
    appState.macroRepeatCount = parseInt(inpRepeat.value, 10);
    playUiSound('tap');
  });

  btnRepeatPlus?.addEventListener('click', () => {
    if (!inpRepeat) return;
    const cur = parseInt(inpRepeat.value || '1', 10);
    inpRepeat.value = cur + 1;
    appState.macroRepeatCount = parseInt(inpRepeat.value, 10);
    playUiSound('tap');
  });

  inpRepeat?.addEventListener('change', () => {
    appState.macroRepeatCount = Math.max(1, parseInt(inpRepeat.value || '1', 10));
  });

  btnPlay.addEventListener('click', async () => {
    if (!appState.isPlayingMacro && (!appState.macroEvents || appState.macroEvents.length === 0)) {
      showLiquidAlert('No recorded sequence to play! Please record actions (F7) first.', 'warning', 'No Sequence Recorded');
      return;
    }
    const action = appState.isPlayingMacro ? 'stop' : 'start';
    const repeats = parseInt(inpRepeat?.value || '1', 10);
    try {
      const res = await fetch('/api/macro/playback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, speed: parseFloat(selSpeed.value), repeats })
      });
      const data = await res.json();
      setPlaybackState(data.is_playing_macro);
    } catch (e) {}
  });

  if (btnClear) {
    btnClear.addEventListener('click', async () => {
      try {
        await fetch('/api/macro/record', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'clear' })
        });
        appState.macroEvents = [];
        appState.macroEventCount = 0;
        renderMacroTimeline([]);
      } catch (e) {}
    });
  }

  selSpeed.addEventListener('change', () => {
    syncSettingsToBackend();
  });

  // Export macro to JSON file
  btnExport.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/macro/events');
      const data = await res.json();
      if (!data.events || data.events.length === 0) {
        showLiquidAlert('No recorded events to export. Press Record (F7) to capture actions first.', 'warning', 'Export Notice');
        return;
      }
      const blob = new Blob([JSON.stringify(data.events, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AetherClick_Macro_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showLiquidAlert(`Exported ${data.events.length} actions to JSON file.`, 'success', 'Macro Exported');
    } catch (e) {
      showLiquidAlert('Failed to export macro sequence file.', 'error', 'Export Error');
    }
  });

  // Import macro from JSON file
  btnImport.addEventListener('click', () => inpFile.click());
  inpFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const events = JSON.parse(ev.target.result);
        if (Array.isArray(events)) {
          await fetch('/api/macro/playback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'load', events })
          });
          appState.macroEvents = events;
          renderMacroTimeline(events);
          showLiquidAlert(`Successfully imported ${events.length} macro actions ready for playback!`, 'success', 'Import Complete');
        }
      } catch (err) {
        showLiquidAlert('Invalid JSON macro file format. Please choose a valid sequence export.', 'error', 'Import Error');
      }
    };
    reader.readAsText(file);
  });
}

function updateMacroUI() {
  const lblRec = document.getElementById('lblRecordBtn');
  const pulseRec = document.getElementById('recordPulse');
  const lblPlay = document.getElementById('lblPlayMacroBtn');
  const lblStatus = document.getElementById('lblMacroStatus');

  if (appState.isRecording) {
    lblRec.textContent = 'Stop Recording';
    pulseRec.classList.add('active');
    const count = appState.macroEventCount || 0;
    lblStatus.textContent = `Recording (${count} actions)...`;
    lblStatus.style.color = 'var(--apple-red)';
  } else {
    lblRec.textContent = 'Start Recording';
    pulseRec.classList.remove('active');
  }

  if (appState.isPlayingMacro) {
    lblPlay.textContent = 'Stop Playback';
    lblStatus.textContent = 'Replaying Sequence...';
    lblStatus.style.color = 'var(--apple-cyan)';
  } else if (!appState.isRecording) {
    lblPlay.textContent = 'Play Sequence';
    lblStatus.textContent = appState.macroEvents.length ? `${appState.macroEvents.length} Actions Ready` : 'Idle';
    lblStatus.style.color = 'var(--text-tertiary)';
  }
}

function renderMacroTimeline(events) {
  if (window.updateMacroSequenceHintUI) {
    window.updateMacroSequenceHintUI(events);
  }
  const box = document.getElementById('macroTimeline');
  if (!events || events.length === 0) {
    box.innerHTML = '<div style="text-align: center; color: var(--text-tertiary); padding: 20px;">No recorded events yet. Press "Start Recording" (F7) to capture actions.</div>';
    return;
  }
  const items = events.slice(0, 50).map(ev => {
    const isClick = ev.type === 'click';
    const tagBg = isClick ? 'rgba(var(--apple-blue-rgb), 0.18)' : 'rgba(255, 255, 255, 0.08)';
    const tagColor = isClick ? 'var(--apple-blue)' : 'var(--text-secondary)';
    const actionDesc = isClick 
      ? `CLICK <span style="text-transform:capitalize; font-weight:700;">${ev.button || 'Left'}</span> at (${ev.x}, ${ev.y})` 
      : `MOVE to (${ev.x}, ${ev.y})`;
      
    return `
      <div class="macro-event-item" style="padding: 5px 8px; font-size: 11px;">
        <span style="display:flex; align-items:center; gap:6px;">
          <span style="background:${tagBg}; color:${tagColor}; padding:1.5px 6px; border-radius:4px; font-weight:700; font-size:10px;">
            ${ev.type.toUpperCase()}
          </span>
          <span>${actionDesc}</span>
        </span>
        <span style="color:var(--text-tertiary); font-family:JetBrains Mono, monospace; font-size:10px;">${ev.t}s</span>
      </div>
    `;
  }).join('');

  box.innerHTML = `
    <div style="font-size:10.5px; font-weight:600; color:var(--text-tertiary); padding: 4px 8px; border-bottom:1px solid var(--glass-border); display:flex; justify-content:space-between;">
      <span>SEQUENCE TIMELINE (${events.length} TOTAL)</span>
      <span>TIMESTAMP</span>
    </div>
    ${items}
    ${events.length > 50 ? `<div style="text-align:center; padding:6px; font-size:10px; color:var(--text-tertiary);">...and ${events.length - 50} more actions</div>` : ''}
  `;
}

// ==========================================================================
// IN-APP CPS SPEED TESTER & BENCHMARK
// ==========================================================================

function initSpeedTester() {
  const zone = document.getElementById('clickTestZone');
  const cpsDisplay = document.getElementById('testCpsDisplay');
  const clicksDisplay = document.getElementById('testTotalClicks');
  const timerDisplay = document.getElementById('testTimer');
  const ratingDisplay = document.getElementById('testRating');
  const btnReset = document.getElementById('btnResetTester');

  let testClicks = 0;
  let testStartTime = null;
  let testInterval = null;

  function recordTestClick(e) {
    playAppleClickSound();
    if (!testStartTime) {
      testStartTime = performance.now();
      testInterval = setInterval(updateStats, 80);
    }
    testClicks++;
    clicksDisplay.textContent = testClicks;
    updateStats();
  }

  function updateStats() {
    if (!testStartTime) return;
    const elapsedSec = (performance.now() - testStartTime) / 1000.0;
    timerDisplay.textContent = `${elapsedSec.toFixed(1)}s`;
    
    if (elapsedSec > 0.05) {
      const cps = testClicks / elapsedSec;
      cpsDisplay.textContent = `${cps.toFixed(1)} CPS`;

      // Apple Rating Rank
      let rank = 'Casual';
      let col = 'var(--text-secondary)';
      if (cps >= 40) { rank = 'CYBORG GOD'; col = 'var(--apple-purple)'; }
      else if (cps >= 25) { rank = 'LIGHTNING FAST'; col = 'var(--apple-cyan)'; }
      else if (cps >= 15) { rank = 'PRO GAMER'; col = 'var(--apple-green)'; }
      else if (cps >= 8) { rank = 'FAST'; col = 'var(--apple-blue)'; }
      ratingDisplay.textContent = rank;
      ratingDisplay.style.color = col;
    }
  }

  zone.addEventListener('mousedown', recordTestClick);

  btnReset.addEventListener('click', () => {
    clearInterval(testInterval);
    testClicks = 0;
    testStartTime = null;
    cpsDisplay.textContent = '0.0 CPS';
    clicksDisplay.textContent = '0';
    timerDisplay.textContent = '0.0s';
    ratingDisplay.textContent = 'Ready';
    ratingDisplay.style.color = 'var(--apple-blue)';
  });
}

// ==========================================================================
// HOTKEY MODAL RE-BINDER
// ==========================================================================

function initHotkeyManager() {
  const modal = document.getElementById('hotkeyModal');
  const title = document.getElementById('modalHotkeyTitle');
  const captureBox = document.getElementById('keyCaptureBox');
  const btnCancel = document.getElementById('btnCancelHotkey');
  const btnSave = document.getElementById('btnSaveHotkey');

  function openHotkeyDialog(targetName, displayTitle) {
    appState.bindingHotkeyTarget = targetName;
    appState.pendingKey = null;
    title.textContent = `Assign ${displayTitle} Hotkey`;
    captureBox.textContent = 'Press any key on keyboard...';
    modal.classList.add('active');

    function onCaptureKeyDown(e) {
      e.preventDefault();
      e.stopPropagation();
      let key = e.key.toUpperCase();
      if (key.startsWith('ARROW')) key = key.replace('ARROW', '');
      appState.pendingKey = key;
      captureBox.textContent = key;
    }

    window.addEventListener('keydown', onCaptureKeyDown, { once: true });
  }

  document.getElementById('btnChangeHotkeyClicker').addEventListener('click', () => {
    openHotkeyDialog('autoclick', 'AutoClicker Start/Stop');
  });
  document.getElementById('btnChangeHotkeyRecord').addEventListener('click', () => {
    openHotkeyDialog('record', 'Macro Record');
  });
  document.getElementById('btnChangeHotkeyPlayback').addEventListener('click', () => {
    openHotkeyDialog('playback', 'Macro Playback');
  });

  btnCancel.addEventListener('click', () => modal.classList.remove('active'));

  btnSave.addEventListener('click', async () => {
    if (!appState.pendingKey) {
      modal.classList.remove('active');
      return;
    }
    const payload = {};
    payload[appState.bindingHotkeyTarget] = appState.pendingKey;

    try {
      const res = await fetch('/api/hotkeys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.hotkeys) {
        updateHotkeysUI(data.hotkeys);
      }
    } catch (e) {}
    modal.classList.remove('active');
  });
}

function updateHotkeysUI(hotkeys) {
  if (hotkeys.autoclick) {
    appState.hotkey = hotkeys.autoclick;
    document.getElementById('tagStartHotkey').textContent = hotkeys.autoclick;
    document.getElementById('tagStopHotkey').textContent = hotkeys.autoclick;
    document.getElementById('lblCurrentHotkeyClicker').textContent = hotkeys.autoclick;
  }
  if (hotkeys.record) {
    appState.hotkeyRecord = hotkeys.record;
    document.getElementById('tagRecordHotkey').textContent = hotkeys.record;
    document.getElementById('lblCurrentHotkeyRecord').textContent = hotkeys.record;
  }
  if (hotkeys.playback) {
    appState.hotkeyPlayback = hotkeys.playback;
    document.getElementById('tagPlaybackHotkey').textContent = hotkeys.playback;
    document.getElementById('lblCurrentHotkeyPlayback').textContent = hotkeys.playback;
  }
}

// ==========================================================================
// BACKGROUND STATUS POLLER & AUDIO FEEDBACK
// ==========================================================================

let lastReportedClicks = 0;
let isStatusPolling = false;
let elHudClicks = null;
let elHudCps = null;
let elHudCursor = null;
let cachedClicksText = '';
let cachedCpsText = '';
let cachedCursorText = '';
let lastWasRecording = false;
let lastWasPlaying = false;
let lastMacroCount = -1;

async function pollBackendStatus() {
  if (isStatusPolling) return;
  isStatusPolling = true;

  try {
    const res = await fetch('/api/status');
    const data = await res.json();

    if (data.running !== appState.running) {
      setRunningState(data.running);
    }

    if (data.total_clicks > lastReportedClicks) {
      playAppleClickSound();
    }
    lastReportedClicks = data.total_clicks;

    const wasRecording = appState.isRecording;
    const wasPlaying = appState.isPlayingMacro;
    appState.totalClicks = data.total_clicks;
    appState.cps = data.cps;
    appState.liveCursor = data.cursor || { x: 0, y: 0 };
    appState.macroEventCount = data.macro_event_count || 0;

    // Synchronize recording state transition (triggered via F7 hotkey or UI)
    if (data.is_recording !== wasRecording) {
      if (!data.is_recording) {
        try {
          const evRes = await fetch('/api/macro/events');
          const evData = await evRes.json();
          setRecordingState(false, evData.events || []);
        } catch (err) {
          setRecordingState(false);
        }
      } else {
        setRecordingState(true);
      }
    }

    // Synchronize playback state transition (triggered via F8 hotkey, UI, or scheduler)
    if (data.is_playing_macro !== wasPlaying) {
      setPlaybackState(data.is_playing_macro);
    }

    isInitialMacroCheck = false;

    // High performance DOM updates (only when values change)
    updateHudUI();

    if (data.is_recording !== lastWasRecording || data.is_playing_macro !== lastWasPlaying || data.macro_event_count !== lastMacroCount) {
      lastWasRecording = data.is_recording;
      lastWasPlaying = data.is_playing_macro;
      lastMacroCount = data.macro_event_count;
      updateMacroUI();
    }

    if (data.hotkey && data.hotkey !== appState.hotkey) {
      updateHotkeysUI({
        autoclick: data.hotkey,
        record: data.hotkey_record,
        playback: data.hotkey_playback
      });
    }

    if (window.syncMacroScheduleUI) {
      window.syncMacroScheduleUI(data.macro_schedule_time, data.macro_schedule_label, data.macro_schedules);
    }

    if (data.system_theme) {
      const prevSystem = systemThemeDetected;
      systemThemeDetected = data.system_theme;
      if (appState.theme === 'system' && prevSystem !== data.system_theme) {
        applyThemeToDOM('system');
      }
    }

  } catch (e) {
  } finally {
    isStatusPolling = false;
  }
}

function updateHudUI() {
  if (!elHudClicks) {
    elHudClicks = document.getElementById('lblHudClicks');
    elHudCps = document.getElementById('lblHudCps');
    elHudCursor = document.getElementById('lblLiveCursor');
  }

  const clicksStr = appState.totalClicks.toLocaleString();
  if (elHudClicks && clicksStr !== cachedClicksText) {
    elHudClicks.textContent = clicksStr;
    cachedClicksText = clicksStr;
  }

  const cpsStr = `${appState.cps} CPS`;
  if (elHudCps && cpsStr !== cachedCpsText) {
    elHudCps.textContent = cpsStr;
    cachedCpsText = cpsStr;
  }

  const cursorStr = `X: ${appState.liveCursor.x}, Y: ${appState.liveCursor.y}`;
  if (elHudCursor && cursorStr !== cachedCursorText) {
    elHudCursor.textContent = cursorStr;
    cachedCursorText = cursorStr;
  }
}

async function initSettingsFromBackend() {
  try {
    const res = await fetch('/api/status');
    const data = await res.json();
    if (data.settings) {
      const s = data.settings;
      if (s.hours !== undefined && document.getElementById('inpHours')) document.getElementById('inpHours').value = s.hours;
      if (s.minutes !== undefined && document.getElementById('inpMins')) document.getElementById('inpMins').value = s.minutes;
      if (s.seconds !== undefined && document.getElementById('inpSecs')) document.getElementById('inpSecs').value = s.seconds;
      if (s.milliseconds !== undefined && document.getElementById('inpMillis')) document.getElementById('inpMillis').value = s.milliseconds;
      if (s.random_min_ms !== undefined && document.getElementById('inpRandMin')) document.getElementById('inpRandMin').value = s.random_min_ms;
      if (s.random_max_ms !== undefined && document.getElementById('inpRandMax')) document.getElementById('inpRandMax').value = s.random_max_ms;
      if (s.mouse_button && document.getElementById('selMouseButton')) document.getElementById('selMouseButton').value = s.mouse_button;
      if (s.click_type && document.getElementById('selClickType')) document.getElementById('selClickType').value = s.click_type;
      if (s.repeat_count && document.getElementById('inpRepeatCount')) document.getElementById('inpRepeatCount').value = s.repeat_count;
      if (s.pick_x !== undefined && document.getElementById('inpCoordX')) document.getElementById('inpCoordX').value = s.pick_x;
      if (s.pick_y !== undefined && document.getElementById('inpCoordY')) document.getElementById('inpCoordY').value = s.pick_y;

      if (s.repeat_mode === 'count') {
        appState.repeatMode = 'count';
        document.getElementById('tileRepeatCount')?.classList.add('selected');
        document.getElementById('tileRepeatInfinite')?.classList.remove('selected');
      } else {
        appState.repeatMode = 'infinite';
        document.getElementById('tileRepeatInfinite')?.classList.add('selected');
        document.getElementById('tileRepeatCount')?.classList.remove('selected');
      }

      if (s.interval_mode === 'random') {
        appState.intervalMode = 'random';
        document.getElementById('btnModeRandom')?.classList.add('active');
        document.getElementById('btnModeFixed')?.classList.remove('active');
        const vf = document.getElementById('intervalFixedView');
        const vr = document.getElementById('intervalRandomView');
        if (vf && vr) { vf.style.display = 'none'; vr.style.display = 'block'; }
      } else {
        appState.intervalMode = 'fixed';
        document.getElementById('btnModeFixed')?.classList.add('active');
        document.getElementById('btnModeRandom')?.classList.remove('active');
        const vf = document.getElementById('intervalFixedView');
        const vr = document.getElementById('intervalRandomView');
        if (vf && vr) { vf.style.display = 'block'; vr.style.display = 'none'; }
      }

      if (s.mouse_button && document.getElementById('selMouseButton')) {
        const el = document.getElementById('selMouseButton');
        el.value = s.mouse_button;
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (s.click_type && document.getElementById('selClickType')) {
        const el = document.getElementById('selClickType');
        el.value = s.click_type;
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (s.macro_speed !== undefined && document.getElementById('selMacroSpeed')) {
        const el = document.getElementById('selMacroSpeed');
        el.value = String(s.macro_speed);
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }

      // Cursor location mode: Defaults to 'current' so clicking always follows the mouse cursor
      let mode = 'current';
      try {
        mode = localStorage.getItem('aether_loc_mode') || 'current';
      } catch (e) {}
      setLocationMode(mode);
    }
  } catch (e) {}
}

// ==========================================================================
// APPLE LIQUID GLASS CUSTOM DROPDOWNS
// ==========================================================================

function initCustomSelects() {
  document.querySelectorAll('.select-wrapper').forEach(wrapper => {
    const nativeSelect = wrapper.querySelector('select.apple-select');
    if (!nativeSelect) return;
    if (wrapper.querySelector('.custom-select-trigger')) return;

    wrapper.classList.add('custom-select-wrapper');

    // Create trigger button
    const trigger = document.createElement('div');
    trigger.className = 'custom-select-trigger';
    trigger.tabIndex = 0;
    trigger.setAttribute('role', 'combobox');
    trigger.setAttribute('aria-expanded', 'false');

    const label = document.createElement('span');
    label.className = 'custom-select-label';
    const activeOpt = nativeSelect.options[nativeSelect.selectedIndex] || nativeSelect.options[0];
    label.textContent = activeOpt ? activeOpt.textContent : '';

    const arrow = document.createElement('div');
    arrow.className = 'custom-select-arrow';
    arrow.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>`;

    trigger.appendChild(label);
    trigger.appendChild(arrow);

    // Hide native arrow icon if present
    const oldArrow = wrapper.querySelector('.select-arrow');
    if (oldArrow) oldArrow.style.display = 'none';

    // Create dropdown menu container
    const menu = document.createElement('div');
    menu.className = 'custom-select-menu';
    menu.setAttribute('role', 'listbox');

    function buildOptions() {
      menu.innerHTML = '';
      Array.from(nativeSelect.options).forEach(opt => {
        const item = document.createElement('div');
        item.className = 'custom-select-option' + (opt.value === nativeSelect.value ? ' selected' : '');
        item.setAttribute('role', 'option');
        item.setAttribute('data-value', opt.value);

        const span = document.createElement('span');
        span.textContent = opt.textContent;
        item.appendChild(span);

        const check = document.createElement('div');
        check.className = 'opt-check';
        check.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;
        item.appendChild(check);

        item.addEventListener('click', (e) => {
          e.stopPropagation();
          setVal(opt.value);
          closeDropdown();
        });

        menu.appendChild(item);
      });
    }

    buildOptions();

    function setVal(newVal) {
      if (nativeSelect.value !== newVal) {
        nativeSelect.value = newVal;
        nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));
        nativeSelect.dispatchEvent(new Event('input', { bubbles: true }));
      }
      refreshUI();
    }

    function refreshUI() {
      const cur = nativeSelect.options[nativeSelect.selectedIndex];
      if (cur) {
        label.textContent = cur.textContent;
      }
      menu.querySelectorAll('.custom-select-option').forEach(el => {
        if (el.getAttribute('data-value') === nativeSelect.value) {
          el.classList.add('selected');
        } else {
          el.classList.remove('selected');
        }
      });
    }

    nativeSelect.addEventListener('change', refreshUI);

    const parentCard = wrapper.closest('.glass-card');

    function openDropdown() {
      // Close any other open dropdowns
      document.querySelectorAll('.custom-select-wrapper.open').forEach(w => {
        if (w !== wrapper) {
          w.classList.remove('open');
          w.closest('.glass-card')?.classList.remove('dropdown-active');
          const trg = w.querySelector('.custom-select-trigger');
          if (trg) trg.setAttribute('aria-expanded', 'false');
        }
      });

      wrapper.classList.add('open');
      if (parentCard) parentCard.classList.add('dropdown-active');
      trigger.setAttribute('aria-expanded', 'true');
      refreshUI();
    }

    function closeDropdown() {
      wrapper.classList.remove('open');
      if (parentCard) parentCard.classList.remove('dropdown-active');
      trigger.setAttribute('aria-expanded', 'false');
    }

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      if (wrapper.classList.contains('open')) {
        closeDropdown();
      } else {
        openDropdown();
      }
    });

    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!wrapper.classList.contains('open')) {
          openDropdown();
        } else {
          const opts = Array.from(nativeSelect.options);
          let idx = nativeSelect.selectedIndex;
          if (e.key === 'ArrowDown') {
            idx = (idx + 1) % opts.length;
            setVal(opts[idx].value);
          } else if (e.key === 'ArrowUp') {
            idx = (idx - 1 + opts.length) % opts.length;
            setVal(opts[idx].value);
          } else if (e.key === 'Enter' || e.key === ' ') {
            closeDropdown();
          }
        }
      } else if (e.key === 'Escape' || e.key === 'Tab') {
        closeDropdown();
      }
    });

    // Make native select invisible but fully functional in DOM
    nativeSelect.style.position = 'absolute';
    nativeSelect.style.opacity = '0';
    nativeSelect.style.width = '1px';
    nativeSelect.style.height = '1px';
    nativeSelect.style.pointerEvents = 'none';
    nativeSelect.tabIndex = -1;

    wrapper.appendChild(trigger);
    wrapper.appendChild(menu);
  });

  // Global click outside to dismiss open dropdowns
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.custom-select-wrapper')) {
      document.querySelectorAll('.custom-select-wrapper.open').forEach(w => {
        w.classList.remove('open');
        w.closest('.glass-card')?.classList.remove('dropdown-active');
        const trg = w.querySelector('.custom-select-trigger');
        if (trg) trg.setAttribute('aria-expanded', 'false');
      });
    }
  });
}

// ==========================================================================
// ACCENT COLOR THEME CHANGER
// ==========================================================================

function hexToRgb(hex) {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  const num = parseInt(c, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

function adjustColorBrightness(hex, percent) {
  const { r, g, b } = hexToRgb(hex);
  const factor = 1 + percent / 100;
  const newR = Math.min(255, Math.max(0, Math.round(r * factor)));
  const newG = Math.min(255, Math.max(0, Math.round(g * factor)));
  const newB = Math.min(255, Math.max(0, Math.round(b * factor)));
  return `#${((1 << 24) + (newR << 16) + (newG << 8) + newB).toString(16).slice(1)}`;
}

function setAccentColor(hex, name = 'Custom', playAudio = false) {
  appState.accentColor = hex;
  appState.accentName = name;
  localStorage.setItem('aether_accent_color', hex);
  localStorage.setItem('aether_accent_name', name);

  const { r, g, b } = hexToRgb(hex);
  const darkHex = adjustColorBrightness(hex, -25);
  const rootStyle = document.documentElement.style;

  rootStyle.setProperty('--apple-blue', hex);
  rootStyle.setProperty('--apple-blue-rgb', `${r}, ${g}, ${b}`);
  rootStyle.setProperty('--btn-prominent-bg', `linear-gradient(180deg, ${hex} 0%, ${darkHex} 100%)`);
  rootStyle.setProperty('--btn-prominent-shadow', `0 6px 20px rgba(${r}, ${g}, ${b}, 0.45)`);
  rootStyle.setProperty('--radio-tile-selected-border', hex);
  rootStyle.setProperty('--radio-tile-selected-bg', `rgba(${r}, ${g}, ${b}, 0.12)`);
  rootStyle.setProperty('--input-focus', `rgba(${r}, ${g}, ${b}, 0.45)`);
  rootStyle.setProperty('--modal-accent', hex);
  rootStyle.setProperty('--ambient-caustic', `radial-gradient(ellipse 65% 35% at 80% 15%, rgba(${r}, ${g}, ${b}, 0.22), transparent 70%), radial-gradient(ellipse 50% 45% at 20% 85%, rgba(${r}, ${g}, ${b}, 0.14), transparent 70%)`);

  // Update UI badge
  const lbl = document.getElementById('lblActiveColorName');
  if (lbl) lbl.textContent = name;

  // Update swatch active states
  const swatches = document.querySelectorAll('.accent-swatch');
  let matchedSwatch = false;
  swatches.forEach(swatch => {
    if (swatch.getAttribute('data-color').toLowerCase() === hex.toLowerCase()) {
      swatch.classList.add('active');
      matchedSwatch = true;
    } else {
      swatch.classList.remove('active');
    }
  });

  const customWrap = document.querySelector('.custom-color-wrapper');
  const customInput = document.getElementById('inpCustomColorPicker');
  if (customWrap && customInput) {
    customInput.value = hex;
    if (!matchedSwatch) {
      customWrap.classList.add('active');
    } else {
      customWrap.classList.remove('active');
    }
  }

  if (playAudio) {
    playUiSound('tab');
  }
}

function initAccentColorChanger() {
  const swatches = document.querySelectorAll('.accent-swatch');
  swatches.forEach(swatch => {
    swatch.addEventListener('click', () => {
      const color = swatch.getAttribute('data-color');
      const name = swatch.getAttribute('data-name') || 'Color';
      setAccentColor(color, name, true);
    });
  });

  const customInput = document.getElementById('inpCustomColorPicker');
  if (customInput) {
    customInput.addEventListener('input', (e) => {
      setAccentColor(e.target.value, 'Custom', false);
    });
    customInput.addEventListener('change', (e) => {
      setAccentColor(e.target.value, 'Custom', true);
    });
  }

  // Restore saved accent color
  const savedColor = localStorage.getItem('aether_accent_color') || '#0A84FF';
  const savedName = localStorage.getItem('aether_accent_name') || 'Electric Blue';
  setAccentColor(savedColor, savedName, false);
}

// ==========================================================================
// AUDIO & SOUND FX SETTINGS & GLOBAL EVENT DELEGATION
// ==========================================================================

function initAudioSettings() {
  const chkAction = document.getElementById('chkActionAudio');
  const chkClicker = document.getElementById('chkAudioFeedback');
  const selPreset = document.getElementById('selAudioPreset');
  const rngVolume = document.getElementById('rngAudioVolume');
  const lblVolume = document.getElementById('lblAudioVolume');

  const savedActionAudio = localStorage.getItem('aether_action_audio');
  if (savedActionAudio !== null) {
    appState.actionAudioEnabled = savedActionAudio === 'true';
    if (chkAction) chkAction.checked = appState.actionAudioEnabled;
  }

  const savedClickerAudio = localStorage.getItem('aether_clicker_audio');
  if (savedClickerAudio !== null) {
    appState.audioEnabled = savedClickerAudio === 'true';
    if (chkClicker) chkClicker.checked = appState.audioEnabled;
  }

  const savedPreset = localStorage.getItem('aether_audio_preset') || 'haptic';
  appState.audioPreset = savedPreset;
  if (selPreset) selPreset.value = savedPreset;

  const savedVolume = localStorage.getItem('aether_audio_volume');
  if (savedVolume !== null) {
    appState.audioVolume = parseFloat(savedVolume);
    if (rngVolume) rngVolume.value = Math.round(appState.audioVolume * 100);
    if (lblVolume) lblVolume.textContent = `${Math.round(appState.audioVolume * 100)}%`;
  }

  if (chkAction) {
    chkAction.addEventListener('change', (e) => {
      appState.actionAudioEnabled = e.target.checked;
      localStorage.setItem('aether_action_audio', e.target.checked);
      if (e.target.checked) playUiSound('switch');
    });
  }

  if (chkClicker) {
    chkClicker.addEventListener('change', (e) => {
      appState.audioEnabled = e.target.checked;
      localStorage.setItem('aether_clicker_audio', e.target.checked);
      if (e.target.checked) playUiSound('switch');
    });
  }

  if (selPreset) {
    selPreset.addEventListener('change', (e) => {
      appState.audioPreset = e.target.value;
      localStorage.setItem('aether_audio_preset', e.target.value);
      playUiSound('tap');
    });
  }

  if (rngVolume && lblVolume) {
    rngVolume.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      appState.audioVolume = val / 100;
      lblVolume.textContent = `${val}%`;
      localStorage.setItem('aether_audio_volume', (val / 100).toString());
    });
    rngVolume.addEventListener('change', () => {
      playUiSound('tap');
    });
  }

  // Global UI click audio delegator: buttons, switches, tiles, tabs trigger audio feedback
  document.addEventListener('click', (e) => {
    const target = e.target.closest('button, .preset-chip, .custom-select-trigger, .custom-select-option, .radio-tile, .segmented-item, .nav-tab, .apple-switch, .accent-swatch, .btn-micro-reset, .btn-micro-cancel');
    if (!target) return;

    if (target.classList.contains('nav-tab')) {
      playUiSound('tab');
    } else if (target.classList.contains('apple-switch')) {
      playUiSound('switch');
    } else if (target.id === 'btnStartClicker' || target.id === 'btnPlayMacroToggle') {
      playUiSound('start');
    } else if (target.id === 'btnStopClicker' || target.id === 'btnClearMacro') {
      playUiSound('stop');
    } else if (target.id === 'btnSetSchedule') {
      playUiSound('schedule');
    } else if (target.id === 'btnCancelSchedule' || target.id === 'btnBannerCancelSchedule') {
      playUiSound('stop');
    } else {
      playUiSound('tap');
    }
  }, true);
}

// ==========================================================================
// MACRO SEQUENCE CALENDAR & TIME SCHEDULING (PRESENT VS FUTURE)
// ==========================================================================

let macroScheduleCountdownTimer = null;

function initMacroScheduler() {
  const btnPresent = document.getElementById('btnSchedModePresent');
  const btnFuture = document.getElementById('btnSchedModeFuture');
  const schedIndicator = document.getElementById('schedSegmentIndicator');
  const futurePanel = document.getElementById('macroFuturePanel');
  const lblSchedBadge = document.getElementById('lblSchedBadge');
  const inpDate = document.getElementById('inpScheduleDate');
  const inpTime = document.getElementById('inpScheduleTime');
  const inpSchedRepeat = document.getElementById('inpSchedRepeatCount');
  const btnSchedRepeatMinus = document.getElementById('btnSchedRepeatMinus');
  const btnSchedRepeatPlus = document.getElementById('btnSchedRepeatPlus');
  const btnAddSingle = document.getElementById('btnAddSingleSchedule');

  const inpGenRuns = document.getElementById('inpGenRunCount');
  const btnGenRunsMinus = document.getElementById('btnGenRunsMinus');
  const btnGenRunsPlus = document.getElementById('btnGenRunsPlus');
  const inpGenIntervalVal = document.getElementById('inpGenIntervalVal');
  const selGenIntervalUnit = document.getElementById('selGenIntervalUnit');
  const btnGenerateMulti = document.getElementById('btnGenerateMultiSchedules');

  const queueList = document.getElementById('scheduleQueueList');
  const lblQueueCount = document.getElementById('lblQueueCountBadge');
  const btnClearAll = document.getElementById('btnClearAllSchedules');

  const activeBanner = document.getElementById('scheduleActiveBanner');
  const bannerTarget = document.getElementById('lblScheduleBannerTarget');
  const bannerCountdown = document.getElementById('lblScheduleBannerCountdown');
  const btnBannerCancel = document.getElementById('btnBannerCancelSchedule');

  const lblBtnGenerateMulti = document.getElementById('lblBtnGenerateMulti');
  const btnQuickRecordNav = document.getElementById('btnQuickRecordNav');

  function getIntervalInSeconds() {
    const val = Math.max(1, parseInt(inpGenIntervalVal?.value || '1', 10));
    const unitMult = parseInt(selGenIntervalUnit?.value || '3600', 10);
    return val * unitMult;
  }

  function syncPresetChipsHighlight(val, unitMult) {
    document.querySelectorAll('.btn-interval-preset').forEach(btn => {
      const bVal = parseInt(btn.getAttribute('data-val') || '1', 10);
      const bUnit = parseInt(btn.getAttribute('data-unit') || '3600', 10);
      if (bVal === val && bUnit === unitMult) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  function updateMultiRunBtnLabel() {
    if (!inpGenRuns || !lblBtnGenerateMulti) return;
    const count = parseInt(inpGenRuns.value || '2', 10);
    const val = Math.max(1, parseInt(inpGenIntervalVal?.value || '1', 10));
    const unitText = selGenIntervalUnit?.options[selGenIntervalUnit.selectedIndex]?.text || 'Hours';
    const intervalStr = `${val} ${val === 1 ? unitText.replace(/s$/, '') : unitText}`;
    lblBtnGenerateMulti.textContent = `Auto-Generate ${count} Runs (Every ${intervalStr})`;
  }

  // Quick Interval Preset buttons (30m, 1h, 2h, 5h, 7h, 10h, 24h)
  document.querySelectorAll('.btn-interval-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = parseInt(btn.getAttribute('data-val') || '1', 10);
      const unit = parseInt(btn.getAttribute('data-unit') || '3600', 10);
      if (inpGenIntervalVal) inpGenIntervalVal.value = val;
      if (selGenIntervalUnit) selGenIntervalUnit.value = unit;
      syncPresetChipsHighlight(val, unit);
      updateMultiRunBtnLabel();
      playUiSound('tap');
    });
  });

  inpGenIntervalVal?.addEventListener('input', () => {
    const val = parseInt(inpGenIntervalVal.value || '1', 10);
    const unit = parseInt(selGenIntervalUnit?.value || '3600', 10);
    syncPresetChipsHighlight(val, unit);
    updateMultiRunBtnLabel();
  });

  selGenIntervalUnit?.addEventListener('change', () => {
    const val = parseInt(inpGenIntervalVal?.value || '1', 10);
    const unit = parseInt(selGenIntervalUnit.value || '3600', 10);
    syncPresetChipsHighlight(val, unit);
    updateMultiRunBtnLabel();
    playUiSound('tap');
  });

  // Stepper handlers
  btnSchedRepeatMinus?.addEventListener('click', () => {
    if (!inpSchedRepeat) return;
    const cur = parseInt(inpSchedRepeat.value || '1', 10);
    inpSchedRepeat.value = Math.max(1, cur - 1);
    playUiSound('tap');
  });

  btnSchedRepeatPlus?.addEventListener('click', () => {
    if (!inpSchedRepeat) return;
    const cur = parseInt(inpSchedRepeat.value || '1', 10);
    inpSchedRepeat.value = cur + 1;
    playUiSound('tap');
  });

  btnGenRunsMinus?.addEventListener('click', () => {
    if (!inpGenRuns) return;
    const cur = parseInt(inpGenRuns.value || '2', 10);
    inpGenRuns.value = Math.max(1, cur - 1);
    updateMultiRunBtnLabel();
    playUiSound('tap');
  });

  btnGenRunsPlus?.addEventListener('click', () => {
    if (!inpGenRuns) return;
    const cur = parseInt(inpGenRuns.value || '2', 10);
    inpGenRuns.value = Math.min(50, cur + 1);
    updateMultiRunBtnLabel();
    playUiSound('tap');
  });

  inpGenRuns?.addEventListener('input', updateMultiRunBtnLabel);

  // Quick Record Button in notice hint
  btnQuickRecordNav?.addEventListener('click', () => {
    const btnRecord = document.getElementById('btnRecordToggle');
    if (btnRecord) {
      btnRecord.click();
    }
  });

  // Global sequence hint state updater
  window.updateMacroSequenceHintUI = function(events = appState.macroEvents) {
    const hintEl = document.getElementById('macroSeqStatusHint');
    const textEl = document.getElementById('lblSeqStatusText');
    const recBtn = document.getElementById('btnQuickRecordNav');
    if (!hintEl) return;

    const count = (events && Array.isArray(events)) ? events.length : 0;
    if (count === 0) {
      hintEl.classList.remove('has-sequence');
      if (textEl) {
        textEl.innerHTML = '<b>No sequence recorded yet.</b> Record actions or import JSON before scheduling playback.';
      }
      if (recBtn) {
        recBtn.textContent = '● Record F7';
        recBtn.style.display = 'inline-flex';
      }
    } else {
      hintEl.classList.add('has-sequence');
      const duration = count > 1
        ? ((events[count - 1].time - events[0].time) / 1000).toFixed(1)
        : '0.0';
      if (textEl) {
        textEl.innerHTML = `<b>Sequence Ready:</b> ${count} recorded actions (${duration}s duration) ready for scheduled playback.`;
      }
      if (recBtn) {
        recBtn.textContent = 'Re-Record';
        recBtn.style.display = 'inline-flex';
      }
    }
  };

  // Set default date & time in input pickers to +5 minutes from now
  function setFutureDefaults(secondsOffset = 300) {
    const d = new Date(Date.now() + secondsOffset * 1000);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');

    if (inpDate) inpDate.value = `${yyyy}-${mm}-${dd}`;
    if (inpTime) inpTime.value = `${hh}:${min}:${ss}`;

    if (window.syncCalendarPicker) window.syncCalendarPicker();
    if (window.syncTimePicker) window.syncTimePicker();
  }

  setFutureDefaults(300);
  updateMultiRunBtnLabel();
  window.updateMacroSequenceHintUI();

  function switchSchedMode(mode) {
    if (mode === 'present') {
      btnPresent?.classList.add('active');
      btnFuture?.classList.remove('active');
      if (btnPresent) {
        btnPresent.style.color = 'var(--text-primary)';
        btnPresent.style.fontWeight = '600';
      }
      if (btnFuture) {
        btnFuture.style.color = 'var(--text-secondary)';
        btnFuture.style.fontWeight = '500';
      }
      if (schedIndicator) schedIndicator.style.transform = 'translateX(0)';
      if (futurePanel) futurePanel.style.display = 'none';
      if (lblSchedBadge) lblSchedBadge.textContent = 'Present Mode';
      playUiSound('tab');
    } else {
      btnFuture?.classList.add('active');
      btnPresent?.classList.remove('active');
      if (btnFuture) {
        btnFuture.style.color = 'var(--text-primary)';
        btnFuture.style.fontWeight = '600';
      }
      if (btnPresent) {
        btnPresent.style.color = 'var(--text-secondary)';
        btnPresent.style.fontWeight = '500';
      }
      if (schedIndicator) schedIndicator.style.transform = 'translateX(100%)';
      if (futurePanel) futurePanel.style.display = 'block';
      if (lblSchedBadge) lblSchedBadge.textContent = 'Scheduled Mode';
      window.updateMacroSequenceHintUI();
      playUiSound('tab');
    }
  }

  btnPresent?.addEventListener('click', () => switchSchedMode('present'));
  btnFuture?.addEventListener('click', () => switchSchedMode('future'));

  // Quick preset offset chips
  document.querySelectorAll('.btn-quick-sched').forEach(chip => {
    chip.addEventListener('click', () => {
      const offset = parseInt(chip.getAttribute('data-offset') || '300', 10);
      setFutureDefaults(offset);
      chip.style.transform = 'scale(0.95)';
      setTimeout(() => chip.style.transform = '', 150);
    });
  });

  function formatEpochFriendly(epoch) {
    const dt = new Date(epoch * 1000);
    return dt.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  // Render Queue Function
  function renderScheduleQueue(schedules = appState.macroSchedules) {
    if (!queueList) return;
    const items = schedules || [];
    if (lblQueueCount) {
      lblQueueCount.textContent = `${items.length} Queued`;
    }
    if (btnClearAll) {
      btnClearAll.style.display = items.length > 0 ? 'inline-flex' : 'none';
    }

    if (items.length === 0) {
      queueList.innerHTML = `
        <div class="queue-empty-card" id="queueEmptyMsg">
          <div class="empty-icon-circle">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <div class="empty-title">No Scheduled Runs Yet</div>
          <div class="empty-desc">Pick a time above and click <b>+ Add Scheduled Time</b>, or use the Multi-Time Scheduler to queue future runs.</div>
        </div>
      `;
      if (activeBanner) activeBanner.style.display = 'none';
      return;
    }

    const nowSec = Date.now() / 1000;
    queueList.innerHTML = items.map((item, idx) => {
      const isNext = idx === 0;
      const diffSec = Math.max(0, Math.floor(item.timestamp - nowSec));
      const h = Math.floor(diffSec / 3600);
      const m = Math.floor((diffSec % 3600) / 60);
      const s = diffSec % 60;
      const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      const repeatLabel = item.repeats > 1 ? `Loops <b>${item.repeats}x</b>` : 'Plays <b>1x</b>';

      return `
        <div class="schedule-queue-item ${isNext ? 'is-next' : ''}" data-id="${item.id}">
          <div class="queue-item-left">
            <span class="queue-item-dot"></span>
            <div class="queue-item-info">
              <div class="queue-item-title">
                <span>Run #${idx + 1}: ${item.label}</span>
                ${isNext ? '<span style="font-size:9px; background:#30D158; color:#000; padding:1px 5px; border-radius:4px; font-weight:700;">NEXT</span>' : ''}
              </div>
              <div class="queue-item-sub">
                ${repeatLabel} • Starts in <b>${timeStr}</b>
              </div>
            </div>
          </div>
          <button type="button" class="btn-queue-delete" data-id="${item.id}" title="Remove this scheduled run">✕</button>
        </div>
      `;
    }).join('');

    // Attach delete listeners
    queueList.querySelectorAll('.btn-queue-delete').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const schedId = btn.getAttribute('data-id');
        try {
          const res = await fetch('/api/macro/schedule', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'remove', id: schedId })
          });
          const data = await res.json();
          if (data.success) {
            appState.macroSchedules = data.macro_schedules || [];
            renderScheduleQueue(appState.macroSchedules);
            playUiSound('tap');
          }
        } catch (err) {}
      });
    });

    // Update active banner for next item
    if (items.length > 0) {
      const next = items[0];
      if (activeBanner) activeBanner.style.display = 'flex';
      if (bannerTarget) bannerTarget.textContent = `Next Run (#1 of ${items.length}): ${next.label}`;
    } else {
      if (activeBanner) activeBanner.style.display = 'none';
    }
  }

  // Clear all schedules
  btnClearAll?.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/macro/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear' })
      });
      const data = await res.json();
      if (data.success) {
        appState.macroSchedules = [];
        appState.macroScheduleTime = null;
        appState.macroScheduleLabel = '';
        renderScheduleQueue([]);
        showLiquidAlert('All upcoming scheduled playback runs have been cleared.', 'info', 'Queue Cleared');
      }
    } catch (e) {}
  });

  btnBannerCancel?.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/macro/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear' })
      });
      const data = await res.json();
      if (data.success) {
        appState.macroSchedules = [];
        appState.macroScheduleTime = null;
        appState.macroScheduleLabel = '';
        renderScheduleQueue([]);
        showLiquidAlert('Scheduled playback cancelled.', 'info', 'Schedule Cancelled');
      }
    } catch (e) {}
  });

  // Add Single Scheduled Time
  btnAddSingle?.addEventListener('click', async () => {
    if (!inpDate?.value || !inpTime?.value) {
      showLiquidAlert('Please select both a Target Date and Target Time first.', 'warning', 'Date & Time Required');
      return;
    }
    if (!appState.macroEvents || appState.macroEvents.length === 0) {
      showLiquidAlert('No sequence recorded yet. Please record actions (F7) or import a macro first.', 'warning', 'No Sequence Recorded');
      return;
    }

    const dtString = `${inpDate.value}T${inpTime.value}`;
    const targetDt = new Date(dtString);
    const targetEpoch = targetDt.getTime() / 1000;
    const nowEpoch = Date.now() / 1000;

    if (isNaN(targetEpoch) || targetEpoch <= nowEpoch) {
      showLiquidAlert('Target time must be in the future! Please pick a future date and time.', 'warning', 'Invalid Future Time');
      return;
    }

    const repeats = Math.max(1, parseInt(inpSchedRepeat?.value || '1', 10));
    const friendlyLabel = formatEpochFriendly(targetEpoch);

    try {
      const res = await fetch('/api/macro/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          timestamp: targetEpoch,
          label: friendlyLabel,
          repeats
        })
      });
      const data = await res.json();
      if (data.success) {
        appState.macroSchedules = data.macro_schedules || [];
        renderScheduleQueue(appState.macroSchedules);
        showLiquidAlert(`Scheduled playback queued for ${friendlyLabel} (${repeats}x loop)`, 'success', 'Playback Scheduled');
      }
    } catch (e) {
      showLiquidAlert('Could not schedule with backend: ' + e.message, 'error', 'Schedule Error');
    }
  });

  // Multi-Time Scheduler: User chooses how many times to play in future (e.g. 1st at 5pm, 2nd at 6pm)
  btnGenerateMulti?.addEventListener('click', async () => {
    if (!appState.macroEvents || appState.macroEvents.length === 0) {
      showLiquidAlert('No sequence recorded yet. Please record actions (F7) or import a macro first.', 'warning', 'No Sequence Recorded');
      return;
    }

    const runCount = Math.max(1, Math.min(50, parseInt(inpGenRuns?.value || '2', 10)));
    const intervalSec = getIntervalInSeconds();
    const repeatsPerRun = Math.max(1, parseInt(inpSchedRepeat?.value || '1', 10));

    // Determine starting timestamp from date/time inputs, or now + interval if past/empty
    let startEpoch = Date.now() / 1000 + 300;
    if (inpDate?.value && inpTime?.value) {
      const targetDt = new Date(`${inpDate.value}T${inpTime.value}`);
      const parsedEpoch = targetDt.getTime() / 1000;
      if (!isNaN(parsedEpoch) && parsedEpoch > Date.now() / 1000) {
        startEpoch = parsedEpoch;
      }
    }

    const newSchedules = [];
    for (let i = 0; i < runCount; i++) {
      const t = startEpoch + (i * intervalSec);
      newSchedules.push({
        id: `sched_${Date.now()}_${i}_${Math.floor(Math.random() * 1000)}`,
        timestamp: t,
        label: formatEpochFriendly(t),
        repeats: repeatsPerRun
      });
    }

    try {
      const res = await fetch('/api/macro/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_multiple',
          schedules: newSchedules
        })
      });
      const data = await res.json();
      if (data.success) {
        appState.macroSchedules = data.macro_schedules || [];
        renderScheduleQueue(appState.macroSchedules);
        showLiquidAlert(`Successfully queued ${runCount} future playback runs!`, 'success', 'Batch Schedules Created');
      }
    } catch (e) {
      showLiquidAlert('Could not add multi-run schedule: ' + e.message, 'error', 'Batch Schedule Error');
    }
  });

  // Countdown timer updating queue cards and banner every 500ms
  if (macroScheduleCountdownTimer) clearInterval(macroScheduleCountdownTimer);
  macroScheduleCountdownTimer = setInterval(() => {
    if (!appState.macroSchedules || appState.macroSchedules.length === 0) return;
    const nowSec = Date.now() / 1000;
    const next = appState.macroSchedules[0];
    const diffSec = Math.max(0, Math.floor(next.timestamp - nowSec));

    const h = Math.floor(diffSec / 3600);
    const m = Math.floor((diffSec % 3600) / 60);
    const s = diffSec % 60;
    const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

    if (bannerCountdown) {
      bannerCountdown.textContent = diffSec > 0 ? `Starts in: ${timeStr}` : 'Starting sequence now...';
    }

    // Update countdown text inside queue items without re-rendering entire DOM
    const nextItemSub = queueList?.querySelector('.schedule-queue-item.is-next .queue-item-sub b:last-child');
    if (nextItemSub) {
      nextItemSub.textContent = timeStr;
    }
  }, 500);

  // Export helper for status poller
  window.syncMacroScheduleUI = (scheduleTime, scheduleLabel, schedules) => {
    if (schedules && Array.isArray(schedules)) {
      const idsNow = (appState.macroSchedules || []).map(s => s.id).join(',');
      const idsNew = schedules.map(s => s.id).join(',');
      if (idsNow !== idsNew) {
        appState.macroSchedules = schedules;
        renderScheduleQueue(schedules);
      }
    }
    appState.macroScheduleTime = scheduleTime || null;
    appState.macroScheduleLabel = scheduleLabel || '';
  };
}

// ==========================================================================
// BENCHO COMPONENT INITIALIZERS: WAKE SLIDER, EYE TRACKER, TIME SCRUBBER
// ==========================================================================

function initWakeSlider() {
  const mount = document.getElementById('wakeSliderMount');
  if (!mount) return;

  const H = 16;
  const n = 36;
  const wakeKnob = 60;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  let currentVal = Math.round(appState.audioVolume * 100);
  const st = {
    energy: new Float32Array(n),
    down: false,
    lastX: 0,
    lastT: 0,
    speed: 0,
    raf: 0,
    at: currentVal / 100,
    lastBar: -1
  };

  mount.innerHTML = `
    <div class="wks">
      <div class="wks-track" role="slider" tabindex="0" aria-label="Sound Volume" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${currentVal}">
        ${Array.from({ length: n }, () => `<span class="wks-bar" style="height: ${H}px;"></span>`).join('')}
      </div>
      <span class="wks-value">${currentVal}%</span>
    </div>
  `;

  const track = mount.querySelector('.wks-track');
  const bars = mount.querySelectorAll('.wks-bar');
  const valDisplay = mount.querySelector('.wks-value');

  function updateLit(val) {
    const lit = Math.round((val / 100) * (n - 1));
    bars.forEach((b, i) => {
      if (val > 0 && i <= lit) {
        b.setAttribute('data-on', 'true');
      } else {
        b.removeAttribute('data-on');
      }
    });
    valDisplay.textContent = `${val}%`;
    const lbl = document.getElementById('lblAudioVolume');
    if (lbl) lbl.textContent = `${val}%`;
    const nativeRng = document.getElementById('rngAudioVolume');
    if (nativeRng) nativeRng.value = val;
  }

  updateLit(currentVal);

  function loop() {
    if (st.raf) return;
    let prev = performance.now();
    function run(now) {
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      let live = false;
      const fall = Math.exp(-dt * 6.5);
      for (let i = 0; i < st.energy.length; i++) {
        st.energy[i] *= fall;
        if (st.energy[i] < 0.002) {
          st.energy[i] = 0;
        } else {
          live = true;
        }
        const b = bars[i];
        if (b) {
          b.style.transform = `scaleY(${(1 + st.energy[i] * 1.6).toFixed(3)})`;
        }
      }
      st.raf = (live || st.down) ? requestAnimationFrame(run) : 0;
    }
    st.raf = requestAnimationFrame(run);
  }

  function to(f, speed) {
    f = clamp(f, 0, 1);
    const from = st.at;
    st.at = f;
    const a = Math.round(from * (n - 1));
    const b = Math.round(f * (n - 1));
    const push = (1 - Math.exp(-speed / 900)) * (wakeKnob / 60);
    const lo = Math.min(a, b);
    const hi = Math.max(a, b);
    for (let i = lo; i <= hi; i++) {
      st.energy[i] = Math.max(st.energy[i], push);
    }
    if (b !== st.lastBar) {
      st.lastBar = b;
      playUiSound('tick');
    }
    const nextVal = Math.round(f * 100);
    currentVal = nextVal;
    appState.audioVolume = nextVal / 100;
    localStorage.setItem('aether_audio_volume', (nextVal / 100).toString());
    updateLit(nextVal);
    loop();
  }

  function frac(clientX) {
    const r = track.getBoundingClientRect();
    return (clientX - r.left) / r.width;
  }

  track.addEventListener('pointerdown', (e) => {
    try { track.setPointerCapture(e.pointerId); } catch {}
    st.down = true;
    st.lastX = e.clientX;
    st.lastT = performance.now();
    st.speed = 0;
    to(frac(e.clientX), 0);
    playUiSound('tick');
  });

  track.addEventListener('pointermove', (e) => {
    if (!st.down) return;
    const now = performance.now();
    const dt = Math.max(0.008, (now - st.lastT) / 1000);
    const v = Math.abs(e.clientX - st.lastX) / dt;
    st.speed = st.speed * 0.5 + v * 0.5;
    st.lastX = e.clientX;
    st.lastT = now;
    to(frac(e.clientX), st.speed);
  });

  const onUp = (e) => {
    if (st.down) {
      st.down = false;
      try { track.releasePointerCapture(e.pointerId); } catch {}
      playUiSound('tap');
    }
  };
  track.addEventListener('pointerup', onUp);
  track.addEventListener('pointercancel', onUp);

  track.addEventListener('keydown', (e) => {
    const step = e.shiftKey ? 10 : 1;
    let next = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = currentVal + step;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = currentVal - step;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = 100;
    if (next === null) return;
    e.preventDefault();
    to(clamp(next, 0, 100) / 100, 600);
  });
}

function initEyeTracker() {
  const mount = document.getElementById('eyeTrackerMount');
  if (!mount) return;

  const R = 50;
  const GAP = 0.19;
  const TILT = 64;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  const STYLES = {
    Slant: { w: 9, h: 15, r: 4.5 },
    Dots: { w: 11, h: 11, r: 5.5 },
    Squares: { w: 12, h: 12, r: 3.5 }
  };

  const SHAPES = {
    Ball: "M50 0 A50 50 0 1 1 49.99 0 Z",
    Circle: "M50 7 A43 43 0 1 1 49.99 7 Z",
    Cube: "M30 6 H70 A24 24 0 0 1 94 30 V70 A24 24 0 0 1 70 94 H30 A24 24 0 0 1 6 70 V30 A24 24 0 0 1 30 6 Z",
    Pill: "M34 17 H66 A33 33 0 0 1 66 83 H34 A33 33 0 0 1 34 17 Z",
    Hexagon: "M59.53 8.50 L81.18 21.00 Q90.70 26.50 90.70 37.50 L90.70 62.50 Q90.70 73.50 81.18 79.00 L59.53 91.50 Q50.00 97.00 40.47 91.50 L18.82 79.00 Q9.30 73.50 9.30 62.50 L9.30 37.50 Q9.30 26.50 18.82 21.00 L40.47 8.50 Q50.00 3.00 59.53 8.50 Z",
    "Hex flat": "M91.50 59.53 L79.00 81.18 Q73.50 90.70 62.50 90.70 L37.50 90.70 Q26.50 90.70 21.00 81.18 L8.50 59.53 Q3.00 50.00 8.50 40.47 L21.00 18.82 Q26.50 9.30 37.50 9.30 L62.50 9.30 Q73.50 9.30 79.00 18.82 L91.50 40.47 Q97.00 50.00 91.50 59.53 Z"
  };

  const LINES = [
    "Hey, I see you.",
    "Boop.",
    "That tickles.",
    "Hi there!",
    "Stop poking me.",
    "I'm watching you.",
    "Again? Okay.",
    "You found me."
  ];
  const TINTS = ["#0A84FF", "#30D158", "#FF2D55", "#AF52DE", "#FF9F0A"];
  const KEY_MS = 38;
  const HOLD_MS = 1500;

  let currentShape = 'Cube';
  let currentLook = 'Slant';
  let eyeScale = 1;
  let bounce = 30;

  mount.innerHTML = `
    <div class="eyt" style="--eyt-size: 110px;" role="img" aria-label="A ball with two eyes that follows the cursor">
      <svg class="eyt-ball" viewBox="0 0 100 100" data-poke="true">
        <defs>
          <clipPath id="eytClipDom">
            <path id="eytClipPathDom" d="${SHAPES[currentShape]}"></path>
          </clipPath>
        </defs>
        <path id="eytBodyPathDom" class="eyt-body" d="${SHAPES[currentShape]}"></path>
        <g clip-path="url(#eytClipDom)">
          <g id="eytEyeLeft"><rect class="eyt-eye" x="-4.5" y="-7.5" width="9" height="15" rx="4.5"></rect></g>
          <g id="eytEyeRight"><rect class="eyt-eye" x="-4.5" y="-7.5" width="9" height="15" rx="4.5"></rect></g>
        </g>
      </svg>
      <span class="eyt-say" id="eytChatBubble" aria-live="polite" style="--tint: #0A84FF;">
        <span id="eytChatText"></span>
        <span class="eyt-caret"></span>
      </span>
    </div>
  `;

  const box = mount.querySelector('.eyt');
  const ball = mount.querySelector('.eyt-ball');
  const eyeL = document.getElementById('eytEyeLeft');
  const eyeR = document.getElementById('eytEyeRight');
  const bubble = document.getElementById('eytChatBubble');
  const bubbleText = document.getElementById('eytChatText');
  const bodyPath = document.getElementById('eytBodyPathDom');
  const clipPath = document.getElementById('eytClipPathDom');

  const t = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0 };
  let raf = 0;
  let prev = 0;
  let blink = 0;
  let nextBlink = performance.now() + 2200;

  function draw(now) {
    let lid = 1;
    if (now > nextBlink) {
      blink = now;
      nextBlink = now + 2600 + Math.random() * 3200;
    }
    const since = now - blink;
    if (since < 160) lid = 1 - 0.9 * Math.sin((since / 160) * Math.PI);

    const as = (v) => Math.asin(clamp(v, -0.92, 0.92));
    const yaw = as(t.x);
    const pitch = -as(t.y);
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    const tilt = TILT * t.x * t.y;
    const g0 = GAP * Math.max(1, eyeScale * 0.8);

    const baseEye = STYLES[currentLook] || STYLES.Slant;
    const eyeElements = [eyeL, eyeR];

    [-g0, g0].forEach((x0, i) => {
      const g = eyeElements[i];
      if (!g) return;
      const z0 = Math.sqrt(1 - x0 * x0);
      const x1 = x0 * cy + z0 * sy;
      const z1 = -x0 * sy + z0 * cy;
      const y2 = -z1 * sp;
      const z2 = z1 * cp;
      const near = clamp(z2, 0, 1);
      const k = 0.45 + 0.55 * near;
      const sx = k * (0.7 + 0.3 * near);

      const w = baseEye.w * sx;
      const h = Math.max(0.6, baseEye.h * k * lid);
      const rect = g.firstElementChild;
      if (rect) {
        rect.setAttribute('x', (-w / 2).toFixed(2));
        rect.setAttribute('y', (-h / 2).toFixed(2));
        rect.setAttribute('width', w.toFixed(2));
        rect.setAttribute('height', h.toFixed(2));
        rect.setAttribute('rx', Math.min(baseEye.r, w / 2, h / 2).toFixed(2));
      }
      g.setAttribute('transform', `translate(${(50 + x1 * R).toFixed(2)} ${(50 + y2 * R).toFixed(2)}) rotate(${tilt.toFixed(2)})`);
      g.style.opacity = z2 < 0.05 ? '0' : '1';
    });
  }

  function tick(now) {
    const dt = prev ? Math.min(2.5, (now - prev) / 16.67) : 1;
    prev = now;
    const k = 0.06;
    const d = 0.34 - (clamp(bounce, 0, 100) / 100) * 0.22;
    t.vx += ((t.tx - t.x) * k - t.vx * d) * dt;
    t.vy += ((t.ty - t.y) * k - t.vy * d) * dt;
    t.x += t.vx * dt;
    t.y += t.vy * dt;
    draw(now);
    raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);

  window.addEventListener('pointermove', (e) => {
    const f = box.closest('.glass-card') || box;
    const bRect = f.getBoundingClientRect();
    if (e.clientX < bRect.left || e.clientX > bRect.right || e.clientY < bRect.top || e.clientY > bRect.bottom) {
      t.tx = 0;
      t.ty = 0;
      return;
    }
    const r = box.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    const d = Math.hypot(dx, dy) || 1;
    const reach = Math.max(60, Math.min(bRect.width, bRect.height) * 0.35);
    const far = Math.min(0.85, Math.tanh(d / reach) * 1.5);
    t.tx = (dx / d) * far;
    t.ty = (dy / d) * far;
  }, { passive: true });

  document.documentElement.addEventListener('pointerleave', () => {
    t.tx = 0;
    t.ty = 0;
  });

  let pokeTurn = 0;
  let lastPokeLine = -1;
  ball.addEventListener('click', async () => {
    playUiSound('tap');
    const mine = ++pokeTurn;
    const pool = LINES.map((_, i) => i).filter((i) => i !== lastPokeLine);
    const i = pool[Math.floor(Math.random() * pool.length)];
    lastPokeLine = i;
    const line = LINES[i];
    const wait = (ms) => new Promise((res) => setTimeout(res, ms));

    const tint = TINTS[Math.floor(Math.random() * TINTS.length)];
    bubble.style.setProperty('--tint', tint);
    bubbleText.textContent = '';
    bubble.setAttribute('data-on', 'true');

    for (let k = 1; k <= line.length; k++) {
      await wait(KEY_MS + Math.random() * 25);
      if (mine !== pokeTurn) return;
      bubbleText.textContent = line.slice(0, k);
    }
    await wait(HOLD_MS);
    if (mine !== pokeTurn) return;
    bubble.removeAttribute('data-on');
  });

  const selShape = document.getElementById('selWatcherShape');
  if (selShape) {
    selShape.addEventListener('change', (e) => {
      currentShape = e.target.value;
      const d = SHAPES[currentShape] || SHAPES.Ball;
      bodyPath.setAttribute('d', d);
      clipPath.setAttribute('d', d);
      playUiSound('tab');
    });
  }

  const selLook = document.getElementById('selWatcherLook');
  if (selLook) {
    selLook.addEventListener('change', (e) => {
      currentLook = e.target.value;
      playUiSound('tab');
    });
  }
}

function initTimeScrubber() {
  const mount = document.getElementById('timeScrubberMount');
  if (!mount) return;

  const W = 360;
  const PX = 1.8;
  const HALF = (W - 36) / 2;
  const DAY = 1440;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const wrap = (m) => ((m % DAY) + DAY) % DAY;

  const now = new Date();
  let startMinutes = now.getHours() * 60 + now.getMinutes() + 5;
  startMinutes = wrap(startMinutes);

  let pos = startMinutes;
  const p = { x: startMinutes, v: 0, to: startMinutes };
  let raf = 0;
  const step = 5;
  const momentum = 50;

  mount.innerHTML = `
    <div class="tms">
      <div class="tms-read" aria-live="polite">
        <span class="tms-time" id="tmsTimeDigits"></span>
        <span class="tms-mer" id="tmsMerBadge">AM</span>
      </div>
      <div class="tms-ruler" role="slider" tabindex="0" aria-label="Target Time">
        <div class="tms-track" id="tmsRulerTrack"></div>
        <span class="tms-mark" aria-hidden="true"></span>
      </div>
    </div>
  `;

  const timeDisplay = document.getElementById('tmsTimeDigits');
  const merBadge = document.getElementById('tmsMerBadge');
  const ruler = mount.querySelector('.tms-ruler');
  const track = document.getElementById('tmsRulerTrack');

  function getLabel(m) {
    const t = wrap(Math.round(m));
    const h = Math.floor(t / 60);
    const mm = String(t % 60).padStart(2, '0');
    return {
      h24: `${String(h).padStart(2, '0')}:${mm}`,
      time12: `${h % 12 || 12}:${mm}`,
      mer: h < 12 ? 'AM' : 'PM',
      h: h,
      m: t % 60
    };
  }

  function renderDigits(str) {
    const existingStrips = timeDisplay.querySelectorAll('.tms-strip');
    const chars = str.split('');
    const numDigits = chars.filter(c => c !== ':').length;
    if (existingStrips.length === numDigits) {
      let idx = 0;
      chars.forEach((c) => {
        if (c !== ':') {
          existingStrips[idx].style.transform = `translateY(${-Number(c) * 1.5}em)`;
          idx++;
        }
      });
      return;
    }
    timeDisplay.innerHTML = chars.map((c) => {
      if (c === ':') return '<span class="tms-colon">:</span>';
      return `
        <span class="tms-col">
          <span class="tms-strip" style="transform: translateY(${-Number(c) * 1.5}em);">
            ${'0123456789'.split('').map(n => `<span>${n}</span>`).join('')}
          </span>
        </span>
      `;
    }).join('');
  }

  function renderRuler(currentPos) {
    const span = HALF / PX + 20;
    const ticks = [];
    for (let m = Math.ceil((currentPos - span) / 5) * 5; m <= currentPos + span; m += 5) {
      const x = (m - currentPos) * PX;
      const f = clamp(1 - Math.pow(Math.abs(x) / HALF, 2), 0, 1);
      const w = wrap(m);
      const kind = (w % 60 === 0) ? 'hour' : (w % 15 === 0 ? 'quarter' : 'five');
      ticks.push({ m, x, f, kind });
    }

    track.innerHTML = ticks.map(t => `
      <span class="tms-tick" data-kind="${t.kind}" style="transform: translateX(${t.x.toFixed(2)}px) scaleY(${(0.6 + 0.4 * t.f).toFixed(3)}); opacity: ${(0.25 + 0.75 * t.f).toFixed(2)};"></span>
    `).join('') + ticks.filter(t => t.kind === 'hour').map(t => {
      const h = Math.floor(wrap(t.m) / 60);
      const lbl = `${h % 12 || 12} ${h < 12 ? 'AM' : 'PM'}`;
      return `
        <span class="tms-hour" style="transform: translateX(${t.x.toFixed(2)}px) translateX(-50%); opacity: ${(0.3 + 0.7 * t.f).toFixed(2)};">${lbl}</span>
      `;
    }).join('');
  }

  let lastTickIndex = Math.round(startMinutes / 5);

  function set(x, playSound = false) {
    p.x = x;
    pos = x;
    const l = getLabel(x);
    renderDigits(l.time12);
    merBadge.textContent = l.mer;
    renderRuler(x);

    const currentTick = Math.round(x / 5);
    if (playSound && currentTick !== lastTickIndex) {
      lastTickIndex = currentTick;
      playUiSound('timerTick');
    }

    const inp = document.getElementById('inpScheduleTime');
    if (inp) {
      inp.value = `${l.h24}:00`;
    }

    const lbl = document.getElementById('lblCustomTime');
    if (lbl) {
      lbl.textContent = `${l.time12}:00 ${l.mer}`;
    }

    if (window.syncTimePickerSelection) {
      window.syncTimePickerSelection(l.h, l.m, 0);
    }
  }

  set(startMinutes, false);

  function runSpring() {
    if (raf) return;
    let prevT = 0;
    function tick(t) {
      const dt = prevT ? clamp((t - prevT) / 16.67, 0, 2.5) : 1;
      prevT = t;
      p.v += ((p.to - p.x) * 0.022 - p.v * 0.26) * dt;
      const nextX = p.x + p.v * dt;
      if (Math.abs(p.to - nextX) < 0.01 && Math.abs(p.v) < 0.01) {
        p.v = 0;
        set(p.to, true);
        raf = 0;
        return;
      }
      set(nextX, true);
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
  }

  function goTo(to, v = p.v) {
    p.to = to;
    p.v = v;
    runSpring();
  }

  window.syncTimeScrubberToTime = (h, m) => {
    const totalMinutes = h * 60 + m;
    goTo(totalMinutes);
  };

  let drag = null;
  ruler.addEventListener('pointerdown', (e) => {
    try { ruler.setPointerCapture(e.pointerId); } catch {}
    cancelAnimationFrame(raf);
    raf = 0;
    drag = { x: e.clientX, t: performance.now(), v: 0 };
    p.v = 0;
  });

  ruler.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const now = performance.now();
    const dm = -(e.clientX - drag.x) / PX;
    const dt = Math.max(1, now - drag.t) / 16.67;
    drag.v = drag.v * 0.5 + (dm / dt) * 0.5;
    drag.x = e.clientX;
    drag.t = now;
    set(p.x + dm, true);
  });

  const onDragEnd = (e) => {
    if (!drag) return;
    const g = drag;
    drag = null;
    try { ruler.releasePointerCapture(e.pointerId); } catch {}
    const v = (performance.now() - g.t > 80) ? 0 : clamp(g.v, -14, 14);
    const carry = 6 + (momentum / 100) * 30;
    const land = Math.round((p.x + v * carry) / step) * step;
    goTo(land, v * 0.6);
  };

  ruler.addEventListener('pointerup', onDragEnd);
  ruler.addEventListener('pointercancel', onDragEnd);

  ruler.addEventListener('wheel', (e) => {
    e.preventDefault();
    cancelAnimationFrame(raf);
    raf = 0;
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    const stepDiff = delta > 0 ? 5 : -5;
    set(p.x + stepDiff, true);
    clearTimeout(mount._idle);
    mount._idle = setTimeout(() => {
      goTo(Math.round(p.x / step) * step, 0);
    }, 120);
  }, { passive: false });

  ruler.addEventListener('keydown', (e) => {
    const stepVal = e.shiftKey ? 15 : 5;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      cancelAnimationFrame(raf);
      goTo(Math.round((p.x + stepVal) / 5) * 5);
      playUiSound('timerTick');
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      cancelAnimationFrame(raf);
      goTo(Math.round((p.x - stepVal) / 5) * 5);
      playUiSound('timerTick');
    }
  });
}

// ==========================================================================
// BESPOKE APPLE LIQUID GLASS CALENDAR & TIME PICKERS
// ==========================================================================

function initCustomCalendarPicker() {
  const trigger = document.getElementById('btnCustomDatePicker');
  const popup = document.getElementById('customCalendarPopup');
  const lbl = document.getElementById('lblCustomDate');
  const inp = document.getElementById('inpScheduleDate');
  const prevBtn = document.getElementById('calPrevMonth');
  const nextBtn = document.getElementById('calNextMonth');
  const title = document.getElementById('calMonthYearTitle');
  const grid = document.getElementById('calDaysGrid');
  const btnToday = document.getElementById('calBtnToday');
  const btnClear = document.getElementById('calBtnClear');

  if (!trigger || !popup || !inp || !grid) return;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  let selectedDate = new Date();
  if (inp.value) {
    const parts = inp.value.split('-');
    if (parts.length === 3) {
      selectedDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }
  }

  let viewYear = selectedDate.getFullYear();
  let viewMonth = selectedDate.getMonth();

  function formatDisplayDate(d) {
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function formatIsoDate(d) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  function updateTriggerLabel() {
    if (lbl) {
      lbl.textContent = formatDisplayDate(selectedDate);
    }
    if (inp) {
      inp.value = formatIsoDate(selectedDate);
    }
  }

  function renderGrid() {
    if (!title || !grid) return;
    title.textContent = `${monthNames[viewMonth]} ${viewYear}`;
    grid.innerHTML = '';

    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const today = new Date();
    const isCurrentMonth = today.getFullYear() === viewYear && today.getMonth() === viewMonth;
    const isSelectedMonth = selectedDate.getFullYear() === viewYear && selectedDate.getMonth() === viewMonth;

    // Previous month padding days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const cell = document.createElement('div');
      cell.className = 'cal-day other-month';
      cell.textContent = dayNum;
      grid.appendChild(cell);
    }

    // Days in current month
    for (let day = 1; day <= daysInMonth; day++) {
      const cell = document.createElement('div');
      cell.className = 'cal-day';
      cell.textContent = day;

      if (isCurrentMonth && today.getDate() === day) {
        cell.classList.add('today');
      }

      if (isSelectedMonth && selectedDate.getDate() === day) {
        cell.classList.add('selected');
      }

      cell.addEventListener('click', (e) => {
        e.stopPropagation();
        selectedDate = new Date(viewYear, viewMonth, day);
        updateTriggerLabel();
        renderGrid();
        playUiSound('tap');
        closeCalendar();
      });

      grid.appendChild(cell);
    }

    // Next month padding days to complete 35 or 42 grid cells
    const totalCells = firstDayIndex + daysInMonth;
    const nextPadding = totalCells <= 35 ? (35 - totalCells) : (42 - totalCells);
    for (let i = 1; i <= nextPadding; i++) {
      const cell = document.createElement('div');
      cell.className = 'cal-day other-month';
      cell.textContent = i;
      grid.appendChild(cell);
    }
  }

  function openCalendar() {
    document.querySelectorAll('.apple-picker-trigger.open').forEach(trg => {
      if (trg !== trigger) {
        trg.classList.remove('open');
        trg.setAttribute('aria-expanded', 'false');
      }
    });
    document.querySelectorAll('.liquid-time-popup.open').forEach(p => p.classList.remove('open'));

    trigger.classList.add('open');
    trigger.setAttribute('aria-expanded', 'true');
    popup.classList.add('open');
    renderGrid();
  }

  function closeCalendar() {
    trigger.classList.remove('open');
    trigger.setAttribute('aria-expanded', 'false');
    popup.classList.remove('open');
  }

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    if (popup.classList.contains('open')) {
      closeCalendar();
    } else {
      openCalendar();
    }
  });

  popup.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      viewMonth--;
      if (viewMonth < 0) {
        viewMonth = 11;
        viewYear--;
      }
      renderGrid();
      playUiSound('tab');
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      viewMonth++;
      if (viewMonth > 11) {
        viewMonth = 0;
        viewYear++;
      }
      renderGrid();
      playUiSound('tab');
    });
  }

  if (btnToday) {
    btnToday.addEventListener('click', (e) => {
      e.stopPropagation();
      selectedDate = new Date();
      viewYear = selectedDate.getFullYear();
      viewMonth = selectedDate.getMonth();
      updateTriggerLabel();
      renderGrid();
      playUiSound('tab');
      closeCalendar();
    });
  }

  if (btnClear) {
    btnClear.addEventListener('click', (e) => {
      e.stopPropagation();
      selectedDate = new Date();
      viewYear = selectedDate.getFullYear();
      viewMonth = selectedDate.getMonth();
      updateTriggerLabel();
      renderGrid();
      playUiSound('stop');
      closeCalendar();
    });
  }

  // Sync when inpScheduleDate changes programmatically
  window.syncCalendarPicker = () => {
    if (inp.value) {
      const parts = inp.value.split('-');
      if (parts.length === 3) {
        selectedDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        viewYear = selectedDate.getFullYear();
        viewMonth = selectedDate.getMonth();
        updateTriggerLabel();
        renderGrid();
      }
    }
  };

  updateTriggerLabel();
  renderGrid();

  document.addEventListener('click', (e) => {
    if (!trigger.contains(e.target) && !popup.contains(e.target)) {
      closeCalendar();
    }
  });
}

function initCustomTimePicker() {
  const trigger = document.getElementById('btnCustomTimePicker');
  const popup = document.getElementById('customTimePopup');
  const lbl = document.getElementById('lblCustomTime');
  const inp = document.getElementById('inpScheduleTime');
  const scrollHours = document.getElementById('timeScrollHours');
  const scrollMinutes = document.getElementById('timeScrollMinutes');
  const scrollSeconds = document.getElementById('timeScrollSeconds');
  const btnAM = document.getElementById('btnPeriodAM');
  const btnPM = document.getElementById('btnPeriodPM');
  const btnNow = document.getElementById('timeBtnNow');
  const btnDone = document.getElementById('timeBtnDone');

  if (!trigger || !popup || !inp || !scrollHours || !scrollMinutes || !scrollSeconds) return;

  let currentHour12 = 4;
  let currentMinute = 15;
  let currentSecond = 0;
  let currentPeriod = 'AM';

  function parseInputTime() {
    if (inp.value) {
      const parts = inp.value.split(':');
      if (parts.length >= 2) {
        const h24 = parseInt(parts[0], 10) || 0;
        currentMinute = parseInt(parts[1], 10) || 0;
        currentSecond = parts.length > 2 ? (parseInt(parts[2], 10) || 0) : 0;
        currentPeriod = h24 >= 12 ? 'PM' : 'AM';
        currentHour12 = h24 % 12 || 12;
      }
    }
  }

  parseInputTime();

  function formatDisplay() {
    const hh = String(currentHour12).padStart(2, '0');
    const mm = String(currentMinute).padStart(2, '0');
    const ss = String(currentSecond).padStart(2, '0');
    return `${hh}:${mm}:${ss} ${currentPeriod}`;
  }

  function getHour24() {
    if (currentPeriod === 'PM') {
      return currentHour12 === 12 ? 12 : currentHour12 + 12;
    } else {
      return currentHour12 === 12 ? 0 : currentHour12;
    }
  }

  function updateValues(fromScrubber = false) {
    const h24 = getHour24();
    const hh24Str = String(h24).padStart(2, '0');
    const mmStr = String(currentMinute).padStart(2, '0');
    const ssStr = String(currentSecond).padStart(2, '0');

    if (inp) inp.value = `${hh24Str}:${mmStr}:${ssStr}`;
    if (lbl) lbl.textContent = formatDisplay();

    // Toggle Period buttons
    if (btnAM && btnPM) {
      if (currentPeriod === 'AM') {
        btnAM.classList.add('active');
        btnPM.classList.remove('active');
      } else {
        btnPM.classList.add('active');
        btnAM.classList.remove('active');
      }
    }

    highlightSelectedCells();

    // Sync to dial ruler if not triggered by scrubber
    if (!fromScrubber && window.syncTimeScrubberToTime) {
      window.syncTimeScrubberToTime(h24, currentMinute);
    }
  }

  function buildColumns() {
    // Hours 01 to 12
    scrollHours.innerHTML = '';
    for (let h = 1; h <= 12; h++) {
      const cell = document.createElement('div');
      cell.className = 'time-cell';
      cell.dataset.value = h;
      cell.textContent = String(h).padStart(2, '0');
      cell.addEventListener('click', (e) => {
        e.stopPropagation();
        currentHour12 = h;
        playUiSound('timerTick');
        updateValues();
      });
      scrollHours.appendChild(cell);
    }

    // Minutes 00 to 59
    scrollMinutes.innerHTML = '';
    for (let m = 0; m < 60; m++) {
      const cell = document.createElement('div');
      cell.className = 'time-cell';
      cell.dataset.value = m;
      cell.textContent = String(m).padStart(2, '0');
      cell.addEventListener('click', (e) => {
        e.stopPropagation();
        currentMinute = m;
        playUiSound('timerTick');
        updateValues();
      });
      scrollMinutes.appendChild(cell);
    }

    // Seconds 00 to 59
    scrollSeconds.innerHTML = '';
    for (let s = 0; s < 60; s++) {
      const cell = document.createElement('div');
      cell.className = 'time-cell';
      cell.dataset.value = s;
      cell.textContent = String(s).padStart(2, '0');
      cell.addEventListener('click', (e) => {
        e.stopPropagation();
        currentSecond = s;
        playUiSound('timerTick');
        updateValues();
      });
      scrollSeconds.appendChild(cell);
    }
  }

  function highlightSelectedCells() {
    scrollHours.querySelectorAll('.time-cell').forEach(c => {
      c.classList.toggle('selected', parseInt(c.dataset.value, 10) === currentHour12);
    });
    scrollMinutes.querySelectorAll('.time-cell').forEach(c => {
      c.classList.toggle('selected', parseInt(c.dataset.value, 10) === currentMinute);
    });
    scrollSeconds.querySelectorAll('.time-cell').forEach(c => {
      c.classList.toggle('selected', parseInt(c.dataset.value, 10) === currentSecond);
    });
  }

  function scrollIntoCenter() {
    setTimeout(() => {
      const selH = scrollHours.querySelector('.time-cell.selected');
      const selM = scrollMinutes.querySelector('.time-cell.selected');
      const selS = scrollSeconds.querySelector('.time-cell.selected');
      if (selH) selH.scrollIntoView({ block: 'center', behavior: 'smooth' });
      if (selM) selM.scrollIntoView({ block: 'center', behavior: 'smooth' });
      if (selS) selS.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 50);
  }

  if (btnAM) {
    btnAM.addEventListener('click', (e) => {
      e.stopPropagation();
      currentPeriod = 'AM';
      playUiSound('tab');
      updateValues();
    });
  }

  if (btnPM) {
    btnPM.addEventListener('click', (e) => {
      e.stopPropagation();
      currentPeriod = 'PM';
      playUiSound('tab');
      updateValues();
    });
  }

  if (btnNow) {
    btnNow.addEventListener('click', (e) => {
      e.stopPropagation();
      const d = new Date(Date.now() + 5 * 60 * 1000);
      const h24 = d.getHours();
      currentMinute = d.getMinutes();
      currentSecond = 0;
      currentPeriod = h24 >= 12 ? 'PM' : 'AM';
      currentHour12 = h24 % 12 || 12;
      playUiSound('tab');
      updateValues();
      scrollIntoCenter();
    });
  }

  if (btnDone) {
    btnDone.addEventListener('click', (e) => {
      e.stopPropagation();
      closeTimePicker();
      playUiSound('tap');
    });
  }

  function openTimePicker() {
    document.querySelectorAll('.apple-picker-trigger.open').forEach(trg => {
      if (trg !== trigger) {
        trg.classList.remove('open');
        trg.setAttribute('aria-expanded', 'false');
      }
    });
    document.querySelectorAll('.liquid-calendar-popup.open').forEach(p => p.classList.remove('open'));

    trigger.classList.add('open');
    trigger.setAttribute('aria-expanded', 'true');
    popup.classList.add('open');
    highlightSelectedCells();
    scrollIntoCenter();
  }

  function closeTimePicker() {
    trigger.classList.remove('open');
    trigger.setAttribute('aria-expanded', 'false');
    popup.classList.remove('open');
  }

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    if (popup.classList.contains('open')) {
      closeTimePicker();
    } else {
      openTimePicker();
    }
  });

  popup.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  window.syncTimePickerSelection = (h24, m, s = 0) => {
    currentMinute = m;
    currentSecond = s;
    currentPeriod = h24 >= 12 ? 'PM' : 'AM';
    currentHour12 = h24 % 12 || 12;
    updateValues(true);
  };

  window.syncTimePicker = () => {
    parseInputTime();
    updateValues(true);
  };

  buildColumns();
  updateValues(true);

  document.addEventListener('click', (e) => {
    if (!trigger.contains(e.target) && !popup.contains(e.target)) {
      closeTimePicker();
    }
  });
}

// ==========================================================================
// SAM ASANTE LIQUID GLASS ENGINE (glass.samasante.com)
// Signed Distance Field (SDF) displacement generator & physical refraction
// ==========================================================================

function initSamAsanteLiquidGlass() {
  const mapImage = document.getElementById('samasanteMapImage');
  if (!mapImage) return;

  // Sam Asante Material Optics parameters (glass.samasante.com)
  const optics = {
    mapSize: 256,
    strength: 0.05,
    depth: 0.5,
    curvature: 0.3,
    bend: 0.45,
    bendWidth: 0.16,
    sheen: 0.32,
    sheenAngle: 45 * (Math.PI / 180),
    glow: 0.1,
  };

  try {
    const canvas = document.createElement('canvas');
    canvas.width = optics.mapSize;
    canvas.height = optics.mapSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imgData = ctx.createImageData(optics.mapSize, optics.mapSize);
    const data = imgData.data;

    const size = optics.mapSize;
    const half = size / 2;
    const radius = half * 0.45;
    const halfW = half * 0.85;
    const halfH = half * 0.85;

    const lightX = Math.cos(optics.sheenAngle);
    const lightY = Math.sin(optics.sheenAngle);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;

        // Rounded rect SDF from center
        const px = Math.abs(x - half) - (halfW - radius);
        const py = Math.abs(y - half) - (halfH - radius);
        const ox = Math.max(px, 0);
        const oy = Math.max(py, 0);
        const dist = Math.sqrt(ox * ox + oy * oy) + Math.min(Math.max(px, py), 0) - radius;

        if (dist > 0) {
          // Outside the lens boundary: neutral grey (no displacement, no specular)
          data[idx] = 128;
          data[idx + 1] = 128;
          data[idx + 2] = 128;
          data[idx + 3] = 0;
        } else {
          // Inside lens: compute surface normals from gradient
          const inward = -dist;
          const normDist = Math.min(1, inward / (half * optics.depth));

          // Normal vectors toward center
          const dx = (x - half) / half;
          const dy = (y - half) / half;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          const nx = dx / len;
          const ny = dy / len;

          // Dome curvature + rim meniscus bend
          const dome = Math.sin(normDist * Math.PI * 0.5) * optics.curvature;
          const rimBand = Math.max(0, 1 - (inward / (half * optics.bendWidth)));
          const rimBend = Math.sin(rimBand * Math.PI * 0.5) * optics.bend;
          const totalBend = (dome + rimBend) * optics.strength;

          // R = X displacement (128 is 0 displacement)
          data[idx] = Math.max(0, Math.min(255, Math.round(128 + nx * totalBend * 127)));
          // G = Y displacement (128 is 0 displacement)
          data[idx + 1] = Math.max(0, Math.min(255, Math.round(128 + ny * totalBend * 127)));

          // Specular & Meniscus sheen (B channel: 128 = 0 sheen, 255 = full sheen)
          const dot = Math.max(0, nx * lightX + ny * lightY);
          const sheenVal = Math.pow(dot, 3) * optics.sheen * rimBand;
          const glowVal = Math.exp(-inward / (half * 0.2)) * optics.glow;
          const specular = Math.min(1, sheenVal + glowVal);

          data[idx + 2] = Math.round(128 + specular * 127);
          data[idx + 3] = 255;
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
    const dataUrl = canvas.toDataURL('image/png');
    mapImage.setAttribute('href', dataUrl);

    // Browser engine detection for backdrop-filter url() support
    const ua = navigator.userAgent;
    const hasUAData = typeof navigator.userAgentData !== 'undefined';
    const isChromium = hasUAData || (/\b(?:Chrome|Chromium|Edg)\//.test(ua) && !/\b(?:CriOS|EdgiOS|FxiOS|OPiOS)\b/.test(ua) && !/iPhone|iPad|iPod/.test(ua));

    if (!isChromium) {
      // Safari / Firefox fallback: maintain Apple liquid frost and saturation
      document.querySelectorAll('.app-window, .glass-card, .segmented-nav').forEach(el => {
        el.style.backdropFilter = 'blur(20px) saturate(1.25)';
      });
    }
  } catch (err) {
    console.warn('Liquid glass map initialization fallback:', err);
  }
}

// ==========================================================================
// LÉO'S ANIMATED APPLE SWITCH (@unlumen-ui/apple-switch)
// Draggable thumb, liquid press feedback, spring physics, widening thumb,
// and synchronized active progress transform.
// ==========================================================================

function initLeoAppleSwitches() {
  document.querySelectorAll('.apple-switch[role="switch"]').forEach(sw => {
    const hiddenCheckbox = sw.querySelector('input[type="checkbox"]');
    const thumb = sw.querySelector('.apple-switch-thumb');
    const track = sw.querySelector('.apple-switch-track');

    let isChecked = sw.getAttribute('aria-checked') === 'true';
    if (hiddenCheckbox) {
      isChecked = hiddenCheckbox.checked;
      sw.setAttribute('aria-checked', isChecked ? 'true' : 'false');
    }

    let isDragging = false;
    let startX = 0;
    let currentDragX = 0;
    let hasMoved = false;

    // Travel distance = track width (48) - thumb width (24) - left padding (2*2) = 20px
    const travelDistance = 20;

    function updateVisuals(progress, isPressed = false) {
      // progress: 0 (off) to 1 (on)
      const x = progress * travelDistance;
      sw.classList.toggle('is-checked', progress >= 0.5);
      sw.classList.toggle('is-pressed', isPressed);

      if (thumb) {
        // When dragging or pressed, thumb widens by 5px (24px -> 29px)
        if (isPressed) {
          const origin = progress >= 0.5 ? 'right center' : 'left center';
          thumb.style.transformOrigin = origin;
          thumb.style.transform = `translateX(${x}px)`;
        } else {
          thumb.style.transformOrigin = 'center center';
          thumb.style.transform = `translateX(${x}px)`;
        }
      }
    }

    function setChecked(checked, triggerSound = true) {
      isChecked = checked;
      sw.setAttribute('aria-checked', checked ? 'true' : 'false');
      sw.classList.toggle('is-checked', checked);
      if (hiddenCheckbox) {
        hiddenCheckbox.checked = checked;
        hiddenCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
      }
      updateVisuals(checked ? 1 : 0, false);
      if (triggerSound) playUiSound('switch');
    }

    updateVisuals(isChecked ? 1 : 0, false);

    sw.addEventListener('pointerdown', (e) => {
      try { sw.setPointerCapture(e.pointerId); } catch {}
      isDragging = true;
      startX = e.clientX;
      hasMoved = false;
      sw.classList.add('is-pressed');
      updateVisuals(isChecked ? 1 : 0, true);
    });

    sw.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 3) hasMoved = true;

      // Real-time draggable slide
      let base = isChecked ? travelDistance : 0;
      let dragX = Math.max(0, Math.min(travelDistance, base + dx));
      let progress = dragX / travelDistance;
      updateVisuals(progress, true);
      currentDragX = dx;
    });

    const onPointerUp = (e) => {
      if (!isDragging) return;
      isDragging = false;
      try { sw.releasePointerCapture(e.pointerId); } catch {}
      sw.classList.remove('is-pressed');

      if (!hasMoved) {
        // Click to toggle
        setChecked(!isChecked, true);
      } else {
        // Drag to slide: if dragged past midpoint or in toggle direction
        const shouldBeChecked = isChecked ? (currentDragX > -travelDistance / 2) : (currentDragX > travelDistance / 2);
        setChecked(shouldBeChecked, shouldBeChecked !== isChecked);
      }
    };

    sw.addEventListener('pointerup', onPointerUp);
    sw.addEventListener('pointercancel', onPointerUp);

    sw.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setChecked(!isChecked, true);
      }
    });

    // Synchronize if hidden input changes programmatically
    if (hiddenCheckbox) {
      hiddenCheckbox.addEventListener('change', () => {
        if (hiddenCheckbox.checked !== isChecked) {
          setChecked(hiddenCheckbox.checked, false);
        }
      });
    }
  });
}

// ==========================================================================
// INITIALIZATION
// ==========================================================================

window.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initAccentColorChanger();
  initSamAsanteLiquidGlass();
  initNav();
  initClickerSettings();
  initMacroStudio();
  initMacroScheduler();
  initSpeedTester();
  initHotkeyManager();
  initCustomSelects();
  initAudioSettings();
  initSettingsFromBackend();

  // Bencho components
  initWakeSlider();
  initEyeTracker();
  initTimeScrubber();
  initCustomCalendarPicker();
  initCustomTimePicker();
  initLeoAppleSwitches();

  // Traffic lights: Native Minimize, Close, and Zoom
  const btnClose = document.getElementById('btnWindowClose');
  if (btnClose) {
    btnClose.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (window.electronAPI && window.electronAPI.close) {
        window.electronAPI.close();
        return;
      }
      try {
        if (window.pywebview && window.pywebview.api && window.pywebview.api.close) {
          window.pywebview.api.close();
        } else {
          await fetch('/api/window/close', { method: 'POST' });
        }
      } catch (err) {}
      try { window.close(); } catch (err) {}
    });
  }

  const btnMin = document.getElementById('btnWindowMin');
  if (btnMin) {
    btnMin.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (window.electronAPI && window.electronAPI.minimize) {
        window.electronAPI.minimize();
        return;
      }
      try {
        if (window.pywebview && window.pywebview.api && window.pywebview.api.minimize) {
          window.pywebview.api.minimize();
        } else {
          await fetch('/api/window/minimize', { method: 'POST' });
        }
      } catch (err) {}
    });
  }

  const btnZoom = document.getElementById('btnWindowZoom');
  if (btnZoom) {
    btnZoom.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (window.electronAPI && window.electronAPI.toggleMaximize) {
        const isMax = await window.electronAPI.toggleMaximize();
        showLiquidAlert(isMax ? 'Maximized window' : 'Restored window size', 'info', 'Window');
        return;
      }
      const isExpanded = document.body.classList.toggle('expanded-view');
      showLiquidAlert(isExpanded ? 'Expanded wide workspace layout' : 'Restored standard compact window', 'info', 'Window Layout');
    });
  }

  // Handle external links (Facebook, Instagram, documentation) to open in the user's default browser
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="http://"], a[href^="https://"], .social-pill-btn');
    if (link) {
      const url = link.getAttribute('href');
      if (url && !url.includes('127.0.0.1:5678') && !url.includes('localhost:5678')) {
        e.preventDefault();
        e.stopPropagation();
        if (window.electronAPI && window.electronAPI.openExternal) {
          window.electronAPI.openExternal(url);
        } else {
          try {
            fetch('/api/open_browser', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url })
            });
          } catch (err) {}
          window.open(url, '_blank');
        }
      }
    }
  });

  // Adaptive non-blocking status loop (120ms active, 250ms idle)
  function scheduleNextPoll() {
    const delay = (appState.running || appState.isRecording || appState.isPlayingMacro) ? 120 : 250;
    setTimeout(async () => {
      await pollBackendStatus();
      scheduleNextPoll();
    }, delay);
  }
  scheduleNextPoll();
});

