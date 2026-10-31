/**
 * AetherClick - In-Browser Auto Clicker & Precision Engine
 * Content Script (Runs in Web Pages)
 */

(function () {
  if (window.__AETHERCLICK_LOADED__) return;
  window.__AETHERCLICK_LOADED__ = true;

  // Clicker State
  const state = {
    running: false,
    timerId: null,
    totalClicks: 0,
    clicksInWindow: [],
    settings: {
      intervalMode: 'fixed',
      intervalMs: 100,
      randomMinMs: 50,
      randomMaxMs: 150,
      mouseButton: 'left', // 'left', 'right', 'middle'
      clickType: 'single', // 'single', 'double'
      repeatMode: 'infinite', // 'infinite', 'count'
      repeatCount: 100,
      targetMode: 'cursor', // 'cursor', 'coords', 'element'
      coords: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
      selector: ''
    },
    currentMousePos: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
    isPicking: false
  };

  // Track live mouse position on webpage
  window.addEventListener('mousemove', (e) => {
    state.currentMousePos.x = e.clientX;
    state.currentMousePos.y = e.clientY;
  }, { passive: true });

  // Floating On-Screen HUD Badge
  let hudContainer = null;

  function createHud() {
    if (hudContainer) return;
    hudContainer = document.createElement('div');
    hudContainer.id = '__aetherclick_hud__';
    hudContainer.innerHTML = `
      <div class="ac-hud-inner">
        <span class="ac-hud-dot"></span>
        <div class="ac-hud-info">
          <span class="ac-hud-title">AetherClick</span>
          <span class="ac-hud-stats" id="__ac_hud_stats__">0 CPS • 0 Clicks</span>
        </div>
        <button type="button" class="ac-hud-btn" id="__ac_hud_stop__" title="Stop AutoClicker">Stop</button>
      </div>
      <style>
        #__aetherclick_hud__ {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 2147483647;
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif;
          pointer-events: auto;
          user-select: none;
          display: none;
        }
        .ac-hud-inner {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 14px;
          background: rgba(14, 19, 30, 0.88);
          backdrop-filter: blur(20px) saturate(140%);
          -webkit-backdrop-filter: blur(20px) saturate(140%);
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 9999px;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45), inset 0 1px 1px rgba(255, 255, 255, 0.2);
          color: #fff;
        }
        .ac-hud-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #30D158;
          box-shadow: 0 0 10px #30D158;
          animation: acPulse 1.2s infinite alternate;
        }
        @keyframes acPulse {
          from { opacity: 0.6; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1.15); }
        }
        .ac-hud-info {
          display: flex;
          flex-direction: column;
        }
        .ac-hud-title {
          font-size: 11px;
          font-weight: 700;
          color: #0A84FF;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .ac-hud-stats {
          font-size: 12px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.9);
        }
        .ac-hud-btn {
          background: rgba(255, 69, 58, 0.22);
          border: 1px solid rgba(255, 69, 58, 0.5);
          color: #FF453A;
          border-radius: 9999px;
          padding: 3px 10px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.16s;
        }
        .ac-hud-btn:hover {
          background: rgba(255, 69, 58, 0.38);
        }
      </style>
    `;
    document.documentElement.appendChild(hudContainer);

    document.getElementById('__ac_hud_stop__').addEventListener('click', () => {
      stopClicker();
      chrome.runtime.sendMessage({ action: 'STATUS_CHANGED', running: false });
    });
  }

  function updateHud(cps) {
    if (!hudContainer) createHud();
    hudContainer.style.display = state.running ? 'block' : 'none';
    const statsEl = document.getElementById('__ac_hud_stats__');
    if (statsEl) {
      statsEl.textContent = `${cps} CPS • ${state.totalClicks.toLocaleString()} Clicks`;
    }
  }

  // Get current click interval in ms
  function getNextInterval() {
    if (state.settings.intervalMode === 'random') {
      const min = Math.max(1, state.settings.randomMinMs || 50);
      const max = Math.max(min, state.settings.randomMaxMs || 150);
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    return Math.max(1, state.settings.intervalMs || 100);
  }

  // Calculate live CPS
  function calculateCps() {
    const now = performance.now();
    state.clicksInWindow = state.clicksInWindow.filter(t => now - t <= 1000);
    return state.clicksInWindow.length;
  }

  // Execute a hardware-grade synthetic click on target
  function fireSyntheticClick() {
    let clientX = state.currentMousePos.x;
    let clientY = state.currentMousePos.y;
    let targetEl = null;

    if (state.settings.targetMode === 'coords') {
      clientX = state.settings.coords.x;
      clientY = state.settings.coords.y;
      targetEl = document.elementFromPoint(clientX, clientY);
    } else if (state.settings.targetMode === 'element' && state.settings.selector) {
      try {
        targetEl = document.querySelector(state.settings.selector);
        if (targetEl) {
          const rect = targetEl.getBoundingClientRect();
          clientX = rect.left + rect.width / 2;
          clientY = rect.top + rect.height / 2;
        }
      } catch (e) {}
    } else {
      // Cursor position
      targetEl = document.elementFromPoint(clientX, clientY);
    }

    if (!targetEl) targetEl = document.elementFromPoint(clientX, clientY) || document.body;

    const btn = state.settings.mouseButton === 'right' ? 2 : (state.settings.mouseButton === 'middle' ? 1 : 0);
    const buttons = state.settings.mouseButton === 'right' ? 2 : (state.settings.mouseButton === 'middle' ? 4 : 1);

    const eventInit = {
      bubbles: true,
      cancelable: true,
      view: window,
      detail: 1,
      clientX: clientX,
      clientY: clientY,
      screenX: clientX + (window.screenX || 0),
      screenY: clientY + (window.screenY || 0),
      button: btn,
      buttons: buttons
    };

    // Dispatches full standard event chain
    targetEl.dispatchEvent(new PointerEvent('pointerdown', eventInit));
    targetEl.dispatchEvent(new MouseEvent('mousedown', eventInit));
    targetEl.dispatchEvent(new PointerEvent('pointerup', eventInit));
    targetEl.dispatchEvent(new MouseEvent('mouseup', eventInit));
    targetEl.dispatchEvent(new MouseEvent('click', eventInit));

    if (state.settings.clickType === 'double') {
      targetEl.dispatchEvent(new MouseEvent('dblclick', eventInit));
    }

    // Direct click invocation if supported
    if (typeof targetEl.click === 'function' && btn === 0) {
      try { targetEl.click(); } catch (e) {}
    }

    const now = performance.now();
    state.totalClicks++;
    state.clicksInWindow.push(now);

    updateHud(calculateCps());

    // Check repeat limit
    if (state.settings.repeatMode === 'count' && state.totalClicks >= state.settings.repeatCount) {
      stopClicker();
      chrome.runtime.sendMessage({ action: 'STATUS_CHANGED', running: false });
    }
  }

  // Core Precision Click Loop
  function startClicker(settings) {
    if (state.running) stopClicker();
    if (settings) state.settings = { ...state.settings, ...settings };

    state.running = true;
    state.totalClicks = 0;
    state.clicksInWindow = [];

    createHud();
    updateHud(0);

    function step() {
      if (!state.running) return;
      fireSyntheticClick();
      const delay = getNextInterval();
      state.timerId = setTimeout(step, delay);
    }

    step();
  }

  function stopClicker() {
    state.running = false;
    if (state.timerId) {
      clearTimeout(state.timerId);
      state.timerId = null;
    }
    updateHud(0);
    if (hudContainer) {
      hudContainer.style.display = 'none';
    }
  }

  // Interactive Target Element / Coordinate Picker Overlay
  let pickerOverlay = null;

  function startTargetPicker() {
    if (state.isPicking) return;
    state.isPicking = true;

    pickerOverlay = document.createElement('div');
    pickerOverlay.id = '__aetherclick_picker__';
    pickerOverlay.innerHTML = `
      <div id="__ac_picker_box__"></div>
      <div id="__ac_picker_tooltip__">Click any element or position to set target (ESC to cancel)</div>
      <style>
        #__aetherclick_picker__ {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          z-index: 2147483647;
          cursor: crosshair;
          background: rgba(0, 0, 0, 0.15);
        }
        #__ac_picker_box__ {
          position: fixed;
          pointer-events: none;
          border: 2px solid #0A84FF;
          background: rgba(10, 132, 255, 0.16);
          border-radius: 4px;
          transition: all 0.05s ease;
          display: none;
          box-shadow: 0 0 14px rgba(10, 132, 255, 0.6);
        }
        #__ac_picker_tooltip__ {
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(10, 14, 24, 0.92);
          border: 1px solid rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(16px);
          color: #fff;
          padding: 8px 18px;
          border-radius: 9999px;
          font-family: sans-serif;
          font-size: 13px;
          font-weight: 500;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
          pointer-events: none;
        }
      </style>
    `;
    document.documentElement.appendChild(pickerOverlay);

    const box = document.getElementById('__ac_picker_box__');

    function onMove(e) {
      pickerOverlay.style.pointerEvents = 'none';
      const el = document.elementFromPoint(e.clientX, e.clientY);
      pickerOverlay.style.pointerEvents = 'auto';

      if (el && el !== pickerOverlay && !pickerOverlay.contains(el)) {
        const rect = el.getBoundingClientRect();
        box.style.display = 'block';
        box.style.top = `${rect.top}px`;
        box.style.left = `${rect.left}px`;
        box.style.width = `${rect.width}px`;
        box.style.height = `${rect.height}px`;
      }
    }

    function onClick(e) {
      e.preventDefault();
      e.stopPropagation();

      pickerOverlay.style.pointerEvents = 'none';
      const el = document.elementFromPoint(e.clientX, e.clientY);
      pickerOverlay.remove();
      state.isPicking = false;

      let selector = '';
      if (el && el !== document.body && el !== document.documentElement) {
        if (el.id) {
          selector = `#${el.id}`;
        } else if (el.className && typeof el.className === 'string') {
          const firstClass = el.className.trim().split(/\s+/)[0];
          if (firstClass) selector = `${el.tagName.toLowerCase()}.${firstClass}`;
        }
        if (!selector) selector = el.tagName.toLowerCase();
      }

      const pickedCoords = { x: Math.round(e.clientX), y: Math.round(e.clientY) };
      state.settings.coords = pickedCoords;
      state.settings.selector = selector;

      chrome.storage.local.set({
        aether_target_mode: selector ? 'element' : 'coords',
        aether_coords: pickedCoords,
        aether_selector: selector
      });

      chrome.runtime.sendMessage({
        action: 'TARGET_PICKED',
        coords: pickedCoords,
        selector: selector
      });
    }

    function onKeyDown(e) {
      if (e.key === 'Escape') {
        if (pickerOverlay) pickerOverlay.remove();
        state.isPicking = false;
        window.removeEventListener('keydown', onKeyDown);
      }
    }

    pickerOverlay.addEventListener('mousemove', onMove);
    pickerOverlay.addEventListener('click', onClick, { once: true });
    window.addEventListener('keydown', onKeyDown);
  }

  // Extension Message Bridge
  chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
    if (req.action === 'START') {
      startClicker(req.settings);
      sendResponse({ success: true, running: true });
    } else if (req.action === 'STOP') {
      stopClicker();
      sendResponse({ success: true, running: false });
    } else if (req.action === 'TOGGLE') {
      if (state.running) {
        stopClicker();
      } else {
        startClicker(req.settings);
      }
      sendResponse({ success: true, running: state.running });
    } else if (req.action === 'PICK_TARGET') {
      startTargetPicker();
      sendResponse({ success: true });
    } else if (req.action === 'RESET_COUNTER') {
      state.totalClicks = 0;
      state.clicksInWindow = [];
      updateHud();
      sendResponse({ success: true });
    } else if (req.action === 'GET_STATUS') {
      sendResponse({
        running: state.running,
        totalClicks: state.totalClicks,
        cps: calculateCps(),
        settings: state.settings
      });
    }
    return true;
  });

  // Load saved settings from Chrome Storage
  chrome.storage.local.get(null, (saved) => {
    if (saved) {
      if (saved.aether_interval_ms) state.settings.intervalMs = saved.aether_interval_ms;
      if (saved.aether_random_min) state.settings.randomMinMs = saved.aether_random_min;
      if (saved.aether_random_max) state.settings.randomMaxMs = saved.aether_random_max;
      if (saved.aether_mode) state.settings.intervalMode = saved.aether_mode;
      if (saved.aether_coords) state.settings.coords = saved.aether_coords;
      if (saved.aether_selector) state.settings.selector = saved.aether_selector;
      if (saved.aether_button) state.settings.mouseButton = saved.aether_button;
    }
  });

})();
