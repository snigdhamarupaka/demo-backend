const { Pool } = require('pg');

// Simple handler without Express - more reliable for Netlify
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// CORS headers
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

// Initialize database
const initializeDatabase = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      mobile VARCHAR(10) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await pool.query(createTableQuery);
    console.log('✓ Database table initialized');
  } catch (error) {
    console.error('Error initializing database:', error.message);
  }
};

// Initialize database on cold start
let dbInitialized = false;
const ensureDbInitialized = async () => {
  if (!dbInitialized) {
    await initializeDatabase();
    dbInitialized = true;
  }
};

// Create user
const createUser = async (body) => {
  const { name, mobile, email } = body;

  if (!name || !mobile || !email) {
    return res.status(400).json({
      success: false,
      message: 'All fields (name, mobile, email) are required'
    });
  }

  const mobileRegex = /^[0-9]{10}$/;
  if (!mobileRegex.test(mobile)) {
    return res.status(400).json({
      success: false,
      message: 'Mobile number must be exactly 10 digits'
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format'
    });
  }

  try {
    const query = 'INSERT INTO users (name, mobile, email) VALUES ($1, $2, $3) RETURNING *;';
    const values = [name, mobile, email];
    const result = await pool.query(query, values);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating user:', error);
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Email already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message
    });
  }
};

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const query = 'SELECT * FROM users ORDER BY created_at DESC;';
    const result = await pool.query(query);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    const query = 'SELECT * FROM users WHERE id = $1;';
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const query = 'DELETE FROM users WHERE id = $1 RETURNING *;';
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
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
      createUser: 'POST /api/users',
      getAllUsers: 'GET /api/users',
      getUserById: 'GET /api/users/:id',
      deleteUser: 'DELETE /api/users/:id'
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

