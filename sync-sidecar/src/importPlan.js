import { reportDefinitions } from './reportDefinitions.js';

export function buildImportPlan() {
  return {
    expectedReports: reportDefinitions.map((report) => report.outputFileName),
    appTargets: [
      'src/context/DataContext importFills() <- fills.csv',
      'src/context/DataContext importData() <- performance.csv',
      'src/context/DataContext importData() <- account-balance-history.csv (optional balance history supplement)',
    ],
    accountHandling: {
      preserveSeparateAccounts: true,
      note: 'One Tradovate login can contain multiple trading accounts. Imports should stay account-specific, especially for PA Apex accounts.',
    },
    note: 'The sidecar now reflects the confirmed manual workflow: Reports -> Fills/Performance -> Date dropdown -> This Year -> Download CSV. Live selectors may still need local tuning against a real authenticated Tradovate session.',
  };
}
