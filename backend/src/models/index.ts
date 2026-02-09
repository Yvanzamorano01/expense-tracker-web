/**
 * Models Index
 * Defines all model associations and relationships
 * Based on Class Diagram relationships
 */

import User from './User';
import Category from './Category';
import Expense from './Expense';
import Budget from './Budget';

/**
 * Define Model Associations
 * Based on UML Class Diagram relationships
 */

// User associations
User.hasMany(Expense, {
  foreignKey: 'userId',
  as: 'expenses',
  onDelete: 'CASCADE',
});

User.hasMany(Budget, {
  foreignKey: 'userId',
  as: 'budgets',
  onDelete: 'CASCADE',
});

// Category associations
Category.hasMany(Expense, {
  foreignKey: 'categoryId',
  as: 'expenses',
  onDelete: 'RESTRICT', // Prevent deletion if expenses exist
});

Category.hasMany(Budget, {
  foreignKey: 'categoryId',
  as: 'budgets',
  onDelete: 'SET NULL', // Allow deletion, set budget category to null
});

// Expense associations
Expense.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

Expense.belongsTo(Category, {
  foreignKey: 'categoryId',
  as: 'category',
});

// Budget associations
Budget.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

Budget.belongsTo(Category, {
  foreignKey: 'categoryId',
  as: 'category',
});

/**
 * Export all models
 */
export {
  User,
  Category,
  Expense,
  Budget,
};

/**
 * Initialize database and sync models
 */
export const initializeModels = async (force: boolean = false): Promise<void> => {
  try {
    // Sync in correct order due to foreign key constraints
    await User.sync({ force });
    await Category.sync({ force });
    await Expense.sync({ force });
    await Budget.sync({ force });

    console.log('✓ All models synchronized successfully');
  } catch (error) {
    console.error('✗ Error synchronizing models:', error);
    throw error;
  }
};

export default {
  User,
  Category,
  Expense,
  Budget,
  initializeModels,
};
