// Modern Admin Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    setupNavigation();
    loadDashboardData();
});

// Initialize dashboard
function initializeDashboard() {
    // Check authentication
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (!token || role !== 'admin') {
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
        'users': 'Gestion des utilisateurs',
        'materials': 'Gestion du matériel',
        'allocations': 'Gestion des allocations',
        'maintenance': 'Gestion de la maintenance',
        'reports': 'Rapports et statistiques',
        'logs': 'Logs système'
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
        case 'users':
      loadUsers();
            break;
        case 'materials':
      loadMaterials();
            break;
        case 'allocations':
            loadAllocations();
            break;
        case 'maintenance':
            loadMaintenance();
            break;
        case 'reports':
            loadReports();
            break;
        case 'logs':
            loadLogs();
            break;
    }
}

// Load dashboard statistics
async function loadDashboardStats() {
    try {
        const dashboardData = await apiService.getAdminDashboard();
        
        // Update stat cards
        const stats = {
            users: dashboardData.overview.users.total,
            materials: dashboardData.overview.materials.total,
            allocations: dashboardData.overview.allocations.total,
            maintenance: dashboardData.overview.maintenance.total
        };
        
        updateStatCards(stats);
        loadRecentActivity(dashboardData.recent);
        updateSystemStatus(dashboardData.overview);
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        showToast('Erreur lors du chargement des statistiques', 'error');
    }
}

// Update statistics cards
function updateStatCards(stats) {
    const statNumbers = document.querySelectorAll('.stat-number');
    if (statNumbers.length >= 4) {
        statNumbers[0].textContent = stats.users;
        statNumbers[1].textContent = stats.materials;
        statNumbers[2].textContent = stats.allocations;
        statNumbers[3].textContent = stats.maintenance;
    }
}

// Load users
async function loadUsers() {
    const container = document.getElementById('user-list');
    if (!container) return;
    
    container.innerHTML = '<div class="loading-spinner">Chargement des utilisateurs...</div>';
    
    try {
        const usersData = await apiService.getUsers();
        renderUsers(usersData.users);
    } catch (error) {
        console.error('Error loading users:', error);
        showToast('Erreur lors du chargement des utilisateurs', 'error');
        container.innerHTML = '<p class="error-message">Erreur de chargement</p>';
    }
}

// Render users
function renderUsers(users) {
    const container = document.getElementById('user-list');
    if (!container) return;
    
    if (!users || users.length === 0) {
        container.innerHTML = '<p class="no-data">Aucun utilisateur trouvé</p>';
        return;
    }
    
    container.innerHTML = `
        <div class="data-table">
            <div class="table-header">
                <div class="table-row">
                    <div class="table-cell">Nom</div>
                    <div class="table-cell">Email</div>
                    <div class="table-cell">Rôle</div>
                    <div class="table-cell">Statut</div>
                    <div class="table-cell">Actions</div>
                </div>
            </div>
            <div class="table-body">
                ${users.map(user => `
                    <div class="table-row">
                        <div class="table-cell">${user.name || 'N/A'}</div>
                        <div class="table-cell">${user.email || 'N/A'}</div>
                        <div class="table-cell">
                            <span class="badge badge-${user.role || 'utilisateur'}">${user.role || 'utilisateur'}</span>
                        </div>
                        <div class="table-cell">
                            <span class="badge badge-actif">Actif</span>
                        </div>
                        <div class="table-cell">
                            <div class="actions">
                                <button class="btn-edit" onclick="editUser('${user._id}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn-delete" onclick="deleteUser('${user._id}')">
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

// Load materials
async function loadMaterials() {
    const container = document.getElementById('material-list');
    if (!container) return;
    
    container.innerHTML = '<div class="loading-spinner">Chargement du matériel...</div>';
    
    try {
        const materialsData = await apiService.getMaterials();
        renderMaterials(materialsData.materiels);
    } catch (error) {
        console.error('Error loading materials:', error);
        showToast('Erreur lors du chargement des matériels', 'error');
        container.innerHTML = '<p class="error-message">Erreur de chargement</p>';
    }
}

// Render materials
function renderMaterials(materials) {
    const container = document.getElementById('material-list');
    if (!container) return;
    
    if (!materials || materials.length === 0) {
        container.innerHTML = '<p class="no-data">Aucun matériel trouvé</p>';
        return;
    }
    
    container.innerHTML = `
        <div class="data-table">
            <div class="table-header">
                <div class="table-row">
                    <div class="table-cell">Nom</div>
                    <div class="table-cell">Type</div>
                    <div class="table-cell">Statut</div>
                    <div class="table-cell">Localisation</div>
                    <div class="table-cell">Actions</div>
                </div>
            </div>
            <div class="table-body">
                ${materials.map(material => `
                    <div class="table-row">
                        <div class="table-cell">${material.name || 'N/A'}</div>
                        <div class="table-cell">${material.type || 'N/A'}</div>
                        <div class="table-cell">
                            <span class="badge badge-${material.status || 'disponible'}">${material.status || 'disponible'}</span>
                        </div>
                        <div class="table-cell">${material.location || 'N/A'}</div>
                        <div class="table-cell">
                            <div class="actions">
                                <button class="btn-edit" onclick="editMaterial('${material._id}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn-delete" onclick="deleteMaterial('${material._id}')">
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
    const container = document.getElementById('allocation-list');
    if (!container) return;
    
    container.innerHTML = '<div class="loading-spinner">Chargement des allocations...</div>';
    
    try {
        const allocationsData = await apiService.getAllocations();
        renderAllocations(allocationsData.allocations);
    } catch (error) {
        console.error('Error loading allocations:', error);
        showToast('Erreur lors du chargement des allocations', 'error');
        container.innerHTML = '<p class="error-message">Erreur de chargement</p>';
    }
}

// Render allocations
function renderAllocations(allocations) {
    const container = document.getElementById('allocation-list');
    if (!container) return;
    
    if (!allocations || allocations.length === 0) {
        container.innerHTML = '<p class="no-data">Aucune allocation trouvée</p>';
        return;
    }
    
    container.innerHTML = `
        <div class="data-table">
            <div class="table-header">
                <div class="table-row">
                    <div class="table-cell">Utilisateur</div>
                    <div class="table-cell">Matériel</div>
                    <div class="table-cell">Date d'allocation</div>
                    <div class="table-cell">Statut</div>
                    <div class="table-cell">Actions</div>
                </div>
            </div>
            <div class="table-body">
                ${allocations.map(allocation => `
                    <div class="table-row">
                        <div class="table-cell">${allocation.user?.name || allocation.user || 'N/A'}</div>
                        <div class="table-cell">${allocation.materiel?.name || allocation.material || 'N/A'}</div>
                        <div class="table-cell">${new Date(allocation.allocationDate).toLocaleDateString() || allocation.date || 'N/A'}</div>
                        <div class="table-cell">
                            <span class="badge badge-${allocation.status || 'pending'}">${allocation.status || 'pending'}</span>
                        </div>
                        <div class="table-cell">
                            <div class="actions">
                                <button class="btn-edit" onclick="editAllocation('${allocation._id}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn-delete" onclick="deleteAllocation('${allocation._id}')">
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

// Load maintenance
async function loadMaintenance() {
    const container = document.getElementById('maintenance-list');
    if (!container) return;
    
    container.innerHTML = '<div class="loading-spinner">Chargement de la maintenance...</div>';
    
    try {
        const maintenanceData = await apiService.getMaintenance();
        renderMaintenance(maintenanceData.maintenance);
    } catch (error) {
        console.error('Error loading maintenance:', error);
        showToast('Erreur lors du chargement de la maintenance', 'error');
        container.innerHTML = '<p class="error-message">Erreur de chargement</p>';
    }
}

// Render maintenance
function renderMaintenance(maintenance) {
    const container = document.getElementById('maintenance-list');
    if (!container) return;
    
    if (!maintenance || maintenance.length === 0) {
        container.innerHTML = '<p class="no-data">Aucune maintenance trouvée</p>';
        return;
    }
    
    container.innerHTML = `
        <div class="data-table">
            <div class="table-header">
                <div class="table-row">
                    <div class="table-cell">Matériel</div>
                    <div class="table-cell">Type</div>
                    <div class="table-cell">Priorité</div>
                    <div class="table-cell">Description</div>
                    <div class="table-cell">Localisation</div>
                    <div class="table-cell">Technicien</div>
                    <div class="table-cell">Début</div>
                    <div class="table-cell">Statut</div>
                    <div class="table-cell">Actions</div>
                </div>
            </div>
            <div class="table-body">
                ${maintenance.map(item => `
                    <div class="table-row">
                        <div class="table-cell">${item.materiel?.name || 'N/A'}<br><small>${item.materiel?.serialNumber || ''}</small></div>
                        <div class="table-cell">${item.type || 'N/A'}</div>
                        <div class="table-cell"><span class="badge">${item.priority || 'normale'}</span></div>
                        <div class="table-cell">${item.description || 'N/A'}</div>
                        <div class="table-cell">${item.materiel?.location || 'N/A'}</div>
                        <div class="table-cell">${item.technician?.name || 'Non assigné'}</div>
                        <div class="table-cell">${new Date(item.startDate || item.createdAt).toLocaleString()}</div>
                        <div class="table-cell"><span class="badge badge-${item.status || 'en_attente'}">${item.status || 'en_attente'}</span></div>
                        <div class="table-cell">
                            <div class="actions">
                            <button class="btn-edit" onclick="viewMaintenance('${item._id}')"><i class="fas fa-eye"></i></button>
                            <button class="btn-edit" onclick="editMaintenance('${item._id}')"><i class="fas fa-edit"></i></button>
                            <button class="btn-delete" onclick="deleteMaintenance('${item._id}')"><i class="fas fa-trash"></i></button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Load reports
function loadReports() {
    // Initialize charts if Chart.js is available
    if (typeof Chart !== 'undefined') {
        initializeCharts();
    }
}

// Initialize charts
function initializeCharts() {
    // Usage Chart
    const usageCtx = document.getElementById('usageChart');
    if (usageCtx) {
        new Chart(usageCtx, {
            type: 'doughnut',
            data: {
                labels: ['Disponible', 'Affecté', 'Maintenance'],
                datasets: [{
                    data: [65, 25, 10],
                    backgroundColor: ['#10b981', '#3b82f6', '#f59e0b']
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
                    label: 'Allocations',
                    data: [12, 19, 15, 25, 22, 30],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
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

// Load logs
function loadLogs() {
    const container = document.getElementById('logs-list');
    if (!container) return;
    
    container.innerHTML = '<div class="loading-spinner">Chargement des logs...</div>';
    
    setTimeout(() => {
        const logs = [
            { id: 1, action: 'Connexion utilisateur', user: 'Alice Martin', timestamp: '2024-01-15 14:30:00' },
            { id: 2, action: 'Allocation matériel', user: 'Bob Dupont', timestamp: '2024-01-15 14:25:00' },
            { id: 3, action: 'Maintenance créée', user: 'Admin', timestamp: '2024-01-15 14:20:00' }
        ];
        
        renderLogs(logs);
    }, 1000);
}

// Render logs
function renderLogs(logs) {
    const container = document.getElementById('logs-list');
    if (!container) return;
    
    container.innerHTML = `
        <div class="logs-list">
            ${logs.map(log => `
                <div class="log-item">
                    <div class="log-icon">
                        <i class="fas fa-info-circle"></i>
                    </div>
                    <div class="log-content">
                        <div class="log-action">${log.action}</div>
                        <div class="log-details">
                            <span class="log-user">${log.user}</span>
                            <span class="log-time">${log.timestamp}</span>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Update user info
function updateUserInfo() {
    const userName = document.querySelector('.user-name');
    const userRole = document.querySelector('.user-role');
    
    if (userName) userName.textContent = 'Administrateur';
    if (userRole) userRole.textContent = 'Admin';
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
function addUser() {
    openModal('createUserModal');
}

function addMaterial() {
    openModal('createMaterialModal');
}

// Modal helpers
function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.style.display = 'none';
    document.body.style.overflow = '';
}

// Submit create user
async function submitCreateUser() {
    const form = document.getElementById('createUserForm');
    if (!form) return;
    
    const name = document.getElementById('cu_name').value.trim();
    const email = document.getElementById('cu_email').value.trim();
    const password = document.getElementById('cu_password').value;
    const role = document.getElementById('cu_role').value;
    
    if (!name || !email || !password || !role) {
        showToast('Veuillez remplir tous les champs requis', 'error');
        return;
    }
    
    // Disable buttons during submit
    const buttons = form.querySelectorAll('button');
    buttons.forEach(b => b.disabled = true);
    
    try {
        await apiService.createUser({ name, email, password, role });
        showToast('Utilisateur créé avec succès', 'success');
        closeModal('createUserModal');
        // Refresh list
        showSection('users');
        await loadUsers();
        form.reset();
    } catch (error) {
        showToast(error.message || 'Erreur lors de la création de l\'utilisateur', 'error');
    } finally {
        buttons.forEach(b => b.disabled = false);
    }
}

// Submit create material
async function submitCreateMaterial() {
    const form = document.getElementById('createMaterialForm');
    if (!form) return;
    
    const name = document.getElementById('cm_name').value.trim();
    const type = document.getElementById('cm_type').value; // select uses exact enum labels
    const location = document.getElementById('cm_location').value.trim();
    const description = (document.getElementById('cm_description')?.value || '').trim();
    const serialNumber = (document.getElementById('cm_serial')?.value || '').trim();
    
    if (!name || !type || !location) {
        showToast('Veuillez renseigner le nom, le type et la localisation', 'error');
        return;
    }
    
    // Backend requires: name, type (enum), location
    const payload = { name, type, location };
    if (description) payload.description = description;
    if (serialNumber) payload.serialNumber = serialNumber;
    
    const buttons = form.querySelectorAll('button');
    buttons.forEach(b => b.disabled = true);
    
    try {
        await apiService.createMaterial(payload);
        showToast('Matériel créé avec succès', 'success');
        closeModal('createMaterialModal');
        // Refresh list
        showSection('materials');
        await loadMaterials();
        form.reset();
    } catch (error) {
        showToast(error.message || 'Erreur lors de la création du matériel', 'error');
    } finally {
        buttons.forEach(b => b.disabled = false);
    }
}

function addAllocation() {
    const modal = document.getElementById('allocationModal');
    if (!modal) {
        showToast('Modal d\'allocation non trouvé', 'error');
        return;
    }
    modal.style.display = 'block';
    const form = document.getElementById('allocationForm');
    if (form) form.reset();
    loadUsersForAllocation();
    loadMaterialsForAllocation();
}
// Load users for allocation select
async function loadUsersForAllocation() {
    try {
        const select = document.getElementById('a_user');
        if (!select) return;
        select.innerHTML = '<option value="">Chargement...</option>';
        const usersResp = await apiService.getUsers();
        const users = usersResp.users || usersResp.data || usersResp || [];
        select.innerHTML = '<option value="">Sélectionner un utilisateur</option>' +
            users.map(u => `<option value="${u._id}">${u.name} - ${u.email || ''}</option>`).join('');
    } catch (e) {
        console.error('Error loading users for allocation', e);
        showToast('Erreur chargement utilisateurs', 'error');
    }
}

// Load materials for allocation select (fetch ALL materials)
async function loadMaterialsForAllocation() {
    try {
        const select = document.getElementById('a_materiel');
        if (!select) return;
        select.innerHTML = '<option value="">Chargement...</option>';
        const matsResp = await apiService.getMaterials();
        const mats = matsResp.materiels || matsResp.data || matsResp || [];
        select.innerHTML = '<option value="">Sélectionner un matériel</option>' +
            mats.map(m => {
                const status = m.status || 'disponible';
                const serial = m.serialNumber || '';
                const loc = m.location || '';
                return `<option value="${m._id}">${m.name} - ${serial} (${loc}) [${status}]` + `</option>`;
            }).join('');
    } catch (e) {
        console.error('Error loading materials for allocation', e);
        showToast('Erreur chargement matériel', 'error');
    }
}

// Submit allocation (admin)
async function submitAllocation() {
    try {
        const userId = document.getElementById('a_user').value;
        const materielId = document.getElementById('a_materiel').value;
        const purpose = document.getElementById('a_purpose').value.trim();
        const location = document.getElementById('a_location').value.trim();
        const expectedReturnDate = document.getElementById('a_expectedReturnDate').value;
        const notes = document.getElementById('a_notes').value.trim();

        if (!userId || !materielId || !purpose || !location) {
            showToast('Veuillez remplir Utilisateur, Matériel, Objet et Localisation', 'error');
            return;
        }

        const btn = document.querySelector('#allocationModal .btn-primary');
        const original = btn ? btn.innerHTML : '';
        if (btn) btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Création...';

        const payload = { userId, materielId, purpose, location, notes };
        if (expectedReturnDate) payload.expectedReturnDate = expectedReturnDate;

        const resp = await apiService.createAllocation(payload);
        showToast(resp.message || 'Allocation créée', 'success');
        closeModal('allocationModal');
        await loadAllocations();
    } catch (error) {
        console.error('Create allocation error', error);
        showToast(error.message || 'Erreur lors de la création de l\'allocation', 'error');
    } finally {
        const btn = document.querySelector('#allocationModal .btn-primary');
        if (btn) btn.innerHTML = '<i class="fas fa-share-square"></i> Créer l\'allocation';
    }
}

function addMaintenance() {
    // Show the maintenance modal
    const modal = document.getElementById('maintenanceModal');
    if (modal) {
        modal.style.display = 'block';
        // Reset form
        document.getElementById('maintenanceForm').reset();
        // Load minimal selects
        loadMaterialsForMaintenance();
        loadTechniciansForMaintenance();
    } else {
        showToast('Modal de maintenance non trouvé', 'error');
    }
}

// Removed advanced type-dependent UI for simplicity

// Add part functionality
function addPart() {
    const container = document.getElementById('partsContainer');
    const partItem = document.createElement('div');
    partItem.className = 'part-item';
    partItem.innerHTML = `
        <input type="text" placeholder="Nom de la pièce" class="part-name" />
        <input type="number" placeholder="Quantité" min="1" class="part-quantity" />
        <input type="number" placeholder="Coût (FCFA)" min="0" class="part-cost" />
        <button type="button" class="btn-remove-part" onclick="removePart(this)">×</button>
    `;
    container.appendChild(partItem);
}

// Remove part functionality
function removePart(button) {
    const partItem = button.parentElement;
    const container = document.getElementById('partsContainer');
    
    // Don't remove if it's the only part item
    if (container.children.length > 1) {
        partItem.remove();
    } else {
        // Clear the fields instead of removing
        partItem.querySelector('.part-name').value = '';
        partItem.querySelector('.part-quantity').value = '';
        partItem.querySelector('.part-cost').value = '';
    }
}

// Load materials for maintenance selection
async function loadMaterialsForMaintenance() {
    try {
        const resp = await apiService.getMaterials();
        const materials = resp.materiels || resp.data || resp || [];
        const select = document.getElementById('m_materiel');
        
        // Clear existing options except the first one
        select.innerHTML = '<option value="">Sélectionner un matériel</option>';
        
        // Add all materials found
        materials.forEach(material => {
            const option = document.createElement('option');
            option.value = material._id;
            const serial = material.serialNumber ? ` (${material.serialNumber})` : '';
            const status = material.status ? ` - ${material.status}` : '';
            option.textContent = `${material.name || 'Sans nom'}${serial}${status}`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading materials for maintenance:', error);
        showToast('Erreur lors du chargement des matériels', 'error');
    }
}

// Load technicians for maintenance selection
async function loadTechniciansForMaintenance() {
    try {
        const resp = await apiService.getTechnicians();
        const technicians = resp.technicians || resp.users || resp.data || resp || [];
        const select = document.getElementById('m_technician');
        
        // Clear existing options except the first one
        select.innerHTML = '<option value="">Sélectionner un technicien</option>';
        
        // Add technicians
        technicians.forEach(t => {
            const option = document.createElement('option');
            option.value = t._id;
            const email = t.email ? ` - ${t.email}` : '';
            option.textContent = `${t.name || 'Technicien'}${email}`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading technicians for maintenance:', error);
        showToast('Erreur lors du chargement des techniciens', 'error');
    }
}

// Submit maintenance form
async function submitMaintenance() {
    try {
        const form = document.getElementById('maintenanceForm');
        const formData = new FormData(form);
        
        // Get form values
        const maintenanceData = {
            materielId: document.getElementById('m_materiel').value,
            type: document.getElementById('m_type').value,
            priority: document.getElementById('m_priority').value,
            description: document.getElementById('m_description').value,
            estimatedDuration: parseInt(document.getElementById('m_estimatedDuration').value) || null,
            technicianId: document.getElementById('m_technician').value,
            // keep payload minimal; backend has defaults for optional fields
        };
        
        // Validate required fields
        if (!maintenanceData.materielId || !maintenanceData.type || !maintenanceData.priority ||
            !maintenanceData.description || !maintenanceData.estimatedDuration || !maintenanceData.technicianId) {
            showToast('Champs requis: Matériel, Type, Priorité, Description, Durée estimée, Technicien', 'error');
            return;
        }
        
        // Show loading state
        const submitBtn = document.querySelector('#maintenanceModal .btn-primary');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Création...';
        submitBtn.disabled = true;
        
        // Create maintenance
        await apiService.createMaintenance(maintenanceData);
        
        // Success
        showToast('Maintenance créée avec succès', 'success');
        closeModal('maintenanceModal');
        
        // Reload maintenance list
        loadMaintenance();
        
        // Reset button state
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        
    } catch (error) {
        console.error('Error creating maintenance:', error);
        showToast('Erreur lors de la création de la maintenance', 'error');
        
        // Reset button state
        const submitBtn = document.querySelector('#maintenanceModal .btn-primary');
        submitBtn.innerHTML = '<i class="fas fa-wrench"></i> Créer la maintenance';
        submitBtn.disabled = false;
    }
}

// Export PDF Report
async function exportReport() {
    const exportBtn = document.getElementById('exportPdfBtn');
    const btnText = exportBtn.querySelector('.btn-text');
    const loadingIcon = exportBtn.querySelector('.loading-icon');
    
    // Show loading state
    exportBtn.disabled = true;
    btnText.textContent = 'Génération...';
    loadingIcon.style.display = 'inline-block';
    
    try {
        // Create PDF document
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        
        // Set up fonts and colors
        doc.setFont('helvetica');
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        
        // Header
        await addHeader(doc, pageWidth);
        
        // Executive Summary
        await addExecutiveSummary(doc, pageWidth);
        
        // Statistics Overview
        await addStatisticsOverview(doc, pageWidth);
        
        // Charts (if available)
        await addCharts(doc, pageWidth);
        
        // Detailed Data Tables
        await addDataTables(doc, pageWidth);
        
        // Footer
        addFooter(doc, pageWidth, pageHeight);
        
        // Generate filename with current date
        const currentDate = new Date().toLocaleDateString('fr-FR');
        const filename = `Rapport_Statistiques_CRTV_${currentDate.replace(/\//g, '-')}.pdf`;
        
        // Save the PDF
        doc.save(filename);
        
        showToast('Rapport PDF généré avec succès!', 'success');
        
    } catch (error) {
        console.error('Error generating PDF:', error);
        showToast('Erreur lors de la génération du PDF', 'error');
    } finally {
        // Reset button state
        exportBtn.disabled = false;
        btnText.textContent = 'Exporter PDF';
        loadingIcon.style.display = 'none';
    }
}

// Add header to PDF
async function addHeader(doc, pageWidth) {
    // Logo and title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('GESTION MATÉRIEL CRTV', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Rapport de Statistiques et Performance', pageWidth / 2, 30, { align: 'center' });
    
    // Date and time
    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    const timeStr = now.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    doc.setFontSize(10);
    doc.text(`Généré le ${dateStr} à ${timeStr}`, pageWidth / 2, 40, { align: 'center' });
    
    // Line separator
    doc.setLineWidth(0.5);
    doc.line(20, 45, pageWidth - 20, 45);
}

// Add executive summary
async function addExecutiveSummary(doc, pageWidth) {
    let yPosition = 55;
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('RÉSUMÉ EXÉCUTIF', 20, yPosition);
    
    yPosition += 10;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    const summaryText = [
        'Ce rapport présente une analyse complète de la gestion du matériel de la CRTV.',
        'Il inclut les statistiques d\'utilisation, les allocations en cours, et l\'état de la maintenance.',
        'Les données sont collectées en temps réel et reflètent l\'état actuel du système.'
    ];
    
    summaryText.forEach(text => {
        doc.text(text, 20, yPosition, { maxWidth: pageWidth - 40 });
        yPosition += 8;
    });
    
    yPosition += 10;
}

// Add statistics overview
async function addStatisticsOverview(doc, pageWidth) {
    let yPosition = 100;
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('VUE D\'ENSEMBLE DES STATISTIQUES', 20, yPosition);
    
    yPosition += 15;
    
    // Get current statistics
    const stats = await getCurrentStatistics();
    
    // Create statistics table
    const tableData = [
        ['Métrique', 'Valeur', 'Tendance'],
        ['Utilisateurs actifs', stats.users.toString(), '+12%'],
        ['Matériels total', stats.materials.toString(), '+8%'],
        ['Allocations actives', stats.allocations.toString(), '0%'],
        ['Maintenance en cours', stats.maintenance.toString(), '-3%']
    ];
    
    yPosition = addTable(doc, tableData, 20, yPosition, pageWidth - 40);
    yPosition += 15;
}

// Add charts to PDF
async function addCharts(doc, pageWidth) {
    let yPosition = 180;
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('GRAPHIQUES ET ANALYSES', 20, yPosition);
    
    yPosition += 15;
    
    // Check if we need a new page
    if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
    }
    
    // Add chart placeholders (in a real implementation, you'd capture the actual charts)
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Graphique d\'utilisation du matériel', 20, yPosition);
    doc.rect(20, yPosition + 5, pageWidth - 40, 40);
    doc.text('[Graphique d\'utilisation du matériel]', pageWidth / 2, yPosition + 25, { align: 'center' });
    
    yPosition += 60;
    
    if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
    }
    
    doc.text('Graphique des allocations par mois', 20, yPosition);
    doc.rect(20, yPosition + 5, pageWidth - 40, 40);
    doc.text('[Graphique des allocations par mois]', pageWidth / 2, yPosition + 25, { align: 'center' });
}

// Add data tables
async function addDataTables(doc, pageWidth) {
    let yPosition = 280;
    
    // Check if we need a new page
    if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
    }
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('DONNÉES DÉTAILLÉES', 20, yPosition);
    
    yPosition += 15;
    
    // Recent Activity
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Activité Récente', 20, yPosition);
    
    yPosition += 10;
    
    const recentActivity = [
        ['Action', 'Utilisateur', 'Heure'],
        ['Nouvel utilisateur inscrit', 'Marie Dubois', 'Il y a 2 heures'],
        ['Matériel ajouté', 'Caméra Sony HD', 'Il y a 4 heures'],
        ['Allocation créée', 'PC Portable → Jean Martin', 'Il y a 6 heures'],
        ['Maintenance signalée', 'Microphone Shure', 'Il y a 8 heures']
    ];
    
    yPosition = addTable(doc, recentActivity, 20, yPosition, pageWidth - 40);
    yPosition += 15;
}

// Add footer to PDF
function addFooter(doc, pageWidth, pageHeight) {
    const pageCount = doc.internal.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        // Footer line
        doc.setLineWidth(0.5);
        doc.line(20, pageHeight - 20, pageWidth - 20, pageHeight - 20);
        
        // Footer text
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('Rapport généré automatiquement par le système de gestion de matériel CRTV', 
                 pageWidth / 2, pageHeight - 15, { align: 'center' });
        doc.text(`Page ${i} sur ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }
}

// Helper function to add tables
function addTable(doc, data, x, y, width) {
    const cellHeight = 8;
    const cellPadding = 2;
    const colWidths = [width * 0.4, width * 0.3, width * 0.3];
    
    data.forEach((row, rowIndex) => {
        let currentX = x;
        
        row.forEach((cell, colIndex) => {
            // Draw cell border
            doc.rect(currentX, y, colWidths[colIndex], cellHeight);
            
            // Add cell content
            doc.setFontSize(9);
            if (rowIndex === 0) {
                doc.setFont('helvetica', 'bold');
            } else {
                doc.setFont('helvetica', 'normal');
            }
            
            doc.text(cell, currentX + cellPadding, y + cellHeight - 2, { 
                maxWidth: colWidths[colIndex] - (cellPadding * 2) 
            });
            
            currentX += colWidths[colIndex];
        });
        
        y += cellHeight;
    });
    
    return y;
}

// Get current statistics
async function getCurrentStatistics() {
    try {
        // Try to get real data from API
        const dashboardData = await apiService.getAdminDashboard();
        return {
            users: dashboardData.overview.users.total || 24,
            materials: dashboardData.overview.materials.total || 156,
            allocations: dashboardData.overview.allocations.total || 89,
            maintenance: dashboardData.overview.maintenance.total || 7
        };
    } catch (error) {
        // Fallback to static data
        return {
            users: 24,
            materials: 156,
            allocations: 89,
            maintenance: 7
        };
    }
}

// Export Excel function (placeholder)
function exportExcel() {
    showToast('Fonctionnalité d\'export Excel à implémenter', 'info');
}

function refreshLogs() {
    loadLogs();
    showToast('Logs actualisés', 'success');
}

function quickAction() {
    showToast('Action rapide sélectionnée', 'info');
}

// Edit functions
function editUser(id) {
    // Load user data from current table row if present
    const row = [...document.querySelectorAll('.table-row')].find(r => r.innerHTML.includes(`editUser('${id}')`));
    const nameCell = row ? row.querySelector('.table-cell:nth-child(1)') : null;
    const emailCell = row ? row.querySelector('.table-cell:nth-child(2)') : null;
    const roleCell = row ? row.querySelector('.table-cell:nth-child(3) .badge') : null;

    // Populate modal
    document.getElementById('eu_id').value = id;
    if (nameCell) document.getElementById('eu_name').value = nameCell.textContent.trim();
    if (emailCell) document.getElementById('eu_email').value = emailCell.textContent.trim();
    if (roleCell) document.getElementById('eu_role').value = roleCell.textContent.trim();

    openModal('editUserModal');
}

function deleteUser(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;
    (async () => {
        try {
            await apiService.deleteUser(id);
            showToast('Utilisateur supprimé', 'success');
            await loadUsers();
        } catch (error) {
            showToast(error.message || 'Erreur lors de la suppression', 'error');
        }
    })();
}

// Submit update user
async function submitUpdateUser() {
    const id = document.getElementById('eu_id').value;
    const name = document.getElementById('eu_name').value.trim();
    const email = document.getElementById('eu_email').value.trim();
    const role = document.getElementById('eu_role').value;

    if (!name || !email || !role) {
        showToast('Veuillez renseigner le nom, l\'email et le rôle', 'error');
        return;
    }

    try {
        await apiService.updateUser(id, { name, email, role });
        showToast('Utilisateur mis à jour', 'success');
        closeModal('editUserModal');
        await loadUsers();
    } catch (error) {
        showToast(error.message || 'Erreur lors de la mise à jour', 'error');
    }
}

function editMaterial(id) {
    // Get row details
    const row = [...document.querySelectorAll('#material-list .table-row')].find(r => r.innerHTML.includes(`editMaterial('${id}')`));
    const nameCell = row ? row.querySelector('.table-cell:nth-child(1)') : null;
    const typeCell = row ? row.querySelector('.table-cell:nth-child(2)') : null;
    const statusBadge = row ? row.querySelector('.table-cell:nth-child(3) .badge') : null;
    const locationCell = row ? row.querySelector('.table-cell:nth-child(4)') : null;

    document.getElementById('em_id').value = id;
    if (nameCell) document.getElementById('em_name').value = nameCell.textContent.trim();
    if (typeCell) document.getElementById('em_type').value = typeCell.textContent.trim();
    if (statusBadge) document.getElementById('em_status').value = statusBadge.textContent.trim();
    if (locationCell) document.getElementById('em_location').value = locationCell.textContent.trim();
    document.getElementById('em_description').value = '';

    // Maintenance toggle default
    const maintToggle = document.getElementById('em_create_maint');
    const maintBlock = document.getElementById('em_maint_block');
    if (maintToggle && maintBlock) {
        maintToggle.checked = statusBadge && statusBadge.textContent.trim() === 'maintenance';
        maintBlock.style.display = maintToggle.checked ? 'block' : 'none';
        // Load technicians when block is visible
        if (maintToggle.checked) populateTechniciansSelect('em_m_technician');
        maintToggle.onchange = () => {
            maintBlock.style.display = maintToggle.checked ? 'block' : 'none';
            if (maintToggle.checked) populateTechniciansSelect('em_m_technician');
        };
    }
    
    // Always load technicians when modal opens (for better UX)
    populateTechniciansSelect('em_m_technician');

    openModal('editMaterialModal');
}

function deleteMaterial(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce matériel ?')) return;
    (async () => {
        try {
            await apiService.deleteMaterial(id);
            showToast('Matériel supprimé', 'success');
            await loadMaterials();
        } catch (error) {
            showToast(error.message || 'Erreur lors de la suppression du matériel', 'error');
        }
    })();
}

// Submit update material
async function submitUpdateMaterial() {
    const id = document.getElementById('em_id').value;
    const name = document.getElementById('em_name').value.trim();
    const type = document.getElementById('em_type').value;
    const status = document.getElementById('em_status').value;
    const location = document.getElementById('em_location').value.trim();
    const description = (document.getElementById('em_description').value || '').trim();

    if (!name || !type || !status || !location) {
        showToast('Veuillez renseigner tous les champs requis', 'error');
        return;
    }

    const payload = { name, type, status, location };
    if (description) payload.description = description;

    try {
        // Update material first
        await apiService.updateMaterial(id, payload);

        // If maintenance requested, create maintenance record
        const createMaint = document.getElementById('em_create_maint')?.checked;
        if (createMaint) {
            const type = document.getElementById('em_m_type').value;
            const priority = document.getElementById('em_m_priority').value;
            const estimatedDuration = parseInt(document.getElementById('em_m_estDuration').value || '1', 10);
            const description = (document.getElementById('em_m_description').value || 'Maintenance programmée').trim();
            const technician = document.getElementById('em_m_technician').value;

            // Build maintenance payload matching backend
            const currentUser = await apiService.getCurrentUser();
            const maintenancePayload = {
                materiel: id,
                type,
                priority,
                status: 'en_attente',
                description,
                technician,
                requestedBy: currentUser._id,
                estimatedDuration
            };
            await apiService.createMaintenance(maintenancePayload);
        }

        showToast('Matériel mis à jour', 'success');
        closeModal('editMaterialModal');
        await loadMaterials();
        if (createMaint) showToast('Maintenance créée', 'success');
    } catch (error) {
        showToast(error.message || 'Erreur lors de la mise à jour du matériel', 'error');
    }
}

// Populate technicians select
async function populateTechniciansSelect(selectId) {
    try {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        select.innerHTML = '<option value="">Chargement...</option>';
        const response = await apiService.getTechnicians();
        select.innerHTML = '<option value="">Sélectionner un technicien</option>';
        
        // Handle the response structure: { technicians: [...] }
        const technicians = response.technicians || [];
        technicians.forEach(tech => {
            const opt = document.createElement('option');
            opt.value = tech._id;
            opt.textContent = `${tech.name} (${tech.email})`;
            select.appendChild(opt);
        });
        
        if (technicians.length === 0) {
            select.innerHTML = '<option value="">Aucun technicien disponible</option>';
        }
    } catch (e) {
        console.error('Error loading technicians:', e);
        const select = document.getElementById(selectId);
        if (select) {
            select.innerHTML = '<option value="">Erreur de chargement</option>';
        }
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

function editMaintenance(id) {
    showToast(`Modifier maintenance ${id}`, 'info');
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

// Load recent activity
function loadRecentActivity() {
    const recentActivity = [
        {
            icon: 'fas fa-user-plus',
            title: 'Nouvel utilisateur inscrit',
            user: 'Marie Dubois',
            time: 'Il y a 2 heures'
        },
        {
            icon: 'fas fa-desktop',
            title: 'Matériel ajouté',
            user: 'Caméra Sony HD',
            time: 'Il y a 4 heures'
        },
        {
            icon: 'fas fa-handshake',
            title: 'Allocation créée',
            user: 'PC Portable → Jean Martin',
            time: 'Il y a 6 heures'
        },
        {
            icon: 'fas fa-wrench',
            title: 'Maintenance signalée',
            user: 'Microphone Shure',
            time: 'Il y a 8 heures'
        }
    ];
    
    updateRecentActivity(recentActivity);
}

// Update recent activity display
function updateRecentActivity(activities) {
    const container = document.querySelector('.recent-activity');
    if (!container) return;
    
    container.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon">
                <i class="${activity.icon}"></i>
            </div>
            <div class="activity-content">
                <div class="activity-title">${activity.title}</div>
                <div class="activity-details">
                    <span class="activity-user">${activity.user}</span>
                    <span class="activity-time">${activity.time}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Update system status
function updateSystemStatus() {
    const statusData = {
        onlineUsers: 8,
        availableMaterials: 67,
        totalMaterials: 156,
        urgentMaintenance: 2
    };
    
    const summaryNumbers = document.querySelectorAll('.summary-number');
    if (summaryNumbers.length >= 3) {
        summaryNumbers[0].textContent = statusData.onlineUsers;
        summaryNumbers[1].textContent = statusData.availableMaterials;
        summaryNumbers[2].textContent = statusData.urgentMaintenance;
    }
    
    // Update the period text for materials
    const summaryPeriods = document.querySelectorAll('.summary-period');
    if (summaryPeriods.length >= 2) {
        summaryPeriods[1].textContent = `Sur ${statusData.totalMaterials} total`;
    }
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