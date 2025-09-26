// API Service for Gestion Matériel
class ApiService {
  constructor() {
    this.baseURL = 'http://localhost:3000/api';
    this.token = localStorage.getItem('token');
  }

  // Set auth token
  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  // Get auth headers
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  // Generic request method
  async request(endpoint, options = {}) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const config = {
        headers: this.getHeaders(),
        ...options
      };

      const response = await fetch(url, config);
      
      // Handle unauthorized access
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('userId');
        localStorage.removeItem('userName');
        localStorage.removeItem('user');
        localStorage.removeItem('userEmail');
        this.token = null;
        window.location.href = 'login.html';
        return;
      }

      // Handle forbidden access
      if (response.status === 403) {
        throw new Error('Access denied. Insufficient permissions.');
      }

      // Handle server errors
      if (response.status === 500) {
        throw new Error('Server error. Please try again later.');
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // Authentication methods
  async login(email, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    if (response.token) {
      this.setToken(response.token);
      localStorage.setItem('role', response.role);
      localStorage.setItem('userId', response._id);
      localStorage.setItem('userName', response.name);
      localStorage.setItem('user', JSON.stringify({
        _id: response._id,
        name: response.name,
        email: response.email,
        role: response.role
      }));
    }
    
    return response;
  }

  async register(name, email, password, role) {
    return await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role })
    });
  }

  // User methods
  async getCurrentUser() {
    try {
      return await this.request('/users/profile/me');
    } catch (error) {
      // If we can't get current user, return basic info from localStorage
      return {
        _id: localStorage.getItem('userId') || 'unknown',
        name: localStorage.getItem('userName') || 'Unknown User',
        email: localStorage.getItem('userEmail') || 'unknown@email.com',
        role: localStorage.getItem('role') || 'utilisateur'
      };
    }
  }

  async updateProfile(profileData) {
    return await this.request('/users/profile/me', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  }

  async getUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/users?${queryString}` : '/users';
    return await this.request(endpoint);
  }

  async createUser(userData) {
    return await this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async updateUser(userId, userData) {
    return await this.request(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  }

  async deleteUser(userId) {
    return await this.request(`/users/${userId}`, {
      method: 'DELETE'
    });
  }

  async getTechnicians() {
    return await this.request('/users/technicians');
  }

  // Material methods
  async getMaterials(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/materiel?${queryString}` : '/materiel';
    return await this.request(endpoint);
  }

  async getMaterial(materialId) {
    return await this.request(`/materiel/${materialId}`);
  }

  async createMaterial(materialData) {
    return await this.request('/materiel', {
      method: 'POST',
      body: JSON.stringify(materialData)
    });
  }

  async updateMaterial(materialId, materialData) {
    return await this.request(`/materiel/${materialId}`, {
      method: 'PUT',
      body: JSON.stringify(materialData)
    });
  }

  async deleteMaterial(materialId) {
    return await this.request(`/materiel/${materialId}`, {
      method: 'DELETE'
    });
  }

  async assignMaterial(materialId, assignmentData) {
    return await this.request(`/materiel/${materialId}/assign`, {
      method: 'POST',
      body: JSON.stringify(assignmentData)
    });
  }

  async returnMaterial(materialId, returnData) {
    return await this.request(`/materiel/${materialId}/return`, {
      method: 'POST',
      body: JSON.stringify(returnData)
    });
  }

  async searchMaterials(query, filters = {}) {
    const params = { q: query, ...filters };
    const queryString = new URLSearchParams(params).toString();
    return await this.request(`/materiel/search?${queryString}`);
  }

  async getMaterialStats() {
    return await this.request('/materiel/stats/overview');
  }

  // Allocation methods
  async getAllocations(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/allocation?${queryString}` : '/allocation';
    return await this.request(endpoint);
  }

  async getAllocation(allocationId) {
    return await this.request(`/allocation/${allocationId}`);
  }

  async createAllocation(allocationData) {
    return await this.request('/allocation', {
      method: 'POST',
      body: JSON.stringify(allocationData)
    });
  }

  async updateAllocation(allocationId, allocationData) {
    return await this.request(`/allocation/${allocationId}`, {
      method: 'PUT',
      body: JSON.stringify(allocationData)
    });
  }

  async approveAllocation(allocationId) {
    return await this.request(`/allocation/${allocationId}/approve`, {
      method: 'POST'
    });
  }

  async rejectAllocation(allocationId, reason) {
    return await this.request(`/allocation/${allocationId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }

  async returnAllocation(allocationId, returnData) {
    return await this.request(`/allocation/${allocationId}/return`, {
      method: 'POST',
      body: JSON.stringify(returnData)
    });
  }

  async cancelAllocation(allocationId) {
    return await this.request(`/allocation/${allocationId}/cancel`, {
      method: 'POST'
    });
  }

  async getUserAllocations(userId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/allocation/user/${userId}?${queryString}` : `/allocation/user/${userId}`;
    return await this.request(endpoint);
  }

  async getAllocationStats() {
    return await this.request('/allocation/stats/overview');
  }

  // Maintenance methods
  async getMaintenance(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/maintenance?${queryString}` : '/maintenance';
    return await this.request(endpoint);
  }

  async getMaintenanceById(maintenanceId) {
    return await this.request(`/maintenance/${maintenanceId}`);
  }

  async createMaintenance(maintenanceData) {
    return await this.request('/maintenance', {
      method: 'POST',
      body: JSON.stringify(maintenanceData)
    });
  }

  async updateMaintenance(maintenanceId, maintenanceData) {
    return await this.request(`/maintenance/${maintenanceId}`, {
      method: 'PUT',
      body: JSON.stringify(maintenanceData)
    });
  }

  async startMaintenance(maintenanceId) {
    return await this.request(`/maintenance/${maintenanceId}/start`, {
      method: 'POST'
    });
  }

  async completeMaintenance(maintenanceId, completionData) {
    return await this.request(`/maintenance/${maintenanceId}/complete`, {
      method: 'POST',
      body: JSON.stringify(completionData)
    });
  }

  async cancelMaintenance(maintenanceId, reason) {
    return await this.request(`/maintenance/${maintenanceId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }

  async getTechnicianMaintenance(technicianId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/maintenance/technician/${technicianId}?${queryString}` : `/maintenance/technician/${technicianId}`;
    return await this.request(endpoint);
  }

  async startMaintenance(maintenanceId) {
    return await this.request(`/maintenance/${maintenanceId}/start`, {
      method: 'POST'
    });
  }

  async getMaintenanceStats() {
    return await this.request('/maintenance/stats/overview');
  }

  async getMaintenanceSchedule(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/maintenance/schedule?${queryString}` : '/maintenance/schedule';
    return await this.request(endpoint);
  }

  async getPreventiveMaintenanceDue() {
    return await this.request('/maintenance/preventive/due');
  }

  // Dashboard methods
  async getAdminDashboard() {
    return await this.request('/dashboard/admin');
  }

  async getUserDashboard() {
    return await this.request('/dashboard/user');
  }

  async getTechnicianDashboard() {
    return await this.request('/dashboard/technician');
  }

  async getSystemOverview() {
    return await this.request('/dashboard/overview');
  }

  // Equipment Request methods
  async getEquipmentRequests(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/equipment-requests?${queryString}` : '/equipment-requests';
    return await this.request(endpoint);
  }

  async getAllEquipmentRequests() {
    return await this.request('/equipment-requests/all');
  }

  async getUserEquipmentRequests() {
    return await this.request('/equipment-requests');
  }

  async createEquipmentRequest(requestData) {
    return await this.request('/equipment-requests', {
      method: 'POST',
      body: JSON.stringify(requestData)
    });
  }

  async updateEquipmentRequestStatus(requestId, statusData) {
    return await this.request(`/equipment-requests/${requestId}/status`, {
      method: 'PUT',
      body: JSON.stringify(statusData)
    });
  }

  async getAvailableEquipment(equipmentType = '') {
    const queryString = equipmentType ? `?equipmentType=${equipmentType}` : '';
    return await this.request(`/equipment-requests/available${queryString}`);
  }

  // Fault Report methods
  async getFaultReports(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/fault-reports?${queryString}` : '/fault-reports';
    return await this.request(endpoint);
  }

  async getAllFaultReports() {
    return await this.request('/fault-reports/all');
  }

  async getUserFaultReports() {
    return await this.request('/fault-reports/my-reports');
  }

  async getTechnicianFaultReports() {
    return await this.request('/fault-reports/assigned');
  }

  async createFaultReport(reportData) {
    return await this.request('/fault-reports', {
      method: 'POST',
      body: JSON.stringify(reportData)
    });
  }

  async updateFaultReport(reportId, reportData) {
    return await this.request(`/fault-reports/${reportId}`, {
      method: 'PUT',
      body: JSON.stringify(reportData)
    });
  }

  // Chatbot methods
  async getChatbotSession() {
    return await this.request('/chatbot/session');
  }

  async sendChatbotMessage(message, sessionId) {
    return await this.request('/chatbot/message', {
      method: 'POST',
      body: JSON.stringify({ message, sessionId })
    });
  }

  async getChatbotStats() {
    return await this.request('/chatbot/stats');
  }

  // Utility methods
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('user');
    localStorage.removeItem('userEmail');
    this.token = null;
    window.location.href = 'login.html';
  }

  isAuthenticated() {
    return !!this.token;
  }

  getUserRole() {
    return localStorage.getItem('role');
  }
}

// Create global instance
const apiService = new ApiService();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ApiService;
}
