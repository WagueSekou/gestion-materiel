document.getElementById("registerForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const role = document.getElementById("role").value;
  const errorMsg = document.getElementById("registerError");
  const submitButton = this.querySelector('.auth-button');
  
  // Clear previous errors
  errorMsg.textContent = '';
  errorMsg.style.display = 'none';
  
  // Validate password match
  if (password !== confirmPassword) {
    errorMsg.textContent = "Les mots de passe ne correspondent pas.";
    return;
  }
  
  // Set loading state
  setLoadingState('registerForm', true);

  try {
    const data = await apiService.register(name, email, password, role);
    
    // Show success feedback
    submitButton.innerHTML = '<i class="fas fa-check"></i> Compte créé !';
    submitButton.style.background = 'var(--success-color)';
    
    // Show success message
    showSuccess("Compte créé avec succès ! Redirection vers la page de connexion...", 'registerSuccess');
    
    // Redirect after a short delay
    setTimeout(() => {
      window.location.href = "login.html";
    }, 2000);
    
  } catch (error) {
    console.error('Register error:', error);
    const message = error?.message || 'Erreur de connexion au serveur. Veuillez réessayer.';
    showError(message, 'registerError');
    scrollToError();
  } finally {
    // Remove loading state
    setLoadingState('registerForm', false);
  }
});
