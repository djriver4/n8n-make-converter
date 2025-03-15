import fs from 'fs';
import path from 'path';
import { loadFixture } from './test-helpers';

/**
 * Validates that fixture files exist and can be loaded
 */
export function validateFixtures(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const platforms = ['n8n', 'make'];
  const requiredFixtures = [
    'sample-workflow',
    'expected-workflow'
  ];

  let valid = true;

  // Check if fixture directories exist
  const fixtureBasePath = path.join(__dirname, '..', 'fixtures');
  
  if (!fs.existsSync(fixtureBasePath)) {
    errors.push(`Main fixtures directory not found at: ${fixtureBasePath}`);
    valid = false;
    return { valid, errors };
  }

  // Check platform directories
  for (const platform of platforms) {
    const platformPath = path.join(fixtureBasePath, platform);
    
    if (!fs.existsSync(platformPath)) {
      errors.push(`Platform directory not found: ${platformPath}`);
      valid = false;
      continue;
    }

    // Check required fixtures
    for (const fixtureName of requiredFixtures) {
      const fixturePath = path.join(platformPath, `${fixtureName}.json`);
      
      if (!fs.existsSync(fixturePath)) {
        errors.push(`Required fixture not found: ${fixturePath}`);
        valid = false;
        continue;
      }

      // Try to load and validate the fixture
      try {
        const fixture = loadFixture(platform as 'n8n' | 'make', fixtureName);
        
        if (!fixture) {
          errors.push(`Fixture is empty or null: ${platform}/${fixtureName}`);
          valid = false;
          continue;
        }

        // Validate structure based on platform
        if (platform === 'n8n') {
          if (!fixture.nodes || !Array.isArray(fixture.nodes)) {
            errors.push(`Invalid n8n workflow structure - nodes array missing: ${platform}/${fixtureName}`);
            valid = false;
          }
          if (!fixture.connections) {
            errors.push(`Invalid n8n workflow structure - connections missing: ${platform}/${fixtureName}`);
            valid = false;
          }
        } else if (platform === 'make') {
          // Make.com workflow needs modules/flow array
          if ((!fixture.modules && !fixture.flow) || 
              (fixture.modules && !Array.isArray(fixture.modules)) ||
              (fixture.flow && !Array.isArray(fixture.flow))) {
            errors.push(`Invalid Make workflow structure - modules/flow array missing: ${platform}/${fixtureName}`);
            valid = false;
          }
        }
      } catch (error) {
        errors.push(`Error loading fixture ${platform}/${fixtureName}: ${error instanceof Error ? error.message : String(error)}`);
        valid = false;
      }
    }
  }

  return { valid, errors };
}

/**
 * Generates reports about available fixtures
 */
export function generateFixtureReport(): { report: string; fixtureCount: number } {
  const fixtureBasePath = path.join(__dirname, '..', 'fixtures');
  let fixtureCount = 0;
  let report = 'Fixture Report:\n';

  // Check main fixtures directory
  report += `\nBase Fixtures:\n`;
  try {
    const files = fs.readdirSync(fixtureBasePath).filter(file => file.endsWith('.json'));
    report += files.map(file => `  - ${file}`).join('\n');
    fixtureCount += files.length;
  } catch (error) {
    report += `  Error reading directory: ${error instanceof Error ? error.message : String(error)}`;
  }

  // Check platform directories
  const platforms = ['n8n', 'make'];
  for (const platform of platforms) {
    report += `\n\n${platform.toUpperCase()} Fixtures:\n`;
    const platformPath = path.join(fixtureBasePath, platform);
    
    try {
      if (fs.existsSync(platformPath)) {
        const files = fs.readdirSync(platformPath).filter(file => file.endsWith('.json'));
        files.forEach(file => {
          report += `  - ${file}\n`;
          fixtureCount += 1;
          
          // Try to show info about this fixture
          try {
            const fixture = loadFixture(platform as 'n8n' | 'make', file.replace('.json', ''));
            if (platform === 'n8n') {
              report += `    Nodes: ${fixture.nodes?.length || 0}, `;
              report += `Connections: ${Object.keys(fixture.connections || {}).length}\n`;
            } else {
              report += `    Modules: ${fixture.flow?.length || fixture.modules?.length || 0}\n`;
            }
          } catch (error) {
            report += `    Error reading fixture: ${error instanceof Error ? error.message : String(error)}\n`;
          }
        });
      } else {
        report += `  Directory not found: ${platformPath}\n`;
      }
    } catch (error) {
      report += `  Error reading directory: ${error instanceof Error ? error.message : String(error)}\n`;
    }
  }

  return { report, fixtureCount };
} 