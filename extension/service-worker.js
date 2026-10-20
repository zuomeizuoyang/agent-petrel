chrome.action.onClicked.addListener(async tab => {
  if (!tab.id || !tab.url || !/^https?:/.test(tab.url)) return;
  try {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
    await chrome.action.setBadgeText({ tabId: tab.id, text: '' });
  } catch (error) {
    console.warn('Petrel: this page does not allow extension scripts.', error);
    await chrome.action.setBadgeText({ tabId: tab.id, text: '!' });
  }
});
