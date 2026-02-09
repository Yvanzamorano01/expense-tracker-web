import { Category } from '../models';

/**
 * Default Categories Seeder
 * FR-2.1: System shall provide predefined expense categories
 */

export interface DefaultCategory {
  name: string;
  color: string;
  icon: string;
  isDefault: boolean;
}

export const defaultCategories: DefaultCategory[] = [
  {
    name: 'Food & Dining',
    color: '#EF4444',
    icon: 'Utensils',
    isDefault: true,
  },
  {
    name: 'Transportation',
    color: '#3B82F6',
    icon: 'Car',
    isDefault: true,
  },
  {
    name: 'Housing',
    color: '#8B5CF6',
    icon: 'Home',
    isDefault: true,
  },
  {
    name: 'Entertainment',
    color: '#EC4899',
    icon: 'Film',
    isDefault: true,
  },
  {
    name: 'Healthcare',
    color: '#10B981',
    icon: 'Heart',
    isDefault: true,
  },
  {
    name: 'Shopping',
    color: '#F59E0B',
    icon: 'ShoppingBag',
    isDefault: true,
  },
  {
    name: 'Utilities',
    color: '#6366F1',
    icon: 'Zap',
    isDefault: true,
  },
  {
    name: 'Education',
    color: '#14B8A6',
    icon: 'BookOpen',
    isDefault: true,
  },
  {
    name: 'Bills & Subscriptions',
    color: '#F97316',
    icon: 'FileText',
    isDefault: true,
  },
  {
    name: 'Travel',
    color: '#06B6D4',
    icon: 'Plane',
    isDefault: true,
  },
  {
    name: 'Personal Care',
    color: '#A855F7',
    icon: 'Sparkles',
    isDefault: true,
  },
  {
    name: 'Gifts & Donations',
    color: '#EC4899',
    icon: 'Gift',
    isDefault: true,
  },
  {
    name: 'Uncategorized',
    color: '#6B7280',
    icon: 'HelpCircle',
    isDefault: true,
  },
];

/**
 * Seed default categories into the database
 * @returns Number of categories created
 */
export const seedDefaultCategories = async (): Promise<number> => {
  try {
    let createdCount = 0;

    for (const categoryData of defaultCategories) {
      // Check if category already exists
      const existing = await Category.findOne({
        where: { name: categoryData.name },
      });

      if (!existing) {
        await Category.create(categoryData);
        createdCount++;
        console.log(`✓ Created default category: ${categoryData.name}`);
      }
    }

    if (createdCount > 0) {
      console.log(`✓ Seeded ${createdCount} default categories`);
    } else {
      console.log('✓ Default categories already exist');
    }

    return createdCount;
  } catch (error) {
    console.error('✗ Error seeding default categories:', error);
    throw error;
  }
};

/**
 * Get "Uncategorized" category ID
 * Used when deleting categories (FR-2.4)
 * @returns Category ID or null
 */
export const getUncategorizedCategoryId = async (): Promise<number | null> => {
  const uncategorized = await Category.findOne({
    where: { name: 'Uncategorized' },
  });

  return uncategorized ? uncategorized.categoryId : null;
};

export default {
  defaultCategories,
  seedDefaultCategories,
  getUncategorizedCategoryId,
};
