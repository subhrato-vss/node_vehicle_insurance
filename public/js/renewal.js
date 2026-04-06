/**
 * renewal.js
 * Handles dynamic premium recalculation and payment triggering for Policy Renewals.
 */

document.addEventListener('DOMContentLoaded', async () => {
    const loader = document.getElementById('renewalLoader');
    const content = document.getElementById('renewalContent');
    const btnPay = document.getElementById('btnPayRenewal');
    const newPremiumAmt = document.getElementById('newPremiumAmt');
    const newIdvAmt = document.getElementById('newIdvAmt');
    const premiumDiffLabel = document.getElementById('premiumDiffLabel');
    const successOverlay = document.getElementById('successOverlay');

    // Load Razorpay if not loaded
    if (!window.Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        document.head.appendChild(script);
    }

    let renewedStatePayload = null;

    if (!window.POLICY_DATA) {
        alert("Policy data missing or corrupted");
        return;
    }

    const { 
        variant_id, vehicle_type, manufacturing_year, rto_city, previous_claim, 
        plan_id, plan_name, addons, 
        customer_name, customer_email, customer_mobile, 
        address_line1, address_line2, customer_city, customer_state, customer_pincode, id
    } = window.POLICY_DATA;

    try {
        const res = await fetch('/api/calculate-premium', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ variant_id, vehicle_type, manufacturing_year, rto_city, previous_claim })
        });
        
        if (!res.ok) throw new Error("Calculation failed");
        const data = await res.json();
        
        const selectedPlan = data.plans.find(p => p.id === plan_id) || data.plans[0];
        
        let newAddonsCost = 0;
        let parsedAddons = [];
        try { parsedAddons = typeof addons === 'string' ? JSON.parse(addons) : addons; } catch{}
        
        parsedAddons.forEach(a => {
            const addonObj = data.addons.find(x => x.id === a);
            if (addonObj) newAddonsCost += (selectedPlan.price * addonObj.percent / 100);
        });

        const newFinalPremium = Math.round(selectedPlan.price + newAddonsCost);

        renewedStatePayload = {
             variant_id, vehicle_type, manufacturing_year, rto_city, previous_claim,
             fuel_type: window.POLICY_DATA.fuel_type || 'petrol',
             base_premium: selectedPlan.price,
             idv: data.idv,
             plan_id: selectedPlan.id,
             plan_name: selectedPlan.name,
             plan_price: selectedPlan.price,
             addons: parsedAddons,
             addons_cost: Math.round(newAddonsCost),
             final_premium: newFinalPremium,
             customer: { name: customer_name, email: customer_email, mobile: customer_mobile, address1: address_line1, address2: address_line2, city: customer_city, state: customer_state, pincode: customer_pincode },
             parent_policy_id: id,
             renewal_count: (window.POLICY_DATA.renewal_count || 0) + 1
        };

        newPremiumAmt.textContent = `₹${newFinalPremium.toLocaleString('en-IN')}`;
        newIdvAmt.textContent = `₹${data.idv.toLocaleString('en-IN')}`;

        const diff = newFinalPremium - window.OLD_PREMIUM;
        if (diff > 0) {
            premiumDiffLabel.innerHTML = `<span class="text-orange-500 font-bold">▲ ₹${diff.toLocaleString('en-IN')} increase due to age depreciation</span>`;
        } else if (diff < 0) {
            premiumDiffLabel.innerHTML = `<span class="text-emerald-500 font-bold">▼ ₹${Math.abs(diff).toLocaleString('en-IN')} savings on renewal!</span>`;
        } else {
            premiumDiffLabel.innerHTML = `Identical coverage premium retained.`;
        }

        setTimeout(() => {
            loader.classList.add('hidden');
            content.classList.remove('hidden');
            content.classList.add('animate-fade-in');
        }, 800);

    } catch (e) {
        loader.innerHTML = `<i class="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i><p class="text-gray-900 font-bold">Failed to load renewal estimates.</p>`;
    }

    btnPay.addEventListener('click', async () => {
        if (!renewedStatePayload) return;
        btnPay.disabled = true;
        btnPay.innerHTML = '<i class="fas fa-compact-disc fa-spin"></i> Processing...';
        
        try {
            const formDataJSON = {
                brand: window.POLICY_DATA.brand_id || 1, 
                model: window.POLICY_DATA.model_id || 1,
                variant: renewedStatePayload.variant_id,
                year: renewedStatePayload.manufacturing_year,
                fuel: renewedStatePayload.fuel_type,
                city: renewedStatePayload.rto_city,
                claim: renewedStatePayload.previous_claim,
                plan: renewedStatePayload.plan_id,
                planPrice: renewedStatePayload.plan_price,
                planName: renewedStatePayload.plan_name,
                addons: renewedStatePayload.addons,
                addonsCost: renewedStatePayload.addons_cost,
                finalPremium: renewedStatePayload.final_premium,
                customer: renewedStatePayload.customer,
                parent_policy_id: renewedStatePayload.parent_policy_id,
                renewal_count: renewedStatePayload.renewal_count
            };

            const res = await fetch('/api/generate-policy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formDataJSON)
            });

            if (!res.ok) throw new Error("Payment init failed");
            const pData = await res.json();

            if (res.ok && pData.success) {
                const options = {
                    key: window.RAZORPAY_TEST_KEY,
                    amount: pData.order.amount,
                    currency: "INR",
                    name: "DriveGuard Insurance",
                    description: `Policy Renewal`,
                    order_id: pData.order.id,
                    handler: async function (response) {
                        try {
                            const vRes = await fetch('/api/verify-payment', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_signature: response.razorpay_signature,
                                    temp_policy_id: pData.policy_id
                                })
                            });
                            
                            const vData = await vRes.json();
                            if (vData.success) {
                                content.classList.add('hidden');
                                successOverlay.classList.remove('hidden');
                            } else {
                                alert("Verification Failed. Please try again or contact support.");
                                btnPay.disabled = false;
                                btnPay.innerHTML = '<i class="fas fa-lock"></i> Pay & Instantly Renew';
                            }
                        } catch (err) {
                            alert("Something went wrong verifying the payment.");
                            btnPay.disabled = false;
                            btnPay.innerHTML = '<i class="fas fa-lock"></i> Pay & Instantly Renew';
                        }
                    },
                    prefill: {
                        name: formDataJSON.customer.name,
                        email: formDataJSON.customer.email,
                        contact: formDataJSON.customer.mobile
                    },
                    theme: { color: "#2563EB" }
                };

                const rzp = new window.Razorpay(options);
                rzp.on('payment.failed', function(res){
                   alert("Payment Failed. Reason: " + res.error.description); 
                   btnPay.disabled = false;
                   btnPay.innerHTML = '<i class="fas fa-lock"></i> Pay & Instantly Renew';
                });
                rzp.open();

            } else {
                alert("Failed to initialize payment.");
                btnPay.disabled = false;
                btnPay.innerHTML = '<i class="fas fa-lock"></i> Pay & Instantly Renew';
            }
        } catch (e) {
            console.error(e);
            alert("Network error.");
            btnPay.disabled = false;
            btnPay.innerHTML = '<i class="fas fa-lock"></i> Pay & Instantly Renew';
        }
    });

});
