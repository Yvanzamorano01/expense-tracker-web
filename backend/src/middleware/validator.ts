import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

/**
 * Request Validation Middleware
 * NFR-S3: Input validation to prevent SQL injection and bad data
 */

/**
 * Generic validation middleware factory
 * @param schema - Joi schema to validate against
 * @param property - Request property to validate ('body', 'query', 'params')
 */
export const validate = (schema: Joi.ObjectSchema, property: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(', ');
      return next(new AppError(errorMessage, 400));
    }

    // Replace request property with validated value
    req[property] = value;
    next();
  };
};

/**
 * Expense Validation Schemas
 * FR-1.1: Validate expense data
 */
export const expenseSchemas = {
  create: Joi.object({
    amount: Joi.number().positive().precision(2).required()
      .messages({
        'number.base': 'Amount must be a number',
        'number.positive': 'Amount must be positive',
        'any.required': 'Amount is required',
      }),
    date: Joi.date().iso().required()
      .messages({
        'date.base': 'Date must be a valid date',
        'any.required': 'Date is required',
      }),
    categoryId: Joi.number().integer().positive().required()
      .messages({
        'number.base': 'Category ID must be a number',
        'any.required': 'Category is required',
      }),
    description: Joi.string().max(255).allow('').optional(),
    paymentMethod: Joi.string()
      .valid('Cash', 'Card', 'Bank Transfer', 'Digital Wallet', 'Other')
      .required()
      .messages({
        'any.only': 'Invalid payment method',
        'any.required': 'Payment method is required',
      }),
    location: Joi.string().max(500).allow('').optional(),
    isRecurring: Joi.boolean().optional(),
    recurringFrequency: Joi.string()
      .valid('daily', 'weekly', 'monthly', 'yearly')
      .optional(),
    userId: Joi.number().integer().positive().optional(),
    originalCurrency: Joi.string()
      .valid('USD', 'EUR', 'GBP', 'XAF')
      .optional()
      .default('USD')
      .messages({
        'any.only': 'Currency must be one of: USD, EUR, GBP, XAF',
      }),
  }),

  update: Joi.object({
    amount: Joi.number().positive().precision(2).optional(),
    date: Joi.date().iso().optional(),
    categoryId: Joi.number().integer().positive().optional(),
    description: Joi.string().max(255).allow('').optional(),
    paymentMethod: Joi.string()
      .valid('Cash', 'Card', 'Bank Transfer', 'Digital Wallet', 'Other')
      .optional(),
    location: Joi.string().max(500).allow('').optional(),
    isRecurring: Joi.boolean().optional(),
    recurringFrequency: Joi.string()
      .valid('daily', 'weekly', 'monthly', 'yearly')
      .optional(),
    originalCurrency: Joi.string()
      .valid('USD', 'EUR', 'GBP', 'XAF')
      .optional()
      .messages({
        'any.only': 'Currency must be one of: USD, EUR, GBP, XAF',
      }),
  }).min(1), // At least one field must be provided

  query: Joi.object({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    categoryId: Joi.number().integer().positive().optional(),
    searchTerm: Joi.string().max(100).optional(),
    minAmount: Joi.number().positive().optional(),
    maxAmount: Joi.number().positive().optional(),
    limit: Joi.number().integer().min(1).max(1000).default(100),
    offset: Joi.number().integer().min(0).default(0),
  }),
};

/**
 * Category Validation Schemas
 * FR-2.2: Validate category data
 */
export const categorySchemas = {
  create: Joi.object({
    name: Joi.string().min(1).max(50).required()
      .messages({
        'string.empty': 'Category name cannot be empty',
        'any.required': 'Category name is required',
      }),
    color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).required()
      .messages({
        'string.pattern.base': 'Color must be a valid hex color (e.g., #3B82F6)',
        'any.required': 'Color is required',
      }),
    icon: Joi.string().max(50).optional(),
  }),

  update: Joi.object({
    name: Joi.string().min(1).max(50).optional(),
    color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).optional(),
    icon: Joi.string().max(50).optional(),
  }).min(1),
};

/**
 * Budget Validation Schemas
 * FR-3.1-3.2: Validate budget data
 */
export const budgetSchemas = {
  create: Joi.object({
    amount: Joi.number().positive().precision(2).required()
      .messages({
        'number.positive': 'Budget amount must be positive',
        'any.required': 'Budget amount is required',
      }),
    categoryId: Joi.number().integer().positive().allow(null).optional(),
    month: Joi.number().integer().min(1).max(12).required()
      .messages({
        'number.min': 'Month must be between 1 and 12',
        'number.max': 'Month must be between 1 and 12',
        'any.required': 'Month is required',
      }),
    year: Joi.number().integer().min(2000).max(2100).required()
      .messages({
        'number.min': 'Year must be between 2000 and 2100',
        'number.max': 'Year must be between 2000 and 2100',
        'any.required': 'Year is required',
      }),
    userId: Joi.number().integer().positive().optional(),
  }),

  update: Joi.object({
    amount: Joi.number().positive().precision(2).optional(),
    month: Joi.number().integer().min(1).max(12).optional(),
    year: Joi.number().integer().min(2000).max(2100).optional(),
  }).min(1),

  query: Joi.object({
    month: Joi.number().integer().min(1).max(12).optional(),
    year: Joi.number().integer().min(2000).max(2100).optional(),
    categoryId: Joi.number().integer().positive().optional(),
  }),
};

/**
 * Authentication Validation Schemas
 * NFR-S2: Password validation
 */
export const authSchemas = {
  setupPassword: Joi.object({
    password: Joi.string().min(8).max(100).required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'any.required': 'Password is required',
      }),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required()
      .messages({
        'any.only': 'Passwords must match',
        'any.required': 'Password confirmation is required',
      }),
  }),

  login: Joi.object({
    password: Joi.string().required()
      .messages({
        'any.required': 'Password is required',
      }),
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required()
      .messages({
        'any.required': 'Current password is required',
      }),
    newPassword: Joi.string().min(8).max(100).required()
      .messages({
        'string.min': 'New password must be at least 8 characters long',
        'any.required': 'New password is required',
      }),
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
      .messages({
        'any.only': 'Passwords must match',
        'any.required': 'Password confirmation is required',
      }),
  }),
};

/**
 * ID Parameter Validation
 */
export const idSchema = Joi.object({
  id: Joi.number().integer().positive().required()
    .messages({
      'number.base': 'ID must be a number',
      'number.positive': 'ID must be positive',
      'any.required': 'ID is required',
    }),
});

export default {
  validate,
  expenseSchemas,
  categorySchemas,
  budgetSchemas,
  authSchemas,
  idSchema,
};
