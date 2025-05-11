import { sequelize } from '../config/database';
import User from './User';
import Warranty from './Warranty';

// Sync models with database
const syncDatabase = async (force: boolean = false) => {
  try {
    await sequelize.sync({ force });
    console.log('All models were synchronized successfully.');
  } catch (error) {
    console.error('Error syncing database:', error);
  }
};

export {
  User,
  Warranty,
  syncDatabase
}; 