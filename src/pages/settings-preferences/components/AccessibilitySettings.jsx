import React, { useState, useEffect } from 'react';
import { Checkbox } from '../../../components/ui/Checkbox';
import Select from '../../../components/ui/Select';
import PreferenceSection from './PreferenceSection';

const AccessibilitySettings = () => {
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [fontSize, setFontSize] = useState('default');
  const [keyboardShortcuts, setKeyboardShortcuts] = useState(true);

  const fontSizeOptions = [
    { value: 'small', label: 'Small', description: '90% of default size' },
    { value: 'default', label: 'Default', description: 'Standard text size' },
    { value: 'large', label: 'Large', description: '110% of default size' },
    { value: 'extra-large', label: 'Extra Large', description: '125% of default size' }
  ];

  useEffect(() => {
    const savedSettings = localStorage.getItem('accessibilitySettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setHighContrast(settings?.highContrast ?? false);
      setReducedMotion(settings?.reducedMotion ?? false);
      setFontSize(settings?.fontSize ?? 'default');
      setKeyboardShortcuts(settings?.keyboardShortcuts ?? true);
    }
  }, []);

  const saveSettings = () => {
    const settings = {
      highContrast,
      reducedMotion,
      fontSize,
      keyboardShortcuts
    };
    localStorage.setItem('accessibilitySettings', JSON.stringify(settings));
  };

  useEffect(() => {
    saveSettings();
    
    // Apply accessibility settings
    const root = document.documentElement;
    
    if (highContrast) {
      root.classList?.add('high-contrast');
    } else {
      root.classList?.remove('high-contrast');
    }
    
    if (reducedMotion) {
      root.classList?.add('reduced-motion');
    } else {
      root.classList?.remove('reduced-motion');
    }
    
    // Apply font size
    root.classList?.remove('font-small', 'font-large', 'font-extra-large');
    if (fontSize !== 'default') {
      root.classList?.add(`font-${fontSize}`);
    }
  }, [highContrast, reducedMotion, fontSize, keyboardShortcuts]);

  return (
    <PreferenceSection
      title="Accessibility Settings"
      description="Customize the interface for better accessibility and usability"
      icon="Eye"
    >
      <div className="space-y-6">
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground">Visual Preferences</h4>
          
          <Checkbox
            label="High contrast mode"
            description="Increase contrast for better visibility"
            checked={highContrast}
            onChange={(e) => setHighContrast(e?.target?.checked)}
          />
          
          <Checkbox
            label="Reduce motion"
            description="Minimize animations and transitions"
            checked={reducedMotion}
            onChange={(e) => setReducedMotion(e?.target?.checked)}
          />
          
          <Select
            label="Font Size"
            description="Adjust text size for better readability"
            options={fontSizeOptions}
            value={fontSize}
            onChange={setFontSize}
          />
        </div>

        <div className="border-t border-border pt-6 space-y-4">
          <h4 className="text-sm font-semibold text-foreground">Navigation Preferences</h4>
          
          <Checkbox
            label="Enable keyboard shortcuts"
            description="Use keyboard shortcuts for faster navigation"
            checked={keyboardShortcuts}
            onChange={(e) => setKeyboardShortcuts(e?.target?.checked)}
          />
          
          {keyboardShortcuts && (
            <div className="ml-6 bg-muted/50 rounded-lg p-4">
              <h5 className="text-sm font-medium text-foreground mb-3">Available Shortcuts</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Add expense</span>
                  <kbd className="px-2 py-1 bg-background border border-border rounded text-xs">Ctrl + N</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Search</span>
                  <kbd className="px-2 py-1 bg-background border border-border rounded text-xs">Ctrl + F</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Go to dashboard</span>
                  <kbd className="px-2 py-1 bg-background border border-border rounded text-xs">Ctrl + D</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Go to expenses</span>
                  <kbd className="px-2 py-1 bg-background border border-border rounded text-xs">Ctrl + E</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Go to analytics</span>
                  <kbd className="px-2 py-1 bg-background border border-border rounded text-xs">Ctrl + A</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Settings</span>
                  <kbd className="px-2 py-1 bg-background border border-border rounded text-xs">Ctrl + ,</kbd>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PreferenceSection>
  );
};

export default AccessibilitySettings;