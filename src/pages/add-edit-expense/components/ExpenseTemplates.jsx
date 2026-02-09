import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ExpenseTemplates = ({ onSelectTemplate, onClose }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const templates = [
    {
      id: 1,
      name: "Morning Coffee",
      amount: "4.50",
      currency: "USD",
      category: "food-dining",
      paymentMethod: "credit-card",
      description: "Daily coffee from local cafe",
      icon: "Coffee"
    },
    {
      id: 2,
      name: "Lunch Break",
      amount: "12.00",
      currency: "USD",
      category: "food-dining",
      paymentMethod: "credit-card",
      description: "Lunch at office cafeteria",
      icon: "UtensilsCrossed"
    },
    {
      id: 3,
      name: "Gas Fill-up",
      amount: "45.00",
      currency: "USD",
      category: "transportation",
      paymentMethod: "debit-card",
      description: "Weekly gas station visit",
      icon: "Fuel"
    },
    {
      id: 4,
      name: "Grocery Shopping",
      amount: "85.00",
      currency: "USD",
      category: "shopping",
      paymentMethod: "debit-card",
      description: "Weekly grocery shopping",
      icon: "ShoppingCart"
    },
    {
      id: 5,
      name: "Movie Ticket",
      amount: "15.00",
      currency: "USD",
      category: "entertainment",
      paymentMethod: "credit-card",
      description: "Weekend movie entertainment",
      icon: "Film"
    },
    {
      id: 6,
      name: "Uber Ride",
      amount: "18.50",
      currency: "USD",
      category: "transportation",
      paymentMethod: "digital-wallet",
      description: "Ride to downtown",
      icon: "Car"
    }
  ];

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template?.id);
    onSelectTemplate({
      amount: template?.amount,
      currency: template?.currency,
      category: template?.category,
      paymentMethod: template?.paymentMethod,
      description: template?.description,
      date: new Date()?.toISOString()?.split('T')?.[0]
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-modal">
      <div className="bg-card rounded-lg border border-border w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Expense Templates</h3>
            <p className="text-sm text-muted-foreground">Choose a template to quickly add common expenses</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <Icon name="X" size={16} />
          </Button>
        </div>

        {/* Templates Grid */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {templates?.map((template) => (
              <div
                key={template?.id}
                onClick={() => handleSelectTemplate(template)}
                className="p-4 border border-border rounded-lg hover:bg-muted cursor-pointer transition-colors duration-150 group"
              >
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Icon name={template?.icon} size={20} className="text-primary" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-foreground truncate">{template?.name}</h4>
                      <span className="text-sm font-semibold text-primary">
                        ${template?.amount}
                      </span>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {template?.description}
                    </p>
                    
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <span className="capitalize">{template?.category?.replace('-', ' ')}</span>
                      <span>•</span>
                      <span className="capitalize">{template?.paymentMethod?.replace('-', ' ')}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/30">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Templates help you quickly add recurring expenses
            </p>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseTemplates;