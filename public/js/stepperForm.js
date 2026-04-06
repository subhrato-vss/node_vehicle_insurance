/**
 * stepperForm.js
 * 6-step vehicle insurance form:
 *   1: Vehicle → 2: Details → 3: Plan → 4: Add-ons → 5: Customer → 6: Payment → Confirmation
 */
document.addEventListener('DOMContentLoaded', () => {
    // ─── State ───────────────────────────────────────────────
    const totalSteps = 6;

    let formData = window.StepperState ? window.StepperState.load() : null;
    if (!formData) {
        formData = {
            step: 1,
            vehicleType: "",
            brand: "", brandName: "", model: "", variant: "",
            year: "", fuel: "", city: "", claim: "",
            plan: "", planPrice: 0, planName: "",
            addons: [], addonsCost: 0, finalPremium: 0,
            customer: { name:"", email:"", mobile:"", address1:"", address2:"", city:"", state:"", pincode:"" },
            createdPolicyId: null, // Persisted
            cachedPremiumData: null // Persisted
        };
    }

    // ———— 1. SMART DATA RESET (VEHICLE TYPE SWITCH) ————
    const vehicleTypeFromDOM = document.getElementById('vehicleType')?.value;
    if (window.VehicleSwitchHandler) {
        window.VehicleSwitchHandler.checkSwitch(formData, vehicleTypeFromDOM, () => {
            if (window.StepperState) window.StepperState.save(formData);
        }).then(proceed => {
            if (!proceed) return;
            initForm();
        });
    } else {
        initForm();
    }

    function initForm() {
        // Continue with original initialization logic...

    // Backward compatibility for newly added fields
    if (!formData.customer) formData.customer = { name:"", email:"", mobile:"", address1:"", address2:"", city:"", state:"", pincode:"" };
    if (!formData.addons) formData.addons = [];

    let currentStep = formData.step || 1;
    let isFormComplete = false;

    /* 
    if (window.StepperState) {
        window.StepperState.enableUnloadWarning(() => formData.step >= 1 && !isFormComplete);
    }
    */

    function saveState() {
        formData.step = currentStep;
        if (window.StepperState) window.StepperState.save(formData);
    }

    // Move these into formData for persistence
    // Cache for brand names to populate formData.brandName
    let brandNameCache = {};

    const vehicleType      = document.getElementById('vehicleType')?.value;
    
    // ─── Add-ons Definition (Dynamic) ────────────────────────
    const carAddons = [
        { name:"Zero Depreciation",  value:"zero_dep",       percent:15, icon:"fas fa-percentage",   color:"blue",    description:"Comprehensive parts protection." },
        { name:"Engine Protection",  value:"engine_protect", percent:10, icon:"fas fa-cogs",         color:"amber",   description:"Covers engine damage." },
        { name:"Roadside Assistance",value:"rsa",            percent:5,  icon:"fas fa-truck-pickup", color:"emerald", description:"24/7 breakdown help." },
        { name:"Consumables Cover",  value:"consumables",    percent:3,  icon:"fas fa-oil-can",      color:"violet",  description:"Covers oil, bolts, etc." }
    ];
    const bikeAddons = [
        { name:"Zero Depreciation",  value:"zero_dep",       percent:10, icon:"fas fa-percentage",   color:"blue",    description:"Bumper-to-bumper protection." },
        { name:"Engine Protection",  value:"engine_protect", percent:8,  icon:"fas fa-cogs",         color:"amber",   description:"Critical engine coverage." },
        { name:"Roadside Assistance",value:"rsa",            percent:4,  icon:"fas fa-truck-pickup", color:"emerald", description:"On-road support." },
        { name:"Consumables Cover",  value:"consumables",    percent:3,  icon:"fas fa-oil-can",      color:"violet",  description:"General consumables." }
    ];
    const ADDONS = (vehicleType === 'car') ? carAddons : bikeAddons;
    const brandSelectEl    = document.getElementById('brandSelect');
    const modelSelectEl    = document.getElementById('modelSelect');
    const variantSelectEl  = document.getElementById('variantSelect');
    const modelContainer   = document.getElementById('modelContainer');
    const variantContainer = document.getElementById('variantContainer');
    const yearSelectEl     = document.getElementById('yearSelect');
    const citySelectEl     = document.getElementById('citySelect');

    const panels = [null,
        document.getElementById('step1Panel'),
        document.getElementById('step2Panel'),
        document.getElementById('step3Panel'),
        document.getElementById('step4Panel'),
        document.getElementById('step5Panel'),
        document.getElementById('step6Panel')
    ];
    const successOverlay = document.getElementById('successOverlay');

    const btnStep1Next    = document.getElementById('btnStep1Next');
    const btnStep2Back    = document.getElementById('btnStep2Back');
    const btnStep2Submit  = document.getElementById('btnStep2Submit');
    const btnStep3Back    = document.getElementById('btnStep3Back');
    const btnStep3Next    = document.getElementById('btnStep3Next');
    const btnStep4Back    = document.getElementById('btnStep4Back');
    const btnStep4Next    = document.getElementById('btnStep4Next');
    const btnStep5Back    = document.getElementById('btnStep5Back');
    const btnStep5Submit  = document.getElementById('btnStep5Submit');
    const btnStep6Back    = document.getElementById('btnStep6Back');
    
    // Step 6 Buttons
    const btnPayRazorpay  = document.getElementById('btnPayRazorpay');
    // Simulation button removed
    const paymentError    = document.getElementById('paymentError');
    const paymentErrorMsg = document.getElementById('paymentErrorMsg');

    if (!brandSelectEl) return;

    // ─── Populate Year ───────────────────────────────────────
    const curYear = new Date().getFullYear();
    for (let y = curYear; y >= curYear - 19; y--) { const o = document.createElement('option'); o.value = y; o.textContent = y; yearSelectEl.appendChild(o); }

    // ─── Cities ──────────────────────────────────────────────
    ["Mumbai","Delhi","Bengaluru","Hyderabad","Ahmedabad","Chennai","Kolkata","Pune","Jaipur","Surat","Lucknow","Kanpur","Nagpur","Indore","Thane","Bhopal","Visakhapatnam","Patna","Vadodara","Ghaziabad","Ludhiana","Agra","Nashik","Faridabad","Meerut","Rajkot","Varanasi","Srinagar","Aurangabad","Dhanbad","Amritsar","Allahabad","Ranchi","Howrah","Coimbatore","Jabalpur","Gwalior","Vijayawada","Jodhpur","Madurai","Raipur","Kota","Chandigarh","Guwahati","Hubli","Mysore","Tiruchirappalli","Bareilly","Aligarh","Moradabad","Jalandhar","Bhubaneswar","Salem","Warangal","Guntur","Bhilai","Kochi","Gorakhpur","Shimla","Dehradun","Noida","Gurgaon","Navi Mumbai","Thiruvananthapuram","Mangalore","Udaipur","Siliguri","Jamshedpur","Muzaffarpur","Panipat","Bokaro","Rohtak"].sort().forEach(c => { const o = document.createElement('option'); o.value = c; o.textContent = c; citySelectEl.appendChild(o); });

    // ─── Tom Select: Model ───────────────────────────────────
    const modelSelectTom = new TomSelect('#modelSelect', {
        valueField:'id', labelField:'name', searchField:'name', create:false,
        onChange: async (mid) => {
            resetVariantSelect(); formData.model=mid; formData.variant=""; saveState(); validateStep1();
            if (!mid) return;
            variantSelectTom.enable(); variantContainer.classList.remove('opacity-30','pointer-events-none');
            variantSelectTom.clearOptions();
            variantSelectTom.addOption({ id:'', name:'Loading...' });
            variantSelectTom.setValue('');
            try {
                const r=await fetch(`/api/form/variants?model_id=${mid}`);
                const v=await r.json();
                variantSelectTom.clearOptions();
                variantSelectTom.addOptions(v.map(x=>({ id:x.id, name:x.name })));
                variantSelectTom.refreshOptions(false);
            } catch {
                variantSelectTom.clearOptions();
                variantSelectTom.addOption({ id:'', name:'Error loading variants' });
            }
        }
    });

    // ─── Tom Select: Variant ─────────────────────────────────
    const variantSelectTom = new TomSelect('#variantSelect', {
        valueField:'id', labelField:'name', searchField:'name', create:false,
        onChange: (vid) => { formData.variant=vid; saveState(); validateStep1(); }
    });

    // ─── Tom Select: Brand ───────────────────────────────────
    const brandSelectTom = new TomSelect('#brandSelect', {
        valueField:'id', labelField:'name', searchField:'name', preload:true, loadThrottle:300,
        load: async (q, cb) => { try { const r = await fetch(`/api/form/brands?type=${vehicleType}&q=${encodeURIComponent(q)}`); const j = await r.json(); j.forEach(b => brandNameCache[b.id]=b.name); cb(j); } catch { cb(); } },
        render: { option:(i,e)=>`<div><span class="font-bold">${e(i.name)}</span></div>`, item:(i,e)=>`<div>${e(i.name)}</div>` },
        onChange: async (bid) => {
            resetModelSelect(); resetVariantSelect(); formData.brand=bid; formData.brandName=brandNameCache[bid]||""; formData.model=""; formData.variant=""; saveState(); validateStep1();
            if (!bid) return;
            modelSelectTom.enable(); modelContainer.classList.remove('opacity-30','pointer-events-none');
            modelSelectTom.clearOptions();
            modelSelectTom.addOption({ id:'', name:'Loading...' });
            modelSelectTom.setValue('');
            try {
                const r=await fetch(`/api/form/models?brand_id=${bid}`);
                const m=await r.json();
                modelSelectTom.clearOptions();
                modelSelectTom.addOptions(m.map(x=>({ id:x.id, name:x.name })));
                modelSelectTom.refreshOptions(false);
            } catch {
                modelSelectTom.clearOptions();
                modelSelectTom.addOption({ id:'', name:'Error loading models' });
            }
        }
    });

    const cityTom = new TomSelect('#citySelect', { create:false, sortField:{field:'text',direction:'asc'}, onChange:v=>{formData.city=v; saveState(); if(v)hideError('cityError');validateStep2();} });
    yearSelectEl.addEventListener('change', ()=>{formData.year=yearSelectEl.value; saveState(); if(formData.year)hideError('yearError'); validateStep2();});
    document.querySelectorAll('input[name="fuel"]').forEach(r=>r.addEventListener('change',()=>{formData.fuel=r.value; saveState(); hideError('fuelError');validateStep2();}));
    document.querySelectorAll('input[name="claim"]').forEach(r=>r.addEventListener('change',()=>{formData.claim=r.value; saveState(); hideError('claimError');validateStep2();}));

    // ─── Validation ──────────────────────────────────────────
    function showError(id){const e=document.getElementById(id);if(e){e.classList.remove('hidden');e.classList.add('animate-fade-in');}}
    function hideError(id){const e=document.getElementById(id);if(e){e.classList.add('hidden');e.classList.remove('animate-fade-in');}}

    function validateStep1(){const v=formData.brand&&formData.model&&formData.variant;btnStep1Next.disabled=!v;return v;}
    function validateStep1WithErrors(){let v=true;if(!formData.brand){showError('brandError');v=false;}else hideError('brandError');if(!formData.model){showError('modelError');v=false;}else hideError('modelError');if(!formData.variant){showError('variantError');v=false;}else hideError('variantError');return v;}
    function validateStep2(){const v=formData.year&&formData.fuel&&formData.city&&formData.claim;btnStep2Submit.disabled=!v;return v;}
    function validateStep2WithErrors(){let v=true;if(!formData.year){showError('yearError');v=false;}else hideError('yearError');if(!formData.fuel){showError('fuelError');v=false;}else hideError('fuelError');if(!formData.city){showError('cityError');v=false;}else hideError('cityError');if(!formData.claim){showError('claimError');v=false;}else hideError('claimError');return v;}

    // ═══ STEP 5 VALIDATION ═══════════════════════════════════
    function validateStep5() {
        const c = formData.customer;
        const valid = c.name.length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email) && /^[6-9]\d{9}$/.test(c.mobile)
            && c.address1.length >= 5 && c.city.length >= 2 && c.state && /^\d{6}$/.test(c.pincode);
        btnStep5Submit.disabled = !valid;
        return valid;
    }

    function validateStep5WithErrors() {
        const c = formData.customer;
        let v = true;
        if (!c.name || c.name.trim().length < 2) { showError('custNameError'); v=false; } else hideError('custNameError');
        if (!c.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) { showError('custEmailError'); v=false; } else hideError('custEmailError');
        if (!c.mobile || !/^[6-9]\d{9}$/.test(c.mobile)) { showError('custMobileError'); v=false; } else hideError('custMobileError');
        if (!c.address1 || c.address1.trim().length < 5) { showError('custAddress1Error'); v=false; } else hideError('custAddress1Error');
        if (!c.city || c.city.trim().length < 2) { showError('custCityError'); v=false; } else hideError('custCityError');
        if (!c.state) { showError('custStateError'); v=false; } else hideError('custStateError');
        if (!c.pincode || !/^\d{6}$/.test(c.pincode)) { showError('custPincodeError'); v=false; } else hideError('custPincodeError');
        return v;
    }

    // Bind customer field listeners
    function bindCustomerFields() {
        const map = { custName:'name', custEmail:'email', custMobile:'mobile', custAddress1:'address1', custAddress2:'address2', custCity:'city', custPincode:'pincode' };
        Object.entries(map).forEach(([id, key]) => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', () => { formData.customer[key] = el.value; hideError(id + 'Error'); saveState(); validateStep5(); });
        });
        const stateEl = document.getElementById('custState');
        if (stateEl) stateEl.addEventListener('change', () => { formData.customer.state = stateEl.value; hideError('custStateError'); saveState(); validateStep5(); });

        // Number-only fields
        document.getElementById('custMobile')?.addEventListener('input', function() { this.value = this.value.replace(/\D/g, '').slice(0, 10); formData.customer.mobile = this.value; saveState(); validateStep5(); });
        document.getElementById('custPincode')?.addEventListener('input', function() { this.value = this.value.replace(/\D/g, '').slice(0, 6); formData.customer.pincode = this.value; saveState(); validateStep5(); });
    }
    bindCustomerFields();

    // ─── Navigation ──────────────────────────────────────────
    function goToStep(step) {
        if (step < 1 || step > totalSteps) return;
        const prev = panels[currentStep], next = panels[step];
        prev.classList.add('stepper-panel-exit');
        setTimeout(() => {
            prev.classList.add('hidden'); prev.classList.remove('stepper-panel-exit');
            next.classList.remove('hidden'); next.classList.add('stepper-panel-enter');
            setTimeout(() => next.classList.remove('stepper-panel-enter'), 400);
            currentStep = step; saveState(); updateStepIndicator(); autoFocusStep(step);
        }, 300);
    }

    function updateStepIndicator() {
        const connectorIds = [null, null, 'stepConnector12', 'stepConnector23', 'stepConnector34', 'stepConnector45', 'stepConnector56'];
        const activeClass='w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-500 bg-blue-600 text-white shadow-lg shadow-blue-200 ring-4 ring-blue-100';
        const doneClass='w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-500 bg-green-500 text-white shadow-lg shadow-green-200';
        const idleClass='w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-500 bg-gray-200 text-gray-500';
        const chk='<i class="fas fa-check text-[10px]"></i>';

        for (let i = 1; i <= totalSteps; i++) {
            const c = document.getElementById('stepCircle'+i);
            const l = document.getElementById('stepLabel'+i);
            if (i < currentStep) { c.className=doneClass; c.innerHTML=chk; l.className='text-[10px] font-bold text-green-600 hidden md:inline transition-colors duration-300'; }
            else if (i === currentStep) { c.className=activeClass; c.innerHTML=String(i); l.className='text-[10px] font-bold text-blue-700 hidden md:inline transition-colors duration-300'; }
            else { c.className=idleClass; c.innerHTML=String(i); l.className='text-[10px] font-medium text-gray-400 hidden md:inline transition-colors duration-300'; }
        }
        for (let i = 2; i <= totalSteps; i++) {
            const conn = document.getElementById(connectorIds[i]);
            if (conn) conn.style.width = currentStep >= i ? '100%' : '0%';
        }
    }

    function autoFocusStep(step) {
        setTimeout(() => {
            if (step===1) { if(brandSelectTom) brandSelectTom.focus(); }
            else if (step===2) yearSelectEl.focus();
            else if (step===5) document.getElementById('custName')?.focus();
        }, 400);
    }

    function showPaymentError(msg) {
        paymentErrorMsg.textContent = msg;
        paymentError.classList.remove('hidden');
        paymentError.classList.add('animate-fade-in');
    }

    function hidePaymentError() {
        paymentError.classList.add('hidden');
    }

    // ─── Utils ───────────────────────────────────────────────
    function formatCurrency(a) { return '₹'+Number(a).toLocaleString('en-IN',{maximumFractionDigits:0}); }

    // ═══ PLAN CARDS ══════════════════════════════════════════
    function renderPlanCards(plans) {
        const container = document.getElementById('planCardsContainer'); container.innerHTML='';
        const cm = { blue:{border:'border-blue-200',hb:'hover:border-blue-400',bg:'bg-blue-50',icon:'text-blue-600',pr:'from-blue-600 to-blue-700'}, indigo:{border:'border-indigo-200',hb:'hover:border-indigo-400',bg:'bg-indigo-50',icon:'text-indigo-600',pr:'from-indigo-600 to-violet-700'}, violet:{border:'border-violet-200',hb:'hover:border-violet-400',bg:'bg-violet-50',icon:'text-violet-600',pr:'from-violet-600 to-purple-700'} };
        plans.forEach(plan=>{
            const c = cm[plan.color]||cm.blue;
            const card = document.createElement('div');
            card.className=`plan-card plan-card-enter rounded-2xl border-2 ${c.border} ${c.hb} bg-white overflow-hidden flex flex-col`;
            card.dataset.planId=plan.id;
            card.innerHTML=`${plan.recommended?`<div class="plan-recommended-badge bg-gradient-to-r ${c.pr} text-white text-center text-xs font-bold py-1.5 uppercase tracking-wider">⭐ Most Popular</div>`:''}<div class="p-5 flex flex-col flex-grow"><div class="flex items-center gap-3 mb-3"><div class="w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center"><i class="${plan.icon} ${c.icon} text-lg"></i></div><div><h4 class="font-extrabold text-gray-900 text-base">${plan.name}</h4><p class="text-xs text-gray-400">${plan.tagline}</p></div></div><div class="bg-gradient-to-r ${c.pr} rounded-xl p-3 text-center mb-4"><p class="text-white/80 text-[10px] uppercase tracking-wider font-medium">Annual Premium</p><p class="text-white text-2xl font-extrabold tracking-tight">${formatCurrency(plan.price)}</p><p class="text-white/60 text-[10px] mt-0.5">${plan.multiplier>1?Math.round((plan.multiplier-1)*100)+'% above base':'Base price'}</p></div><div class="space-y-2 flex-grow mb-4">${plan.features.map(f=>`<div class="flex items-center gap-2 text-sm"><i class="fas ${f.included?'fa-check-circle text-emerald-500':'fa-times-circle text-gray-300'} text-xs flex-shrink-0"></i><span class="${f.included?'text-gray-700':'text-gray-400'}">${f.text}</span></div>`).join('')}</div><button type="button" class="plan-select-btn w-full py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 border-2 ${c.border} text-gray-700 hover:${c.bg}">Select Plan</button></div>`;
            card.addEventListener('click',()=>selectPlan(plan,card)); container.appendChild(card);
        });
    }
    function selectPlan(plan,el){
        formData.plan=plan.id;formData.planPrice=plan.price;formData.planName=plan.name; saveState();
        document.querySelectorAll('.plan-card').forEach(c=>{c.classList.remove('plan-selected','ring-2','ring-indigo-500','ring-offset-2');const b=c.querySelector('.plan-select-btn');if(b){b.textContent='Select Plan';b.classList.remove('bg-gradient-to-r','from-indigo-600','to-violet-600','text-white','border-transparent');}});
        el.classList.add('plan-selected','ring-2','ring-indigo-500','ring-offset-2');const btn=el.querySelector('.plan-select-btn');if(btn){btn.innerHTML='<i class="fas fa-check mr-1"></i> Selected';btn.classList.add('bg-gradient-to-r','from-indigo-600','to-violet-600','text-white','border-transparent');}
        hideError('planError');btnStep3Next.disabled=false;
    }

    // ═══ ADD-ONS ═════════════════════════════════════════════
    function renderAddonCards() {
        const container=document.getElementById('addonCardsContainer'); container.innerHTML='';
        const cm={blue:{bg:'bg-blue-50',border:'border-blue-200',cb:'border-blue-500',cbg:'bg-blue-50',ic:'text-blue-600',bd:'bg-blue-100 text-blue-700'},amber:{bg:'bg-amber-50',border:'border-amber-200',cb:'border-amber-500',cbg:'bg-amber-50',ic:'text-amber-600',bd:'bg-amber-100 text-amber-700'},emerald:{bg:'bg-emerald-50',border:'border-emerald-200',cb:'border-emerald-500',cbg:'bg-emerald-50',ic:'text-emerald-600',bd:'bg-emerald-100 text-emerald-700'},violet:{bg:'bg-violet-50',border:'border-violet-200',cb:'border-violet-500',cbg:'bg-violet-50',ic:'text-violet-600',bd:'bg-violet-100 text-violet-700'}};
        ADDONS.forEach((addon,idx)=>{
            const c=cm[addon.color]||cm.blue; const amt=Math.round((formData.planPrice*addon.percent)/100); const chk=formData.addons.includes(addon.value);
            const card=document.createElement('div');
            card.className=`addon-card addon-card-enter rounded-2xl border-2 ${chk?c.cb+' '+c.cbg:c.border+' bg-white'} p-4 cursor-pointer transition-all duration-300 hover:shadow-md`;
            card.innerHTML=`<div class="flex items-center gap-4"><div class="addon-checkbox w-6 h-6 rounded-lg border-2 ${chk?c.cb+' '+c.bg:'border-gray-300 bg-white'} flex items-center justify-center transition-all duration-300 flex-shrink-0">${chk?'<i class="fas fa-check text-xs '+c.ic+'"></i>':''}</div><div class="w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center flex-shrink-0"><i class="${addon.icon} ${c.ic} text-lg"></i></div><div class="flex-grow min-w-0"><div class="flex items-center gap-2"><h4 class="font-bold text-gray-900 text-sm">${addon.name}</h4><span class="text-xs font-bold px-2 py-0.5 rounded-full ${c.bd}">+${addon.percent}%</span></div><p class="text-xs text-gray-400 mt-0.5 truncate">${addon.description}</p></div><div class="text-right flex-shrink-0"><p class="text-sm font-extrabold ${chk?c.ic:'text-gray-700'}">+ ${formatCurrency(amt)}</p><p class="text-[10px] text-gray-400">per year</p></div></div>`;
            card.addEventListener('click',()=>{
                const i=formData.addons.indexOf(addon.value); if(i>-1) formData.addons.splice(i,1); else formData.addons.push(addon.value);
                saveState();
                renderAddonCards();
            });
            container.appendChild(card);
        });
        recalcFinal();
    }
    function recalcFinal() {
        const MAX_PAYMENT_LIMIT = 450000;
        const base = formData.planPrice; 
        let addonTotal = 0;
        formData.addons.forEach(v => {
            const a = ADDONS.find(x => x.value === v);
            if (a) addonTotal += Math.round((base * a.percent) / 100);
        });
        
        formData.addonsCost = addonTotal; 
        let finalPremium = base + addonTotal;
        
        // SAFETY CAP Check for Razorpay Test Mode
        let isAdjusted = false;
        if (finalPremium > MAX_PAYMENT_LIMIT) {
            finalPremium = MAX_PAYMENT_LIMIT - 1000; // ₹449,000 (Safe Margin)
            isAdjusted = true;
        }
        
        formData.finalPremium = finalPremium;
        
        document.getElementById('summaryPlanPrice').textContent = formatCurrency(base);
        document.getElementById('summaryAddonCost').textContent = addonTotal > 0 ? `+ ${formatCurrency(addonTotal)}` : '+  ₹0';
        
        const fEl = document.getElementById('summaryFinalPremium'); 
        fEl.textContent = formatCurrency(formData.finalPremium);
        
        // Show adjustment notice if cap hit
        const noticeId = 'priceAdjustmentNotice';
        let notice = document.getElementById(noticeId);
        if (isAdjusted) {
            if (!notice) {
                notice = document.createElement('div');
                notice.id = noticeId;
                notice.className = 'mt-2 text-[10px] font-bold text-amber-600 flex items-center gap-1 animate-pulse';
                notice.innerHTML = '<i class="fas fa-info-circle"></i> Price adjusted to meet payment limits';
                fEl.parentNode.appendChild(notice);
            }
        } else if (notice) {
            notice.remove();
        }

        fEl.classList.add('scale-110'); 
        setTimeout(() => fEl.classList.remove('scale-110'), 200);
    }

    // ═══ BUTTON HANDLERS ═════════════════════════════════════
    btnStep1Next.addEventListener('click',()=>{if(validateStep1WithErrors())goToStep(2);});
    btnStep2Back.addEventListener('click',()=>goToStep(1));

    // Step 2 → Calculate → Step 3
    btnStep2Submit.addEventListener('click', async()=>{
        if(!validateStep2WithErrors())return;
        const ot=btnStep2Submit.innerHTML; btnStep2Submit.disabled=true; btnStep2Submit.innerHTML='<i class="fas fa-spinner fa-spin mr-2"></i> Calculating...';
        try{
            const pr = await fetch('/api/calculate-premium', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ variant_id: formData.variant, year: formData.year, fuel: formData.fuel, city: formData.city, claim: formData.claim })
            });
            const pd = await pr.json();
            if (!pr.ok || !pd.success) {
                showToast(pd.message || 'Failed.', 'error');
                btnStep2Submit.disabled = false; btnStep2Submit.innerHTML = ot; return;
            }
            
            formData.cachedPremiumData = pd;
            
            // 2. Fetch Plans
            const plr = await fetch('/api/get-plans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ premium: pd.premium, idv: pd.idv, type: vehicleType })
            });
            const pld = await plr.json();
            if (!plr.ok || !pld.success) {
                showToast(pld.message || 'Plans failed.', 'error');
                btnStep2Submit.disabled = false; btnStep2Submit.innerHTML = ot; return;
            }

            document.getElementById('step3BasePremium').textContent = formatCurrency(pd.premium);
            document.getElementById('step3IDV').textContent = formatCurrency(pd.idv);
            renderPlanCards(pld.plans);
            
            formData.plan = ""; formData.planPrice = 0; formData.planName = ""; 
            btnStep3Next.disabled = true;
            showToast('Premium calculated!', 'success');
            goToStep(3);
            btnStep2Submit.disabled = false; btnStep2Submit.innerHTML = ot;
        } catch(e) {
            console.error('Step 2 Full Error:', e);
            showToast('Network error. Please check your connection.', 'error');
            btnStep2Submit.disabled = false; btnStep2Submit.innerHTML = ot;
        }
    });

    btnStep3Back.addEventListener('click',()=>goToStep(2));
    btnStep3Next.addEventListener('click',()=>{
        if(!formData.plan){showError('planError');return;}
        document.getElementById('step4PlanName').textContent=formData.planName+' Plan';
        document.getElementById('step4PlanPrice').textContent=formatCurrency(formData.planPrice);
        formData.addons=[];formData.addonsCost=0;formData.finalPremium=formData.planPrice;
        renderAddonCards(); goToStep(4);
    });

    btnStep4Back.addEventListener('click',()=>goToStep(3));
    btnStep4Next.addEventListener('click',()=>{
        // Populate Step 5 summary bar
        document.getElementById('step5FinalPremium').textContent=formatCurrency(formData.finalPremium);
        document.getElementById('step5PlanLabel').textContent=formData.planName+' Plan';
        validateStep5();
        goToStep(5);
    });

    btnStep5Back.addEventListener('click',()=>goToStep(4));

    // ═══ STEP 5 SUBMIT → STEP 6 PAYMENT ══════════════════════
    btnStep5Submit.addEventListener('click', async()=>{
        if(!validateStep5WithErrors()) return;

        const ot=btnStep5Submit.innerHTML; btnStep5Submit.disabled=true;
        btnStep5Submit.innerHTML='<i class="fas fa-spinner fa-spin mr-2"></i> Checking Policy...';

        // ———— 1. BUSINESS LOGIC: DUPLICATE CHECK ————
        try {
            const checkRes = await fetch('/api/check-duplicate-policy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: formData.customer.email.trim(), 
                    variant_id: formData.variant 
                })
            });
            const checkData = await checkRes.json();

            if (checkData.duplicate) {
                btnStep5Submit.disabled = false;
                btnStep5Submit.innerHTML = ot;
                
                const result = await Swal.fire({
                    title: 'Duplicate Policy Detected!',
                    html: `
                        <div class="text-left space-y-4 pt-2">
                            <p class="text-gray-600 text-sm leading-relaxed">System found an <b>active policy</b> for this vehicle under your email. We recommend renewing or viewing existing policy to avoid redundant payments.</p>
                            <div class="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                <div class="flex justify-between items-center mb-2 pb-2 border-b border-blue-100">
                                    <span class="text-[10px] font-extrabold text-blue-400 uppercase tracking-widest">Policy Details</span>
                                    <span class="px-2 py-0.5 bg-blue-600 text-white text-[9px] font-bold rounded-full uppercase tracking-tighter">Active</span>
                                </div>
                                <div class="flex justify-between items-center mb-1">
                                    <span class="text-xs font-bold text-gray-400">Policy No:</span>
                                    <span class="text-sm font-extrabold text-blue-900">${checkData.policyNumber}</span>
                                </div>
                                <div class="flex justify-between items-center">
                                    <span class="text-xs font-bold text-gray-400">Expiry Date:</span>
                                    <span class="text-sm font-extrabold ${checkData.isExpiringSoon || checkData.isExpired ? 'text-rose-600' : 'text-blue-900'}">
                                        ${new Date(checkData.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </span>
                                </div>
                                ${checkData.isExpiringSoon ? `
                                    <div class="mt-3 flex items-center gap-2 text-rose-600">
                                        <i class="fas fa-exclamation-triangle text-xs animate-pulse"></i>
                                        <span class="text-[10px] font-extrabold uppercase tracking-widest">Expiring Soon - Renewal Suggested</span>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `,
                    icon: 'warning',
                    showCancelButton: true,
                    showDenyButton: true,
                    confirmButtonText: '<i class="fas fa-sync-alt mr-2"></i> Renew Instead',
                    denyButtonText: '<i class="fas fa-external-link-alt mr-1"></i> View Detail',
                    cancelButtonText: 'Buy Anyway',
                    confirmButtonColor: '#4f46e5',
                    denyButtonColor: '#1e293b',
                    cancelButtonColor: '#94a3b8',
                    reverseButtons: false,
                    customClass: {
                        popup: 'rounded-[2.5rem] border-none shadow-2xl p-8',
                        title: 'text-2xl font-black text-gray-900',
                        confirmButton: 'rounded-2xl font-bold px-6 py-3.5 text-sm transition-all shadow-lg hover:shadow-blue-200',
                        denyButton: 'rounded-2xl font-bold px-6 py-3.5 text-sm transition-all',
                        cancelButton: 'rounded-2xl font-bold px-6 py-3.5 text-sm transition-all'
                    }
                });

                if (result.isConfirmed) {
                    window.location.href = `/renew-policy?id=${checkData.id}`;
                    return;
                } else if (result.isDenied) {
                    window.location.href = '/user/dashboard';
                    return;
                } else if (result.dismiss !== Swal.DismissReason.cancel) {
                    return; 
                }
                // If they click "Buy Anyway" (cancel), we proceed below.
                btnStep5Submit.disabled = true;
            }
        } catch (err) {
            console.error('Business Logic (Duplicate Check) Error:', err);
        }

        // ———— 2. ORIGINAL SAVE LOGIC ————
        btnStep5Submit.innerHTML='<i class="fas fa-spinner fa-spin mr-2"></i> Saving Details...';

        const payload = {
            customer: {
                name: formData.customer.name.trim(),
                email: formData.customer.email.trim(),
                mobile: formData.customer.mobile.trim(),
                address1: formData.customer.address1.trim(),
                address2: formData.customer.address2.trim(),
                city: formData.customer.city.trim(),
                state: formData.customer.state,
                pincode: formData.customer.pincode.trim()
            },
            vehicle: {
                variant_id: formData.variant,
                type: vehicleType,
                year: formData.year,
                fuel: formData.fuel,
                city: formData.city,
                claim: formData.claim
            },
            insurance: {
                base_premium: formData.cachedPremiumData?.premium || 0,
                idv: formData.cachedPremiumData?.idv || 0,
                plan_id: formData.plan,
                plan_name: formData.planName,
                plan_price: formData.planPrice,
                addons: formData.addons,
                addons_cost: formData.addonsCost,
                final_premium: formData.finalPremium
            },
            createdPolicyId: formData.createdPolicyId // Pass existing ID if any (e.g. for update)
        };

        try {
            const res = await fetch('/api/save-customer-details', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (res.ok && data.success) {
                formData.createdPolicyId = data.policyId;
                saveState();
                
                // Populate Step 6 Payment Summary
                const vi = formData.cachedPremiumData?.vehicleInfo || {};
                const addonNames = formData.addons.map(v => ADDONS.find(a=>a.value===v)?.name).filter(Boolean);
                
                // Set the payment total amount
                document.getElementById('paymentTotalAmount').textContent = formatCurrency(formData.finalPremium);
                
                document.getElementById('paymentSummaryDetails').innerHTML = `
                    <div class="flex justify-between py-1 border-b border-white/10"><span class="text-slate-400">Customer</span><span class="font-bold text-white">${formData.customer.name}</span></div>
                    <div class="flex justify-between py-1 border-b border-white/10"><span class="text-slate-400">Vehicle</span><span class="font-bold text-white">${vi.brand||''} ${vi.model||''} — ${vi.variant||''}</span></div>
                    <div class="flex justify-between py-1 border-b border-white/10"><span class="text-slate-400">Plan</span><span class="font-bold text-indigo-300">${formData.planName}</span></div>
                    ${addonNames.length?`<div class="flex justify-between py-1 border-b border-white/10"><span class="text-slate-400">Add-ons</span><span class="font-bold text-violet-300 text-xs">${addonNames.join(', ')}</span></div>`:``}
                `;
                
                hidePaymentError();
                goToStep(6);
                showToast('Details saved! Please complete your payment.', 'success');
            } else {
                if (data.errors && data.errors.length) {
                    data.errors.forEach(e => {
                        const errorMap = { name:'custNameError', email:'custEmailError', mobile:'custMobileError', address1:'custAddress1Error', city:'custCityError', state:'custStateError', pincode:'custPincodeError' };
                        if (errorMap[e.field]) showError(errorMap[e.field]);
                    });
                }
                showToast(data.message||'Submission failed.','error');
            }
        } catch(err) {
            console.error(err); showToast('Network error while saving details.','error');
        } finally {
            btnStep5Submit.disabled = false; btnStep5Submit.innerHTML = ot;
        }
    });

    btnStep6Back.addEventListener('click',()=>goToStep(5));

    // ═══ STEP 6 PAYMENT LOGIC ════════════════════════════════

    async function handlePaymentSuccess(data, method) {
        // Change UI to reflect generation process
        document.getElementById('vehicleForm').classList.add('hidden');
        document.getElementById('stepIndicatorBar').classList.add('hidden');
        document.getElementById('infoBox')?.classList.add('hidden');
        
        successOverlay.innerHTML = `
            <div class="animate-pulse text-center py-12">
                <div class="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-5 border-4 border-blue-500 border-t-transparent animate-spin"></div>
                <h3 class="text-2xl font-extrabold text-gray-900 mb-2">Generating Policy...</h3>
                <p class="text-gray-500 mb-4 max-w-sm mx-auto">Please wait while we finalize your document. Do not refresh the page.</p>
            </div>
        `;
        successOverlay.classList.remove('hidden');

        try {
            const res = await fetch('/api/generate-policy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ policyId: data.policyId || formData.createdPolicyId })
            });
            const pData = await res.json();

            if (res.ok && pData.success) {
                isFormComplete = true;
                if (window.StepperState) window.StepperState.clear();

                // Update Overlay to final success
                successOverlay.innerHTML = `
                    <div class="text-center py-12">
                        <div class="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-200">
                             <i class="fas fa-check text-3xl text-white"></i>
                        </div>
                        <h3 class="text-2xl font-extrabold text-gray-900 mb-2">Policy Issued!</h3>
                        <p class="text-gray-500 mb-4 max-w-sm mx-auto">Your protection is now active. We've sent your policy details to your email.</p>
                        <div class="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full text-slate-600 text-xs font-bold">
                            <i class="fas fa-envelope"></i> Checking inbox...
                        </div>
                    </div>
                `;

                // Redirect to Thank You page
                setTimeout(() => {
                    window.location.href = `/policy-success?id=${pData.policyNumber}&email=${encodeURIComponent(pData.email)}`;
                }, 2000);
            } else {
                showToast(pData.message || 'Error generating policy.', 'error');
                // Revert UI to show failure state inside the success container
                successOverlay.innerHTML = `
                    <div class="text-center py-12">
                        <i class="fas fa-exclamation-triangle text-5xl text-red-500 mb-4"></i>
                        <h3 class="text-xl font-bold text-gray-900">Document Generation Failed</h3>
                        <p class="text-gray-500 mt-2">${pData.message || 'Please contact support.'}</p>
                        <p class="text-sm mt-1">Payment Ref: ${data.paymentId}</p>
                    </div>
                `;
            }
        } catch (e) {
            console.error('Generate Policy error:', e);
            showToast('Network error while generating policy.', 'error');
        }
    }


    // Real Razorpay Flow (Simplified Dummy Mode)
    btnPayRazorpay.addEventListener('click', async () => {
        if (!formData.createdPolicyId) return showPaymentError('Invalid session. Please reload.');
        
        const ot = btnPayRazorpay.innerHTML;
        btnPayRazorpay.disabled = true;
        btnPayRazorpay.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Opening Gateway...';
        hidePaymentError();

        // 1. Configure Dummy Razorpay Options
        // Note: Using a dummy key as ordering is skipped
        const options = {
            key: window.RAZORPAY_TEST_KEY || 'rzp_test_dummy_key',
            amount: Math.round(formData.finalPremium * 100), // paise (ensure integer)
            currency: 'INR',
            name: 'DriveGuard Insurance',
            description: `Payment for ${formData.planName} Plan`,
            handler: async function(response) {
                try {
                    btnPayRazorpay.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Verifying...';
                    // We call the dummy endpoint directly to mark as paid
                    const res = await fetch('/api/payment/dummy', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ policyId: formData.createdPolicyId, action: 'success' })
                    });
                    const data = await res.json();
                    if (res.ok && data.success) {
                        data.paymentId = response.razorpay_payment_id || `dummy_rzp_${Date.now()}`;
                        handlePaymentSuccess(data, 'razorpay');
                    } else {
                        btnPayRazorpay.disabled = false; btnPayRazorpay.innerHTML = ot;
                        showPaymentError(data.message || 'Payment failed.');
                    }
                } catch (e) {
                     btnPayRazorpay.disabled = false; btnPayRazorpay.innerHTML = ot;
                     showPaymentError('Network error while processing payment.');
                }
            },
            prefill: {
                name: formData.customer.name,
                email: formData.customer.email,
                contact: formData.customer.mobile
            },
            theme: { color: "#2563eb" },
            modal: { 
                ondismiss: function() { 
                    if (btnPayRazorpay) {
                        btnPayRazorpay.disabled = false;
                        btnPayRazorpay.innerHTML = ot;
                    }
                } 
            }
        };

        try {
            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function(response) {
                btnPayRazorpay.disabled = false; btnPayRazorpay.innerHTML = ot;
                showPaymentError(`Payment Failed: ${response.error.description}`);
            });
            rzp.open();
        } catch (error) {
            console.error('Razorpay Error:', error);
            showPaymentError('Unable to open payment gateway. Please use Simulate Success.');
            btnPayRazorpay.disabled = false; btnPayRazorpay.innerHTML = ot;
        }
    });



    // ─── Prevent form submit ─────────────────────────────────
    document.getElementById('vehicleForm').addEventListener('submit',e=>e.preventDefault());

    // ─── Helpers ─────────────────────────────────────────────
    function resetModelSelect(){ if(modelSelectTom) { modelSelectTom.clear(); modelSelectTom.clearOptions(); modelSelectTom.disable(); } modelContainer.classList.add('opacity-30'); }
    function resetVariantSelect(){ if(variantSelectTom) { variantSelectTom.clear(); variantSelectTom.clearOptions(); variantSelectTom.disable(); } variantContainer.classList.add('opacity-30'); }

    // ─── Toast ───────────────────────────────────────────────
    function showToast(msg,type='success'){let c=document.getElementById('toastContainer');if(!c){c=document.createElement('div');c.id='toastContainer';c.className='fixed top-6 right-6 z-50 flex flex-col gap-3';document.body.appendChild(c);}const t=document.createElement('div');t.className=`p-4 rounded-xl shadow-2xl flex items-center gap-3 text-white transition-all transform translate-x-full ${type==='success'?'bg-gradient-to-r from-green-500 to-emerald-600':'bg-gradient-to-r from-red-500 to-rose-600'}`;t.innerHTML=`<i class="fas ${type==='success'?'fa-check-circle':'fa-exclamation-circle'}"></i><span class="font-medium">${msg}</span>`;c.appendChild(t);setTimeout(()=>t.classList.remove('translate-x-full'),10);setTimeout(()=>{t.classList.add('translate-x-full','opacity-0');setTimeout(()=>t.remove(),300);},3000);}

    // ─── Restore From State ──────────────────────────────────
    async function restoreSession() {
        if (!formData.brand && formData.step === 1) return; // Clean new session
        
        // Restore basic scalar fields
        if (formData.year) yearSelectEl.value = formData.year;
        if (formData.fuel) {
            const rd = document.querySelector(`input[name="fuel"][value="${formData.fuel}"]`);
            if (rd) rd.checked = true;
        }
        if (formData.claim) {
            const rd = document.querySelector(`input[name="claim"][value="${formData.claim}"]`);
            if (rd) rd.checked = true;
        }
        if (formData.city) {
            // Check if cityTom exists or use the raw DOM value if tom hasn't booted
            if (typeof cityTom !== 'undefined' && cityTom.setValue) {
                cityTom.setValue(formData.city);
            } else {
                citySelectEl.value = formData.city;
            }
        }
        
        // Restore customer
        const m = { custName:'name', custEmail:'email', custMobile:'mobile', custAddress1:'address1', custAddress2:'address2', custCity:'city', custPincode:'pincode' };
        Object.entries(m).forEach(([id, key]) => { if(formData.customer && formData.customer[key]){ const el = document.getElementById(id); if (el) el.value = formData.customer[key]; }});
        if (formData.customer && formData.customer.state) {
            const hs = document.getElementById('custState');
            if (hs) hs.value = formData.customer.state;
        }

        // Restore Brand/Model/Variant async flow
        if (formData.brand && formData.brandName) {
            if (brandSelectTom) {
                brandSelectTom.addOption({ id: formData.brand, name: formData.brandName });
                brandSelectTom.setValue(formData.brand, true); // true = silent
            }
            
            if (modelSelectTom) modelSelectTom.enable();
            modelContainer.classList.remove('opacity-30','pointer-events-none');
            try {
                const rm = await fetch(`/api/form/models?brand_id=${formData.brand}`);
                const ms = await rm.json(); 
                if (modelSelectTom) {
                    modelSelectTom.clearOptions();
                    modelSelectTom.addOptions(ms.map(x=>({ id:x.id, name:x.name })));
                }
                
                if (formData.model && modelSelectTom) {
                    modelSelectTom.setValue(formData.model, true);
                    if (variantSelectTom) variantSelectTom.enable();
                    variantContainer.classList.remove('opacity-30','pointer-events-none');
                    const rv = await fetch(`/api/form/variants?model_id=${formData.model}`);
                    const vs = await rv.json();
                    if (variantSelectTom) {
                        variantSelectTom.clearOptions();
                        variantSelectTom.addOptions(vs.map(x=>({ id:x.id, name:x.name })));
                    }
                    
                    if (formData.variant && variantSelectTom) {
                        variantSelectTom.setValue(formData.variant, true);
                    }
                }
            } catch(e) { console.error('Restoration Failed:', e); }
        }

        if (currentStep >= 1) validateStep1();
        if (currentStep >= 2) validateStep2();
        if (currentStep >= 5) validateStep5();

        if (currentStep > 2 && !formData.cachedPremiumData) {
            showToast('Session restored. Please recalculate your premium.', 'success');
            currentStep = 2; formData.step = 2; formData.plan = ""; formData.addons = [];
            saveState();
        }

        // Restore Step 6 Summary if applicable
        if (currentStep === 6 && formData.cachedPremiumData) {
            const vi = formData.cachedPremiumData.vehicleInfo || {};
            const addonNames = formData.addons.map(v => ADDONS.find(a=>a.value===v)?.name).filter(Boolean);
            document.getElementById('paymentTotalAmount').textContent = formatCurrency(formData.finalPremium);
            document.getElementById('paymentSummaryDetails').innerHTML = `
                <div class="flex justify-between py-1 border-b border-white/10"><span class="text-slate-400">Customer</span><span class="font-bold text-white">${formData.customer.name}</span></div>
                <div class="flex justify-between py-1 border-b border-white/10"><span class="text-slate-400">Vehicle</span><span class="font-bold text-white">${vi.brand||''} ${vi.model||''} — ${vi.variant||''}</span></div>
                <div class="flex justify-between py-1 border-b border-white/10"><span class="text-slate-400">Plan</span><span class="font-bold text-indigo-300">${formData.planName}</span></div>
                ${addonNames.length?`<div class="flex justify-between py-1 border-b border-white/10"><span class="text-slate-400">Add-ons</span><span class="font-bold text-violet-300 text-xs">${addonNames.join(', ')}</span></div>`:``}
            `;
        }

        panels.forEach((p, i) => {
            if (p) {
                p.classList.add('hidden');
                if (i === currentStep) p.classList.remove('hidden');
            }
        });
        updateStepIndicator();
    }

    // ─── Init ────────────────────────────────────────────────
    restoreSession().then(() => {
        updateStepIndicator();
        autoFocusStep(currentStep);
    });
}
});
