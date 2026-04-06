/**
 * stepperState.js
 * Client-Side State Controller for Vehicle Insurance Form
 */

window.StepperState = (() => {
    const STORAGE_KEY = 'insuranceForm';

    return {
        save: (data) => {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            } catch (e) {
                console.error('Failed to save state to localStorage', e);
            }
        },
        
        load: () => {
            try {
                const saved = localStorage.getItem(STORAGE_KEY);
                if (saved) return JSON.parse(saved);
            } catch (e) {
                console.error('Failed to load state from localStorage', e);
            }
            return null;
        },
        
        clear: () => {
            try {
                localStorage.removeItem(STORAGE_KEY);
            } catch (e) {
                console.error('Failed to clear state from localStorage', e);
            }
        },

        enableUnloadWarning: (conditionFunc) => {
            window.addEventListener("beforeunload", (e) => {
                if (typeof conditionFunc === 'function' && conditionFunc()) {
                    e.preventDefault();
                    e.returnValue = "";
                }
            });
        }
    };
})();
