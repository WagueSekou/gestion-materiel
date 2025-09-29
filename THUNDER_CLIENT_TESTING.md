# Thunder Client Testing Guide

## Setup
1. Install Thunder Client extension in VS Code
2. Start the backend: `cd backend && npm start`
3. Base URL: `http://localhost:3000/api`

## Authentication Flow

### 1. Register a User
```http
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "name": "Admin User",
  "email": "admin@test.com",
  "password": "password123",
  "role": "admin"
}
```

### 2. Login
```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "admin@test.com",
  "password": "password123"
}
```
**Save the token from response for subsequent requests**

### 3. Set Authorization Header
For all protected routes, add this header:
```
Authorization: Bearer YOUR_TOKEN_HERE
```

## User Management

### Get All Users
```http
GET http://localhost:3000/api/users
Authorization: Bearer YOUR_TOKEN
```

### Get Technicians Only
```http
GET http://localhost:3000/api/users/technicians
Authorization: Bearer YOUR_TOKEN
```

### Create User
```http
POST http://localhost:3000/api/users
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "name": "John Technician",
  "email": "john@test.com",
  "password": "password123",
  "role": "technicien"
}
```

## Material Management

### Get All Materials
```http
GET http://localhost:3000/api/materiel
Authorization: Bearer YOUR_TOKEN
```

### Get Materials with Filters
```http
GET http://localhost:3000/api/materiel?status=disponible&type=Ordinateur
Authorization: Bearer YOUR_TOKEN
```

### Create Material
```http
POST http://localhost:3000/api/materiel
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "name": "Laptop Dell",
  "type": "Ordinateur",
  "description": "Laptop for office work",
  "serialNumber": "DELL001",
  "location": "Bureau A",
  "category": "Informatique",
  "condition": "Bon"
}
```

### Update Material
```http
PUT http://localhost:3000/api/materiel/MATERIAL_ID
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "status": "affecté",
  "location": "Bureau B"
}
```

### Get Material by ID
```http
GET http://localhost:3000/api/materiel/MATERIAL_ID
Authorization: Bearer YOUR_TOKEN
```

## Allocation Management

### Get All Allocations
```http
GET http://localhost:3000/api/allocation
Authorization: Bearer YOUR_TOKEN
```

### Create Allocation (Admin)
```http
POST http://localhost:3000/api/allocation
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "materielId": "MATERIAL_ID",
  "userId": "USER_ID",
  "purpose": "Project work",
  "location": "Office",
  "expectedReturnDate": "2024-02-15",
  "notes": "For client presentation"
}
```

### Create Allocation Request (Regular User)
```http
POST http://localhost:3000/api/allocation
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "materielId": "MATERIAL_ID",
  "purpose": "Training session",
  "location": "Conference room",
  "expectedReturnDate": "2024-02-10"
}
```

### Approve Allocation
```http
POST http://localhost:3000/api/allocation/ALLOCATION_ID/approve
Authorization: Bearer YOUR_TOKEN
```

### Reject Allocation
```http
POST http://localhost:3000/api/allocation/ALLOCATION_ID/reject
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "reason": "Material not available"
}
```

### Return Allocation
```http
POST http://localhost:3000/api/allocation/ALLOCATION_ID/return
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "returnCondition": "Good",
  "damageReport": "No damage",
  "returnNotes": "Returned on time"
}
```

## Maintenance Management

### Get All Maintenance
```http
GET http://localhost:3000/api/maintenance
Authorization: Bearer YOUR_TOKEN
```

### Create Maintenance
```http
POST http://localhost:3000/api/maintenance
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "materielId": "MATERIAL_ID",
  "type": "corrective",
  "priority": "haute",
  "description": "Screen flickering issue",
  "estimatedDuration": 4,
  "technicianId": "TECHNICIAN_ID"
}
```

### Start Maintenance
```http
POST http://localhost:3000/api/maintenance/MAINTENANCE_ID/start
Authorization: Bearer YOUR_TOKEN
```

### Complete Maintenance
```http
POST http://localhost:3000/api/maintenance/MAINTENANCE_ID/complete
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "solution": "Replaced screen cable",
  "actualDuration": 3,
  "cost": 15000,
  "notes": "Issue resolved successfully"
}
```

### Get Technician Maintenance
```http
GET http://localhost:3000/api/maintenance/technician/TECHNICIAN_ID
Authorization: Bearer YOUR_TOKEN
```

## Dashboard Data

### Get Admin Dashboard
```http
GET http://localhost:3000/api/dashboard/admin
Authorization: Bearer YOUR_TOKEN
```

### Get User Dashboard
```http
GET http://localhost:3000/api/dashboard/user
Authorization: Bearer YOUR_TOKEN
```

### Get Technician Dashboard
```http
GET http://localhost:3000/api/dashboard/technician
Authorization: Bearer YOUR_TOKEN
```

## Statistics

### Get Material Stats
```http
GET http://localhost:3000/api/materiel/stats/overview
Authorization: Bearer YOUR_TOKEN
```

### Get Allocation Stats
```http
GET http://localhost:3000/api/allocation/stats/overview
Authorization: Bearer YOUR_TOKEN
```

### Get Maintenance Stats
```http
GET http://localhost:3000/api/maintenance/stats/overview
Authorization: Bearer YOUR_TOKEN
```

## Equipment Requests

### Get Equipment Requests
```http
GET http://localhost:3000/api/equipment-requests
Authorization: Bearer YOUR_TOKEN
```

### Create Equipment Request
```http
POST http://localhost:3000/api/equipment-requests
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "equipmentType": "Ordinateur",
  "description": "Need laptop for new employee",
  "purpose": "Daily work",
  "priority": "normal",
  "neededBy": "2024-02-20"
}
```

### Get Available Equipment
```http
GET http://localhost:3000/api/equipment-requests/available?equipmentType=Ordinateur
Authorization: Bearer YOUR_TOKEN
```

## Fault Reports

### Get Fault Reports
```http
GET http://localhost:3000/api/fault-reports
Authorization: Bearer YOUR_TOKEN
```

### Create Fault Report
```http
POST http://localhost:3000/api/fault-reports
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "equipmentId": "MATERIAL_ID",
  "title": "Printer not working",
  "description": "Printer shows error message",
  "severity": "medium",
  "location": "Office A"
}
```

## Chatbot

### Get Chatbot Session
```http
GET http://localhost:3000/api/chatbot/session
Authorization: Bearer YOUR_TOKEN
```

### Send Chatbot Message
```http
POST http://localhost:3000/api/chatbot/message
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "message": "How many materials do we have?",
  "sessionId": "SESSION_ID"
}
```

## Testing Workflow

### 1. Authentication Test
1. Register a user
2. Login and save token
3. Test protected route with token

### 2. Material Management Test
1. Create materials with different types and statuses
2. Get all materials
3. Update material status
4. Test material assignment

### 3. Allocation Test
1. Create allocation as admin (auto-approved)
2. Create allocation as regular user (pending)
3. Approve/reject allocation
4. Return allocation

### 4. Maintenance Test
1. Create maintenance request
2. Start maintenance
3. Complete maintenance
4. Check maintenance history

### 5. Dashboard Test
1. Test different dashboard endpoints
2. Verify statistics accuracy
3. Check role-based access

## Common Response Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Server Error

## Tips for Testing

1. **Always use the token** from login response
2. **Check response structure** - some endpoints return `{ data: [...] }`, others return `{ materiels: [...] }`
3. **Test error cases** - invalid IDs, missing fields, wrong permissions
4. **Use realistic data** - proper dates, valid enum values
5. **Test role permissions** - admin vs regular user vs technician
6. **Check database state** - verify changes persist after requests

## Sample Test Data

### Valid Material Types
- `Ordinateur`, `Caméra`, `Microphone`, `Écran`, `Clavier`, `Souris`, `Câble`, `Autre`

### Valid Material Status
- `disponible`, `affecté`, `maintenance`, `hors_service`

### Valid Maintenance Types
- `preventive`, `corrective`, `urgente`

### Valid Priorities
- `basse`, `normale`, `haute`, `critique`

### Valid User Roles
- `admin`, `technicien`, `utilisateur`, `technical_manager`
