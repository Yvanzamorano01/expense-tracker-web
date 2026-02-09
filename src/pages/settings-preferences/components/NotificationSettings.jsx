import React, { useState, useEffect } from 'react';
import { Checkbox } from '../../../components/ui/Checkbox';
import Input from '../../../components/ui/Input';
import PreferenceSection from './PreferenceSection';

const NotificationSettings = () => {
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [spendingThreshold, setSpendingThreshold] = useState(80);
  const [dailyReminders, setDailyReminders] = useState(false);
  const [weeklyReports, setWeeklyReports] = useState(true);
  const [monthlyReports, setMonthlyReports] = useState(true);

  useEffect(() => {
    const savedSettings = localStorage.getItem('notificationSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setBudgetAlerts(settings?.budgetAlerts ?? true);
      setSpendingThreshold(settings?.spendingThreshold ?? 80);
      setDailyReminders(settings?.dailyReminders ?? false);
      setWeeklyReports(settings?.weeklyReports ?? true);
      setMonthlyReports(settings?.monthlyReports ?? true);
    }
  }, []);

  const saveSettings = () => {
    const settings = {
      budgetAlerts,
      spendingThreshold,
      dailyReminders,
      weeklyReports,
      monthlyReports
    };
    localStorage.setItem('notificationSettings', JSON.stringify(settings));
  };

  useEffect(() => {
    saveSettings();
  }, [budgetAlerts, spendingThreshold, dailyReminders, weeklyReports, monthlyReports]);

  return (
    <PreferenceSection
      title="Notification Settings"
      description="Configure alerts and reminders for better expense management"
      icon="Bell"
    >
      <div className="space-y-6">
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground">Budget Alerts</h4>
          
          <Checkbox
            label="Enable budget alerts"
            description="Get notified when approaching or exceeding budget limits"
            checked={budgetAlerts}
            onChange={(e) => setBudgetAlerts(e?.target?.checked)}
          />
          
          {budgetAlerts && (
            <div className="ml-6 space-y-2">
              <Input
                label="Alert Threshold (%)"
                type="number"
                min="50"
                max="100"
                value={spendingThreshold}
                onChange={(e) => setSpendingThreshold(Number(e?.target?.value))}
                description={`Alert when spending reaches ${spendingThreshold}% of budget`}
              />
            </div>
          )}
        </div>

        <div className="border-t border-border pt-6">
          <h4 className="text-sm font-semibold text-foreground mb-4">Expense Reminders</h4>
          
          <div className="space-y-3">
            <Checkbox
              label="Daily expense reminders"
              description="Remind me to log expenses at the end of each day"
              checked={dailyReminders}
              onChange={(e) => setDailyReminders(e?.target?.checked)}
            />
            
            <Checkbox
              label="Weekly spending reports"
              description="Receive weekly summaries of spending patterns"
              checked={weeklyReports}
              onChange={(e) => setWeeklyReports(e?.target?.checked)}
            />
            
            <Checkbox
              label="Monthly financial reports"
              description="Get detailed monthly expense and budget analysis"
              checked={monthlyReports}
              onChange={(e) => setMonthlyReports(e?.target?.checked)}
            />
          </div>
        </div>
      </div>
    </PreferenceSection>
  );
};

export default NotificationSettings;