import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Header from '../../components/ui/Header';
import BottomNavigation from '../../components/ui/BottomNavigation';
import FloatingActionButton from '../../components/ui/FloatingActionButton';
import CurrencySettings from './components/CurrencySettings';
import ThemeSettings from './components/ThemeSettings';
import DateFormatSettings from './components/DateFormatSettings';
import NotificationSettings from './components/NotificationSettings';
import DefaultCategorySettings from './components/DefaultCategorySettings';
import DataManagement from './components/DataManagement';
import AccessibilitySettings from './components/AccessibilitySettings';
import Icon from '../../components/AppIcon';

const SettingsPreferences = () => {
  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Settings & Preferences - ExpenseTracker Pro</title>
        <meta name="description" content="Customize your expense tracking experience with comprehensive settings and preferences" />
      </Helmet>
      <Header />
      <main className="pt-16 pb-20 lg:pb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Icon name="Settings" size={24} className="text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Settings & Preferences</h1>
                <p className="text-muted-foreground">
                  Customize your expense tracking experience and manage your data
                </p>
              </div>
            </div>
          </div>

          {/* Settings Grid */}
          <div className="space-y-8">
            {/* Row 1: Currency and Theme */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CurrencySettings />
              <ThemeSettings />
            </div>

            {/* Row 2: Date Format and Notifications */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DateFormatSettings />
              <NotificationSettings />
            </div>

            {/* Row 3: Default Settings (Full Width) */}
            <DefaultCategorySettings />

            {/* Row 4: Data Management and Accessibility */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DataManagement />
              <AccessibilitySettings />
            </div>

            {/* App Information */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon name="Info" size={20} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-foreground mb-2">About ExpenseTracker Pro</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>Version 1.0.0 • Built with React 18</p>
                    <p>Offline-first personal finance management application</p>
                    <p>All data is stored locally on your device for privacy and security</p>
                    <p className="text-xs mt-4">
                      © {new Date()?.getFullYear()} ExpenseTracker Pro. All rights reserved.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <BottomNavigation />
      <FloatingActionButton />
    </div>
  );
};

export default SettingsPreferences;