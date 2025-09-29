document.getElementById("loginForm").addEventListener("submit", async function(e) {
  e.preventDefault();
  
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const errorMsg = document.getElementById("loginError");
  const submitButton = this.querySelector('.auth-button');
  
  // Clear previous errors
  errorMsg.textContent = '';
  errorMsg.style.display = 'none';
  
  // Set loading state
  setLoadingState('loginForm', true);

  try {
    const data = await apiService.login(email, password);
    
    // Show success feedback
    submitButton.innerHTML = '<i class="fas fa-check"></i> Connexion réussie';
    submitButton.style.background = 'var(--success-color)';
    
    // Redirect after a short delay
    setTimeout(() => {
      if (data.role === "admin") {
        window.location.href = "dashboard_admin.html";
      } else if (data.role === "technicien") {
        window.location.href = "dashboard_technicien.html";
      } else if (data.role === "technical_manager") {
        window.location.href = "dashboard_technical_manager.html";
      } else {
        window.location.href = "dashboard_utilisateur.html";
      }
    }, 1000);
    
  } catch (error) {
    console.error('Login error:', error);
    showError("Erreur de connexion au serveur. Veuillez réessayer.", 'loginError');
    scrollToError();
  } finally {
    // Remove loading state
    setLoadingState('loginForm', false);
  }
});
