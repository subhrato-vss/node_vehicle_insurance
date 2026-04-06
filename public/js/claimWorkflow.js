/**
 * claimWorkflow.js
 * Handles AJAX actions for the sequential claim approval workflow.
 */

/**
 * Advance a claim to the next stage.
 */
async function advanceStage(claimId, endpoint, extraData = {}) {
    const { isConfirmed } = await Swal.fire({
        title: 'Confirm Action',
        text: `Are you sure you want to proceed with this step?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#2563eb',
        confirmButtonText: 'Yes, Proceed'
    });

    if (!isConfirmed) return;

    try {
        const response = await fetch(`/api/admin/claim/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ claimId, ...extraData })
        });

        const result = await response.json();
        if (result.success) {
            Swal.fire('Success', result.message, 'success').then(() => location.reload());
        } else {
            Swal.fire('Error', result.message, 'error');
        }
    } catch (error) {
        console.error('Workflow Error:', error);
        Swal.fire('Error', 'Network error. Please try again.', 'error');
    }
}

/**
 * Verify a specific document.
 */
async function verifyDoc(claimId, docId, isVerified) {
    try {
        const response = await fetch('/api/admin/claim/verify-docs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                claimId, 
                verifications: [{ docId, isVerified, notes: 'Verified by Admin' }] 
            })
        });

        const result = await response.json();
        if (result.success) {
            // Minimal toast for doc verification
            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true
            });
            Toast.fire({ icon: 'success', title: 'Document verified' });
            
            // Reload to show "Finalize Verification" button if all are done
            setTimeout(() => location.reload(), 1000);
        } else {
            Swal.fire('Error', result.message, 'error');
        }
    } catch (error) {
        console.error('Verification Error:', error);
    }
}

/**
 * Handle claim rejection.
 */
async function rejectClaim(claimId) {
    const { value: reason } = await Swal.fire({
        title: 'Reject Claim',
        input: 'textarea',
        inputLabel: 'Rejection Reason',
        inputPlaceholder: 'State why the claim is being rejected...',
        showCancelButton: true,
        inputValidator: (value) => {
            if (!value) return 'You must provide a reason for rejection.';
        }
    });

    if (!reason) return;

    try {
        const response = await fetch('/api/admin/claim/update-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ claimId, status: 'rejected', rejectionReason: reason })
        });

        const result = await response.json();
        if (result.success) {
            Swal.fire('Rejected', 'Claim has been rejected.', 'success').then(() => location.reload());
        } else {
            Swal.fire('Error', result.message, 'error');
        }
    } catch (error) {
        console.error('Rejection Error:', error);
        Swal.fire('Error', 'Network error.', 'error');
    }
}
