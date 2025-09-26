# Gestion Matériel - Backend API

## 🚀 **Complete Node.js Backend for Material Management System**

### **✨ Features Implemented**

#### **1. Authentication & Authorization**
- **User Registration & Login** with JWT tokens
- **Role-based Access Control** (Admin, Technician, User)
- **Secure Password Hashing** with bcrypt
- **Protected Routes** with middleware

#### **2. User Management**
- **CRUD Operations** for users
- **Profile Management** (view/edit own profile)
- **Role Assignment** (Admin only)
- **User Statistics** and analytics

#### **3. Material Management**
- **Complete CRUD** for equipment/materials
- **Status Tracking** (Available, Allocated, Maintenance, Out of Service)
- **Serial Number** validation
- **Category & Type** organization
- **Location Management**
- **Purchase & Warranty** tracking

#### **4. Allocation System**
- **Material Assignment** to users
- **Approval Workflow** (pending → approved → active)
- **Return Management** with condition reporting
- **Overdue Tracking**
- **Allocation History**

#### **5. Maintenance Management**
- **Maintenance Requests** creation
- **Technician Assignment**
- **Workflow Management** (pending → in progress → completed)
- **Priority Levels** (Low, Normal, High, Critical)
- **Cost Tracking** (parts, labor, total)
- **Preventive Maintenance** scheduling

#### **6. Dashboard & Analytics**
- **Role-specific Dashboards** (Admin, User, Technician)
- **Real-time Statistics**
- **Chart Data** for visualizations
- **Performance Metrics**

### **🏗️ Architecture**

#### **Models**
- `User.js` - User accounts and roles
- `Materiel.js` - Equipment and materials
- `Allocation.js` - Material assignments
- `Maintenance.js` - Maintenance records

#### **Controllers**
- `authController.js` - Authentication logic
- `userController.js` - User management
- `materielController.js` - Material operations
- `allocationController.js` - Allocation workflow
- `maintenanceController.js` - Maintenance operations
- `dashboardController.js` - Dashboard data

#### **Middleware**
- `authMiddleware.js` - Authentication & authorization
- Role-based access control
- JWT token verification

#### **Routes**
- `/api/auth` - Authentication endpoints
- `/api/users` - User management
- `/api/materiel` - Material operations
- `/api/allocation` - Allocation management
- `/api/maintenance` - Maintenance operations
- `/api/dashboard` - Dashboard data

### **📋 Setup Instructions**

#### **1. Prerequisites**
- Node.js (v14 or higher)
- MongoDB (local or cloud)
- npm or yarn

#### **2. Installation**
```bash
cd backend
npm install
```

#### **3. Environment Configuration**
Create a `.env` file in the backend directory:
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/gestion-materiel

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
```

#### **4. Database Setup**
```bash
# Start MongoDB (if local)
mongod

# Or use MongoDB Atlas cloud service
```

#### **5. Start Development Server**
```bash
npm run dev
```

#### **6. Start Production Server**
```bash
npm start
```

### **🔐 API Endpoints**

#### **Authentication**
```
POST /api/auth/register - User registration
POST /api/auth/login - User login
```

#### **Users**
```
GET    /api/users - Get all users (Admin only)
POST   /api/users - Create user (Admin only)
GET    /api/users/:id - Get user profile
PUT    /api/users/:id - Update user
DELETE /api/users/:id - Delete user (Admin only)
GET    /api/users/profile/me - Get own profile
PUT    /api/users/profile/me - Update own profile
GET    /api/users/stats/overview - User statistics (Admin only)
GET    /api/users/technicians - Get technicians list
GET    /api/users/:id/dashboard - Get user dashboard
```

#### **Materials**
```
GET    /api/materiel - Get all materials
POST   /api/materiel - Create material (Admin/Technician)
GET    /api/materiel/:id - Get material details
PUT    /api/materiel/:id - Update material (Admin/Technician)
DELETE /api/materiel/:id - Delete material (Admin only)
POST   /api/materiel/:id/assign - Assign material
POST   /api/materiel/:id/return - Return material
GET    /api/materiel/stats/overview - Material statistics
GET    /api/materiel/search - Search materials
```

#### **Allocations**
```
GET    /api/allocation - Get all allocations
POST   /api/allocation - Create allocation request
GET    /api/allocation/:id - Get allocation details
PUT    /api/allocation/:id - Update allocation
POST   /api/allocation/:id/approve - Approve allocation
POST   /api/allocation/:id/reject - Reject allocation
POST   /api/allocation/:id/return - Return material
POST   /api/allocation/:id/cancel - Cancel allocation
GET    /api/allocation/user/:userId - Get user allocations
GET    /api/allocation/stats/overview - Allocation statistics
```

#### **Maintenance**
```
GET    /api/maintenance - Get all maintenance records
POST   /api/maintenance - Create maintenance request
GET    /api/maintenance/:id - Get maintenance details
PUT    /api/maintenance/:id - Update maintenance
POST   /api/maintenance/:id/start - Start maintenance work
POST   /api/maintenance/:id/complete - Complete maintenance
POST   /api/maintenance/:id/cancel - Cancel maintenance
GET    /api/maintenance/technician/:technicianId - Get technician assignments
GET    /api/maintenance/stats/overview - Maintenance statistics
GET    /api/maintenance/schedule - Get maintenance schedule
GET    /api/maintenance/preventive/due - Get due preventive maintenance
```

#### **Dashboard**
```
GET /api/dashboard/overview - Public system overview
GET /api/dashboard/admin - Admin dashboard data
GET /api/dashboard/user - User dashboard data
GET /api/dashboard/technician - Technician dashboard data
```

### **🔒 Security Features**

#### **Authentication**
- JWT token-based authentication
- Secure password hashing with bcrypt
- Token expiration (1 hour)

#### **Authorization**
- Role-based access control
- Route protection middleware
- User permission validation

#### **Data Validation**
- Input sanitization
- Schema validation with Mongoose
- Error handling and logging

### **📊 Database Schema**

#### **User Schema**
- Name, email, password, role
- Timestamps for audit trail
- Password hashing middleware

#### **Material Schema**
- Name, type, description, serial number
- Status, location, purchase details
- Assignment tracking
- Maintenance history

#### **Allocation Schema**
- Material and user references
- Approval workflow
- Return tracking
- Virtual fields for calculations

#### **Maintenance Schema**
- Material and technician references
- Workflow status tracking
- Cost and time tracking
- Quality control

### **🚀 Performance Features**

#### **Database Optimization**
- Indexed fields for fast queries
- Aggregation pipelines for statistics
- Population for related data

#### **API Optimization**
- Pagination for large datasets
- Filtering and sorting options
- Efficient data queries

### **🔧 Development Features**

#### **Error Handling**
- Comprehensive error messages
- Proper HTTP status codes
- Error logging

#### **Validation**
- Input validation
- Data type checking
- Business logic validation

### **📱 API Response Format**

#### **Success Response**
```json
{
  "message": "Operation successful",
  "data": { ... },
  "pagination": { ... }
}
```

#### **Error Response**
```json
{
  "message": "Error description",
  "error": "Error details"
}
```

### **🧪 Testing**

#### **Manual Testing**
- Use Postman or similar tool
- Test all endpoints with different roles
- Verify authorization rules

#### **API Testing**
- Test authentication flow
- Test CRUD operations
- Test business logic

### **📈 Monitoring & Logging**

#### **Health Check**
- `/api/health` endpoint
- System status monitoring
- Timestamp information

#### **Error Logging**
- Console error logging
- Request/response logging
- Performance monitoring

### **🔮 Future Enhancements**

#### **Planned Features**
- Email notifications
- File uploads for documents
- Advanced reporting
- Mobile app API
- Real-time notifications
- Backup and restore

### **📞 Support**

For questions or issues:
1. Check the API documentation
2. Review error logs
3. Test with Postman
4. Verify environment variables

---

**🎉 Your backend is now complete with full CRUD operations, authentication, authorization, and role-based dashboards for all user types!**



