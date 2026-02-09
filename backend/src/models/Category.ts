import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

/**
 * Category Model
 * Represents an expense category (e.g., Food, Transportation, etc.)
 * FR-2.1: Default categories
 * FR-2.2-2.4: CRUD operations
 */

interface CategoryAttributes {
  categoryId: number;
  name: string;
  color: string;
  isDefault: boolean;
  icon?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CategoryCreationAttributes extends Optional<CategoryAttributes, 'categoryId' | 'isDefault' | 'createdAt' | 'updatedAt'> {}

class Category extends Model<CategoryAttributes, CategoryCreationAttributes> implements CategoryAttributes {
  public categoryId!: number;
  public name!: string;
  public color!: string;
  public isDefault!: boolean;
  public icon?: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  /**
   * Get all categories
   * @returns All categories from database
   */
  public static async getAllCategories(): Promise<Category[]> {
    return await Category.findAll({
      order: [['name', 'ASC']],
    });
  }

  /**
   * Get category by ID
   * @param id - Category ID
   * @returns Category instance or null
   */
  public static async getCategoryById(id: number): Promise<Category | null> {
    return await Category.findByPk(id);
  }

  /**
   * Get total spent by category for a specific month/year
   * @param month - Month number (1-12)
   * @param year - Year
   * @returns Total amount spent
   */
  public async getTotalSpentByCategory(month: number, year: number): Promise<number> {
    const { Expense } = await import('./index');
    const { Op } = require('sequelize');

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const expenses = await Expense.findAll({
      where: {
        categoryId: this.categoryId,
        date: {
          [Op.between]: [startDate, endDate],
        },
      },
    });

    return expenses.reduce((total, expense) => total + expense.amount, 0);
  }

  /**
   * Check if category can be deleted
   * @returns True if category has no expenses
   */
  public async canDelete(): Promise<boolean> {
    if (this.isDefault) {
      return false;
    }

    const { Expense } = await import('./index');
    const count = await Expense.count({
      where: { categoryId: this.categoryId },
    });

    return count === 0;
  }
}

Category.init(
  {
    categoryId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'category_id',
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [1, 50],
      },
    },
    color: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '#3B82F6',
      validate: {
        is: /^#[0-9A-F]{6}$/i, // Hex color validation
      },
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_default',
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'categories',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['name'],
      },
    ],
  }
);

export default Category;
