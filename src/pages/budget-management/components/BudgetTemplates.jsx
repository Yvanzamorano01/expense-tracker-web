import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { useCurrency } from '../../../hooks/useCurrency';

const BudgetTemplates = ({ templates, onTemplateApply, onTemplateCreate, onTemplateDelete }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const { formatFromUSD } = useCurrency();

  const handleCreateTemplate = () => {
    if (templateName?.trim()) {
      onTemplateCreate({
        name: templateName,
        description: templateDescription,
        timestamp: new Date()?.toISOString()
      });
      setTemplateName('');
      setTemplateDescription('');
      setIsCreating(false);
    }
  };

  const calculateTotalBudget = (template) => {
    return template?.categories?.reduce((sum, cat) => sum + cat?.budget, 0);
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Budget Templates</h3>
        <Button
          variant="outline"
          onClick={() => setIsCreating(true)}
          iconName="Plus"
          iconPosition="left"
          iconSize={16}
        >
          Create Template
        </Button>
      </div>
      {/* Create Template Form */}
      {isCreating && (
        <div className="mb-6 p-4 bg-muted/50 rounded-lg border border-border">
          <h4 className="font-medium text-foreground mb-4">Create New Template</h4>
          <div className="space-y-4">
            <Input
              label="Template Name"
              value={templateName}
              onChange={(e) => setTemplateName(e?.target?.value)}
              placeholder="e.g., Conservative Budget, Student Budget"
              required
            />
            <Input
              label="Description"
              value={templateDescription}
              onChange={(e) => setTemplateDescription(e?.target?.value)}
              placeholder="Brief description of this budget template"
            />
            <div className="flex space-x-2">
              <Button variant="default" onClick={handleCreateTemplate}>
                Save Template
              </Button>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Template List */}
      <div className="space-y-4">
        {templates?.length === 0 ? (
          <div className="text-center py-8">
            <Icon name="FileText" size={48} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No budget templates yet</p>
            <p className="text-sm text-muted-foreground">Create templates to quickly set up budgets</p>
          </div>
        ) : (
          templates?.map((template) => (
            <div
              key={template?.id}
              className="p-4 border border-border rounded-lg hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-medium text-foreground mb-1">{template?.name}</h4>
                  <p className="text-sm text-muted-foreground mb-2">{template?.description}</p>
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    <span>Total: {formatFromUSD(calculateTotalBudget(template))}</span>
                    <span>•</span>
                    <span>{template?.categories?.length} categories</span>
                    <span>•</span>
                    <span>Created {new Date(template.timestamp)?.toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex space-x-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onTemplateApply(template)}
                    iconName="Download"
                    iconPosition="left"
                    iconSize={14}
                  >
                    Apply
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onTemplateDelete(template?.id)}
                    className="h-8 w-8 text-error hover:text-error"
                  >
                    <Icon name="Trash2" size={14} />
                  </Button>
                </div>
              </div>

              {/* Template Categories Preview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 pt-3 border-t border-border">
                {template?.categories?.slice(0, 4)?.map((category) => (
                  <div key={category?.id} className="flex items-center space-x-2 text-sm">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category?.color }}
                    />
                    <span className="text-muted-foreground truncate">
                      {category?.name}: {formatFromUSD(category?.budget)}
                    </span>
                  </div>
                ))}
                {template?.categories?.length > 4 && (
                  <div className="text-sm text-muted-foreground">
                    +{template?.categories?.length - 4} more
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      {/* Quick Templates */}
      <div className="mt-6 pt-6 border-t border-border">
        <h4 className="font-medium text-foreground mb-4">Quick Start Templates</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
            <div className="flex items-center space-x-3 mb-2">
              <Icon name="Briefcase" size={20} className="text-primary" />
              <h5 className="font-medium text-foreground">Professional Budget</h5>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Balanced budget for working professionals with moderate spending
            </p>
            <div className="text-xs text-muted-foreground">
              Housing 30% • Food 15% • Transport 10% • Savings 20%
            </div>
          </div>

          <div className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
            <div className="flex items-center space-x-3 mb-2">
              <Icon name="GraduationCap" size={20} className="text-accent" />
              <h5 className="font-medium text-foreground">Student Budget</h5>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Tight budget focused on essentials for students and young adults
            </p>
            <div className="text-xs text-muted-foreground">
              Food 25% • Transport 15% • Education 20% • Entertainment 10%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetTemplates;