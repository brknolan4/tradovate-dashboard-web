export const reportDefinitions = [
  {
    id: 'fills',
    label: 'Fills CSV',
    sourceArea: 'Reports',
    expectedFilePrefix: 'fills',
    outputFileName: 'fills.csv',
    navigation: {
      reportUrl: '',
      fallbackPath: '',
      reportLinkText: 'Fills',
      notes: 'Confirmed by user: Tradovate Reports section -> Fills -> Download CSV.',
    },
    filters: {
      datePresetLabel: 'This Year',
      dateControlNotes: 'Date control is a dropdown under the date field.',
    },
    selectors: {
      reportsEntry: [
        'text=/reports/i',
        'a:has-text("Reports")',
        'button:has-text("Reports")',
        '[role="tab"]:has-text("Reports")',
      ],
      reportLink: [
        'text=/^fills$/i',
        'a:has-text("Fills")',
        'button:has-text("Fills")',
      ],
      pageReady: [
        'text=/fills/i',
        '[data-testid="fills-report"]',
      ],
      dateDropdown: [
        'button:has-text("Date")',
        '[role="combobox"]',
        'select',
        'button[aria-haspopup="listbox"]',
      ],
      datePresetOption: [
        'text=/^This Year$/i',
        '[role="option"]:has-text("This Year")',
      ],
      exportButton: [
        'button:has-text("Download CSV")',
        'text=/download csv/i',
        'button:has-text("CSV")',
        '[data-testid="report-export"]',
      ],
    },
  },
  {
    id: 'performance',
    label: 'Performance CSV',
    sourceArea: 'Reports',
    expectedFilePrefix: 'performance',
    outputFileName: 'performance.csv',
    navigation: {
      reportUrl: '',
      fallbackPath: '',
      reportLinkText: 'Performance',
      notes: 'Confirmed by user: Tradovate Reports section -> Performance -> Download CSV.',
    },
    filters: {
      datePresetLabel: 'This Year',
      dateControlNotes: 'Date control is a dropdown under the date field.',
    },
    selectors: {
      reportsEntry: [
        'text=/reports/i',
        'a:has-text("Reports")',
        'button:has-text("Reports")',
        '[role="tab"]:has-text("Reports")',
      ],
      reportLink: [
        'text=/^performance$/i',
        'a:has-text("Performance")',
        'button:has-text("Performance")',
      ],
      pageReady: [
        'text=/performance/i',
        '[data-testid="performance-report"]',
      ],
      dateDropdown: [
        'button:has-text("Date")',
        '[role="combobox"]',
        'select',
        'button[aria-haspopup="listbox"]',
      ],
      datePresetOption: [
        'text=/^This Year$/i',
        '[role="option"]:has-text("This Year")',
      ],
      exportButton: [
        'button:has-text("Download CSV")',
        'text=/download csv/i',
        'button:has-text("CSV")',
        '[data-testid="report-export"]',
      ],
    },
  },
  {
    id: 'account-balance-history',
    label: 'Account Balance History CSV',
    sourceArea: 'Reports',
    expectedFilePrefix: 'account balance history',
    outputFileName: 'account-balance-history.csv',
    navigation: {
      reportUrl: '',
      fallbackPath: '',
      reportLinkText: 'Account Balance History',
      notes: 'Still supported for manual import and future automation, but not yet user-confirmed in the latest walkthrough.',
    },
    filters: {
      datePresetLabel: 'This Year',
    },
    selectors: {
      reportsEntry: [
        'text=/reports/i',
        'a:has-text("Reports")',
        'button:has-text("Reports")',
        '[role="tab"]:has-text("Reports")',
      ],
      reportLink: [
        'text=/account balance history/i',
        'a:has-text("Account Balance History")',
        'button:has-text("Account Balance History")',
      ],
      pageReady: [
        '[data-testid="account-balance-history-report"]',
        'text=/account balance history/i',
      ],
      dateDropdown: [
        'button:has-text("Date")',
        '[role="combobox"]',
        'select',
        'button[aria-haspopup="listbox"]',
      ],
      datePresetOption: [
        'text=/^This Year$/i',
        '[role="option"]:has-text("This Year")',
      ],
      exportButton: [
        'button:has-text("Download CSV")',
        'text=/download csv/i',
        'button:has-text("CSV")',
        '[data-testid="report-export"]',
      ],
    },
  },
];

export function getReportDefinition(reportId) {
  return reportDefinitions.find((report) => report.id === reportId) || null;
}
