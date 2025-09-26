// Affiche uniquement la page sélectionnée, cache les autres
document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll("#menuDashboard button");
  const pages = document.querySelectorAll(".page-section");

  function showPage(pageId) {
    pages.forEach(p => p.style.display = p.id === `page-${pageId}` ? "block" : "none");

    // Charger les données correspondantes à la page active
    if (pageId === "materiel") fetchMateriel();
    if (pageId === "allocation") fetchAllocations();
    if (pageId === "maintenance") fetchMaintenance();
    if (pageId === "reporting") afficherStatistiquesPage();
  }

  buttons.forEach(btn => {
    btn.addEventListener("click", () => showPage(btn.dataset.page));
  });

  // Affichage par défaut
  showPage("materiel");
});

// Appelle la fonction d'affichage des statistiques (dans reporting.js)
function afficherStatistiquesPage() {
  if (typeof afficherStatistiques === "function") {
    afficherStatistiques();
  }
}
