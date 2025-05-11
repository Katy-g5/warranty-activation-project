import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { User } from '../models';
import { generateToken } from '../middlewares/auth';

/**
 * Register a new user
 * @route POST /auth/register
 * @access Public
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check for validation errors
    console.log("trying registration...", req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { username, password, isAdmin } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      res.status(400).json({ message: 'User already exists with this username.' });
      return;
    }

    // Create new user
    const user = await User.create({
      username,
      password,
      isAdmin
    });

    // Generate JWT token
    const token = generateToken(user);

    res.status(201).json({
      id: user.id,
      username: user.username,
      isAdmin: user.isAdmin,
      token
    });
  } catch (error) {
    console.error('Error in user registration:', error);
    res.status(500).json({ message: 'Server error during registration.' });
  }
};

/**
 * Authenticate user & get token
 * @route POST /auth/login
 * @access Public
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check for validation errors
    console.log("trying login...", req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { username, password } = req.body;

    // Find user by username
    const user = await User.findOne({ where: { username } });
    if (!user) {
      res.status(401).json({ message: 'Username not found.' });
      return;
    }

    // Check password
    const isMatch = await user.checkPassword(password);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid password.' });
      return;
    }

    // Generate JWT token
    const token = generateToken(user);

    res.json({
      id: user.id,
      username: user.username,
      isAdmin: user.isAdmin,
      token
    });
  } catch (error) {
    console.error('Error in user login:', error);
    res.status(500).json({ message: 'Server error during login: ' + error });
  }
};

/**
 * Get current user profile
 * @route GET /auth/profile
 * @access Private
 */
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated.' });
      return;
    }

    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error fetching profile.' });
  }
}; 