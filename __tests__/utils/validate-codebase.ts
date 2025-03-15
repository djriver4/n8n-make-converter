import { validateFixtures, generateFixtureReport } from './fixture-validator';
import { validateNodeMappings, generateMappingReport, generateMappingTemplate } from './mapping-validator';

/**
 * Main validation function that checks fixtures and node mappings
 */
export function validateCodebase(): boolean {
  console.log('='.repeat(80));
  console.log('CODEBASE VALIDATION\n');
  
  // Check fixtures
  const fixtureValidation = validateFixtures();
  console.log('FIXTURE VALIDATION:');
  console.log(`Status: ${fixtureValidation.valid ? '✅ PASSED' : '❌ FAILED'}`);
  
  if (!fixtureValidation.valid) {
    console.log('\nFixture issues:');
    fixtureValidation.errors.forEach(error => {
      console.log(`- ${error}`);
    });
  }
  
  // Generate fixture report
  const { report: fixtureReport } = generateFixtureReport();
  console.log('\n' + fixtureReport);
  
  // Check node mappings
  const mappingValidation = validateNodeMappings();
  console.log('\nNODE MAPPING VALIDATION:');
  console.log(`Status: ${mappingValidation.valid ? '✅ PASSED' : '❌ FAILED'}`);
  
  // Generate mapping report
  const mappingReport = generateMappingReport();
  console.log('\n' + mappingReport);
  
  // If there are missing mappings, provide templates for creating them
  if (!mappingValidation.valid) {
    console.log('\nFIX MISSING MAPPINGS:');
    
    if (mappingValidation.missing.n8nToMake.length > 0) {
      console.log('\nMissing n8n to Make mappings template:');
      
      mappingValidation.missing.n8nToMake.forEach(nodeType => {
        console.log(generateMappingTemplate(nodeType, 'n8nToMake'));
        console.log('');
      });
    }
    
    if (mappingValidation.missing.makeToN8n.length > 0) {
      console.log('\nMissing Make to n8n mappings template:');
      
      mappingValidation.missing.makeToN8n.forEach(moduleType => {
        console.log(generateMappingTemplate(moduleType, 'makeToN8n'));
        console.log('');
      });
    }
  }
  
  console.log('='.repeat(80));
  
  // Return true if all validations passed
  return fixtureValidation.valid && mappingValidation.valid;
}

// Run the validation if this file is executed directly
if (require.main === module) {
  const valid = validateCodebase();
  process.exit(valid ? 0 : 1);
} 