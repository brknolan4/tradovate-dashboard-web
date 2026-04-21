import { buildImportPlan } from '../importPlan.js';
import { reportDefinitions } from '../reportDefinitions.js';

console.log(JSON.stringify({
  ...buildImportPlan(),
  reports: reportDefinitions,
}, null, 2));
