document.addEventListener('DOMContentLoaded', () => {
    
    if (window.lucide) window.lucide.createIcons();

    const userId = document.getElementById('profileUserId').value;
    if (!userId) return;

    
    const logoutBtn = document.getElementById('btn-logout');
    logoutBtn?.addEventListener('click', async () => {
        try {
            await fetch('/Users/LogoutAjax', { method: 'POST' });
            window.location.href = '/Auth/Login'; 
        } catch (err) {
            console.error('Logout failed', err);
        }
    });

    
    const passwordModal = document.getElementById('passwordModal');
    const changePasswordBtn = document.getElementById('btn-change-password');
    const cancelPasswordBtn = document.getElementById('cancelPasswordBtn');
    const savePasswordBtn = document.getElementById('savePasswordBtn');

    const currentPasswordInput = document.getElementById('currentPassword');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');

    const currentPasswordValidation = document.getElementById('currentPasswordValidation');
    const newPasswordValidation = document.getElementById('newPasswordValidation');
    const confirmPasswordValidation = document.getElementById('confirmPasswordValidation');

    changePasswordBtn?.addEventListener('click', () => {
        passwordModal.classList.remove('hidden');
        currentPasswordInput.focus();
    });

    cancelPasswordBtn?.addEventListener('click', () => {
        passwordModal.classList.add('hidden');
        currentPasswordInput.value = '';
        newPasswordInput.value = '';
        confirmPasswordInput.value = '';
        clearPasswordValidations();
    });

    const clearPasswordValidations = () => {
        currentPasswordValidation.classList.add('hidden');
        newPasswordValidation.classList.add('hidden');
        confirmPasswordValidation.classList.add('hidden');
    };

    const showPasswordValidation = (field, message) => {
        const validationElement = document.getElementById(field + 'Validation');
        if (validationElement) {
            validationElement.textContent = message;
            validationElement.classList.remove('hidden');
        }
    };

    const validatePasswordFields = () => {
        clearPasswordValidations();
        let isValid = true;

        if (!currentPasswordInput.value.trim()) {
            showPasswordValidation('currentPassword', 'Current password is required');
            isValid = false;
        }

        if (!newPasswordInput.value.trim()) {
            showPasswordValidation('newPassword', 'New password is required');
            isValid = false;
        } else if (newPasswordInput.value.length < 6) {
            showPasswordValidation('newPassword', 'Password must be at least 6 characters');
            isValid = false;
        } else if (!/[A-Z]/.test(newPasswordInput.value) || !/[a-z]/.test(newPasswordInput.value) || !/[0-9]/.test(newPasswordInput.value)) {
            showPasswordValidation('newPassword', 'Password must contain uppercase, lowercase, and number');
            isValid = false;
        }

        if (!confirmPasswordInput.value.trim()) {
            showPasswordValidation('confirmPassword', 'Please confirm your password');
            isValid = false;
        } else if (newPasswordInput.value !== confirmPasswordInput.value) {
            showPasswordValidation('confirmPassword', 'Passwords do not match');
            isValid = false;
        }

        return isValid;
    };

    savePasswordBtn?.addEventListener('click', async () => {
        if (!validatePasswordFields()) return;

        savePasswordBtn.disabled = true;
        savePasswordBtn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Saving...';

        try {
            const res = await fetch(`/Users/ChangePasswordAjax/${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    CurrentPassword: currentPasswordInput.value,
                    NewPassword: newPasswordInput.value,
                    ConfirmPassword: confirmPasswordInput.value
                })
            });

            if (res.ok) {
                alert('Password changed successfully!');
                passwordModal.classList.add('hidden');
                currentPasswordInput.value = '';
                newPasswordInput.value = '';
                confirmPasswordInput.value = '';
                clearPasswordValidations();
            } else {
                const errorData = await res.json();
                const errorMessage = errorData.error || 'Failed to change password';
                alert(errorMessage);
            }
        } catch (error) {
            console.error('Password change failed', error);
            alert('An error occurred while changing password');
        } finally {
            savePasswordBtn.disabled = false;
            savePasswordBtn.innerHTML = '<i data-lucide="check" class="w-4 h-4"></i> Save';
            if (window.lucide) window.lucide.createIcons();
        }
    });

    
    passwordModal?.addEventListener('click', (e) => {
        if (e.target === passwordModal) {
            cancelPasswordBtn.click();
        }
    });

    
    const avatarOverlay = document.getElementById('avatarOverlay');
    const fileInput = document.getElementById('avatarUploadInput');
    const cameraIcon = document.getElementById('cameraIcon');
    const loaderIcon = document.getElementById('loaderIcon');
    const avatarImage = document.getElementById('avatarImage');
    const avatarInitials = document.getElementById('avatarInitials');

    avatarOverlay?.addEventListener('click', () => fileInput.click());

    fileInput?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        cameraIcon.classList.add('hidden');
        loaderIcon.classList.remove('hidden');

        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = async () => {
            
            const canvas = document.createElement('canvas');
            const MAX = 256;
            const ratio = Math.min(MAX / img.width, MAX / img.height);
            canvas.width = Math.round(img.width * ratio);
            canvas.height = Math.round(img.height * ratio);

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            URL.revokeObjectURL(objectUrl);

            try {
                
                const res = await fetch(`/Users/UploadAvatarAjax/${userId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ AvatarUrl: dataUrl })
                });

                if (res.ok) {
                    avatarImage.src = dataUrl;
                    avatarImage.classList.remove('hidden');
                    avatarInitials.classList.add('hidden');
                }
            } catch (error) {
                console.error('Failed to upload', error);
                alert("Failed to upload photo");
            } finally {
                loaderIcon.classList.add('hidden');
                cameraIcon.classList.remove('hidden');
            }
        };
        img.src = objectUrl;
        e.target.value = '';
    });

    
    document.querySelectorAll('.editable-field').forEach(field => {
        const fieldName = field.getAttribute('data-field');
        const displayMode = field.querySelector('.display-mode');
        const editMode = field.querySelector('.edit-mode');
        const valueDisplay = field.querySelector('.field-value');
        const inputElement = field.querySelector('.field-input');
        const validationElement = field.querySelector('.field-validation');

        const editBtn = field.querySelector('.edit-btn');
        const saveBtn = field.querySelector('.save-btn');
        const cancelBtn = field.querySelector('.cancel-btn');

        let originalValue = inputElement ? inputElement.value : '';

        
        editBtn?.addEventListener('click', () => {
            displayMode.classList.replace('flex', 'hidden');
            editMode.classList.replace('hidden', 'flex');
            originalValue = inputElement.value;
            inputElement.focus();
            if (validationElement) validationElement.classList.add('hidden');
        });

        
        cancelBtn?.addEventListener('click', () => {
            inputElement.value = originalValue;
            editMode.classList.replace('flex', 'hidden');
            displayMode.classList.replace('hidden', 'flex');
            if (validationElement) validationElement.classList.add('hidden');
        });

        
        saveBtn?.addEventListener('click', async () => {
            const newValue = inputElement.value.trim();

            
            if (!newValue) {
                if (validationElement) {
                    validationElement.textContent = `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} cannot be empty`;
                    validationElement.classList.remove('hidden');
                }
                return;
            }

            if (fieldName === 'username' && newValue.length < 3) {
                if (validationElement) {
                    validationElement.textContent = 'Username must be at least 3 characters';
                    validationElement.classList.remove('hidden');
                }
                return;
            }

            
            const data = {};
            if (fieldName === 'name') data.Name = newValue;
            if (fieldName === 'username') data.Username = newValue;
            if (fieldName === 'bio') data.Bio = newValue;

            try {
                const res = await fetch(`/Users/UpdateAjax/${userId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (res.ok) {
                    valueDisplay.innerHTML = newValue || "<span class='italic text-muted-foreground'>Not set</span>";
                    valueDisplay.classList.remove('whitespace-pre-wrap');
                    if (fieldName === 'bio') valueDisplay.classList.add('whitespace-pre-wrap');
                    originalValue = newValue;

                    editMode.classList.replace('flex', 'hidden');
                    displayMode.classList.replace('hidden', 'flex');
                    if (validationElement) validationElement.classList.add('hidden');

                    
                    if (fieldName === 'name') document.getElementById('displayNameHeader').textContent = newValue || "Unknown";
                    if (fieldName === 'username') document.getElementById('displayUsernameHeader').textContent = '@' + (newValue || "Unknown");
                } else {
                    const errorData = await res.json().catch(() => ({}));
                    if (validationElement) {
                        validationElement.textContent = errorData.error || "Failed to update profile";
                        validationElement.classList.remove('hidden');
                    } else {
                        alert("Failed to update profile");
                    }
                }
            } catch (error) {
                console.error('Update failed', error);
                if (validationElement) {
                    validationElement.textContent = 'An error occurred';
                    validationElement.classList.remove('hidden');
                }
            }
        });

        
        inputElement?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && fieldName !== 'bio') saveBtn.click();
            if (e.key === 'Escape') cancelBtn.click();
        });
    });
});