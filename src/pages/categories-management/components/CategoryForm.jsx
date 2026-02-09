import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { useCurrency } from '../../../hooks/useCurrency';

const CategoryForm = ({ category, onSave, onCancel, isOpen }) => {
  const { formatAmount } = useCurrency();

  const [formData, setFormData] = useState({
    name: '',
    color: '#3B82F6',
    icon: 'Tag',
    budget: ''
  });
  const [errors, setErrors] = useState({});

  const availableIcons = [
    'Tag', 'ShoppingCart', 'Car', 'Home', 'Utensils', 'Gamepad2',
    'Plane', 'Heart', 'GraduationCap', 'Briefcase', 'Coffee', 'Gift',
    'Music', 'Camera', 'Book', 'Dumbbell', 'Smartphone', 'Laptop'
  ];

  const predefinedColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];

  useEffect(() => {
    if (category) {
      setFormData({
        name: category?.name || '',
        color: category?.color || '#3B82F6',
        icon: category?.icon || 'Tag',
        budget: category?.budget?.toString() || ''
      });
    } else {
      setFormData({
        name: '',
        color: '#3B82F6',
        icon: 'Tag',
        budget: ''
      });
    }
    setErrors({});
  }, [category, isOpen]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors?.[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData?.name?.trim()) {
      newErrors.name = 'Category name is required';
    } else if (formData?.name?.trim()?.length < 2) {
      newErrors.name = 'Category name must be at least 2 characters';
    }

    if (formData?.budget && (isNaN(formData?.budget) || parseFloat(formData?.budget) < 0)) {
      newErrors.budget = 'Budget must be a valid positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (validateForm()) {
      const categoryData = {
        ...formData,
        budget: formData?.budget ? parseFloat(formData?.budget) : 0,
        name: formData?.name?.trim()
      };
      onSave(categoryData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-modal p-4">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">
              {category ? 'Edit Category' : 'Add New Category'}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancel}
              className="h-8 w-8"
            >
              <Icon name="X" size={16} />
            </Button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Category Name */}
            <Input
              label="Category Name"
              type="text"
              placeholder="Enter category name"
              value={formData?.name}
              onChange={(e) => handleInputChange('name', e?.target?.value)}
              error={errors?.name}
              required
            />

            {/* Icon Selection */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Choose Icon
              </label>
              <div className="grid grid-cols-6 gap-2">
                {availableIcons?.map((iconName) => (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => handleInputChange('icon', iconName)}
                    className={`p-3 rounded-lg border-2 transition-colors duration-150 ${
                      formData?.icon === iconName
                        ? 'border-primary bg-primary/10' :'border-border hover:border-primary/50'
                    }`}
                  >
                    <Icon name={iconName} size={20} color={formData?.icon === iconName ? 'var(--color-primary)' : 'currentColor'} />
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selection */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Choose Color
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {predefinedColors?.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleInputChange('color', color)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform duration-150 ${
                      formData?.color === color
                        ? 'border-foreground scale-110'
                        : 'border-border hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <Input
                type="color"
                value={formData?.color}
                onChange={(e) => handleInputChange('color', e?.target?.value)}
                className="w-full h-10"
              />
            </div>

            {/* Budget */}
            <Input
              label="Monthly Budget (Optional)"
              type="number"
              placeholder="0.00"
              value={formData?.budget}
              onChange={(e) => handleInputChange('budget', e?.target?.value)}
              error={errors?.budget}
              min="0"
              step="0.01"
            />

            {/* Preview */}
            <div className="bg-muted rounded-lg p-4">
              <p className="text-sm font-medium text-foreground mb-2">Preview</p>
              <div className="flex items-center space-x-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: formData?.color }}
                >
                  <Icon name={formData?.icon} size={20} color="white" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {formData?.name || 'Category Name'}
                  </p>
                  {formData?.budget && (
                    <p className="text-sm text-muted-foreground">
                      Budget: {formatAmount(parseFloat(formData?.budget) || 0)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
              >
                {category ? 'Update Category' : 'Create Category'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CategoryForm;