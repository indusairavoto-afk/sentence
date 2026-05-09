const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// Puppeteer Text Patch
const pupTextFind = `              text: (el as HTMLElement).innerText || el.textContent || "",`;
const pupTextRepl = `              text: (() => {
                const clone = el.cloneNode(true) as HTMLElement;
                clone.querySelectorAll('script, style, svg, button, nav, header, footer, [aria-hidden="true"], .sr-only, .visually-hidden, .cdk-visually-hidden').forEach(n => n.remove());
                let t = clone.innerText || clone.textContent || "";
                t = t.replace(/Uploaded an image\\s*Uploaded an image/gi, "Uploaded an image");
                t = t.replace(/Show moreShow less/g, "");
                return t.trim();
              })(),`;
content = content.replace(pupTextFind, pupTextRepl);

// Cheerio Text Patch
const cheeTextFind = `        const content = convert($el.html() || "", {
          wordwrap: false,
          selectors: [{ selector: "pre", format: "dataTable" }],
        });`;
const cheeTextRepl = `        const $clone = $el.clone();
        $clone.find('script, style, svg, noscript, nav, header, footer, button, [aria-hidden="true"], .sr-only, .visually-hidden, .cdk-visually-hidden').remove();
        let content = convert($clone.html() || "", {
          wordwrap: false,
          selectors: [{ selector: "pre", format: "dataTable" }],
        });
        content = content.replace(/Uploaded an image\\s*Uploaded an image/gi, "Uploaded an image");
        content = content.replace(/Show moreShow less/g, "");`;
content = content.replace(cheeTextFind, cheeTextRepl);

fs.writeFileSync('server.ts', content);
