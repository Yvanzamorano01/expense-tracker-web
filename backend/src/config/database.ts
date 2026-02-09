import { Sequelize } from 'sequelize';
import path from 'path';
import fs from 'fs';
import env from './env';

// Ensure database directory exists
const dbDir = path.dirname(env.DATABASE_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Create Sequelize instance for SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: env.DATABASE_PATH,
  logging: env.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: true,
    underscored: false,
    freezeTableName: true,
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

// Test database connection
export const testConnection = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connection established successfully.');
  } catch (error) {
    console.error('✗ Unable to connect to the database:', error);
    throw error;
  }
};

// Sync database (create tables if they don't exist)
export const syncDatabase = async (force = false): Promise<void> => {
  try {
    await sequelize.sync({ force, alter: !force });
    console.log('✓ Database synchronized successfully.');
  } catch (error) {
    console.error('✗ Error synchronizing database:', error);
    throw error;
  }
};

// Close database connection
export const closeConnection = async (): Promise<void> => {
  try {
    await sequelize.close();
    console.log('✓ Database connection closed.');
  } catch (error) {
    console.error('✗ Error closing database connection:', error);
    throw error;
  }
};

export default sequelize;
