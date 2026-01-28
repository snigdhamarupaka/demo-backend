const express = require('express');
const router = express.Router();
const {
  createUser,
  getAllUsers,
  getUserById,
  deleteUser
} = require('../controllers/userController');

// POST - Create a new user
router.post('/users', createUser);

// GET - Get all users
router.get('/users', getAllUsers);

// GET - Get user by ID
router.get('/users/:id', getUserById);

// DELETE - Delete user by ID
router.delete('/users/:id', deleteUser);

module.exports = router;
