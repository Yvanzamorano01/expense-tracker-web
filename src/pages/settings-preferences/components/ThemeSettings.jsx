import React, { useState, useEffect } from 'react';
import Select from '../../../components/ui/Select';
import PreferenceSection from './PreferenceSection';

const ThemeSettings = () => {
  const [selectedTheme, setSelectedTheme] = useState('light');

  const themeOptions = [
    { value: 'light', label: 'Light Mode', description: 'Clean and bright interface' },
    { value: 'dark', label: 'Dark Mode', description: 'Easy on the eyes in low light' },
    { value: 'auto', label: 'Auto (System)', description: 'Follows your system preference' }
  ];

  useEffect(() => {
    const savedTheme = localStorage.getItem('selectedTheme') || 'light';
    setSelectedTheme(savedTheme);
  }, []);

  const handleThemeChange = (value) => {
    setSelectedTheme(value);
    localStorage.setItem('selectedTheme', value);
    
    // Apply theme immediately
    if (value === 'dark') {
      document.documentElement?.classList?.add('dark');
    } else if (value === 'light') {
      document.documentElement?.classList?.remove('dark');
    } else {
      // Auto mode - check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)')?.matches;
      if (prefersDark) {
        document.documentElement?.classList?.add('dark');
      } else {
        document.documentElement?.classList?.remove('dark');
      }
    }
  };

  return (
    <PreferenceSection
      title="Theme & Appearance"
      description="Customize the visual appearance of your expense tracker"
      icon="Palette"
    >
      <div className="space-y-4">
        <Select
          label="Theme Mode"
          description="Choose how the application should appear"
          options={themeOptions}
          value={selectedTheme}
          onChange={handleThemeChange}
        />
        
        <div className="grid grid-cols-3 gap-3">
          {themeOptions?.map((theme) => (
            <div
              key={theme?.value}
              className={`relative p-3 rounded-lg border-2 cursor-pointer transition-all ${
                selectedTheme === theme?.value
                  ? 'border-primary bg-primary/5' :'border-border hover:border-primary/50'
              }`}
              onClick={() => handleThemeChange(theme?.value)}
            >
              <div className="text-center">
                <div className={`w-8 h-8 mx-auto mb-2 rounded ${
                  theme?.value === 'light' ? 'bg-white border border-gray-300' :
                  theme?.value === 'dark'? 'bg-gray-800' : 'bg-gradient-to-r from-white to-gray-800'
                }`} />
                <p className="text-xs font-medium text-foreground">{theme?.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PreferenceSection>
  );
};

export default ThemeSettings;