// Media Employee Dashboard JavaScript
let currentUser = null;
let chatbotSession = null;

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
    if (!currentUser || currentUser.role !== 'media_employee') {
        window.location.href = 'login.html';
        return;
    }

    // Display user info
    document.getElementById('userInfo').textContent = `Bonjour, ${currentUser.name}`;

    // Load dashboard data
    loadDashboardData();
    loadEquipmentRequests();
    loadFaultReports();
    loadEquipmentList();
    initializeChatbot();
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

    // Search and filter
    document.getElementById('equipmentSearch').addEventListener('input', filterEquipment);
    document.getElementById('equipmentTypeFilter').addEventListener('change', filterEquipment);

    // Chatbot input
    document.getElementById('chatbotInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendChatbotMessage();
        }
    });
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
}

// Dashboard Data Loading
async function loadDashboardData() {
    try {
        // Load user's equipment requests
        const requestsResponse = await apiService.getUserEquipmentRequests();
        const requests = requestsResponse.data || [];

        // Load user's fault reports
        const faultReportsResponse = await apiService.getUserFaultReports();
        const faultReports = faultReportsResponse.data || [];

        // Update statistics
        document.getElementById('totalRequests').textContent = requests.length;
        document.getElementById('approvedRequests').textContent = 
            requests.filter(r => r.status === 'approved').length;
        document.getElementById('totalFaultReports').textContent = faultReports.length;
        document.getElementById('assignedEquipment').textContent = 
            requests.filter(r => r.assignedEquipment).length;

        // Load recent requests
        loadRecentRequests(requests.slice(0, 5));
        loadRecentFaultReports(faultReports.slice(0, 5));

    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showToast('Erreur lors du chargement des données', 'error');
    }
}

function loadRecentRequests(requests) {
    const container = document.getElementById('recentRequests');
    if (requests.length === 0) {
        container.innerHTML = '<p class="no-data">Aucune demande récente</p>';
        return;
    }

    container.innerHTML = requests.map(request => `
        <div class="request-item">
            <div class="request-info">
                <h4>${request.equipmentType}</h4>
                <p>${request.description}</p>
            </div>
            <div class="request-status">
                <span class="status-badge status-${request.status}">${getStatusText(request.status)}</span>
            </div>
        </div>
    `).join('');
}

function loadRecentFaultReports(reports) {
    const container = document.getElementById('recentFaultReports');
    if (reports.length === 0) {
        container.innerHTML = '<p class="no-data">Aucun rapport récent</p>';
        return;
    }

    container.innerHTML = reports.map(report => `
        <div class="fault-report-item">
            <div class="report-info">
                <h4>${report.equipment.name}</h4>
                <p>${report.description}</p>
            </div>
            <div class="report-status">
                <span class="severity-badge severity-${report.severity}">${getSeverityText(report.severity)}</span>
            </div>
        </div>
    `).join('');
}

// Equipment Requests Management
async function loadEquipmentRequests() {
    try {
        const response = await apiService.getUserEquipmentRequests();
        const requests = response.data || [];
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
            <td>${request.equipmentType}</td>
            <td>${request.description}</td>
            <td><span class="priority-badge priority-${request.priority}">${getPriorityText(request.priority)}</span></td>
            <td><span class="status-badge status-${request.status}">${getStatusText(request.status)}</span></td>
            <td>${formatDate(request.requestedDate)}</td>
            <td>${formatDate(request.neededBy)}</td>
            <td>
                <button class="btn btn-sm btn-info" onclick="viewRequestDetails('${request._id}')">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function openCreateRequestModal() {
    document.getElementById('createRequestModal').style.display = 'block';
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('requestNeededBy').min = today;
}

async function submitCreateRequest() {
    try {
        const formData = {
            equipmentType: document.getElementById('requestEquipmentType').value,
            description: document.getElementById('requestDescription').value,
            purpose: document.getElementById('requestPurpose').value,
            priority: document.getElementById('requestPriority').value,
            neededBy: document.getElementById('requestNeededBy').value
        };

        // Validate form
        if (!formData.equipmentType || !formData.description || !formData.purpose || !formData.neededBy) {
            showToast('Veuillez remplir tous les champs obligatoires', 'error');
            return;
        }

        const response = await apiService.createEquipmentRequest(formData);
        showToast('Demande créée avec succès', 'success');
        closeModal('createRequestModal');
        document.getElementById('createRequestForm').reset();
        loadEquipmentRequests();
        loadDashboardData();
    } catch (error) {
        console.error('Error creating request:', error);
        showToast('Erreur lors de la création de la demande', 'error');
    }
}

// Fault Reports Management
async function loadFaultReports() {
    try {
        const response = await apiService.getUserFaultReports();
        const reports = response.data || [];
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
            <td>${formatDate(report.reportedDate)}</td>
            <td>
                <button class="btn btn-sm btn-info" onclick="viewFaultReportDetails('${report._id}')">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function openCreateFaultReportModal() {
    document.getElementById('createFaultReportModal').style.display = 'block';
    loadEquipmentForFaultReport();
}

async function loadEquipmentForFaultReport() {
    try {
        const response = await apiService.getMaterials();
        const equipment = response.data || [];
        const select = document.getElementById('faultEquipment');
        
        select.innerHTML = '<option value="">Sélectionner un équipement</option>' +
            equipment.map(item => `
                <option value="${item._id}">${item.name} - ${item.type} (${item.serialNumber || 'N/A'})</option>
            `).join('');
    } catch (error) {
        console.error('Error loading equipment:', error);
    }
}

async function submitCreateFaultReport() {
    try {
        const formData = {
            equipment: document.getElementById('faultEquipment').value,
            faultType: document.getElementById('faultType').value,
            description: document.getElementById('faultDescription').value,
            severity: document.getElementById('faultSeverity').value,
            impact: document.getElementById('faultImpact').value,
            workaround: document.getElementById('faultWorkaround').value
        };

        // Validate form
        if (!formData.equipment || !formData.faultType || !formData.description) {
            showToast('Veuillez remplir tous les champs obligatoires', 'error');
            return;
        }

        const response = await apiService.createFaultReport(formData);
        showToast('Rapport créé avec succès', 'success');
        closeModal('createFaultReportModal');
        document.getElementById('createFaultReportForm').reset();
        loadFaultReports();
        loadDashboardData();
    } catch (error) {
        console.error('Error creating fault report:', error);
        showToast('Erreur lors de la création du rapport', 'error');
    }
}

// Equipment List Management
async function loadEquipmentList() {
    try {
        const response = await apiService.getMaterials();
        const equipment = response.data || [];
        renderEquipmentList(equipment);
    } catch (error) {
        console.error('Error loading equipment list:', error);
        showToast('Erreur lors du chargement de la liste des équipements', 'error');
    }
}

function renderEquipmentList(equipment) {
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
            <td><span class="condition-badge condition-${item.condition}">${getConditionText(item.condition)}</span></td>
            <td>
                <button class="btn btn-sm btn-info" onclick="viewEquipmentDetails('${item._id}')">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function filterEquipment() {
    const searchTerm = document.getElementById('equipmentSearch').value.toLowerCase();
    const typeFilter = document.getElementById('equipmentTypeFilter').value;
    const rows = document.querySelectorAll('#equipmentTableBody tr');

    rows.forEach(row => {
        const name = row.cells[0]?.textContent.toLowerCase() || '';
        const type = row.cells[1]?.textContent || '';
        const matchesSearch = name.includes(searchTerm);
        const matchesType = !typeFilter || type === typeFilter;

        row.style.display = matchesSearch && matchesType ? '' : 'none';
    });
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
        'hors_service': 'Hors Service'
    };
    return statusMap[status] || status;
}

function getPriorityText(priority) {
    const priorityMap = {
        'basse': 'Basse',
        'normale': 'Normale',
        'haute': 'Haute',
        'urgente': 'Urgente'
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

function getConditionText(condition) {
    const conditionMap = {
        'Excellent': 'Excellent',
        'Bon': 'Bon',
        'Moyen': 'Moyen',
        'Mauvais': 'Mauvais'
    };
    return conditionMap[condition] || condition;
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
function viewRequestDetails(requestId) {
    showToast('Fonctionnalité en cours de développement', 'info');
}

function viewFaultReportDetails(reportId) {
    showToast('Fonctionnalité en cours de développement', 'info');
}

function viewEquipmentDetails(equipmentId) {
    showToast('Fonctionnalité en cours de développement', 'info');
}
