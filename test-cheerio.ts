import * as cheerio from 'cheerio';
import * as fs from 'fs';

const html = `
<user-query>Slove it oops assignment</user-query>
<model-response>Here are the solutions...</model-response>
<div class="message">
  <user-query>nested</user-query>
</div>
`;
const $ = cheerio.load(html);

let messageNodes = $('.markdown, [data-message-author-role], .font-claude-message, .font-user-message, .message, .chat-message, [data-testid="message"], div[class*="message"], article, .prose, .ProseMirror, [class*="prose"], user-query, model-response, [class*="user-query"], [class*="model-response"]');

const topLevelNodes: any[] = [];
messageNodes.each((_, el) => {
    let parent = el.parent;
    let isNested = false;
    while (parent && (parent.type as unknown as string) !== 'root') {
        const $parent = $(parent as any);
        if ($parent.is('.markdown, [data-message-author-role], .font-claude-message, .font-user-message, .message, .chat-message, [data-testid="message"], div[class*="message"], article, .prose, .ProseMirror, [class*="prose"], user-query, model-response, [class*="user-query"], [class*="model-response"]')) {
           isNested = true;
           break;
        }
        parent = parent.parent;
    }
    if (!isNested) {
       topLevelNodes.push(el);
    }
});
console.log("Top level nodes:", topLevelNodes.length);
