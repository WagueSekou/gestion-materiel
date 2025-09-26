// Enhanced UI interactions for authentication pages
document.addEventListener('DOMContentLoaded', function() {
    // Password toggle functionality
    const passwordToggle = document.getElementById('passwordToggle');
    const passwordInput = document.getElementById('password');
    const confirmPasswordToggle = document.getElementById('confirmPasswordToggle');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    
    if (passwordToggle && passwordInput) {
        passwordToggle.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            const icon = this.querySelector('i');
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        });
    }
    
    if (confirmPasswordToggle && confirmPasswordInput) {
        confirmPasswordToggle.addEventListener('click', function() {
            const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            confirmPasswordInput.setAttribute('type', type);
            
            const icon = this.querySelector('i');
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        });
    }
    
    // Form submission with loading state
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            const submitButton = this.querySelector('.auth-button');
            if (submitButton) {
                submitButton.classList.add('loading');
                submitButton.disabled = true;
                
                // Remove loading state after a delay (in case of error)
                setTimeout(() => {
                    submitButton.classList.remove('loading');
                    submitButton.disabled = false;
                }, 5000);
            }
        });
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            const submitButton = this.querySelector('.auth-button');
            if (submitButton) {
                submitButton.classList.add('loading');
                submitButton.disabled = true;
                
                // Remove loading state after a delay (in case of error)
                setTimeout(() => {
                    submitButton.classList.remove('loading');
                    submitButton.disabled = false;
                }, 5000);
            }
        });
    }
    
    // Input focus effects
    const inputs = document.querySelectorAll('.auth-form input');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
        });
        
        // Real-time validation feedback
        input.addEventListener('input', function() {
            validateInput(this);
        });
    });
    
    // Error message handling
    const errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach(errorMsg => {
        if (errorMsg.textContent.trim()) {
            errorMsg.style.display = 'block';
            
            // Auto-hide error messages after 5 seconds
            setTimeout(() => {
                errorMsg.style.display = 'none';
                errorMsg.textContent = '';
            }, 5000);
        }
    });
    
    // Success message handling
    const successMessages = document.querySelectorAll('.success-message');
    successMessages.forEach(successMsg => {
        if (successMsg.textContent.trim()) {
            successMsg.style.display = 'block';
            
            // Auto-hide success messages after 3 seconds
            setTimeout(() => {
                successMsg.style.display = 'none';
                successMsg.textContent = '';
            }, 3000);
        }
    });
});

// Input validation function
function validateInput(input) {
    const wrapper = input.parentElement;
    const icon = wrapper.querySelector('.input-icon');
    
    // Remove previous validation classes
    wrapper.classList.remove('valid', 'invalid');
    
    if (input.value.trim() === '') {
        return; // Don't show validation for empty fields
    }
    
    let isValid = false;
    
    switch (input.type) {
        case 'email':
            isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value);
            break;
        case 'password':
            isValid = input.value.length >= 4;
            break;
        default:
            isValid = input.value.length > 0;
    }
    
    if (isValid) {
        wrapper.classList.add('valid');
        if (icon) {
            icon.style.color = 'var(--success-color)';
        }
    } else {
        wrapper.classList.add('invalid');
        if (icon) {
            icon.style.color = 'var(--error-color)';
        }
    }
}

// Show error message function
function showError(message, elementId = 'loginError') {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            errorElement.style.display = 'none';
            errorElement.textContent = '';
        }, 5000);
    }
}

// Show success message function
function showSuccess(message, elementId = 'successMessage') {
    const successElement = document.getElementById(elementId);
    if (successElement) {
        successElement.textContent = message;
        successElement.style.display = 'block';
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            successElement.style.display = 'none';
            successElement.textContent = '';
        }, 3000);
    }
}

// Loading state management
function setLoadingState(formId, isLoading) {
    const form = document.getElementById(formId);
    if (form) {
        const button = form.querySelector('.auth-button');
        if (button) {
            if (isLoading) {
                button.classList.add('loading');
                button.disabled = true;
            } else {
                button.classList.remove('loading');
                button.disabled = false;
            }
        }
    }
}

// Smooth scroll to error messages
function scrollToError() {
    const errorElement = document.querySelector('.error-message[style*="display: block"]');
    if (errorElement) {
        errorElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
    }
}

// Keyboard navigation enhancement
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        const activeElement = document.activeElement;
        if (activeElement && activeElement.tagName === 'INPUT') {
            const form = activeElement.closest('form');
            if (form) {
                const submitButton = form.querySelector('button[type="submit"]');
                if (submitButton && !submitButton.disabled) {
                    submitButton.click();
                }
            }
        }
    }
});

// Accessibility improvements
function enhanceAccessibility() {
    // Add ARIA labels to form elements
    const inputs = document.querySelectorAll('.auth-form input');
    inputs.forEach(input => {
        if (!input.getAttribute('aria-label')) {
            input.setAttribute('aria-label', input.placeholder || input.name);
        }
    });
    
    // Add ARIA labels to buttons
    const buttons = document.querySelectorAll('.auth-button');
    buttons.forEach(button => {
        if (!button.getAttribute('aria-label')) {
            const text = button.querySelector('.button-text');
            if (text) {
                button.setAttribute('aria-label', text.textContent);
            }
        }
    });
}

// Initialize accessibility enhancements
document.addEventListener('DOMContentLoaded', enhanceAccessibility);
