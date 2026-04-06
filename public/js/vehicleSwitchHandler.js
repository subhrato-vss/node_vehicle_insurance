/**
 * vehicleSwitchHandler.js
 * Implementation of Smart Data Reset System for Vehicle Type changes.
 */

window.VehicleSwitchHandler = (() => {
    
    /**
     * Checks if user has entered significant data for the current vehicle type.
     * @param {Object} data - Existing formData
     */
    const hasExistingData = (data) => {
        return !!(data.brand || data.model || data.year || data.variant);
    };

    /**
     * Resets the formData to initial state for a new vehicle type.
     * @param {Object} data - Existing formData (passed by reference)
     * @param {string} newType - The new vehicle type (e.g., 'car' or 'motorcycle')
     */
    const performReset = (data, newType) => {
        // Core resets
        data.vehicleType = newType;
        data.step = 1;
        
        // Clear vehicle specific IDs
        data.brand = "";
        data.brandName = "";
        data.model = "";
        data.variant = "";
        
        // Clear generic details
        data.year = "";
        data.fuel = "";
        data.city = "";
        data.claim = "";
        
        // Clear plans & selection
        data.plan = "";
        data.planName = "";
        data.planPrice = 0;
        data.addons = [];
        data.addonsCost = 0;
        data.finalPremium = 0;
        
        // Clear related caches 
        localStorage.removeItem('cachedModels');
        localStorage.removeItem('cachedVariants');
    };

    return {
        /**
         * Main execution: Detect switch and handle reset.
         * @returns {Promise<boolean>} - Always true (silently reset)
         */
        checkSwitch: async (formData, currentType, onReset) => {
            if (!formData.vehicleType) {
                formData.vehicleType = currentType;
                return true;
            }

            if (formData.vehicleType !== currentType) {
                // Silently reset on switch as requested
                performReset(formData, currentType);
                if (onReset) onReset();
                return true;
            }
            return true;
        }
    };
})();
