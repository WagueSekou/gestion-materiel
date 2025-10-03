// Modern User Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initializeUserDashboard();
    setupNavigation();
    loadDashboardData();
    setupFormHandlers();
});

// Initialize user dashboard
function initializeUserDashboard() {
    // Check authentication
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    
    // Update user info
    updateUserInfo();
    
    // Show default section
    showSection('dashboard');
}

// Setup navigation
function setupNavigation() {
    const menuItems = document.querySelectorAll('.menu-item');
    
    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all items
            menuItems.forEach(i => i.classList.remove('active'));
            
            // Add active class to clicked item
            this.classList.add('active');
            
            // Show corresponding section
            const section = this.getAttribute('data-section');
            showSection(section);
        });
    });
}

// Show section
function showSection(sectionName) {
    // Hide all sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => section.classList.remove('active'));
    
    // Show target section
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Update page title
    updatePageTitle(sectionName);
    
    // Load section data
    loadSectionData(sectionName);
}

// Update page title
function updatePageTitle(sectionName) {
    const pageTitle = document.querySelector('.page-title');
    const titles = {
        'dashboard': 'Tableau de bord',
        'materiel': 'Gestion du matériel',
        'allocation': 'Allocation & suivi',
        'maintenance': 'Maintenance',
        'reporting': 'Statistiques et rapports'
    };
    
    if (pageTitle && titles[sectionName]) {
        pageTitle.textContent = titles[sectionName];
    }
}

// Load section data
function loadSectionData(sectionName) {
    switch(sectionName) {
        case 'dashboard':
            loadDashboardStats();
            break;
        case 'materiel':
            loadMateriel();
            break;
        case 'allocation':
            loadAllocations();
            break;
        case 'maintenance':
            loadMaintenance();
            break;
        case 'reporting':
            loadReporting();
            break;
    }
}

// Load dashboard statistics
async function loadDashboardStats() {
    try {
        const dashboardData = await apiService.getUserDashboard();
        
        // Update stat cards
        const stats = {
            materiels: dashboardData.overview.availableMaterials,
            allocations: dashboardData.overview.allocations.total,
            maintenance: dashboardData.overview.maintenance.total,
            demandes: dashboardData.overview.allocations.pending
        };
        
        updateStatCards(stats);
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        showToast('Erreur lors du chargement des statistiques', 'error');
    }
}

// Update statistics cards
function updateStatCards(stats) {
    const statNumbers = document.querySelectorAll('.stat-number');
    if (statNumbers.length >= 4) {
        statNumbers[0].textContent = stats.materiels;
        statNumbers[1].textContent = stats.allocations;
        statNumbers[2].textContent = stats.maintenance;
        statNumbers[3].textContent = stats.demandes;
    }
}

// Load material data
async function loadMateriel() {
    const container = document.getElementById('materielList');
    if (!container) return;
    
    container.innerHTML = '<div class="loading-spinner">Chargement du matériel...</div>';
    
    try {
        // Fetch all materials without restricting to "disponible"
        const materialsData = await apiService.getMaterials();
        renderMateriel(materialsData.materiels || materialsData);
    } catch (error) {
        console.error('Error loading materials:', error);
        showToast('Erreur lors du chargement du matériel', 'error');
        container.innerHTML = '<p class="error-message">Erreur de chargement</p>';
    }
}

// Render material list
function renderMateriel(materiels) {
    const container = document.getElementById('materielList');
    if (!container) return;
    
    if (!materiels || materiels.length === 0) {
        container.innerHTML = '<p class="no-data">Aucun matériel disponible</p>';
        return;
    }
    
    container.innerHTML = `
        <div class="data-table">
            <div class="table-header">
                <div class="table-row">
                    <div class="table-cell">Nom</div>
                    <div class="table-cell">Type</div>
                    <div class="table-cell">État</div>
                    <div class="table-cell">Localisation</div>
                    <div class="table-cell">Actions</div>
                </div>
            </div>
            <div class="table-body">
                ${materiels.map(materiel => `
                    <div class="table-row">
                        <div class="table-cell">${materiel.name || materiel.nom || 'N/A'}</div>
                        <div class="table-cell">${materiel.type || 'N/A'}</div>
                        <div class="table-cell">
                            <span class="badge badge-${materiel.status || materiel.etat || 'disponible'}">${materiel.status || materiel.etat || 'disponible'}</span>
                        </div>
                        <div class="table-cell">${materiel.location || materiel.localisation || 'N/A'}</div>
                        <div class="table-cell">
                            <div class="actions">
                                <button class="btn-edit" onclick="editMateriel('${materiel._id}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn-delete" onclick="deleteMateriel('${materiel._id}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Load allocations
async function loadAllocations() {
    const container = document.getElementById('historiqueAllocations');
    if (!container) return;
    
    container.innerHTML = '<div class="loading-spinner">Chargement des allocations...</div>';
    
    try {
        // Get current user ID from multiple sources
        let userId = null;
        
        // First try to get from API
        try {
            const currentUser = await apiService.getCurrentUser();
            userId = currentUser._id || currentUser.id;
            console.log('Got user ID from API:', userId);
        } catch (userError) {
            console.warn('Could not get current user from API:', userError);
        }
        
        // Fallback to localStorage
        if (!userId) {
            userId = localStorage.getItem('userId') || localStorage.getItem('user_id');
            console.log('Got user ID from localStorage:', userId);
        }
        
        // Last resort: try to get from token
        if (!userId) {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    // Decode JWT token to get user ID
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    userId = payload.id;
                    console.log('Got user ID from token:', userId);
                } catch (tokenError) {
                    console.warn('Could not decode token:', tokenError);
                }
            }
        }
        
        if (!userId || userId === 'unknown') {
            throw new Error('User ID not found. Please log in again.');
        }
        
        console.log('Fetching allocations for user:', userId);
        const allocationsData = await apiService.getUserAllocations(userId);
        console.log('Allocations response:', allocationsData);
        
        // Handle different response formats
        let allocations = [];
        if (allocationsData) {
            if (Array.isArray(allocationsData)) {
                allocations = allocationsData;
            } else if (allocationsData.allocations) {
                allocations = allocationsData.allocations;
            } else if (allocationsData.data) {
                allocations = allocationsData.data;
            }
        }
        
        console.log('Processed allocations:', allocations);
        renderAllocations(allocations);
    } catch (error) {
        console.error('Error loading allocations:', error);
        showToast('Erreur lors du chargement des allocations: ' + error.message, 'error');
        container.innerHTML = `
            <div class="error-message">
                <p>Erreur de chargement des allocations</p>
                <p class="error-details">${error.message}</p>
                <button class="btn-primary" onclick="loadAllocations()">
                    <i class="fas fa-refresh"></i> Réessayer
                </button>
            </div>
        `;
    }
}

// Render allocations
function renderAllocations(allocations) {
    const container = document.getElementById('historiqueAllocations');
    if (!container) return;
    
    if (!allocations || allocations.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-inbox"></i>
                <p>Aucune allocation trouvée</p>
                <p class="no-data-subtitle">Vous n'avez pas encore d'allocations d'équipement</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="data-table">
            <div class="table-header">
                <div class="table-row">
                    <div class="table-cell">Matériel</div>
                    <div class="table-cell">Type</div>
                    <div class="table-cell">Date de début</div>
                    <div class="table-cell">Date de fin prévue</div>
                    <div class="table-cell">Statut</div>
                    <div class="table-cell">Actions</div>
                </div>
            </div>
            <div class="table-body">
                ${allocations.map(allocation => {
                    const materielName = allocation.materiel?.name || allocation.materiel || 'N/A';
                    const materielType = allocation.materiel?.type || 'N/A';
                    const startDate = allocation.allocationDate ? new Date(allocation.allocationDate).toLocaleDateString('fr-FR') : 'N/A';
                    const endDate = allocation.expectedReturnDate ? new Date(allocation.expectedReturnDate).toLocaleDateString('fr-FR') : 'N/A';
                    const status = allocation.status || 'pending';
                    const statusClass = status.toLowerCase().replace('_', '-');
                    
                    return `
                        <div class="table-row">
                            <div class="table-cell">
                                <div class="materiel-info">
                                    <strong>${materielName}</strong>
                                    ${allocation.materiel?.serialNumber ? `<br><small>SN: ${allocation.materiel.serialNumber}</small>` : ''}
                                </div>
                            </div>
                            <div class="table-cell">${materielType}</div>
                            <div class="table-cell">${startDate}</div>
                            <div class="table-cell">${endDate}</div>
                            <div class="table-cell">
                                <span class="badge badge-${statusClass}">${getStatusText(status)}</span>
                            </div>
                            <div class="table-cell">
                                <div class="actions">
                                    <button class="btn-edit" onclick="viewAllocationDetails('${allocation._id}')" title="Voir les détails">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    ${status === 'pending' ? `
                                        <button class="btn-delete" onclick="cancelAllocation('${allocation._id}')" title="Annuler">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    ` : ''}
                                    ${status === 'active' ? `
                                        <button class="btn-secondary" onclick="requestReturn('${allocation._id}')" title="Demander le retour">
                                            <i class="fas fa-undo"></i>
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

// Helper function to get status text in French
function getStatusText(status) {
    const statusMap = {
        'pending': 'En attente',
        'approved': 'Approuvée',
        'active': 'Active',
        'returned': 'Retournée',
        'cancelled': 'Annulée',
        'rejected': 'Rejetée'
    };
    return statusMap[status] || status;
}

// Load maintenance
async function loadMaintenance() {
    const container = document.getElementById('listeMaintenance');
    if (!container) return;
    
    container.innerHTML = '<div class="loading-spinner">Chargement des signalements...</div>';
    
    try {
        // Get current user ID from multiple sources
        let userId = null;
        
        // First try to get from API
        try {
            const currentUser = await apiService.getCurrentUser();
            userId = currentUser._id || currentUser.id;
            console.log('Got user ID from API for maintenance:', userId);
        } catch (userError) {
            console.warn('Could not get current user from API:', userError);
        }
        
        // Fallback to localStorage
        if (!userId) {
            userId = localStorage.getItem('userId') || localStorage.getItem('user_id');
            console.log('Got user ID from localStorage for maintenance:', userId);
        }
        
        // Last resort: try to get from token
        if (!userId) {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    // Decode JWT token to get user ID
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    userId = payload.id;
                    console.log('Got user ID from token for maintenance:', userId);
                } catch (tokenError) {
                    console.warn('Could not decode token:', tokenError);
                }
            }
        }
        
        if (!userId || userId === 'unknown') {
            throw new Error('User ID not found. Please log in again.');
        }
        
        console.log('Fetching maintenance for user:', userId);
        const maintenanceData = await apiService.getUserMaintenance(userId);
        console.log('Maintenance response:', maintenanceData);
        
        // Handle different response formats
        let maintenance = [];
        if (maintenanceData) {
            if (Array.isArray(maintenanceData)) {
                maintenance = maintenanceData;
            } else if (maintenanceData.maintenance) {
                maintenance = maintenanceData.maintenance;
            } else if (maintenanceData.data) {
                maintenance = maintenanceData.data;
            }
        }
        
        console.log('Processed maintenance:', maintenance);
        renderMaintenance(maintenance);
    } catch (error) {
        console.error('Error loading maintenance:', error);
        showToast('Erreur lors du chargement des signalements: ' + error.message, 'error');
        container.innerHTML = `
            <div class="error-message">
                <p>Erreur de chargement des signalements</p>
                <p class="error-details">${error.message}</p>
                <button class="btn-primary" onclick="loadMaintenance()">
                    <i class="fas fa-refresh"></i> Réessayer
                </button>
            </div>
        `;
    }
}

// Render maintenance
function renderMaintenance(maintenance) {
    const container = document.getElementById('listeMaintenance');
    if (!container) return;
    
    if (!maintenance || maintenance.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-wrench"></i>
                <p>Aucun signalement trouvé</p>
                <p class="no-data-subtitle">Vous n'avez pas encore signalé de problèmes d'équipement</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="data-table">
            <div class="table-header">
                <div class="table-row">
                    <div class="table-cell">Équipement</div>
                    <div class="table-cell">Type</div>
                    <div class="table-cell">Priorité</div>
                    <div class="table-cell">Statut</div>
                    <div class="table-cell">Date</div>
                    <div class="table-cell">Actions</div>
                </div>
            </div>
            <div class="table-body">
                ${maintenance.map(item => {
                    const materielName = item.materiel?.name || item.materiel || 'N/A';
                    const materielType = item.materiel?.type || 'N/A';
                    const priority = item.priority || 'normale';
                    const status = item.status || 'en_attente';
                    const createdDate = item.createdAt ? new Date(item.createdAt).toLocaleDateString('fr-FR') : 'N/A';
                    const priorityClass = priority.toLowerCase().replace('_', '-');
                    const statusClass = status.toLowerCase().replace('_', '-');
                    
                    return `
                        <div class="table-row">
                            <div class="table-cell">
                                <div class="materiel-info">
                                    <strong>${materielName}</strong>
                                    ${item.materiel?.serialNumber ? `<br><small>SN: ${item.materiel.serialNumber}</small>` : ''}
                                </div>
                            </div>
                            <div class="table-cell">${getMaintenanceTypeText(item.type)}</div>
                            <div class="table-cell">
                                <span class="badge badge-${priorityClass}">${getPriorityText(priority)}</span>
                            </div>
                            <div class="table-cell">
                                <span class="badge badge-${statusClass}">${getMaintenanceStatusText(status)}</span>
                            </div>
                            <div class="table-cell">${createdDate}</div>
                            <div class="table-cell">
                                <div class="actions">
                                    <button class="btn-edit" onclick="viewMaintenanceDetails('${item._id}')" title="Voir les détails">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    ${status === 'en_attente' ? `
                                        <button class="btn-delete" onclick="cancelMaintenance('${item._id}')" title="Annuler">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

// Helper function to get maintenance type text in French
function getMaintenanceTypeText(type) {
    const typeMap = {
        'preventive': 'Préventive',
        'corrective': 'Corrective',
        'urgent': 'Urgente',
        'routine': 'Routine'
    };
    return typeMap[type] || type || 'N/A';
}

// Helper function to get priority text in French
function getPriorityText(priority) {
    const priorityMap = {
        'low': 'Faible',
        'normal': 'Normale',
        'high': 'Élevée',
        'urgent': 'Urgente',
        'critique': 'Critique'
    };
    return priorityMap[priority] || priority || 'Normale';
}

// Helper function to get maintenance status text in French
function getMaintenanceStatusText(status) {
    const statusMap = {
        'en_attente': 'En attente',
        'en_cours': 'En cours',
        'terminee': 'Terminée',
        'annulee': 'Annulée',
        'en_attente_pieces': 'En attente de pièces'
    };
    return statusMap[status] || status;
}

// Load reporting
function loadReporting() {
    // Initialize charts if Chart.js is available
    if (typeof Chart !== 'undefined') {
        initializeUserCharts();
    }
}

// Initialize user charts
function initializeUserCharts() {
    // Material Usage Chart
    const materielCtx = document.getElementById('materielChart');
    if (materielCtx) {
        new Chart(materielCtx, {
            type: 'doughnut',
            data: {
                labels: ['Caméra', 'Microphone', 'Ordinateur', 'Écran'],
                datasets: [{
                    data: [30, 25, 20, 15],
                    backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
    
    // Allocation Chart
    const allocationCtx = document.getElementById('allocationChart');
    if (allocationCtx) {
        new Chart(allocationCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
                datasets: [{
                    label: 'Mes allocations',
                    data: [2, 3, 1, 4, 2, 3],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                }
            }
        });
    }
}

// Setup form handlers
function setupFormHandlers() {
    // Material form
    const materielForm = document.getElementById('addMaterielForm');
    if (materielForm) {
        materielForm.addEventListener('submit', handleMaterielSubmit);
    }
    
    // Allocation form
    const allocationForm = document.getElementById('demandeAllocationForm');
    if (allocationForm) {
        allocationForm.addEventListener('submit', handleAllocationSubmit);
    }
    
    // Maintenance form
    const maintenanceForm = document.getElementById('maintenanceForm');
    if (maintenanceForm) {
        maintenanceForm.addEventListener('submit', handleMaintenanceSubmit);
    }
}

// Handle material form submission
function handleMaterielSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    // Map form fields to backend model
    const name = formData.get('nom') || (document.getElementById('nom')?.value || '').trim();
    const type = formData.get('type') || (document.getElementById('type')?.value || '').trim();
    const location = formData.get('localisation') || (document.getElementById('localisation')?.value || '').trim();
    const statusInput = formData.get('etat') || (document.getElementById('etat')?.value || '').trim();
    const description = (document.getElementById('descriptionMateriel')?.value || '').trim();

    const materielPayload = {
        name,
        type,
        location,
        description: description || undefined,
        // Only send status if provided and valid; otherwise server default applies
        ...(statusInput && { status: statusInput })
    };

    // Basic client-side validation for required fields
    if (!name || !type || !location) {
        showToast('Veuillez renseigner Nom, Type et Localisation', 'error');
        return;
    }

    // Disable submit button to prevent double submits
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enregistrement...';

    apiService.createMaterial(materielPayload)
        .then(() => {
            showToast('Matériel enregistré avec succès', 'success');
            e.target.reset();
            loadMateriel();
        })
        .catch((err) => {
            // If user lacks permission (403), guide them to use equipment request instead
            const message = err?.message === 'Access denied. Insufficient permissions.'
                ? "Accès refusé: seul l'administrateur ou le technicien peut ajouter un matériel. Veuillez faire une demande d'équipement."
                : (err?.message || 'Erreur lors de la création du matériel');
            showToast(message, 'error');
        })
        .finally(() => {
            if (submitBtn) submitBtn.innerHTML = originalText;
        });
}

// Handle allocation form submission
function handleAllocationSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const allocation = {
        materielId: formData.get('materielId') || document.getElementById('materielId').value,
        beneficiaire: formData.get('beneficiaire') || document.getElementById('beneficiaire').value,
        dateDebut: formData.get('dateDebut') || document.getElementById('dateDebut').value,
        dateFin: formData.get('dateFin') || document.getElementById('dateFin').value,
        raison: formData.get('raison') || document.getElementById('raison').value
    };
    
    // Simulate API call
    showToast('Demande d\'allocation soumise avec succès !', 'success');
    e.target.reset();
    loadAllocations();
}

// Handle maintenance form submission
function handleMaintenanceSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const maintenance = {
        materielId: formData.get('materielIdMaintenance') || document.getElementById('materielIdMaintenance').value,
        priorite: formData.get('priorite') || document.getElementById('priorite').value,
        description: formData.get('description') || document.getElementById('description').value,
        localisation: formData.get('localisationProbleme') || document.getElementById('localisationProbleme').value,
        contact: formData.get('contact') || document.getElementById('contact').value
    };
    
    // Simulate API call
    showToast('Signalement soumis avec succès !', 'success');
    e.target.reset();
    loadMaintenance();
}

// Update user info
function updateUserInfo() {
    const userName = document.querySelector('.user-name');
    const userRole = document.querySelector('.user-role');
    
    if (userName) userName.textContent = 'Employé Média';
    if (userRole) userRole.textContent = 'Employé Média';
}

// Toggle sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');
    
    if (sidebar) {
        sidebar.classList.toggle('open');
    }
    
    if (mainContent) {
        mainContent.classList.toggle('sidebar-open');
    }
}

// Show toast notification
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    // Show toast
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Hide and remove toast
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => container.removeChild(toast), 300);
    }, 3000);
}

// Action functions
function addMateriel() {
    showToast('Formulaire d\'ajout de matériel ouvert', 'info');
}

function addAllocation() {
    showToast('Formulaire de demande d\'allocation ouvert', 'info');
}

function addMaintenance() {
    showToast('Formulaire de signalement ouvert', 'info');
}

function exportRapport() {
    showToast('Export du rapport en cours...', 'success');
}

function quickAction() {
    showToast('Action rapide sélectionnée', 'info');
}

// Edit functions
function editMateriel(id) {
    showToast(`Modifier matériel ${id}`, 'info');
}

function deleteMateriel(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce matériel ?')) {
        showToast(`Matériel ${id} supprimé`, 'success');
        loadMateriel();
    }
}

function editAllocation(id) {
    showToast(`Modifier allocation ${id}`, 'info');
}

function deleteAllocation(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette allocation ?')) {
        showToast(`Allocation ${id} supprimée`, 'success');
        loadAllocations();
    }
}

// View allocation details
function viewAllocationDetails(allocationId) {
    showToast(`Affichage des détails de l'allocation ${allocationId}`, 'info');
    // TODO: Implement allocation details modal
}

// Cancel allocation
async function cancelAllocation(allocationId) {
    if (confirm('Êtes-vous sûr de vouloir annuler cette allocation ?')) {
        try {
            await apiService.cancelAllocation(allocationId);
            showToast('Allocation annulée avec succès', 'success');
            loadAllocations();
        } catch (error) {
            console.error('Error cancelling allocation:', error);
            showToast('Erreur lors de l\'annulation de l\'allocation', 'error');
        }
    }
}

// Request return
async function requestReturn(allocationId) {
    if (confirm('Voulez-vous demander le retour de cet équipement ?')) {
        try {
            await apiService.returnAllocation(allocationId, {
                returnCondition: 'good',
                returnNotes: 'Demande de retour par l\'utilisateur'
            });
            showToast('Demande de retour envoyée avec succès', 'success');
            loadAllocations();
        } catch (error) {
            console.error('Error requesting return:', error);
            showToast('Erreur lors de la demande de retour', 'error');
        }
    }
}

function editMaintenance(id) {
    showToast(`Modifier maintenance ${id}`, 'info');
}

// View maintenance details
function viewMaintenanceDetails(maintenanceId) {
    showToast(`Affichage des détails du signalement ${maintenanceId}`, 'info');
    // TODO: Implement maintenance details modal
}

// Cancel maintenance
async function cancelMaintenance(maintenanceId) {
    if (confirm('Êtes-vous sûr de vouloir annuler ce signalement ?')) {
        try {
            await apiService.cancelMaintenance(maintenanceId);
            showToast('Signalement annulé avec succès', 'success');
            loadMaintenance();
        } catch (error) {
            console.error('Error cancelling maintenance:', error);
            showToast('Erreur lors de l\'annulation du signalement', 'error');
        }
    }
}

function deleteMaintenance(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette maintenance ?')) {
        showToast(`Maintenance ${id} supprimée`, 'success');
        loadMaintenance();
    }
}

// Logout function
function logout() {
    apiService.logout();
}

// Load initial dashboard data
function loadDashboardData() {
    loadDashboardStats();
}

// Chatbot functionality
let chatbotSession = null;

// Initialize chatbot when chatbot section is shown
function initializeChatbot() {
    if (!chatbotSession) {
        loadChatbotSession();
    }
}

// Load chatbot session
async function loadChatbotSession() {
    try {
        const response = await apiService.getChatbotSession();
        chatbotSession = response.data;
        
        // Load existing messages
        if (chatbotSession.messages && chatbotSession.messages.length > 0) {
            const messagesContainer = document.getElementById('chatbotMessages');
            messagesContainer.innerHTML = '';
            
            chatbotSession.messages.forEach(message => {
                addMessageToChat(message.content, message.role);
            });
        }
    } catch (error) {
        console.error('Error initializing chatbot:', error);
    }
}

// Send chatbot message
async function sendChatbotMessage() {
    const input = document.getElementById('chatbotInput');
    const message = input.value.trim();
    
    if (!message) return;

    // Add user message to chat
    addMessageToChat(message, 'user');
    input.value = '';

    try {
        const response = await apiService.sendChatbotMessage(message, chatbotSession.sessionId);
        addMessageToChat(response.data.response, 'assistant');
    } catch (error) {
        console.error('Error sending message:', error);
        addMessageToChat('Désolé, une erreur s\'est produite. Veuillez réessayer.', 'assistant');
    }
}

// Add message to chat
function addMessageToChat(content, role) {
    const messagesContainer = document.getElementById('chatbotMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}-message`;
    
    messageDiv.innerHTML = `
        <div class="message-content">
            <p>${content}</p>
        </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Update showSection function to initialize chatbot
const originalShowSection = showSection;
showSection = function(sectionName) {
    originalShowSection(sectionName);
    
    // Initialize chatbot when chatbot section is shown
    if (sectionName === 'chatbot') {
        initializeChatbot();
    }
};

// Add enter key support for chatbot input
document.addEventListener('DOMContentLoaded', function() {
    const chatbotInput = document.getElementById('chatbotInput');
    if (chatbotInput) {
        chatbotInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendChatbotMessage();
            }
        });
    }
});
