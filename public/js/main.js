document.addEventListener('DOMContentLoaded', () => {
    // Vehicle form stepper logic is handled by stepperForm.js
    // This file now only handles non-stepper pages

    const vehicleType = document.getElementById('vehicleType')?.value;
    const brandSelectEl = document.getElementById('brandSelect');

    // If on vehicle form page, stepperForm.js handles everything
    if (brandSelectEl && document.getElementById('step1Panel')) return;

    // Legacy: Keep any non-vehicle-form page logic here if needed
});

