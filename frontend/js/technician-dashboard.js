// Technician Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initializeTechnicianDashboard();
    setupNavigation();
    setupFormHandlers();
    loadInitialData();
});

// Initialize the technician dashboard
function initializeTechnicianDashboard() {
    // Check authentication
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (!token || role !== 'technicien') {
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

// Show section and hide others
function showSection(sectionName) {
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => section.classList.remove('active'));
    
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    updatePageTitle(sectionName);
    loadSectionData(sectionName);
}

// Update page title
function updatePageTitle(sectionName) {
    const titles = {
        'dashboard': 'Tableau de bord',
        'maintenance': 'Maintenance en cours',
        'repairs': 'Gestion des réparations',
        'inventory': 'Inventaire technique',
        'schedule': 'Planning des interventions',
        'reports': 'Rapports techniques',
        'parts': 'Gestion des pièces détachées',
        'irreparable': 'Équipement irréparable'
    };
    
    const pageTitle = document.querySelector('.page-title');
    if (pageTitle && titles[sectionName]) {
        pageTitle.textContent = titles[sectionName];
    }
}

// Load section data
function loadSectionData(sectionName) {
    switch(sectionName) {
        case 'dashboard': loadDashboardStats(); break;
        case 'maintenance': loadMaintenance(); break;
        case 'repairs': loadRepairs(); break;
        case 'inventory': loadInventory(); break;
        case 'schedule': loadSchedule(); break;
        case 'reports': loadReports(); break;
        case 'parts': loadParts(); break;
        case 'irreparable': loadIrreparableEquipment(); break;
    }
}

// Load initial data
function loadInitialData() {
    loadDashboardStats();
}

// Load dashboard statistics
async function loadDashboardStats() {
    try {
        const dashboardData = await apiService.getTechnicianDashboard();
        
        // Update stat cards
        const stats = {
            maintenance: dashboardData.overview.total,
            repairs: dashboardData.overview.completed,
            time: dashboardData.metrics.completionTime.avgTime || 0,
            emergencies: dashboardData.urgent.length
        };
        
        updateStatCards(stats);
        loadRecentMaintenance(dashboardData.recent);
        updateTechnicalSummary(dashboardData.overview);
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        showToast('Erreur lors du chargement des statistiques', 'error');
    }
}

// Update stat cards
function updateStatCards(stats) {
    const statNumbers = document.querySelectorAll('.stat-number');
    if (statNumbers.length >= 4) {
        statNumbers[0].textContent = stats.maintenance;
        statNumbers[1].textContent = stats.repairs;
        statNumbers[2].textContent = stats.time;
        statNumbers[3].textContent = stats.emergencies;
    }
}

// Load recent maintenance
function loadRecentMaintenance() {
    const recentMaintenance = [
        {
            icon: 'fas fa-exclamation-triangle',
            title: 'PC Portable Dell - Écran cassé',
            priority: 'Urgente',
            time: 'Il y a 1 heure',
            status: 'En attente',
            urgent: true
        },
        {
            icon: 'fas fa-tools',
            title: 'Caméra Sony - Objectif défectueux',
            priority: 'Normale',
            time: 'Il y a 3 heures',
            status: 'En cours',
            urgent: false
        },
        {
            icon: 'fas fa-check-circle',
            title: 'Microphone Shure - Câble remplacé',
            priority: 'Basse',
            time: 'Il y a 6 heures',
            status: 'Terminé',
            urgent: false
        }
    ];
    
    updateRecentMaintenance(recentMaintenance);
}

// Update recent maintenance display
function updateRecentMaintenance(maintenanceItems) {
    const container = document.querySelector('.recent-maintenance');
    if (!container) return;
    
    container.innerHTML = maintenanceItems.map(item => `
        <div class="maintenance-item ${item.urgent ? 'urgent' : ''}">
            <div class="maintenance-icon">
                <i class="${item.icon}"></i>
            </div>
            <div class="maintenance-content">
                <div class="maintenance-title">${item.title}</div>
                <div class="maintenance-details">
                    <span class="maintenance-priority">${item.priority}</span>
                    <span class="maintenance-time">${item.time}</span>
                </div>
            </div>
            <div class="maintenance-status">
                <span class="badge badge-${getStatusClass(item.status)}">${item.status}</span>
            </div>
        </div>
    `).join('');
}

// Get status class for badges
function getStatusClass(status) {
    switch(status) {
        case 'en_attente': return 'urgent';
        case 'en_cours': return 'en-cours';
        case 'terminee': return 'terminé';
        default: return 'normale';
    }
}

// Update technical summary
function updateTechnicalSummary() {
    const summaryData = {
        efficiency: 94,
        partsUsed: 18,
        interventions: 32
    };
    
    const summaryNumbers = document.querySelectorAll('.summary-number');
    if (summaryNumbers.length >= 3) {
        summaryNumbers[0].textContent = summaryData.efficiency + '%';
        summaryNumbers[1].textContent = summaryData.partsUsed;
        summaryNumbers[2].textContent = summaryData.interventions;
    }
}

// Load maintenance data
async function loadMaintenance() {
    const container = document.getElementById('maintenanceList');
    if (!container) return;
    
    container.innerHTML = '<div class="loading-spinner">Chargement de la maintenance...</div>';
    
    try {
        const currentUser = await apiService.getCurrentUser();
        const maintenanceData = await apiService.getTechnicianMaintenance(currentUser._id, { status: 'en_attente' });
        renderMaintenance(maintenanceData.maintenance);
    } catch (error) {
        console.error('Error loading maintenance:', error);
        showToast('Erreur lors du chargement de la maintenance', 'error');
        container.innerHTML = '<p class="error-message">Erreur de chargement</p>';
    }
}

// Render maintenance list
function renderMaintenance(maintenance) {
    const container = document.getElementById('maintenanceList');
    if (!container) return;
    
    container.innerHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Matériel</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Date</th>
                    <th>Statut</th>
                    <th>Technicien</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${maintenance.map(item => `
                    <tr>
                        <td>${item._id}</td>
                        <td>${item.materiel?.name || ''}</td>
                        <td><span class="badge badge-${(item.type||'').toLowerCase()}">${item.type || ''}</span></td>
                        <td>${item.description || ''}</td>
                        <td>${new Date(item.startDate || item.createdAt).toLocaleString()}</td>
                        <td><span class="badge badge-${getStatusClass(item.status)}">${item.status}</span></td>
                        <td>${item.technician?.name || ''}</td>
                        <td class="actions">
                            <button class="btn-secondary" onclick="confirmReceipt('${item._id}')">
                                <i class="fas fa-check"></i> Confirmer réception
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Confirm receipt: start pending maintenance
async function confirmReceipt(maintenanceId) {
    try {
        await apiService.startMaintenance(maintenanceId);
        showToast('Maintenance en cours. Réception confirmée.', 'success');
        loadMaintenance();
    } catch (error) {
        showToast(error.message || 'Erreur de confirmation', 'error');
    }
}

// Load repairs data
function loadRepairs() {
    const container = document.getElementById('repairsHistory');
    if (!container) return;
    
    // Simulate API call
    setTimeout(() => {
        const repairs = [
            { id: 1, materiel: 'PC Portable Dell', technique: 'Remplacement', pieces: 'Écran LCD', cout: 78000, temps: 2.5, date: '2024-01-10' },
            { id: 2, materiel: 'Caméra Sony HD', technique: 'Nettoyage', pieces: 'Aucune', cout: 0, temps: 1.0, date: '2024-01-08' },
            { id: 3, materiel: 'Microphone Shure', technique: 'Réparation', pieces: 'Câble XLR', cout: 16575, temps: 1.5, date: '2024-01-05' }
        ];
        
        renderRepairs(repairs);
    }, 500);
}

// Render repairs list
function renderRepairs(repairs) {
    const container = document.getElementById('repairsHistory');
    if (!container) return;
    
    container.innerHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Matériel</th>
                    <th>Technique</th>
                    <th>Pièces utilisées</th>
                    <th>Coût (FCFA)</th>
                    <th>Temps (h)</th>
                    <th>Date</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${repairs.map(item => `
                    <tr>
                        <td>${item.id}</td>
                        <td>${item.materiel}</td>
                        <td>${item.technique}</td>
                        <td>${item.pieces}</td>
                        <td>${item.cout.toLocaleString('fr-FR')}</td>
                        <td>${item.temps}</td>
                        <td>${item.date}</td>
                        <td class="actions">
                            <button class="btn-edit" onclick="editRepair(${item.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-delete" onclick="deleteRepair(${item.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Load inventory data
function loadInventory() {
    const container = document.getElementById('partsList');
    if (!container) return;
    
    // Simulate API call
    setTimeout(() => {
        const parts = [
            { id: 1, nom: 'Écran LCD 15.6"', categorie: 'Écrans', quantite: 5, seuil: 2, prix: 58495 },
            { id: 2, nom: 'Clavier USB', categorie: 'Claviers', quantite: 8, seuil: 3, prix: 16575 },
            { id: 3, nom: 'Batterie Li-ion', categorie: 'Batteries', quantite: 1, seuil: 2, prix: 29250 },
            { id: 4, nom: 'Câble HDMI 2m', categorie: 'Câbles', quantite: 12, seuil: 5, prix: 5844 }
        ];
        
        renderParts(parts);
    }, 500);
}

// Render parts list
function renderParts(parts) {
    const container = document.getElementById('partsList');
    if (!container) return;
    
    container.innerHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Nom</th>
                    <th>Catégorie</th>
                    <th>Quantité</th>
                    <th>Seuil</th>
                    <th>Prix (FCFA)</th>
                    <th>Statut</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${parts.map(item => `
                    <tr>
                        <td>${item.id}</td>
                        <td>${item.nom}</td>
                        <td>${item.categorie}</td>
                        <td>${item.quantite}</td>
                        <td>${item.seuil}</td>
                        <td>${item.prix.toLocaleString('fr-FR')}</td>
                        <td>
                            <span class="badge badge-${item.quantite <= item.seuil ? 'urgent' : 'normale'}">
                                ${item.quantite <= item.seuil ? 'Stock faible' : 'Disponible'}
                            </span>
                        </td>
                        <td class="actions">
                            <button class="btn-edit" onclick="editPart(${item.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-delete" onclick="deletePart(${item.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Load schedule data
function loadSchedule() {
    const container = document.getElementById('scheduleCalendar');
    if (!container) return;
    
    // Simulate API call
    setTimeout(() => {
        const schedule = [
            { id: 1, materiel: 'PC Portable Dell', type: 'Maintenance', date: '2024-01-16 09:00', duree: '2 heures', notes: 'Maintenance préventive mensuelle' },
            { id: 2, materiel: 'Caméra Sony HD', type: 'Vérification', date: '2024-01-17 14:00', duree: '1 heure', notes: 'Vérification qualité image' },
            { id: 3, materiel: 'Microphone Shure', type: 'Installation', date: '2024-01-18 10:00', duree: '1 heure', notes: 'Installation nouveau microphone' }
        ];
        
        renderSchedule(schedule);
    }, 500);
}

// Render schedule
function renderSchedule(schedule) {
    const container = document.getElementById('scheduleCalendar');
    if (!container) return;
    
    container.innerHTML = `
        <div class="schedule-list">
            ${schedule.map(item => `
                <div class="schedule-item">
                    <div class="schedule-header">
                        <h4>${item.materiel}</h4>
                        <span class="schedule-type">${item.type}</span>
                    </div>
                    <div class="schedule-details">
                        <p><i class="fas fa-calendar"></i> ${item.date}</p>
                        <p><i class="fas fa-clock"></i> ${item.duree}</p>
                        <p><i class="fas fa-sticky-note"></i> ${item.notes}</p>
                    </div>
                    <div class="schedule-actions">
                        <button class="btn-edit" onclick="editSchedule(${item.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-delete" onclick="deleteSchedule(${item.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Load reports data
function loadReports() {
    // Initialize charts
    initializeCharts();
}

// Initialize charts
function initializeCharts() {
    // Maintenance by type chart
    const maintenanceCtx = document.getElementById('maintenanceChart');
    if (maintenanceCtx) {
        new Chart(maintenanceCtx, {
            type: 'doughnut',
            data: {
                labels: ['Préventive', 'Corrective', 'Urgente'],
                datasets: [{
                    data: [65, 25, 10],
                    backgroundColor: ['#10b981', '#3b82f6', '#ef4444']
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
    
    // Repair time chart
    const repairTimeCtx = document.getElementById('repairTimeChart');
    if (repairTimeCtx) {
        new Chart(repairTimeCtx, {
            type: 'line',
            data: {
                labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
                datasets: [{
                    label: 'Temps moyen (heures)',
                    data: [2.5, 3.1, 2.8, 4.2, 3.5, 2.0, 1.5],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
}

// Load parts data
function loadParts() {
    const container = document.getElementById('partsDetailList');
    if (!container) return;
    
    // Simulate API call
    setTimeout(() => {
        const parts = [
            { id: 1, nom: 'Écran LCD 15.6"', categorie: 'Écrans', quantite: 5, seuil: 2, prix: 58495, valeur: 292475 },
            { id: 2, nom: 'Clavier USB', categorie: 'Claviers', quantite: 8, seuil: 3, prix: 16575, valeur: 132600 },
            { id: 3, nom: 'Batterie Li-ion', categorie: 'Batteries', quantite: 1, seuil: 2, prix: 29250, valeur: 29250 },
            { id: 4, nom: 'Câble HDMI 2m', categorie: 'Câbles', quantite: 12, seuil: 5, prix: 5844, valeur: 70128 }
        ];
        
        renderPartsDetail(parts);
    }, 500);
}

// Render parts detail
function renderPartsDetail(parts) {
    const container = document.getElementById('partsDetailList');
    if (!container) return;
    
    container.innerHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Nom</th>
                    <th>Catégorie</th>
                    <th>Quantité</th>
                    <th>Seuil</th>
                    <th>Prix unitaire (FCFA)</th>
                    <th>Valeur totale (FCFA)</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${parts.map(item => `
                    <tr>
                        <td>${item.id}</td>
                        <td>${item.nom}</td>
                        <td>${item.categorie}</td>
                        <td>${item.quantite}</td>
                        <td>${item.seuil}</td>
                        <td>${item.prix.toLocaleString('fr-FR')}</td>
                        <td>${item.valeur.toLocaleString('fr-FR')}</td>
                        <td class="actions">
                            <button class="btn-edit" onclick="editPart(${item.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-delete" onclick="deletePart(${item.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Setup form handlers
function setupFormHandlers() {
    const maintenanceForm = document.getElementById('maintenanceForm');
    if (maintenanceForm) {
        maintenanceForm.addEventListener('submit', handleMaintenanceSubmit);
    }
    
    const repairForm = document.getElementById('repairForm');
    if (repairForm) {
        repairForm.addEventListener('submit', handleRepairSubmit);
    }
    
    const partsForm = document.getElementById('partsForm');
    if (partsForm) {
        partsForm.addEventListener('submit', handlePartsSubmit);
    }
    
    const scheduleForm = document.getElementById('scheduleForm');
    if (scheduleForm) {
        scheduleForm.addEventListener('submit', handleScheduleSubmit);
    }
    
    const irreparableForm = document.getElementById('irreparableEquipmentForm');
    if (irreparableForm) {
        irreparableForm.addEventListener('submit', handleIrreparableSubmit);
    }
}

// Handle maintenance form submission
function handleMaintenanceSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const maintenanceData = {
        materiel: formData.get('materielId'),
        type: formData.get('typeMaintenance'),
        description: formData.get('descriptionMaintenance'),
        dateDebut: formData.get('dateDebut'),
        duree: formData.get('dureeEstimee')
    };
    
    // Simulate API call
    showToast('Maintenance démarrée avec succès !', 'success');
    e.target.reset();
    loadMaintenance();
}

// Handle repair form submission
function handleRepairSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const repairData = {
        materiel: formData.get('materielRepair'),
        technique: formData.get('techniqueUtilisee'),
        pieces: formData.get('piecesUtilisees'),
        cout: formData.get('coutReparation'),
        temps: formData.get('tempsReparation')
    };
    
    // Simulate API call
    showToast('Réparation enregistrée avec succès !', 'success');
    e.target.reset();
    loadRepairs();
}

// Handle parts form submission
function handlePartsSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const partData = {
        nom: formData.get('nomPiece'),
        categorie: formData.get('categoriePiece'),
        quantite: formData.get('quantitePiece'),
        seuil: formData.get('seuilAlerte')
    };
    
    // Simulate API call
    showToast('Pièce ajoutée avec succès !', 'success');
    e.target.reset();
    loadInventory();
}

// Handle schedule form submission
function handleScheduleSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const scheduleData = {
        materiel: formData.get('materielSchedule'),
        type: formData.get('typeIntervention'),
        date: formData.get('dateIntervention'),
        duree: formData.get('dureeIntervention'),
        notes: formData.get('notesIntervention')
    };
    
    // Simulate API call
    showToast('Intervention planifiée avec succès !', 'success');
    e.target.reset();
    loadSchedule();
}

// Update user info
function updateUserInfo() {
    const userName = document.querySelector('.user-name');
    const userRole = document.querySelector('.user-role');
    
    if (userName) userName.textContent = 'Technicien';
    if (userRole) userRole.textContent = 'Maintenance';
}

// Toggle sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('sidebar-hidden');
}

// Show toast notification
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Action functions
function addMaintenance() {
    showSection('maintenance');
}

function addRepair() {
    showSection('repairs');
}

function addPart() {
    showSection('inventory');
}

function addSchedule() {
    showSection('schedule');
}

// Edit functions
function editMaintenance(id) {
    showToast(`Modification de la maintenance ${id}`, 'info');
}

function editRepair(id) {
    showToast(`Modification de la réparation ${id}`, 'info');
}

function editPart(id) {
    showToast(`Modification de la pièce ${id}`, 'info');
}

function editSchedule(id) {
    showToast(`Modification de l'intervention ${id}`, 'info');
}

// Delete functions
function deleteMaintenance(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette maintenance ?')) {
        showToast('Maintenance supprimée', 'success');
        loadMaintenance();
    }
}

function deleteRepair(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette réparation ?')) {
        showToast('Réparation supprimée', 'success');
        loadRepairs();
    }
}

function deletePart(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette pièce ?')) {
        showToast('Pièce supprimée', 'success');
        loadInventory();
    }
}

function deleteSchedule(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette intervention ?')) {
        showToast('Intervention supprimée', 'success');
        loadSchedule();
    }
}

// Export report
function exportReport() {
    showToast('Rapport exporté avec succès !', 'success');
}

// Quick action
function quickAction() {
    showToast('Action rapide activée !', 'info');
}

// Logout
function logout() {
    apiService.logout();
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

// Irreparable Equipment Functions
async function loadIrreparableEquipment() {
    const container = document.getElementById('irreparableList');
    if (!container) return;
    
    container.innerHTML = '<div class="loading-spinner">Chargement des équipements irréparables...</div>';
    
    try {
        // Load irreparable materials
        const materialsResponse = await apiService.getMaterials({ status: 'irreparable' });
        const materials = materialsResponse.data || materialsResponse.materiels || [];
        
        renderIrreparableEquipment(materials);
        
        // Load available materials for the form dropdown
        await loadAvailableMaterialsForIrreparable();
    } catch (error) {
        console.error('Error loading irreparable equipment:', error);
        showToast('Erreur lors du chargement des équipements irréparables', 'error');
        container.innerHTML = '<p class="error-message">Erreur de chargement</p>';
    }
}

function renderIrreparableEquipment(materials) {
    const container = document.getElementById('irreparableList');
    if (!container) return;
    
    if (materials.length === 0) {
        container.innerHTML = '<p class="no-data">Aucun équipement marqué comme irréparable</p>';
        return;
    }
    
    container.innerHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Nom</th>
                    <th>Type</th>
                    <th>Numéro de série</th>
                    <th>Raison</th>
                    <th>Date signalé</th>
                    <th>Signalé par</th>
                    <th>Méthode de disposition</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${materials.map(item => `
                    <tr>
                        <td>${item.name || ''}</td>
                        <td>${item.type || ''}</td>
                        <td>${item.serialNumber || 'N/A'}</td>
                        <td>${item.irreparableReason || ''}</td>
                        <td>${item.irreparableDate ? new Date(item.irreparableDate).toLocaleDateString() : ''}</td>
                        <td>${item.reportedBy?.name || ''}</td>
                        <td>${item.disposalMethod || 'Non spécifié'}</td>
                        <td class="actions">
                            <button class="btn-info" onclick="viewIrreparableDetails('${item._id}')">
                                <i class="fas fa-eye"></i> Détails
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

async function loadAvailableMaterialsForIrreparable() {
    try {
        // Load materials that are not already irreparable
        const materialsResponse = await apiService.getMaterials({ 
            status: { $ne: 'irreparable' } 
        });
        const materials = materialsResponse.data || materialsResponse.materiels || [];
        
        const select = document.getElementById('materielIrreparable');
        if (select) {
            select.innerHTML = '<option value="">Sélectionner un équipement</option>' +
                materials.map(material => 
                    `<option value="${material._id}">${material.name} - ${material.type} (${material.serialNumber || 'N/A'})</option>`
                ).join('');
        }
    } catch (error) {
        console.error('Error loading materials for irreparable form:', error);
    }
}

function showIrreparableForm() {
    const form = document.getElementById('irreparableForm');
    if (form) {
        form.style.display = 'block';
        loadAvailableMaterialsForIrreparable();
    }
}

function hideIrreparableForm() {
    const form = document.getElementById('irreparableForm');
    if (form) {
        form.style.display = 'none';
        form.reset();
    }
}

async function handleIrreparableSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const materialId = formData.get('materielIrreparable');
    const reason = formData.get('irreparableReason');
    const disposalMethod = formData.get('disposalMethod');
    
    if (!materialId || !reason) {
        showToast('Veuillez sélectionner un équipement et fournir une raison', 'error');
        return;
    }
    
    try {
        await apiService.markMaterialIrreparable(materialId, reason, disposalMethod);
        showToast('Équipement marqué comme irréparable avec succès', 'success');
        e.target.reset();
        hideIrreparableForm();
        loadIrreparableEquipment();
    } catch (error) {
        console.error('Error marking material as irreparable:', error);
        showToast(error.message || 'Erreur lors du marquage de l\'équipement', 'error');
    }
}

function viewIrreparableDetails(materialId) {
    showToast(`Affichage des détails pour l'équipement ${materialId}`, 'info');
    // TODO: Implement detailed view modal
}
