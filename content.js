// Content Script - Mengeksekusi script di halaman
(function() {
    'use strict';
    
    console.log('🔌 LTC Farmer Extension Loaded');
    
    // Inject main script
    function injectScript() {
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('inject.js');
        script.onload = function() {
            this.remove();
        };
        (document.head || document.documentElement).appendChild(script);
    }
    
    // Inject multiple times to ensure permanence
    injectScript();
    
    // Reinject on navigation
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            setTimeout(injectScript, 1000);
        }
    }).observe(document, { subtree: true, childList: true });
    
    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'getStatus') {
            sendResponse({
                status: 'active',
                balance: window.userBalance || 0
            });
        }
    });
})();
