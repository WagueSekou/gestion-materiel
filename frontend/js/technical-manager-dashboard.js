// Technical Manager Dashboard JavaScript
let currentUser = null;
let chatbotSession = null;
let charts = {};

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    setupEventListeners();
});

function initializeDashboard() {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Get user info
    currentUser = JSON.parse(localStorage.getItem('user'));
    if (!currentUser || currentUser.role !== 'technical_manager') {
        window.location.href = 'login.html';
        return;
    }

    // Display user info
    document.getElementById('userInfo').textContent = `Bonjour, ${currentUser.name}`;

    // Load dashboard data
    try {
        loadDashboardData();
        loadEquipmentManagement();
        loadStatistics();
        loadAllocationTracking();
        loadServiceScheduling();
        loadEquipmentRequests();
        loadFaultReports();
        initializeChatbot();
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        showToast('Erreur lors de l\'initialisation du tableau de bord', 'error');
    }
}

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.sidebar-menu a[data-section]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            showSection(section);
        });
    });

    // Chatbot input
    const chatbotInput = document.getElementById('chatbotInput');
    if (chatbotInput) {
        chatbotInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendChatbotMessage();
            }
        });
    }
}

function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });

    // Show selected section
    document.getElementById(sectionName).classList.add('active');

    // Update active nav item
    document.querySelectorAll('.sidebar-menu a').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

    // Load section-specific data
    if (sectionName === 'statistics') {
        loadCharts();
    }
}

// Dashboard Data Loading
async function loadDashboardData() {
    try {
        // Load equipment data
        const equipmentResponse = await apiService.getMaterials();
        const equipment = equipmentResponse.data || equipmentResponse.materiels || equipmentResponse || [];

        // Load equipment requests
        let requests = [];
        try {
            const requestsResponse = await apiService.getAllEquipmentRequests();
            requests = requestsResponse.data || requestsResponse.requests || requestsResponse || [];
        } catch (error) {
            console.warn('Could not load equipment requests:', error);
        }

        // Load fault reports
        let faultReports = [];
        try {
            const faultReportsResponse = await apiService.getAllFaultReports();
            faultReports = faultReportsResponse.data || faultReportsResponse.reports || faultReportsResponse || [];
        } catch (error) {
            console.warn('Could not load fault reports:', error);
        }

        // Update statistics
        const totalEquipmentEl = document.getElementById('totalEquipment');
        const availableEquipmentEl = document.getElementById('availableEquipment');
        const maintenanceEquipmentEl = document.getElementById('maintenanceEquipment');
        const pendingRequestsEl = document.getElementById('pendingRequests');
        
        if (totalEquipmentEl) totalEquipmentEl.textContent = equipment.length;
        if (availableEquipmentEl) availableEquipmentEl.textContent = 
            equipment.filter(e => e.status === 'disponible').length;
        if (maintenanceEquipmentEl) maintenanceEquipmentEl.textContent = 
            equipment.filter(e => e.status === 'maintenance').length;
        if (pendingRequestsEl) pendingRequestsEl.textContent = 
            requests.filter(r => r.status === 'pending').length;

        // Load recent data
        try {
            loadRecentRequests(requests.slice(0, 5));
            loadRecentFaults(faultReports.slice(0, 5));
        } catch (error) {
            console.error('Error loading recent data:', error);
        }

    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showToast('Erreur lors du chargement des données', 'error');
    }
}

function loadRecentRequests(requests) {
    const container = document.getElementById('recentRequests');
    if (!container) {
        console.error('Container recentRequests not found');
        return;
    }
    
    if (!requests || requests.length === 0) {
        container.innerHTML = '<p class="no-data">Aucune demande récente</p>';
        return;
    }

    container.innerHTML = requests.map(request => `
        <div class="request-item">
            <div class="request-info">
                <h4>${request.equipmentType}</h4>
                <p>Par: ${request.requester?.name || request.requestedBy?.name || 'Utilisateur inconnu'}</p>
            </div>
            <div class="request-status">
                <span class="status-badge status-${request.status}">${getStatusText(request.status)}</span>
            </div>
        </div>
    `).join('');
}

function loadRecentFaults(faults) {
    const container = document.getElementById('recentFaults');
    if (!container) {
        console.error('Container recentFaults not found');
        return;
    }
    
    if (!faults || faults.length === 0) {
        container.innerHTML = '<p class="no-data">Aucune panne récente</p>';
        return;
    }

    container.innerHTML = faults.map(fault => `
        <div class="fault-item">
            <div class="fault-info">
                <h4>${fault.materiel?.name || fault.equipment?.name || 'Équipement inconnu'}</h4>
                <p>${fault.description}</p>
            </div>
            <div class="fault-status">
                <span class="severity-badge severity-${fault.severity}">${getSeverityText(fault.severity)}</span>
            </div>
        </div>
    `).join('');
}

// Equipment Management
async function loadEquipmentManagement() {
    try {
        const response = await apiService.getMaterials();
        const equipment = response.data || response.materiels || response || [];
        renderEquipmentManagement(equipment);
    } catch (error) {
        console.error('Error loading equipment:', error);
        showToast('Erreur lors du chargement des équipements', 'error');
    }
}

function renderEquipmentManagement(equipment) {
    const tbody = document.getElementById('equipmentTableBody');
    if (equipment.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="no-data">Aucun équipement trouvé</td></tr>';
        return;
    }

    tbody.innerHTML = equipment.map(item => `
        <tr>
            <td>${item.name}</td>
            <td>${item.type}</td>
            <td>${item.serialNumber || 'N/A'}</td>
            <td><span class="status-badge status-${item.status}">${getStatusText(item.status)}</span></td>
            <td>${item.location}</td>
            <td>${item.assignedTo ? item.assignedTo.name : 'Non assigné'}</td>
            <td>
                <button class="btn btn-sm btn-info" onclick="viewEquipmentDetails('${item._id}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-warning" onclick="editEquipment('${item._id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteEquipment('${item._id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function openCreateEquipmentModal() {
    document.getElementById('createEquipmentModal').style.display = 'block';
}

async function submitCreateEquipment() {
    try {
        const formData = {
            name: document.getElementById('equipmentName').value,
            type: document.getElementById('equipmentType').value,
            serialNumber: document.getElementById('equipmentSerialNumber').value,
            location: document.getElementById('equipmentLocation').value,
            description: document.getElementById('equipmentDescription').value
        };

        // Validate form
        if (!formData.name || !formData.type || !formData.location) {
            showToast('Veuillez remplir tous les champs obligatoires', 'error');
            return;
        }

        const response = await apiService.createMaterial(formData);
        showToast('Équipement créé avec succès', 'success');
        closeModal('createEquipmentModal');
        document.getElementById('createEquipmentForm').reset();
        loadEquipmentManagement();
        loadDashboardData();
    } catch (error) {
        console.error('Error creating equipment:', error);
        showToast('Erreur lors de la création de l\'équipement', 'error');
    }
}

// Statistics and Charts
async function loadStatistics() {
    try {
        const response = await apiService.getMaterials();
        const equipment = response.data || response.materiels || response || [];
        
        // Prepare data for charts
        const statusData = getEquipmentStatusData(equipment);
        const typeData = getEquipmentTypeData(equipment);
        
        // Store data for charts
        window.equipmentData = {
            status: statusData,
            type: typeData
        };
        
    } catch (error) {
        console.error('Error loading statistics:', error);
        showToast('Erreur lors du chargement des statistiques', 'error');
    }
}

function loadCharts() {
    if (!window.equipmentData) return;

    // Equipment Status Chart
    const statusCtx = document.getElementById('equipmentStatusChart').getContext('2d');
    if (charts.equipmentStatus) charts.equipmentStatus.destroy();
    
    charts.equipmentStatus = new Chart(statusCtx, {
        type: 'doughnut',
        data: {
            labels: window.equipmentData.status.labels,
            datasets: [{
                data: window.equipmentData.status.data,
                backgroundColor: ['#28a745', '#ffc107', '#dc3545', '#6c757d']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Statut des Équipements'
                }
            }
        }
    });

    // Equipment Type Chart
    const typeCtx = document.getElementById('equipmentTypeChart').getContext('2d');
    if (charts.equipmentType) charts.equipmentType.destroy();
    
    charts.equipmentType = new Chart(typeCtx, {
        type: 'bar',
        data: {
            labels: window.equipmentData.type.labels,
            datasets: [{
                label: 'Nombre d\'équipements',
                data: window.equipmentData.type.data,
                backgroundColor: '#007bff'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Types d\'Équipements'
                }
            }
        }
    });

    // Maintenance Chart (placeholder)
    const maintenanceCtx = document.getElementById('maintenanceChart').getContext('2d');
    if (charts.maintenance) charts.maintenance.destroy();
    
    charts.maintenance = new Chart(maintenanceCtx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
            datasets: [{
                label: 'Maintenances',
                data: [12, 19, 3, 5, 2, 3],
                borderColor: '#dc3545',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Maintenances par Mois'
                }
            }
        }
    });

    // Allocation Chart (placeholder)
    const allocationCtx = document.getElementById('allocationChart').getContext('2d');
    if (charts.allocation) charts.allocation.destroy();
    
    charts.allocation = new Chart(allocationCtx, {
        type: 'pie',
        data: {
            labels: ['Assignés', 'Disponibles'],
            datasets: [{
                data: [window.equipmentData.status.data[1], window.equipmentData.status.data[0]],
                backgroundColor: ['#007bff', '#28a745']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Allocation des Équipements'
                }
            }
        }
    });
}

function getEquipmentStatusData(equipment) {
    const statusCount = {
        'disponible': 0,
        'affecté': 0,
        'maintenance': 0,
        'hors_service': 0
    };

    equipment.forEach(item => {
        statusCount[item.status] = (statusCount[item.status] || 0) + 1;
    });

    return {
        labels: ['Disponible', 'Affecté', 'Maintenance', 'Hors Service'],
        data: [statusCount.disponible, statusCount.affecté, statusCount.maintenance, statusCount.hors_service]
    };
}

function getEquipmentTypeData(equipment) {
    const typeCount = {};
    equipment.forEach(item => {
        typeCount[item.type] = (typeCount[item.type] || 0) + 1;
    });

    return {
        labels: Object.keys(typeCount),
        data: Object.values(typeCount)
    };
}

// Export Reports
async function exportReport(format) {
    try {
        if (format === 'pdf') {
            await exportToPDF();
        } else if (format === 'excel') {
            showToast('Export Excel en cours de développement', 'info');
        }
    } catch (error) {
        console.error('Error exporting report:', error);
        showToast('Erreur lors de l\'export', 'error');
    }
}

async function exportToPDF() {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Add title
        doc.setFontSize(20);
        doc.text('Rapport de Gestion des Équipements', 20, 20);
        
        // Add date
        doc.setFontSize(12);
        doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 20, 30);
        
        // Add statistics
        doc.setFontSize(16);
        doc.text('Statistiques', 20, 50);
        
        doc.setFontSize(12);
        doc.text(`Total des équipements: ${document.getElementById('totalEquipment').textContent}`, 20, 65);
        doc.text(`Équipements disponibles: ${document.getElementById('availableEquipment').textContent}`, 20, 75);
        doc.text(`Équipements en maintenance: ${document.getElementById('maintenanceEquipment').textContent}`, 20, 85);
        doc.text(`Demandes en attente: ${document.getElementById('pendingRequests').textContent}`, 20, 95);
        
        // Save the PDF
        doc.save('rapport-equipements.pdf');
        showToast('Rapport PDF généré avec succès', 'success');
    } catch (error) {
        console.error('Error generating PDF:', error);
        showToast('Erreur lors de la génération du PDF', 'error');
    }
}

// Allocation Tracking
async function loadAllocationTracking() {
    try {
        const response = await apiService.getMaterials();
        const equipment = response.data || response.materiels || response || [];
        const allocatedEquipment = equipment.filter(e => e.assignedTo);
        renderAllocationTracking(allocatedEquipment);
    } catch (error) {
        console.error('Error loading allocation tracking:', error);
        showToast('Erreur lors du chargement du suivi des allocations', 'error');
    }
}

function renderAllocationTracking(allocations) {
    const tbody = document.getElementById('allocationTableBody');
    if (allocations.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="no-data">Aucune allocation trouvée</td></tr>';
        return;
    }

    tbody.innerHTML = allocations.map(item => `
        <tr>
            <td>${item.name} (${item.type})</td>
            <td>${item.assignedTo.name}</td>
            <td>${formatDate(item.assignedDate)}</td>
            <td><span class="status-badge status-${item.status}">${getStatusText(item.status)}</span></td>
            <td>
                <button class="btn btn-sm btn-info" onclick="viewAllocationDetails('${item._id}')">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Service Scheduling
async function loadServiceScheduling() {
    try {
        const response = await apiService.getMaintenances();
        const maintenances = response.data || response.maintenances || response || [];
        renderServiceScheduling(maintenances);
    } catch (error) {
        console.error('Error loading service scheduling:', error);
        showToast('Erreur lors du chargement de la planification des services', 'error');
    }
}

function renderServiceScheduling(maintenances) {
    const tbody = document.getElementById('serviceScheduleTableBody');
    if (maintenances.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="no-data">Aucun service planifié</td></tr>';
        return;
    }

    tbody.innerHTML = maintenances.map(maintenance => `
        <tr>
            <td>${maintenance.materiel.name}</td>
            <td>${getMaintenanceTypeText(maintenance.type)}</td>
            <td>${maintenance.technician.name}</td>
            <td>${formatDate(maintenance.startDate)}</td>
            <td><span class="priority-badge priority-${maintenance.priority}">${getPriorityText(maintenance.priority)}</span></td>
            <td><span class="status-badge status-${maintenance.status}">${getStatusText(maintenance.status)}</span></td>
            <td>
                <button class="btn btn-sm btn-info" onclick="viewServiceDetails('${maintenance._id}')">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function openScheduleServiceModal() {
    document.getElementById('scheduleServiceModal').style.display = 'block';
    loadEquipmentForService();
    loadTechniciansForService();
}

async function loadEquipmentForService() {
    try {
        const response = await apiService.getMaterials();
        const equipment = response.data || response.materiels || response || [];
        const select = document.getElementById('serviceEquipment');
        
        select.innerHTML = '<option value="">Sélectionner un équipement</option>' +
            equipment.map(item => `
                <option value="${item._id}">${item.name} - ${item.type}</option>
            `).join('');
    } catch (error) {
        console.error('Error loading equipment:', error);
    }
}

async function loadTechniciansForService() {
    try {
        const response = await apiService.getTechnicians();
        const technicians = response.technicians || [];
        const select = document.getElementById('serviceTechnician');
        
        select.innerHTML = '<option value="">Sélectionner un technicien</option>' +
            technicians.map(tech => `
                <option value="${tech._id}">${tech.name}</option>
            `).join('');
    } catch (error) {
        console.error('Error loading technicians:', error);
    }
}

async function submitScheduleService() {
    try {
        const formData = {
            materiel: document.getElementById('serviceEquipment').value,
            type: document.getElementById('serviceType').value,
            technician: document.getElementById('serviceTechnician').value,
            startDate: document.getElementById('serviceDate').value,
            priority: document.getElementById('servicePriority').value,
            description: document.getElementById('serviceDescription').value,
            estimatedDuration: 2 // Default duration
        };

        // Validate form
        if (!formData.materiel || !formData.type || !formData.technician || !formData.startDate || !formData.description) {
            showToast('Veuillez remplir tous les champs obligatoires', 'error');
            return;
        }

        const response = await apiService.createMaintenance(formData);
        showToast('Service planifié avec succès', 'success');
        closeModal('scheduleServiceModal');
        document.getElementById('scheduleServiceForm').reset();
        loadServiceScheduling();
    } catch (error) {
        console.error('Error scheduling service:', error);
        showToast('Erreur lors de la planification du service', 'error');
    }
}

// Equipment Requests Management
async function loadEquipmentRequests() {
    try {
        const response = await apiService.getAllEquipmentRequests();
        const requests = response.data || response.requests || response || [];
        renderEquipmentRequests(requests);
    } catch (error) {
        console.error('Error loading equipment requests:', error);
        showToast('Erreur lors du chargement des demandes', 'error');
    }
}

function renderEquipmentRequests(requests) {
    const tbody = document.getElementById('requestsTableBody');
    if (requests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="no-data">Aucune demande trouvée</td></tr>';
        return;
    }

    tbody.innerHTML = requests.map(request => `
        <tr>
            <td>${request.requestedBy.name}</td>
            <td>${request.equipmentType}</td>
            <td>${request.description}</td>
            <td><span class="priority-badge priority-${request.priority}">${getPriorityText(request.priority)}</span></td>
            <td><span class="status-badge status-${request.status}">${getStatusText(request.status)}</span></td>
            <td>${formatDate(request.requestedDate)}</td>
            <td>
                <button class="btn btn-sm btn-success" onclick="approveRequest('${request._id}')" ${request.status !== 'pending' ? 'disabled' : ''}>
                    <i class="fas fa-check"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="rejectRequest('${request._id}')" ${request.status !== 'pending' ? 'disabled' : ''}>
                    <i class="fas fa-times"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Fault Reports Management
async function loadFaultReports() {
    try {
        const response = await apiService.getAllFaultReports();
        const reports = response.data || response.reports || response || [];
        renderFaultReports(reports);
    } catch (error) {
        console.error('Error loading fault reports:', error);
        showToast('Erreur lors du chargement des rapports', 'error');
    }
}

function renderFaultReports(reports) {
    const tbody = document.getElementById('faultReportsTableBody');
    if (reports.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="no-data">Aucun rapport trouvé</td></tr>';
        return;
    }

    tbody.innerHTML = reports.map(report => `
        <tr>
            <td>${report.equipment.name}</td>
            <td>${getFaultTypeText(report.faultType)}</td>
            <td>${report.description}</td>
            <td><span class="severity-badge severity-${report.severity}">${getSeverityText(report.severity)}</span></td>
            <td><span class="status-badge status-${report.status}">${getStatusText(report.status)}</span></td>
            <td>${report.assignedTechnician ? report.assignedTechnician.name : 'Non assigné'}</td>
            <td>
                <button class="btn btn-sm btn-info" onclick="viewFaultReportDetails('${report._id}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-warning" onclick="assignTechnician('${report._id}')" ${report.status === 'resolved' ? 'disabled' : ''}>
                    <i class="fas fa-user"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Chatbot Management
async function initializeChatbot() {
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

// Utility Functions
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function getStatusText(status) {
    const statusMap = {
        'pending': 'En Attente',
        'approved': 'Approuvée',
        'rejected': 'Rejetée',
        'fulfilled': 'Remplie',
        'cancelled': 'Annulée',
        'reported': 'Signalé',
        'acknowledged': 'Reconnu',
        'in_progress': 'En Cours',
        'resolved': 'Résolu',
        'closed': 'Fermé',
        'disponible': 'Disponible',
        'affecté': 'Affecté',
        'maintenance': 'Maintenance',
        'hors_service': 'Hors Service',
        'en_attente': 'En Attente',
        'en_cours': 'En Cours',
        'terminee': 'Terminée',
        'annulee': 'Annulée'
    };
    return statusMap[status] || status;
}

function getPriorityText(priority) {
    const priorityMap = {
        'basse': 'Basse',
        'normale': 'Normale',
        'haute': 'Haute',
        'urgente': 'Urgente',
        'critique': 'Critique'
    };
    return priorityMap[priority] || priority;
}

function getSeverityText(severity) {
    const severityMap = {
        'low': 'Faible',
        'medium': 'Moyenne',
        'high': 'Élevée',
        'critical': 'Critique'
    };
    return severityMap[severity] || severity;
}

function getFaultTypeText(faultType) {
    const faultTypeMap = {
        'hardware': 'Matériel',
        'software': 'Logiciel',
        'network': 'Réseau',
        'power': 'Alimentation',
        'physical_damage': 'Dommage Physique',
        'other': 'Autre'
    };
    return faultTypeMap[faultType] || faultType;
}

function getMaintenanceTypeText(type) {
    const typeMap = {
        'preventive': 'Préventive',
        'corrective': 'Corrective',
        'urgente': 'Urgente'
    };
    return typeMap[type] || type;
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR');
}

function showToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    // Add to page
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Remove toast
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// Placeholder functions for future implementation
function viewEquipmentDetails(equipmentId) {
    showToast('Fonctionnalité en cours de développement', 'info');
}

function editEquipment(equipmentId) {
    showToast('Fonctionnalité en cours de développement', 'info');
}

function deleteEquipment(equipmentId) {
    showToast('Fonctionnalité en cours de développement', 'info');
}

function viewAllocationDetails(allocationId) {
    showToast('Fonctionnalité en cours de développement', 'info');
}

function viewServiceDetails(serviceId) {
    showToast('Fonctionnalité en cours de développement', 'info');
}

function approveRequest(requestId) {
    showToast('Fonctionnalité en cours de développement', 'info');
}

function rejectRequest(requestId) {
    showToast('Fonctionnalité en cours de développement', 'info');
}

function viewFaultReportDetails(reportId) {
    showToast('Fonctionnalité en cours de développement', 'info');
}

function assignTechnician(reportId) {
    showToast('Fonctionnalité en cours de développement', 'info');
}
