import React, { useState, useEffect } from 'react';
import Select from '../../../components/ui/Select';
import PreferenceSection from './PreferenceSection';

const DateFormatSettings = () => {
  const [selectedFormat, setSelectedFormat] = useState('DD/MM/YYYY');

  const formatOptions = [
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY', description: 'Day/Month/Year (European)' },
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY', description: 'Month/Day/Year (US)' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD', description: 'Year-Month-Day (ISO)' },
    { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY', description: 'Day-Month-Year (Dash)' }
  ];

  useEffect(() => {
    const savedFormat = localStorage.getItem('dateFormat') || 'DD/MM/YYYY';
    setSelectedFormat(savedFormat);
  }, []);

  const handleFormatChange = (value) => {
    setSelectedFormat(value);
    localStorage.setItem('dateFormat', value);
  };

  const formatDateExample = (format) => {
    const today = new Date();
    const day = today?.getDate()?.toString()?.padStart(2, '0');
    const month = (today?.getMonth() + 1)?.toString()?.padStart(2, '0');
    const year = today?.getFullYear();

    switch (format) {
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`;
      case 'MM/DD/YYYY':
        return `${month}/${day}/${year}`;
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      case 'DD-MM-YYYY':
        return `${day}-${month}-${year}`;
      default:
        return `${day}/${month}/${year}`;
    }
  };

  return (
    <PreferenceSection
      title="Date Format"
      description="Choose how dates are displayed throughout the application"
      icon="Calendar"
    >
      <div className="space-y-4">
        <Select
          label="Date Display Format"
          description="This format will be used for all date displays and inputs"
          options={formatOptions}
          value={selectedFormat}
          onChange={handleFormatChange}
        />
        
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Today's Date:</span>
            <span className="text-lg font-semibold text-primary">
              {formatDateExample(selectedFormat)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Preview of how dates will appear in your expense entries
          </p>
        </div>
      </div>
    </PreferenceSection>
  );
};

export default DateFormatSettings;