const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

let dbInitialized = false;

const initDB = async () => {
  if (!dbInitialized) {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        mobile VARCHAR(10) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    dbInitialized = true;
  }
};

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  await initDB();

  const path = event.path.replace('/.netlify/functions/api', '');
  const method = event.httpMethod;

  try {
    // GET /users - Get all users
    if (method === 'GET' && path === '/users') {
      const result = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          count: result.rows.length,
          data: result.rows
        })
      };
    }

    // GET /users/:id - Get user by ID
    if (method === 'GET' && path.startsWith('/users/')) {
      const id = path.split('/')[2];
      const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
      
      if (result.rows.length === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ success: false, message: 'User not found' })
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, data: result.rows[0] })
      };
    }

    // POST /users - Create user
    if (method === 'POST' && path === '/users') {
      const { name, mobile, email } = JSON.parse(event.body);

      if (!name || !mobile || !email) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            message: 'All fields required'
          })
        };
      }

      if (!/^[0-9]{10}$/.test(mobile)) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            message: 'Mobile must be 10 digits'
          })
        };
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            message: 'Invalid email'
          })
        };
      }

      try {
        const result = await pool.query(
          'INSERT INTO users (name, mobile, email) VALUES ($1, $2, $3) RETURNING *',
          [name, mobile, email]
        );

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({
            success: true,
            message: 'User created',
            data: result.rows[0]
          })
        };
      } catch (err) {
        if (err.code === '23505') {
          return {
            statusCode: 409,
            headers,
            body: JSON.stringify({ success: false, message: 'Email already exists' })
          };
        }
        throw err;
      }
    }

    // DELETE /users/:id - Delete user
    if (method === 'DELETE' && path.startsWith('/users/')) {
      const id = path.split('/')[2];
      const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
      
      if (result.rows.length === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ success: false, message: 'User not found' })
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'User deleted',
          data: result.rows[0]
        })
      };
    }

    // Root path
    if (path === '' || path === '/') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'User API is running',
          endpoints: {
            getAllUsers: 'GET /users',
            createUser: 'POST /users',
            getUser: 'GET /users/:id',
            deleteUser: 'DELETE /users/:id'
          }
        })
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ success: false, message: 'Route not found' })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Internal server error',
        error: error.message
      })
    };
  }
};
