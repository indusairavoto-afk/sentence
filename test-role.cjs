const cheerio = require('cheerio');
const html = `<article data-testid='message' data-message-author-role='assistant'><div class='markdown'>p1</div><div class='markdown'>p2</div></article>`;
const $ = cheerio.load(html);

const strictSelector = '[data-message-author-role], [data-testid="message"], article, .font-claude-message, .font-user-message, .message-row, .message-bubble, user-query, model-response, .user-query, .model-response, response-container, message-content, .chat-message';
const genericSelector = '.message, .markdown, .prose, .ProseMirror';

let messageNodes = $(strictSelector);
let activeSelector = strictSelector;

if (messageNodes.length === 0) {
  messageNodes = $(genericSelector);
  activeSelector = genericSelector;
}

const topLevelNodes = [];
messageNodes.each((_, el) => {
  let parent = el.parent;
  let isNested = false;
  while (parent && parent.type !== 'root') {
    if ($(parent).is(activeSelector)) {
      isNested = true;
      break;
    }
    parent = parent.parent;
  }
  if (!isNested) {
    topLevelNodes.push(el);
  }
});
console.log('Nodes count:', topLevelNodes.length);
