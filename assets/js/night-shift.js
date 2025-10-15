/**
 * Night Shift Toggle Functionality
 * Provides a macOS-like night shift mode with warm white background
 */

(function() {
    'use strict';

    // Configuration
    const STORAGE_KEY = 'nightShiftEnabled';
    const ROOT_CLASS = 'night-shift';
    
    // DOM elements
    let toggleButton;
    let toggleButtonDesktop;
    let rootElement;

    /**
     * Initialize the night shift functionality
     */
    function init() {
        // Get DOM elements
        toggleButton = document.getElementById('nightShiftToggle');
        toggleButtonDesktop = document.getElementById('nightShiftToggleDesktop');
        rootElement = document.documentElement;

        if (!rootElement) {
            console.warn('Root element not found');
            return;
        }

        // At least one toggle button should exist
        if (!toggleButton && !toggleButtonDesktop) {
            console.warn('No night shift toggle buttons found');
            return;
        }


        // Load saved state
        loadSavedState();

        // Add event listeners to both buttons
        if (toggleButton) {
            toggleButton.addEventListener('click', toggleNightShift);
            toggleButton.addEventListener('keydown', handleKeydown);
        }
        
        if (toggleButtonDesktop) {
            toggleButtonDesktop.addEventListener('click', toggleNightShift);
            toggleButtonDesktop.addEventListener('keydown', handleKeydown);
        }

        // Update button states
        updateButtonState();
    }

    /**
     * Load the saved night shift state from localStorage
     */
    function loadSavedState() {
        const savedState = localStorage.getItem(STORAGE_KEY);
        if (savedState === 'true') {
            enableNightShift();
        }
    }

    /**
     * Toggle night shift mode
     */
    function toggleNightShift() {
        if (isNightShiftEnabled()) {
            disableNightShift();
        } else {
            enableNightShift();
        }
        updateButtonState();
    }

    /**
     * Enable night shift mode
     */
    function enableNightShift() {
        rootElement.classList.add(ROOT_CLASS);
        localStorage.setItem(STORAGE_KEY, 'true');
        
        
        // Add visual feedback to both buttons
        addVisualFeedback();
    }

    /**
     * Disable night shift mode
     */
    function disableNightShift() {
        rootElement.classList.remove(ROOT_CLASS);
        localStorage.setItem(STORAGE_KEY, 'false');
        
        
        // Add visual feedback to both buttons
        addVisualFeedback();
    }

    /**
     * Check if night shift is currently enabled
     */
    function isNightShiftEnabled() {
        return rootElement.classList.contains(ROOT_CLASS);
    }

    /**
     * Add visual feedback to both toggle buttons
     */
    function addVisualFeedback() {
        const buttons = [toggleButton, toggleButtonDesktop].filter(Boolean);
        
        buttons.forEach(button => {
            button.style.transform = 'scale(0.95)';
            setTimeout(() => {
                button.style.transform = '';
            }, 150);
        });
    }

    /**
     * Update the button's visual state
     */
    function updateButtonState() {
        const isEnabled = isNightShiftEnabled();
        const buttons = [toggleButton, toggleButtonDesktop].filter(Boolean);
        
        buttons.forEach(button => {
            const icon = button.querySelector('.night-shift-icon');
            
            if (icon) {
                // Update the icon path for visual feedback
                const path = icon.querySelector('path');
                if (path) {
                    if (isEnabled) {
                        // Moon icon for night shift enabled
                        path.setAttribute('d', 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z');
                    } else {
                        // Sun icon for night shift disabled
                        path.setAttribute('d', 'M12 3V4M12 20V21M4 12H3M6.31412 6.31412L5.5 5.5M17.6859 6.31412L18.5 5.5M6.31412 17.69L5.5 18.5041M17.6859 17.69L18.5 18.5041M21 12H20M16 12C16 14.2091 14.2091 16 12 16C9.79086 16 8 14.2091 8 12C8 9.79086 9.79086 8 12 8C14.2091 8 16 9.79086 16 12Z');
                    }
                }
            }

            // Update aria-label for accessibility
            button.setAttribute('aria-label', 
                isEnabled ? 'Disable night shift mode' : 'Enable night shift mode');
            button.setAttribute('title', 
                isEnabled ? 'Disable night shift mode' : 'Enable night shift mode');
        });
    }

    /**
     * Handle keyboard events for accessibility
     */
    function handleKeydown(event) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggleNightShift();
        }
    }

    /**
     * Auto-enable night shift based on time (optional feature)
     * Uncomment to enable automatic night shift from 8 PM to 6 AM
     */
    /*
    function checkTimeBasedNightShift() {
        const now = new Date();
        const hour = now.getHours();
        
        // Enable night shift between 8 PM (20) and 6 AM (6)
        const shouldBeEnabled = hour >= 20 || hour < 6;
        
        if (shouldBeEnabled && !isNightShiftEnabled()) {
            enableNightShift();
            updateButtonState();
        } else if (!shouldBeEnabled && isNightShiftEnabled()) {
            disableNightShift();
            updateButtonState();
        }
    }
    */

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Optional: Check time-based night shift every minute
    // setInterval(checkTimeBasedNightShift, 60000);

})();
