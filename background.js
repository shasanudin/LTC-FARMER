chrome.runtime.onInstalled.addListener(() => {
    console.log('LTC Farmer Extension Installed');
    
    // Set default config
    chrome.storage.sync.set({
        withdrawAddress: 'ltc1qtz2zzaxpr7a5u0r4qv7agrzk8eufyhyervxr9y',
        increaseRate: 1.0,
        autoWithdraw: true
    });
});
