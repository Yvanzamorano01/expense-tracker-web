import { Model, DataTypes, Optional, Op } from 'sequelize';
import sequelize from '../config/database';
import Category from './Category';
import User from './User';

/**
 * Expense Model
 * Represents a single expense record
 * FR-1.1-1.4: Expense management (Add, Edit, Delete, View)
 */

interface ExpenseAttributes {
  expenseId: number;
  amount: number;
  date: Date;
  categoryId: number;
  description: string;
  paymentMethod: string;
  originalCurrency?: string;
  location?: string;
  isRecurring?: boolean;
  recurringFrequency?: string;
  userId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ExpenseCreationAttributes extends Optional<ExpenseAttributes, 'expenseId' | 'description' | 'createdAt' | 'updatedAt'> {}

class Expense extends Model<ExpenseAttributes, ExpenseCreationAttributes> implements ExpenseAttributes {
  public expenseId!: number;
  public amount!: number;
  public date!: Date;
  public categoryId!: number;
  public description!: string;
  public paymentMethod!: string;
  public originalCurrency!: string;
  public location!: string;
  public isRecurring!: boolean;
  public recurringFrequency!: string;
  public userId!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public readonly category?: Category;
  public readonly user?: User;

  /**
   * Get expense by ID
   * FR-1.4: View expense details
   * @param id - Expense ID
   * @returns Expense instance or null
   */
  public static async getExpenseById(id: number): Promise<Expense | null> {
    return await Expense.findByPk(id, {
      include: [
        { model: Category, as: 'category' },
      ],
    });
  }

  /**
   * Get all expenses
   * @param userId - Optional user ID filter
   * @param limit - Optional limit
   * @param offset - Optional offset for pagination
   * @returns List of expenses
   */
  public static async getAllExpenses(
    userId?: number,
    limit?: number,
    offset?: number
  ): Promise<Expense[]> {
    const where = userId ? { userId } : {};

    return await Expense.findAll({
      where,
      include: [{ model: Category, as: 'category' }],
      order: [['date', 'DESC'], ['createdAt', 'DESC']],
      limit,
      offset,
    });
  }

  /**
   * Get expenses by date range
   * FR-4.2: Filter by date range
   * @param startDate - Start date
   * @param endDate - End date
   * @param userId - Optional user ID filter
   * @returns List of expenses
   */
  public static async getExpensesByDateRange(
    startDate: Date,
    endDate: Date,
    userId?: number
  ): Promise<Expense[]> {
    const where: any = {
      date: {
        [Op.between]: [startDate, endDate],
      },
    };

    if (userId) {
      where.userId = userId;
    }

    return await Expense.findAll({
      where,
      include: [{ model: Category, as: 'category' }],
      order: [['date', 'DESC']],
    });
  }

  /**
   * Get expenses by category
   * FR-4.3: Filter by category
   * @param categoryId - Category ID
   * @param userId - Optional user ID filter
   * @returns List of expenses
   */
  public static async getExpensesByCategory(
    categoryId: number,
    userId?: number
  ): Promise<Expense[]> {
    const where: any = { categoryId };
    if (userId) {
      where.userId = userId;
    }

    return await Expense.findAll({
      where,
      include: [{ model: Category, as: 'category' }],
      order: [['date', 'DESC']],
    });
  }

  /**
   * Get total amount for a set of expenses
   * @param expenses - Array of expenses
   * @returns Total amount
   */
  public static getTotalAmount(expenses: Expense[]): number {
    return expenses.reduce((total, expense) => total + expense.amount, 0);
  }

  /**
   * Search expenses by keyword
   * FR-4.1: Search expenses
   * @param searchTerm - Search keyword
   * @param userId - Optional user ID filter
   * @returns List of matching expenses
   */
  public static async searchExpenses(
    searchTerm: string,
    userId?: number
  ): Promise<Expense[]> {
    const where: any = {
      [Op.or]: [
        { description: { [Op.like]: `%${searchTerm}%` } },
        { paymentMethod: { [Op.like]: `%${searchTerm}%` } },
      ],
    };

    if (userId) {
      where.userId = userId;
    }

    return await Expense.findAll({
      where,
      include: [{ model: Category, as: 'category' }],
      order: [['date', 'DESC']],
    });
  }

  /**
   * Get expenses summary by category
   * Used for analytics and reports
   * @param startDate - Start date
   * @param endDate - End date
   * @param userId - Optional user ID filter
   * @returns Category-wise expense summary
   */
  public static async getExpensesByCategorySummary(
    startDate: Date,
    endDate: Date,
    userId?: number
  ): Promise<any[]> {
    const where: any = {
      date: {
        [Op.between]: [startDate, endDate],
      },
    };

    if (userId) {
      where.userId = userId;
    }

    const expenses = await Expense.findAll({
      where,
      include: [{ model: Category, as: 'category' }],
      attributes: [
        'categoryId',
        [sequelize.fn('SUM', sequelize.col('amount')), 'total'],
        [sequelize.fn('COUNT', sequelize.col('expense_id')), 'count'],
      ],
      group: ['categoryId', 'category.category_id'],
    });

    return expenses;
  }
}

Expense.init(
  {
    expenseId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'expense_id',
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0.01,
        isDecimal: true,
      },
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: true,
      },
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'category_id',
      references: {
        model: 'categories',
        key: 'category_id',
      },
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: '',
    },
    paymentMethod: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'Cash',
      field: 'payment_method',
      validate: {
        isIn: [['Cash', 'Card', 'Bank Transfer', 'Digital Wallet', 'Other']],
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
    location: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
    },
    isRecurring: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_recurring',
    },
    recurringFrequency: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: 'monthly',
      field: 'recurring_frequency',
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
  },
  {
    sequelize,
    tableName: 'expenses',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['date'],
      },
      {
        fields: ['category_id'],
      },
      {
        fields: ['user_id'],
      },
      {
        fields: ['date', 'category_id'],
      },
    ],
  }
);

export default Expense;
