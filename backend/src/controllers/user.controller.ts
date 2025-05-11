import { Request, Response } from 'express';
import { User, Warranty } from '../models';

/**
 * Get all users (admin only)
 * @route GET /users
 * @access Private/Admin
 */
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.isAdmin) {
      res.status(403).json({ message: 'Not authorized to view users.' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await User.findAndCountAll({
      attributes: { exclude: ['password'] },
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      users: rows,
      page,
      totalPages: Math.ceil(count / limit),
      totalItems: count
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error fetching users.' });
  }
};

/**
 * Get user by ID with their warranties (admin only)
 * @route GET /users/:id
 * @access Private/Admin
 */
export const getUserWithWarranties = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.isAdmin) {
      res.status(403).json({ message: 'Not authorized to view user details.' });
      return;
    }

    const userId = req.params.id;
    
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    const warranties = await Warranty.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });

    res.json({
      user,
      warranties
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ message: 'Server error fetching user details.' });
  }
}; 