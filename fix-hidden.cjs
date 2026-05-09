const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const cheerioCloningTarget = `      const $clone = $el.clone();
      $clone.find('script, style, svg, noscript, nav, header, footer').remove();`;

const cheerioCloningFix = `      const $clone = $el.clone();
      $clone.find('script, style, svg, noscript, nav, header, footer').remove();
      $clone.find('[style*="display: none"], [style*="display:none"], [aria-hidden="true"], .cdk-visually-hidden, .sr-only').remove();`;

if (!content.includes('.cdk-visually-hidden')) {
    content = content.replace(cheerioCloningTarget, cheerioCloningFix);
    fs.writeFileSync('server.ts', content);
}
