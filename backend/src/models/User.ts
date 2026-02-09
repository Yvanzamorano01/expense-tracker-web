import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import bcrypt from 'bcrypt';

/**
 * User Model
 * Represents a user of the Expense Tracker system
 * Supports optional password protection (NFR-S2)
 */

interface UserAttributes {
  userId: number;
  username: string;
  passwordHash: string | null;
  currency: string;
  theme: string;
  isPasswordProtected: boolean;
  dateFormat: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'userId' | 'passwordHash' | 'createdAt' | 'updatedAt'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public userId!: number;
  public username!: string;
  public passwordHash!: string | null;
  public currency!: string;
  public theme!: string;
  public isPasswordProtected!: boolean;
  public dateFormat!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  /**
   * Authenticate user with password
   * FR: Password protection requirement
   * @param password - Plain text password
   * @returns True if password matches
   */
  public async authenticate(password: string): Promise<boolean> {
    if (!this.passwordHash) {
      return false;
    }
    return await bcrypt.compare(password, this.passwordHash);
  }

  /**
   * Set or update password
   * Uses bcrypt for secure hashing (NFR-S2)
   * @param password - Plain text password
   */
  public async setPassword(password: string): Promise<void> {
    const saltRounds = 10;
    this.passwordHash = await bcrypt.hash(password, saltRounds);
    this.isPasswordProtected = true;
    await this.save();
  }

  /**
   * Update user settings
   * @param settings - Partial user settings object
   */
  public async updateSettings(settings: Partial<UserAttributes>): Promise<void> {
    await this.update(settings);
  }

  /**
   * Get user settings as a map
   * @returns User settings object
   */
  public getSettings(): Record<string, any> {
    return {
      username: this.username,
      currency: this.currency,
      theme: this.theme,
      dateFormat: this.dateFormat,
      isPasswordProtected: this.isPasswordProtected,
    };
  }
}

User.init(
  {
    userId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'user_id',
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'default',
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'password_hash',
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'USD',
      validate: {
        len: [3, 3], // ISO 4217 currency codes are 3 characters
      },
    },
    theme: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'light',
      validate: {
        isIn: [['light', 'dark', 'auto']],
      },
    },
    isPasswordProtected: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_password_protected',
    },
    dateFormat: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'MM/DD/YYYY',
      field: 'date_format',
    },
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
    underscored: true,
  }
);

export default User;
