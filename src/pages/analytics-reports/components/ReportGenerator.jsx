import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import { Checkbox } from '../../../components/ui/Checkbox';
import Icon from '../../../components/AppIcon';
import { loadExpenses, loadCategories } from '../../../utils/dataHelpers';
import { generateReportData } from '../../../utils/reportGenerator';
import { useCurrency } from '../../../hooks/useCurrency';

const ReportGenerator = ({ categories, onGenerateReport }) => {
  const { formatAmount } = useCurrency();
  const [reportConfig, setReportConfig] = useState({
    type: 'summary',
    dateRange: 'month',
    startDate: '',
    endDate: '',
    includeCharts: true,
    includeTransactions: false,
    format: 'pdf'
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewConfigSnapshot, setPreviewConfigSnapshot] = useState(null);
  const [reportGenerated, setReportGenerated] = useState(false);

  const dateRangeOptions = [
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const formatOptions = [
    { value: 'pdf', label: 'PDF Document' },
    { value: 'csv', label: 'CSV Spreadsheet' },
    { value: 'json', label: 'JSON Data' }
  ];

  const reportTypeOptions = [
    { value: 'summary', label: 'Summary Report' }
  ];

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    setReportGenerated(false);
    try {
      await onGenerateReport(reportConfig);
      setReportGenerated(true);
      
      // Show success notification
      setTimeout(() => {
        alert(`Report generated successfully! Format: ${reportConfig?.format?.toUpperCase()}`);
      }, 100);
      
    } catch (error) {
      alert('Error generating report. Please try again.');
      console.error('Report generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreviewReport = async () => {
    setIsPreviewing(true);
    try {
      // Capture current config snapshot for staleness detection
      setPreviewConfigSnapshot(JSON.parse(JSON.stringify(reportConfig)));

      // Load real data
      const allExpenses = loadExpenses();
      const allCategories = loadCategories();

      // Generate real report data based on current config
      const reportData = generateReportData(reportConfig, allExpenses, allCategories);

      // Format preview data
      const previewDataFormatted = {
        title: `Summary Report - ${dateRangeOptions?.find(opt => opt?.value === reportConfig?.dateRange)?.label || 'Custom Period'}`,
        summary: {
          totalExpenses: reportData.summary.totalExpenses,
          transactionCount: reportData.summary.transactionCount,
          averageTransaction: reportData.summary.averageTransaction,
          period: reportConfig?.dateRange,
          categoriesIncluded: reportData.categoryBreakdown.length,
          includeCharts: reportConfig?.includeCharts,
          includeTransactions: reportConfig?.includeTransactions
        },
        categoryBreakdown: reportData.categoryBreakdown,
        sections: [
          'Executive Summary',
          'Expense Overview',
          reportConfig?.includeCharts ? 'Visual Analytics' : null,
          'Category Breakdown',
          reportConfig?.includeTransactions ? 'Transaction Details' : null,
          'Insights & Recommendations'
        ]?.filter(Boolean)
      };

      setPreviewData(previewDataFormatted);
      setShowPreviewModal(true);
    } catch (error) {
      alert('Error generating preview. Please try again.');
      console.error('Preview generation error:', error);
    } finally {
      setIsPreviewing(false);
    }
  };

  const handlePrintReport = async () => {
    if (!reportGenerated) {
      alert('Please generate a report first before printing.');
      return;
    }
    
    try {
      // Mock print functionality
      window.print();
    } catch (error) {
      alert('Error printing report. Please try again.');
      console.error('Print error:', error);
    }
  };

  return (
    <>
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Icon name="FileText" size={24} className="text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Generate Report</h2>
        </div>
        
        {/* Success Message */}
        {reportGenerated && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <Icon name="CheckCircle" size={16} className="text-green-600" />
              <span className="text-green-800 text-sm font-medium">Report generated successfully!</span>
            </div>
          </div>
        )}

        {/* Recent Reports Stats */}
        <div className="mb-6 p-4 bg-muted/30 border border-border rounded-lg">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Icon name="FileText" size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Reports</p>
                <p className="text-lg font-semibold text-foreground">
                  {localStorage.getItem('totalReportsGenerated') || '0'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Icon name="Download" size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Last Generated</p>
                <p className="text-sm font-medium text-foreground">
                  {localStorage.getItem('lastReportDate')
                    ? new Date(localStorage.getItem('lastReportDate')).toLocaleDateString()
                    : 'Never'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Icon name="Settings" size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Preferred Format</p>
                <p className="text-sm font-medium text-foreground uppercase">
                  {localStorage.getItem('preferredFormat') || 'PDF'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Report Configuration */}
          <div className="space-y-4">
            <Select
              label="Date Range"
              options={dateRangeOptions}
              value={reportConfig?.dateRange}
              onChange={(value) => setReportConfig(prev => ({ ...prev, dateRange: value }))}
            />

            {reportConfig?.dateRange === 'custom' && (
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Start Date"
                  type="date"
                  value={reportConfig?.startDate}
                  onChange={(e) => setReportConfig(prev => ({ ...prev, startDate: e?.target?.value }))}
                />
                <Input
                  label="End Date"
                  type="date"
                  value={reportConfig?.endDate}
                  onChange={(e) => setReportConfig(prev => ({ ...prev, endDate: e?.target?.value }))}
                />
              </div>
            )}

            <Select
              label="Export Format"
              options={formatOptions}
              value={reportConfig?.format}
              onChange={(value) => setReportConfig(prev => ({ ...prev, format: value }))}
            />
          </div>

          {/* Report Options */}
          <div className="space-y-4">
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground">Report Options</h4>

              <Checkbox
                label="Include Charts & Visualizations"
                description="Add pie, bar, line, and budget comparison charts to your report"
                checked={reportConfig?.includeCharts}
                onChange={(e) => setReportConfig(prev => ({ ...prev, includeCharts: e?.target?.checked }))}
              />

              <Checkbox
                label="Include Transaction Details"
                description="Add a detailed table of all individual transactions in the selected period"
                checked={reportConfig?.includeTransactions}
                onChange={(e) => setReportConfig(prev => ({ ...prev, includeTransactions: e?.target?.checked }))}
              />
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-border">
          <Button
            onClick={handleGenerateReport}
            loading={isGenerating}
            iconName="Download"
            iconPosition="left"
            className="flex-1 sm:flex-none"
          >
            {isGenerating ? 'Generating...' : 'Generate Report'}
          </Button>

          <Button
            variant="outline"
            onClick={handlePreviewReport}
            loading={isPreviewing}
            iconName="Eye"
            iconPosition="left"
            className="flex-1 sm:flex-none"
          >
            {isPreviewing ? 'Loading...' : 'Preview Report'}
          </Button>

          <Button
            variant="ghost"
            onClick={handlePrintReport}
            iconName="Printer"
            iconPosition="left"
            className="flex-1 sm:flex-none"
          >
            Print Report
          </Button>
        </div>

        {/* Report Templates */}
        <div className="mt-6 pt-6 border-t border-border">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-foreground">Quick Templates</h4>
            <Icon name="Zap" size={16} className="text-muted-foreground" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setReportConfig(prev => ({
                  ...prev,
                  dateRange: 'month',
                  includeCharts: true,
                  includeTransactions: false,
                  format: 'pdf'
                }));
              }}
              className="flex flex-col items-start p-4 h-auto"
            >
              <div className="flex items-center space-x-2 mb-1">
                <Icon name="Calendar" size={16} />
                <span className="font-medium">Monthly Summary</span>
              </div>
              <span className="text-xs text-muted-foreground text-left">
                Current month with charts, no transactions
              </span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setReportConfig(prev => ({
                  ...prev,
                  dateRange: 'quarter',
                  includeCharts: true,
                  includeTransactions: true,
                  format: 'pdf'
                }));
              }}
              className="flex flex-col items-start p-4 h-auto"
            >
              <div className="flex items-center space-x-2 mb-1">
                <Icon name="TrendingUp" size={16} />
                <span className="font-medium">Quarterly Report</span>
              </div>
              <span className="text-xs text-muted-foreground text-left">
                Full quarter with charts and transactions
              </span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setReportConfig(prev => ({
                  ...prev,
                  dateRange: 'year',
                  includeCharts: true,
                  includeTransactions: false,
                  format: 'pdf'
                }));
              }}
              className="flex flex-col items-start p-4 h-auto"
            >
              <div className="flex items-center space-x-2 mb-1">
                <Icon name="Calendar" size={16} />
                <span className="font-medium">Annual Overview</span>
              </div>
              <span className="text-xs text-muted-foreground text-left">
                Yearly summary with charts only
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreviewModal && previewData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground">Report Preview</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreviewModal(false)}
                  iconName="X"
                />
              </div>

              {/* Staleness Warning */}
              {previewConfigSnapshot && JSON.stringify(reportConfig) !== JSON.stringify(previewConfigSnapshot) && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Icon name="AlertTriangle" size={16} className="text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-yellow-800 text-sm font-medium">Configuration Changed</p>
                      <p className="text-yellow-700 text-xs mt-1">
                        The report configuration has been modified since this preview was generated.
                        Click "Preview Report" again to see updated results.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-foreground mb-2">{previewData?.title}</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Total Expenses: {formatAmount(previewData?.summary?.totalExpenses || 0)}</p>
                    <p>Transaction Count: {previewData?.summary?.transactionCount}</p>
                    <p>Average Transaction: {formatAmount(previewData?.summary?.averageTransaction || 0)}</p>
                    <p>Period: {previewData?.summary?.period}</p>
                    <p>Categories Included: {previewData?.summary?.categoriesIncluded}</p>
                    <p>Charts Included: {previewData?.summary?.includeCharts ? 'Yes' : 'No'}</p>
                    <p>Transactions Included: {previewData?.summary?.includeTransactions ? 'Yes' : 'No'}</p>
                  </div>
                </div>

                {previewData?.categoryBreakdown && previewData?.categoryBreakdown?.length > 0 && (
                  <div>
                    <h5 className="font-medium text-foreground mb-2">Top Categories</h5>
                    <div className="space-y-1">
                      {previewData?.categoryBreakdown?.slice(0, 3)?.map((cat, index) => (
                        <div key={index} className="text-sm text-muted-foreground flex items-center justify-between">
                          <span>{cat.category}</span>
                          <span className="font-medium">{formatAmount(cat.spent || 0)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h5 className="font-medium text-foreground mb-2">Report Sections</h5>
                  <ul className="space-y-1">
                    {previewData?.sections?.map((section, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-center space-x-2">
                        <Icon name="CheckCircle" size={12} className="text-green-600" />
                        <span>{section}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => setShowPreviewModal(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setShowPreviewModal(false);
                    handleGenerateReport();
                  }}
                  iconName="Download"
                  iconPosition="left"
                >
                  Generate Report
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ReportGenerator;