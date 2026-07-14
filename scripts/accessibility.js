/* BachesLoja - Accessibility Enhancement Module */

window.AccessibilityEnhancer = {

    init() {
        this.setupFocusManagement();
        this.setupKeyboardNavigation();
        this.setupAriaLive();
        console.log('Accessibility enhancements initialized');
    },

    // Ensure focus is visible at all times
    setupFocusManagement() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-user');
            }
        });
        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-user');
        });
    },

    // Keyboard navigation helpers
    setupKeyboardNavigation() {
        // Close modals with Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const modal = document.getElementById('report-modal');
                if (modal && modal.classList.contains('active')) {
                    if (window.MunicipalDashboard) {
                        window.MunicipalDashboard.closeModal();
                    }
                }
            }
        });

        // Allow Enter/Space to activate custom radio labels
        document.addEventListener('keydown', (e) => {
            if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('radio-label')) {
                e.preventDefault();
                const forId = e.target.getAttribute('for');
                const radio = document.getElementById(forId);
                if (radio) radio.click();
            }
        });
    },

    // Announce dynamic content changes
    setupAriaLive() {
        // Already handled by aria-live attributes in HTML.
        // This hook can be used to programmatically push messages.
    },

    // Announce a message to screen readers via the toast container
    announce(message, priority = 'polite') {
        const announcer = document.getElementById('toast-container');
        if (announcer) {
            announcer.setAttribute('aria-live', priority);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    window.AccessibilityEnhancer.init();
});
