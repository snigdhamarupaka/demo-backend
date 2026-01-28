const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const { pool, initializeDatabase } = require('../config/database');
const {
  createUser,
  getAllUsers,
  getUserById,
  deleteUser
} = require('../controllers/userController');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize database on cold start
let dbInitialized = false;
const ensureDbInitialized = async () => {
  if (!dbInitialized) {
    await initializeDatabase();
    dbInitialized = true;
  }
};

// Routes with database initialization
app.post('/users', async (req, res, next) => {
  await ensureDbInitialized();
  createUser(req, res, next);
});

app.get('/users', async (req, res, next) => {
  await ensureDbInitialized();
  getAllUsers(req, res, next);
});

app.get('/users/:id', async (req, res, next) => {
  await ensureDbInitialized();
  getUserById(req, res, next);
});

app.delete('/users/:id', async (req, res, next) => {
  await ensureDbInitialized();
  deleteUser(req, res, next);
});

// Health check
app.get('/', (req, res) => {
  res.json({
    message: 'User Form API is running on Netlify Functions',
    status: 'OK',
    endpoints: {
      createUser: 'POST /.netlify/functions/api/users',
      getAllUsers: 'GET /.netlify/functions/api/users',
      getUserById: 'GET /.netlify/functions/api/users/:id',
      deleteUser: 'DELETE /.netlify/functions/api/users/:id'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: err.message
  });
});

module.exports.handler = serverless(app);
