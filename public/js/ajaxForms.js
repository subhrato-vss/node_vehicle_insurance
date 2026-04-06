document.addEventListener('DOMContentLoaded', () => {
    // 1. Generic AJAX Form Handler
    const handleFormSubmit = async (formId, url, method, onSuccess) => {
        const form = document.getElementById(formId);
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            
            // Disable button and show loading
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Saving...';

            const formData = new FormData(form);
            const payload = Object.fromEntries(formData.entries());

            try {
                const response = await fetch(url + (payload.id ? `/${payload.id}` : ''), {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    showToast(data.message || 'Success!', 'success');
                    if (onSuccess) onSuccess(data);
                    form.reset();
                    // If it's a modal form, close it
                    const modal = form.closest('.fixed');
                    if (modal) modal.classList.add('hidden');
                } else {
                    showToast(data.message || 'Something went wrong', 'error');
                }
            } catch (error) {
                console.error('AJAX Error:', error);
                showToast('Network error. Please try again.', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        });
    };

    // 2. Toast Notification System
    const showToast = (message, type = 'success') => {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `p-4 rounded-xl shadow-2xl flex items-center gap-3 text-white transition-all transform translate-x-full animate-fade-in ${
            type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`;
        toast.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span class="font-medium">${message}</span>
        `;

        container.appendChild(toast);
        
        // Slider animation
        setTimeout(() => toast.classList.remove('translate-x-full'), 10);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.add('translate-x-full', 'opacity-0');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    };

    // 2.5 Custom Confirm Modal System
    window.customConfirm = (message) => {
        return new Promise((resolve) => {
            let modal = document.getElementById('customConfirmModal');
            if (modal) modal.remove(); // Clear any existing

            modal = document.createElement('div');
            modal.id = 'customConfirmModal';
            modal.className = 'fixed inset-0 bg-black/50 z-[110] flex items-center justify-center backdrop-blur-sm animate-fade-in';
            modal.innerHTML = `
                <div class="bg-white p-6 md:p-8 rounded-3xl shadow-2xl w-full mx-4 max-w-sm transform transition-all text-center">
                    <div class="mb-5">
                        <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4 shadow-inner">
                            <i class="fas fa-trash-alt text-2xl text-red-600"></i>
                        </div>
                        <h3 class="text-xl font-extrabold text-gray-900 mb-2">Confirm Deletion</h3>
                        <p id="customConfirmMessage" class="text-gray-500 font-medium"></p>
                    </div>
                    <div class="flex gap-3">
                        <button id="customConfirmCancelBtn" class="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all">Cancel</button>
                        <button id="customConfirmOkBtn" class="flex-1 py-3 px-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 hover:-translate-y-0.5 shadow-lg shadow-red-200 transition-all">Yes, Delete</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            document.getElementById('customConfirmMessage').textContent = message;

            const cleanup = () => modal.remove();

            document.getElementById('customConfirmCancelBtn').onclick = () => { cleanup(); resolve(false); };
            document.getElementById('customConfirmOkBtn').onclick = () => { cleanup(); resolve(true); };
        });
    };

    // 3. Login Flow
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const errorDiv = document.getElementById('loginError');
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            
            errorDiv.classList.add('hidden');
            submitBtn.disabled = true;
            submitBtn.innerHTML = 'Signing in...';

            const formData = new FormData(loginForm);
            const payload = Object.fromEntries(formData.entries());

            try {
                const response = await fetch('/admin/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await response.json();

                if (data.success) {
                    window.location.href = '/admin/dashboard';
                } else {
                    errorDiv.querySelector('.error-text').textContent = data.message;
                    errorDiv.classList.remove('hidden');
                    errorDiv.classList.add('flex');
                }
            } catch (err) {
                console.error(err);
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Login <i class="fas fa-sign-in-alt ml-2"></i>';
            }
        });
    }

    // 4. Page Specific Logic
    const path = window.location.pathname;

    // --- BRANDS PAGE ---
    if (path === '/admin/brands') {
        let currentBrandType = 'all';

        const refreshBrandTable = async (type = currentBrandType) => {
            currentBrandType = type;
            const res = await fetch(`/api/brands${type !== 'all' ? `?type=${type}` : ''}`);
            const data = await res.json();
            const brands = data.brands || data;
            const counts = data.counts;

            if (counts) {
                const elAll = document.getElementById('count-all');
                const elCar = document.getElementById('count-car');
                const elBike = document.getElementById('count-bike');
                if (elAll) elAll.textContent = counts.all;
                if (elCar) elCar.textContent = counts.car;
                if (elBike) elBike.textContent = counts.bike;
            }

            const tbody = document.getElementById('brandTableBody');
            tbody.innerHTML = brands.length ? '' : '<tr><td colspan="4" class="px-8 py-10 text-center text-gray-500 italic">No brands found. Add one above!</td></tr>';
            
            brands.forEach(brand => {
                const row = document.createElement('tr');
                row.className = 'hover:bg-blue-50/30 transition-colors';
                row.innerHTML = `
                    <td class="px-8 py-5 font-mono text-gray-400">#${brand.id}</td>
                    <td class="px-8 py-5 font-bold text-gray-800">${brand.name}</td>
                    <td class="px-8 py-5">
                        <span class="px-3 py-1 rounded-full text-xs font-bold uppercase ${brand.type === 'car' ? 'bg-blue-100 text-blue-700' : 'bg-indigo-100 text-indigo-700'}">
                            ${brand.type}
                        </span>
                    </td>
                    <td class="px-8 py-5">
                        <div class="flex justify-center gap-3">
                            <button onclick='openEditModal(${JSON.stringify(brand)})' class="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all"><i class="fas fa-edit"></i></button>
                            <button onclick="deleteBrand(${brand.id})" class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                `;
                tbody.appendChild(row);
            });
        };

        window.filterBrands = (type) => {
            // Update UI (buttons active state)
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('bg-white', 'text-blue-600', 'shadow-sm');
                btn.classList.add('text-gray-500', 'hover:text-gray-700');
            });
            const activeBtn = document.getElementById(`filter-${type}`);
            if (activeBtn) {
                activeBtn.classList.remove('text-gray-500', 'hover:text-gray-700');
                activeBtn.classList.add('bg-white', 'text-blue-600', 'shadow-sm');
            }
            refreshBrandTable(type);
        };

        handleFormSubmit('addBrandForm', '/admin/brands', 'POST', () => refreshBrandTable());
        handleFormSubmit('editBrandForm', '/admin/brands', 'PUT', () => refreshBrandTable());

        window.deleteBrand = async (id) => {
            if (!await window.customConfirm('Delete this brand?')) return;
            try {
                const res = await fetch(`/admin/brands/${id}`, { method: 'DELETE' });
                const data = await res.json();
                if (data.success) {
                    showToast(data.message);
                    refreshBrandTable();
                } else if (data.message) {
                    showToast(data.message, 'error');
                }
            } catch (err) { console.error(err); }
        };
    }

    // --- MODELS PAGE ---
    if (path === '/admin/models') {
        let currentModelType = 'all';
        let currentSearchQuery = '';

        const modelSearchInput = document.getElementById('modelSearchInput');
        if (modelSearchInput) {
            modelSearchInput.addEventListener('input', (e) => {
                currentSearchQuery = e.target.value.toLowerCase().trim();
                refreshModelTable(currentModelType);
            });
        }

        const refreshModelTable = async (type = currentModelType) => {
            currentModelType = type;
            const resData = await fetch(`/admin/models?json=true${type !== 'all' ? `&type=${type}` : ''}`); 
            const data = await resData.json();
            let models = data.models || data;
            const counts = data.counts;

            if (currentSearchQuery) {
                models = models.filter(m => 
                    m.name.toLowerCase().includes(currentSearchQuery) || 
                    m.brand_name.toLowerCase().includes(currentSearchQuery)
                );
            }

            if (counts) {
                const elAll = document.getElementById('count-all');
                const elCar = document.getElementById('count-car');
                const elBike = document.getElementById('count-bike');
                if (elAll) elAll.textContent = counts.all;
                if (elCar) elCar.textContent = counts.car;
                if (elBike) elBike.textContent = counts.bike;
            }
            
            const tbody = document.getElementById('modelTableBody');
            tbody.innerHTML = models.length ? '' : '<tr><td colspan="5" class="px-8 py-10 text-center text-gray-500 italic">No models found referencing your search / filter.</td></tr>';
            
            models.forEach(model => {
                const row = document.createElement('tr');
                row.className = 'hover:bg-blue-50/30 transition-colors';
                row.innerHTML = `
                    <td class="px-8 py-5 font-mono text-gray-400">#${model.id}</td>
                    <td class="px-8 py-5 font-bold text-gray-800">${model.brand_name}</td>
                    <td class="px-8 py-5 font-bold text-blue-600">${model.name}</td>
                    <td class="px-8 py-5">
                        <span class="px-3 py-1 rounded-full text-xs font-bold uppercase ${model.brand_type === 'car' ? 'bg-blue-100 text-blue-700' : 'bg-indigo-100 text-indigo-700'}">
                            ${model.brand_type}
                        </span>
                    </td>
                    <td class="px-8 py-5">
                        <div class="flex justify-center gap-3">
                            <button onclick='openEditModal(${JSON.stringify(model)})' class="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all"><i class="fas fa-edit"></i></button>
                            <button onclick="deleteModel(${model.id})" class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                `;
                tbody.appendChild(row);
            });
        };

        window.filterModels = (type) => {
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('bg-white', 'text-blue-600', 'shadow-sm');
                btn.classList.add('text-gray-500', 'hover:text-gray-700');
            });
            const activeBtn = document.getElementById(`filter-${type}`);
            if (activeBtn) {
                activeBtn.classList.remove('text-gray-500', 'hover:text-gray-700');
                activeBtn.classList.add('bg-white', 'text-blue-600', 'shadow-sm');
            }
            refreshModelTable(type);
        };

        handleFormSubmit('addModelForm', '/admin/models', 'POST', () => refreshModelTable());
        handleFormSubmit('editModelForm', '/admin/models', 'PUT', () => refreshModelTable());

        window.deleteModel = async (id) => {
            if (!await window.customConfirm('Delete this model?')) return;
            try {
                const res = await fetch(`/admin/models/${id}`, { method: 'DELETE' });
                const data = await res.json();
                if (data.success) { 
                    showToast(data.message); 
                    refreshModelTable(); 
                } else if (data.message) {
                    showToast(data.message, 'error');
                }
            } catch (err) { console.error(err); }
        };
    }

    // --- VARIANTS PAGE ---
    if (path === '/admin/variants') {
        let currentVariantType = 'all';
        let currentSearchQuery = '';
        let currentVariantModelId = null;

        const variantSearchInput = document.getElementById('variantSearchInput');
        if (variantSearchInput) {
            variantSearchInput.addEventListener('input', (e) => {
                currentSearchQuery = e.target.value.toLowerCase().trim();
                refreshVariantTable(currentVariantType, currentVariantModelId);
            });
        }

        const refreshVariantTable = async (type = currentVariantType, modelId = currentVariantModelId) => {
            currentVariantType = type;
            currentVariantModelId = modelId;
            const resData = await fetch(`/admin/variants?json=true${type !== 'all' ? `&type=${type}` : ''}`);
            const data = await resData.json();
            let variants = data.variants || data;
            const counts = data.counts;
            
            if (currentVariantModelId) {
                variants = variants.filter(v => v.model_id == currentVariantModelId);
            }
            
            if (currentSearchQuery) {
                variants = variants.filter(v => 
                    v.name.toLowerCase().includes(currentSearchQuery) || 
                    v.brand_name.toLowerCase().includes(currentSearchQuery) ||
                    v.model_name.toLowerCase().includes(currentSearchQuery)
                );
            }

            if (counts) {
                const elAll = document.getElementById('count-all');
                const elCar = document.getElementById('count-car');
                const elBike = document.getElementById('count-bike');
                if (elAll) elAll.textContent = counts.all;
                if (elCar) elCar.textContent = counts.car;
                if (elBike) elBike.textContent = counts.bike;
            }

            const tbody = document.getElementById('variantTableBody');
            tbody.innerHTML = variants.length ? '' : '<tr><td colspan="6" class="px-8 py-10 text-center text-gray-500 italic">No variants found referencing your search / filter.</td></tr>';
            
            variants.forEach(variant => {
                const priceFormatted = variant.base_price ? Number(variant.base_price).toLocaleString('en-IN') : '5,00,000';
                const row = document.createElement('tr');
                row.className = 'hover:bg-blue-50/30 transition-colors';
                row.innerHTML = `
                    <td class="px-8 py-5 font-mono text-gray-400">#${variant.id}</td>
                    <td class="px-8 py-5">
                        <div class="flex flex-col">
                            <span class="text-xs text-gray-400 uppercase tracking-tighter">${variant.brand_name}</span>
                            <span class="font-bold text-gray-800">${variant.model_name}</span>
                        </div>
                    </td>
                    <td class="px-8 py-5 font-bold text-purple-600">${variant.name}</td>
                    <td class="px-8 py-5 font-mono text-emerald-600 font-bold">₹${priceFormatted}</td>
                    <td class="px-8 py-5">
                        <span class="px-3 py-1 rounded-full text-xs font-bold uppercase ${variant.brand_type === 'car' ? 'bg-blue-100 text-blue-700' : 'bg-indigo-100 text-indigo-700'}">
                            ${variant.brand_type}
                        </span>
                    </td>
                    <td class="px-8 py-5">
                        <div class="flex justify-center gap-3">
                            <button onclick='openEditModal(${JSON.stringify(variant)})' class="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all"><i class="fas fa-edit"></i></button>
                            <button onclick="deleteVariant(${variant.id})" class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                `;
                tbody.appendChild(row);
            });
        };

        window.filterVariants = (type, modelId = null) => {
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('bg-white', 'text-blue-600', 'shadow-sm');
                btn.classList.add('text-gray-500', 'hover:text-gray-700');
            });
            const activeBtn = document.getElementById(`filter-${type}`);
            if (activeBtn) {
                activeBtn.classList.remove('text-gray-500', 'hover:text-gray-700');
                activeBtn.classList.add('bg-white', 'text-blue-600', 'shadow-sm');
            }
            refreshVariantTable(type, modelId);
        };

        handleFormSubmit('addVariantForm', '/admin/variants', 'POST', () => refreshVariantTable());
        handleFormSubmit('editVariantForm', '/admin/variants', 'PUT', () => refreshVariantTable());

        window.deleteVariant = async (id) => {
            if (!await window.customConfirm('Delete this variant?')) return;
            try {
                const res = await fetch(`/admin/variants/${id}`, { method: 'DELETE' });
                const data = await res.json();
                if (data.success) { showToast(data.message); refreshVariantTable(); }
            } catch (err) { console.error(err); }
        };
    }

    // --- CHANGE PASSWORD PAGE ---
    if (path === '/admin/change-password') {
        const cpForm = document.getElementById('changePasswordForm');
        if (cpForm) {
            cpForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const newPw = document.getElementById('newPassword').value;
                const confirmPw = document.getElementById('confirmPassword').value;

                if (newPw !== confirmPw) {
                    showToast('New password and confirm password do not match', 'error');
                    return;
                }

                const submitBtn = document.getElementById('changePasswordBtn');
                const originalBtnText = submitBtn.innerHTML;
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Updating...';

                const formData = new FormData(cpForm);
                const payload = Object.fromEntries(formData.entries());

                try {
                    const response = await fetch('/admin/change-password', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    const data = await response.json();

                    if (response.ok && data.success) {
                        showToast(data.message || 'Password updated successfully!', 'success');
                        cpForm.reset();
                        // Reset strength bar
                        const bar = document.getElementById('strengthBar');
                        const text = document.getElementById('strengthText');
                        if (bar) bar.style.opacity = '0';
                        if (text) text.style.opacity = '0';
                    } else {
                        showToast(data.message || 'Failed to update password', 'error');
                    }
                } catch (error) {
                    console.error('Change Password Error:', error);
                    showToast('Network error. Please try again.', 'error');
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                }
            });
        }
    }
});
