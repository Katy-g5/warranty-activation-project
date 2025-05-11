import { Router } from 'express';
import authRoutes from './auth.routes';
import warrantyRoutes from './warranty.routes';
import userRoutes from './user.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/warranties', warrantyRoutes);
router.use('/users', userRoutes);

export default router; 