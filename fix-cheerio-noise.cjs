const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const cheerioTarget = `      let role: "user" | "assistant" | null = null;
      let timestamp: string | undefined = undefined;

      const innerText = $el
        .text()
        .replace(/\\s+/g, " ")
        .trim();
      if (!innerText) return;`;

const cheerioRepl = `      let role: "user" | "assistant" | null = null;
      let timestamp: string | undefined = undefined;

      // Make a clone to safely remove noise elements before extracting text
      const $clone = $el.clone();
      $clone.find('script, style, svg, noscript, nav, header, footer').remove();

      const innerText = $clone
        .text()
        .replace(/\\s+/g, " ")
        .trim();
      if (!innerText) return;`;

content = content.replace(cheerioTarget, cheerioRepl);

fs.writeFileSync('server.ts', content);
