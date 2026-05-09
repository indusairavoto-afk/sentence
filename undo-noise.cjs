const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const cheerioNoiseTarget = `$clone.find('[style*="display: none"], [style*="display:none"], [aria-hidden="true"], .cdk-visually-hidden, .sr-only').remove();`;
const cheerioNoiseRepl = `// $clone.find('[style*="display: none"], [style*="display:none"], [aria-hidden="true"], .cdk-visually-hidden, .sr-only').remove();`;

content = content.replace(cheerioNoiseTarget, cheerioNoiseRepl);

fs.writeFileSync('server.ts', content);
