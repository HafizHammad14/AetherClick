/**
 * AetherClick Chrome Extension — Popup Controller
 * Designed & Developed by Hammad Designz
 */

document.addEventListener('DOMContentLoaded', async () => {
  // UI Elements
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const lblLiveCps = document.getElementById('lblLiveCps');
  const lblTotalClicks = document.getElementById('lblTotalClicks');
  const btnResetHud = document.getElementById('btnResetHud');

  // Interval Elements
  const btnModeFixed = document.getElementById('btnModeFixed');
  const btnModeRandom = document.getElementById('btnModeRandom');
  const fixedIntervalGroup = document.getElementById('fixedIntervalGroup');
  const randomIntervalGroup = document.getElementById('randomIntervalGroup');
  const inHours = document.getElementById('inHours');
  const inMins = document.getElementById('inMins');
  const inSecs = document.getElementById('inSecs');
  const inMs = document.getElementById('inMs');
  const inRandomMin = document.getElementById('inRandomMin');
  const inRandomMax = document.getElementById('inRandomMax');

  // Options
  const selMouseButton = document.getElementById('selMouseButton');
  const selClickType = document.getElementById('selClickType');

  // Repeat
  const btnRepeatInfinite = document.getElementById('btnRepeatInfinite');
  const btnRepeatCount = document.getElementById('btnRepeatCount');
  const repeatCountRow = document.getElementById('repeatCountRow');
  const inRepeatCount = document.getElementById('inRepeatCount');

  // Target Location
  const radTargetCursor = document.getElementById('radTargetCursor');
  const radTargetCoords = document.getElementById('radTargetCoords');
  const radTargetElement = document.getElementById('radTargetElement');
  const targetCoordsGroup = document.getElementById('targetCoordsGroup');
  const targetElementGroup = document.getElementById('targetElementGroup');
  const inCoordX = document.getElementById('inCoordX');
  const inCoordY = document.getElementById('inCoordY');
  const inSelector = document.getElementById('inSelector');
  const btnPickTarget = document.getElementById('btnPickTarget');

  // Action Button
  const btnToggleClicker = document.getElementById('btnToggleClicker');
  const btnActionText = document.getElementById('btnActionText');

  // Social Buttons
  const btnFacebook = document.getElementById('btnFacebook');
  const btnInstagram = document.getElementById('btnInstagram');

  // Local State
  let currentTab = null;
  let isRunning = false;
  let intervalMode = 'fixed';
  let repeatMode = 'infinite';
  let targetMode = 'cursor';
  let pollTimer = null;

  // Retrieve current active tab
  async function getActiveTab() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs && tabs.length > 0 ? tabs[0] : null;
  }

  // Ensure content script is injected in active tab
  async function ensureContentScript(tabId) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content.js']
      });
    } catch (e) {
      // Script may already be injected or page is restricted (e.g. chrome://)
    }
  }

  // Send message safely to active tab
  async function sendTabMessage(msg) {
    if (!currentTab || !currentTab.id) {
      currentTab = await getActiveTab();
    }
    if (!currentTab || !currentTab.id) return null;

    return new Promise((resolve) => {
      chrome.tabs.sendMessage(currentTab.id, msg, async (response) => {
        if (chrome.runtime.lastError) {
          // Attempt injection and retry once
          await ensureContentScript(currentTab.id);
          chrome.tabs.sendMessage(currentTab.id, msg, (retryResponse) => {
            if (chrome.runtime.lastError) {
              resolve(null);
            } else {
              resolve(retryResponse);
            }
          });
        } else {
          resolve(response);
        }
      });
    });
  }

  // Calculate total interval in ms
  function calculateTotalIntervalMs() {
    const h = Math.max(0, parseInt(inHours.value, 10) || 0);
    const m = Math.max(0, parseInt(inMins.value, 10) || 0);
    const s = Math.max(0, parseInt(inSecs.value, 10) || 0);
    const ms = Math.max(1, parseInt(inMs.value, 10) || 1);
    return (h * 3600000) + (m * 60000) + (s * 1000) + ms;
  }

  // Parse total ms into H, M, S, MS fields
  function setFieldsFromIntervalMs(totalMs) {
    let remain = Math.max(1, totalMs || 100);
    const h = Math.floor(remain / 3600000);
    remain %= 3600000;
    const m = Math.floor(remain / 60000);
    remain %= 60000;
    const s = Math.floor(remain / 1000);
    const ms = remain % 1000;

    inHours.value = h;
    inMins.value = m;
    inSecs.value = s;
    inMs.value = ms || 1;
  }

  // Gather complete settings object
  function gatherSettings() {
    return {
      intervalMode: intervalMode,
      intervalMs: calculateTotalIntervalMs(),
      randomMinMs: Math.max(1, parseInt(inRandomMin.value, 10) || 50),
      randomMaxMs: Math.max(1, parseInt(inRandomMax.value, 10) || 150),
      mouseButton: selMouseButton.value,
      clickType: selClickType.value,
      repeatMode: repeatMode,
      repeatCount: Math.max(1, parseInt(inRepeatCount.value, 10) || 100),
      targetMode: targetMode,
      coords: {
        x: parseInt(inCoordX.value, 10) || 500,
        y: parseInt(inCoordY.value, 10) || 500
      },
      selector: inSelector.value.trim()
    };
  }

  // Save settings to Chrome Storage
  function persistSettings() {
    const settings = gatherSettings();
    chrome.storage.local.set({
      aether_mode: settings.intervalMode,
      aether_interval_ms: settings.intervalMs,
      aether_random_min: settings.randomMinMs,
      aether_random_max: settings.randomMaxMs,
      aether_button: settings.mouseButton,
      aether_click_type: settings.clickType,
      aether_repeat_mode: settings.repeatMode,
      aether_repeat_count: settings.repeatCount,
      aether_target_mode: settings.targetMode,
      aether_coords: settings.coords,
      aether_selector: settings.selector
    });
  }

  // Update UI visual state based on running status
  function updateRunningState(running) {
    isRunning = !!running;
    if (isRunning) {
      statusDot.classList.add('active');
      statusText.textContent = 'CLICKING';
      statusText.style.color = 'var(--accent-green)';
      btnToggleClicker.className = 'btn-action btn-stop';
      btnActionText.textContent = 'Stop Auto Clicker';
    } else {
      statusDot.classList.remove('active');
      statusText.textContent = 'READY';
      statusText.style.color = 'var(--text-secondary)';
      btnToggleClicker.className = 'btn-action btn-start';
      btnActionText.textContent = 'Start Auto Clicker';
    }
  }

  // Sync settings into input fields
  function applyLoadedSettings(saved) {
    if (!saved) return;

    if (saved.aether_interval_ms) {
      setFieldsFromIntervalMs(saved.aether_interval_ms);
    }
    if (saved.aether_random_min) inRandomMin.value = saved.aether_random_min;
    if (saved.aether_random_max) inRandomMax.value = saved.aether_random_max;

    if (saved.aether_mode === 'random') {
      intervalMode = 'random';
      btnModeFixed.classList.remove('active');
      btnModeRandom.classList.add('active');
      fixedIntervalGroup.style.display = 'none';
      randomIntervalGroup.style.display = 'flex';
    } else {
      intervalMode = 'fixed';
      btnModeRandom.classList.remove('active');
      btnModeFixed.classList.add('active');
      randomIntervalGroup.style.display = 'none';
      fixedIntervalGroup.style.display = 'grid';
    }

    if (saved.aether_button) selMouseButton.value = saved.aether_button;
    if (saved.aether_click_type) selClickType.value = saved.aether_click_type;

    if (saved.aether_repeat_mode === 'count') {
      repeatMode = 'count';
      btnRepeatInfinite.classList.remove('active');
      btnRepeatCount.classList.add('active');
      repeatCountRow.style.display = 'flex';
    } else {
      repeatMode = 'infinite';
      btnRepeatCount.classList.remove('active');
      btnRepeatInfinite.classList.add('active');
      repeatCountRow.style.display = 'none';
    }
    if (saved.aether_repeat_count) inRepeatCount.value = saved.aether_repeat_count;

    targetMode = saved.aether_target_mode || 'cursor';
    if (targetMode === 'coords') {
      radTargetCoords.checked = true;
      targetCoordsGroup.style.display = 'flex';
      targetElementGroup.style.display = 'none';
    } else if (targetMode === 'element') {
      radTargetElement.checked = true;
      targetCoordsGroup.style.display = 'flex';
      targetElementGroup.style.display = 'flex';
    } else {
      radTargetCursor.checked = true;
      targetCoordsGroup.style.display = 'none';
      targetElementGroup.style.display = 'none';
    }

    if (saved.aether_coords) {
      inCoordX.value = saved.aether_coords.x || 500;
      inCoordY.value = saved.aether_coords.y || 500;
    }
    if (saved.aether_selector) {
      inSelector.value = saved.aether_selector;
    }
  }

  // Toggle Mode: Fixed vs Random
  btnModeFixed.addEventListener('click', () => {
    intervalMode = 'fixed';
    btnModeFixed.classList.add('active');
    btnModeRandom.classList.remove('active');
    fixedIntervalGroup.style.display = 'grid';
    randomIntervalGroup.style.display = 'none';
    persistSettings();
  });

  btnModeRandom.addEventListener('click', () => {
    intervalMode = 'random';
    btnModeRandom.classList.add('active');
    btnModeFixed.classList.remove('active');
    fixedIntervalGroup.style.display = 'none';
    randomIntervalGroup.style.display = 'flex';
    persistSettings();
  });

  // Toggle Repeat: Infinite vs Count
  btnRepeatInfinite.addEventListener('click', () => {
    repeatMode = 'infinite';
    btnRepeatInfinite.classList.add('active');
    btnRepeatCount.classList.remove('active');
    repeatCountRow.style.display = 'none';
    persistSettings();
  });

  btnRepeatCount.addEventListener('click', () => {
    repeatMode = 'count';
    btnRepeatCount.classList.add('active');
    btnRepeatInfinite.classList.remove('active');
    repeatCountRow.style.display = 'flex';
    persistSettings();
  });

  // Target Location Radio Listeners
  [radTargetCursor, radTargetCoords, radTargetElement].forEach((radio) => {
    radio.addEventListener('change', () => {
      if (radTargetCursor.checked) {
        targetMode = 'cursor';
        targetCoordsGroup.style.display = 'none';
        targetElementGroup.style.display = 'none';
      } else if (radTargetCoords.checked) {
        targetMode = 'coords';
        targetCoordsGroup.style.display = 'flex';
        targetElementGroup.style.display = 'none';
      } else if (radTargetElement.checked) {
        targetMode = 'element';
        targetCoordsGroup.style.display = 'flex';
        targetElementGroup.style.display = 'flex';
      }
      persistSettings();
    });
  });

  // Pick Element on Page
  btnPickTarget.addEventListener('click', async () => {
    await sendTabMessage({ action: 'PICK_TARGET' });
    window.close(); // Close popup so user can click target on webpage
  });

  // Input change persistence
  [inHours, inMins, inSecs, inMs, inRandomMin, inRandomMax, selMouseButton, selClickType, inRepeatCount, inCoordX, inCoordY, inSelector].forEach((el) => {
    el.addEventListener('change', persistSettings);
    el.addEventListener('input', persistSettings);
  });

  // Start / Stop Toggle
  btnToggleClicker.addEventListener('click', async () => {
    persistSettings();
    const settings = gatherSettings();

    if (isRunning) {
      const res = await sendTabMessage({ action: 'STOP' });
      if (res) updateRunningState(res.running);
      else updateRunningState(false);
    } else {
      const res = await sendTabMessage({ action: 'START', settings: settings });
      if (res) updateRunningState(res.running);
      else updateRunningState(true);
    }
  });

  // Reset HUD Counter
  btnResetHud.addEventListener('click', async () => {
    lblLiveCps.innerHTML = `0.0 <small>CPS</small>`;
    lblTotalClicks.textContent = '0';
    await sendTabMessage({ action: 'RESET_COUNTER' });
  });

  // Social Links opened safely in new tab via chrome.tabs.create
  btnFacebook.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://www.facebook.com/hammad.designz' });
  });

  btnInstagram.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://www.instagram.com/hammad.designz/' });
  });

  // Real-time tab status polling
  async function pollStatus() {
    const res = await sendTabMessage({ action: 'GET_STATUS' });
    if (res) {
      updateRunningState(res.running);
      if (typeof res.cps === 'number') {
        lblLiveCps.innerHTML = `${res.cps.toFixed(1)} <small>CPS</small>`;
      }
      if (typeof res.totalClicks === 'number') {
        lblTotalClicks.textContent = res.totalClicks.toLocaleString();
      }
    }
  }

  // Listen for message broadcasts from content script
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === 'STATUS_CHANGED') {
      updateRunningState(msg.running);
    } else if (msg.action === 'TARGET_PICKED') {
      if (msg.coords) {
        inCoordX.value = msg.coords.x;
        inCoordY.value = msg.coords.y;
      }
      if (msg.selector) {
        inSelector.value = msg.selector;
        radTargetElement.checked = true;
        targetMode = 'element';
        targetCoordsGroup.style.display = 'flex';
        targetElementGroup.style.display = 'flex';
      } else {
        radTargetCoords.checked = true;
        targetMode = 'coords';
        targetCoordsGroup.style.display = 'flex';
        targetElementGroup.style.display = 'none';
      }
      persistSettings();
    }
  });

  // Initialize
  currentTab = await getActiveTab();
  chrome.storage.local.get(null, (saved) => {
    applyLoadedSettings(saved);
  });

  // Check initial active tab status
  await pollStatus();
  pollTimer = setInterval(pollStatus, 400);

  window.addEventListener('unload', () => {
    if (pollTimer) clearInterval(pollTimer);
  });
});
