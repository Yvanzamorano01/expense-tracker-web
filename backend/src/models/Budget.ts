import { Model, DataTypes, Optional, Op } from 'sequelize';
import sequelize from '../config/database';
import Category from './Category';
import User from './User';

/**
 * Budget Model
 * Represents budget limits for categories or overall monthly budget
 * FR-3.1-3.2: Set monthly/category budgets
 * FR-3.3: Budget alerts (>80% warning, >100% alert)
 */

interface BudgetAttributes {
  budgetId: number;
  amount: number;
  categoryId: number | null; // Null for total monthly budget
  month: number;
  year: number;
  userId: number;
  originalCurrency?: string; // Currency in which budget was created
  createdAt?: Date;
  updatedAt?: Date;
}

interface BudgetCreationAttributes extends Optional<BudgetAttributes, 'budgetId' | 'categoryId' | 'createdAt' | 'updatedAt'> {}

class Budget extends Model<BudgetAttributes, BudgetCreationAttributes> implements BudgetAttributes {
  public budgetId!: number;
  public amount!: number;
  public categoryId!: number | null;
  public month!: number;
  public year!: number;
  public userId!: number;
  public originalCurrency!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public readonly category?: Category;
  public readonly user?: User;

  /**
   * Get budget by category for a specific month/year
   * FR-3.1-3.2: Budget tracking
   * @param categoryId - Category ID (null for total budget)
   * @param month - Month (1-12)
   * @param year - Year
   * @param userId - User ID
   * @returns Budget instance or null
   */
  public static async getBudgetByCategory(
    categoryId: number | null,
    month: number,
    year: number,
    userId: number = 1
  ): Promise<Budget | null> {
    const where: any = {
      month,
      year,
      userId,
    };

    if (categoryId === null) {
      where.categoryId = null;
    } else {
      where.categoryId = categoryId;
    }

    return await Budget.findOne({
      where,
      include: categoryId ? [{ model: Category, as: 'category' }] : [],
    });
  }

  /**
   * Get all budgets for a specific month/year
   * @param month - Month (1-12)
   * @param year - Year
   * @param userId - User ID
   * @returns List of budgets
   */
  public static async getAllBudgets(
    month: number,
    year: number,
    userId: number = 1
  ): Promise<Budget[]> {
    return await Budget.findAll({
      where: {
        month,
        year,
        userId,
      },
      include: [{ model: Category, as: 'category', required: false }],
      order: [['categoryId', 'ASC']],
    });
  }

  /**
   * Get spent amount for this budget
   * Calculates total expenses for the budget's category and period
   * @returns Total amount spent
   */
  public async getSpentAmount(): Promise<number> {
    const { Expense } = await import('./index');

    const startDate = new Date(this.year, this.month - 1, 1);
    const endDate = new Date(this.year, this.month, 0, 23, 59, 59);

    const where: any = {
      userId: this.userId,
      date: {
        [Op.between]: [startDate, endDate],
      },
    };

    // If categoryId is null, get all expenses; otherwise filter by category
    if (this.categoryId !== null) {
      where.categoryId = this.categoryId;
    }

    const expenses = await Expense.findAll({ where });

    return expenses.reduce((total, expense) => total + expense.amount, 0);
  }

  /**
   * Get remaining amount in budget
   * @returns Remaining amount (can be negative if over budget)
   */
  public async getRemainingAmount(): Promise<number> {
    const spent = await this.getSpentAmount();
    return this.amount - spent;
  }

  /**
   * Get percentage of budget used
   * FR-3.3: Budget alerts
   * @returns Percentage (0-100+)
   */
  public async getPercentageUsed(): Promise<number> {
    const spent = await this.getSpentAmount();
    if (this.amount === 0) return 0;
    return (spent / this.amount) * 100;
  }

  /**
   * Check if budget is exceeded
   * FR-3.3: Budget alert when >100%
   * @returns True if budget exceeded
   */
  public async isOverBudget(): Promise<boolean> {
    const percentage = await this.getPercentageUsed();
    return percentage > 100;
  }

  /**
   * Check if budget warning threshold reached
   * FR-3.3: Budget warning when >80%
   * @returns True if warning threshold reached (>80% but <=100%)
   */
  public async isWarningThreshold(): Promise<boolean> {
    const percentage = await this.getPercentageUsed();
    return percentage > 80 && percentage <= 100;
  }

  /**
   * Get budget status with alert level
   * @returns Status object with alert level
   */
  public async getStatus(): Promise<{
    amount: number;
    spent: number;
    remaining: number;
    percentage: number;
    alertLevel: 'normal' | 'warning' | 'exceeded';
  }> {
    const spent = await this.getSpentAmount();
    const remaining = this.amount - spent;
    const percentage = (spent / this.amount) * 100;

    let alertLevel: 'normal' | 'warning' | 'exceeded' = 'normal';
    if (percentage > 100) {
      alertLevel = 'exceeded';
    } else if (percentage > 80) {
      alertLevel = 'warning';
    }

    return {
      amount: this.amount,
      spent,
      remaining,
      percentage,
      alertLevel,
    };
  }
}

Budget.init(
  {
    budgetId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'budget_id',
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
        isDecimal: true,
      },
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'category_id',
      references: {
        model: 'categories',
        key: 'category_id',
      },
    },
    month: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 12,
      },
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 2000,
        max: 2100,
      },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'user_id',
      },
    },
    originalCurrency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'USD',
      field: 'original_currency',
      validate: {
        isIn: [['USD', 'EUR', 'GBP', 'XAF']],
      },
    },
  },
  {
    sequelize,
    tableName: 'budgets',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['category_id', 'month', 'year', 'user_id'],
        name: 'unique_budget_per_category_month',
      },
      {
        fields: ['month', 'year'],
      },
      {
        fields: ['user_id'],
      },
    ],
  }
);

export default Budget;
