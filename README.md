# Backend API - User Form with Neon Database

Node.js Express API that stores user form data in a Neon PostgreSQL database.

## 📋 Features

- RESTful API endpoints
- PostgreSQL database (Neon)
- Form validation
- Error handling
- CORS enabled
- Automatic table creation

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Neon Database

1. Go to [Neon Console](https://console.neon.tech/)
2. Create a new project
3. Copy your connection string
4. Update `.env` file with your DATABASE_URL

### 3. Environment Variables

Create/Update `.env` file:

```env
DATABASE_URL=postgresql://username:password@your-neon-hostname/database-name?sslmode=require
PORT=5000
NODE_ENV=development
```

### 4. Run the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

Server will run on `http://localhost:5000`

## 🌐 API Endpoints

### Create User
```
POST /api/users
Content-Type: application/json

{
  "name": "John Doe",
  "mobile": "1234567890",
  "email": "john@example.com"
}
```

### Get All Users
```
GET /api/users
```

### Get User by ID
```
GET /api/users/:id
```

### Delete User
```
DELETE /api/users/:id
```

## 📊 Database Schema

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  mobile VARCHAR(10) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔧 Testing with cURL

```bash
# Create a user
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","mobile":"1234567890","email":"john@example.com"}'

# Get all users
curl http://localhost:5000/api/users
```

## 📝 Validation Rules

- **Name**: Required, cannot be empty
- **Mobile**: Required, must be exactly 10 digits
- **Email**: Required, must be valid email format, unique
