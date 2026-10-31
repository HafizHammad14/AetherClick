/**
 * AetherClick - Chrome Extension Background Service Worker
 */

// Initialize default storage on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['aether_interval_ms'], (res) => {
    if (!res.aether_interval_ms) {
      chrome.storage.local.set({
        aether_interval_ms: 100,
        aether_mode: 'fixed',
        aether_random_min: 50,
        aether_random_max: 150,
        aether_button: 'left',
        aether_click_type: 'single',
        aether_repeat_mode: 'infinite',
        aether_repeat_count: 100,
        aether_target_mode: 'cursor'
      });
    }
  });
});

// Update Extension Action Badge
function updateBadge(running) {
  if (running) {
    chrome.action.setBadgeText({ text: 'ON' });
    chrome.action.setBadgeBackgroundColor({ color: '#30D158' });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

// Global Keyboard Shortcut Commands Listener
chrome.commands.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) return;

  if (command === 'toggle-autoclicker') {
    try {
      chrome.tabs.sendMessage(tab.id, { action: 'TOGGLE' }, (response) => {
        if (chrome.runtime.lastError) {
          // Tab might not have content script injected yet (e.g. newly opened page)
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
          }).then(() => {
            chrome.tabs.sendMessage(tab.id, { action: 'TOGGLE' }, (r) => {
              if (r) updateBadge(r.running);
            });
          }).catch(() => {});
        } else if (response) {
          updateBadge(response.running);
        }
      });
    } catch (e) {}
  } else if (command === 'pick-element') {
    try {
      chrome.tabs.sendMessage(tab.id, { action: 'PICK_TARGET' });
    } catch (e) {}
  }
});

// Message listener from content script or popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'STATUS_CHANGED') {
    updateBadge(msg.running);
  }
  return true;
});
