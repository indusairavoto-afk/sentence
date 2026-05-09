const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({headless: true, args: ['--no-sandbox']});
  const page = await browser.newPage();
  
  const geminiHtml = `
  <user-query data-message-author-role="user">
     <div class="content">Slove it oops assignment</div>
  </user-query>
  <model-response data-message-author-role="model">
     <div class="content">Here are the solutions...</div>
  </model-response>
  `;
  await page.setContent(geminiHtml);

  const messagesData = await page.$$eval('[data-message-author-role], article, [data-testid^="conversation-turn"], .font-claude-message, .font-user-message, .prose, .ProseMirror, [class*="prose"], [class*="message"], .message, .chat-message, [data-test-id="message"], .markdown, [data-is-streaming], user-query, model-response, [class*="user-query"], [class*="model-response"]', (elements) => {
      
      const topLevelElements = elements.filter(el => {
         if (el.closest('nav, aside, [class*="sidebar"], [class*="menu"], [class*="nav"], header, [class*="header"], [class*="history"], [class*="drawer"]')) return false;
         let parent = el.parentElement;
         while (parent) {
            if (parent.matches('[data-message-author-role], article, [data-testid^="conversation-turn"], .font-claude-message, .font-user-message, .prose, .ProseMirror, [class*="prose"], [class*="message"], .message, .chat-message, [data-test-id="message"], .markdown, [data-is-streaming], user-query, model-response, [class*="user-query"], [class*="model-response"]')) {
               return false;
            }
            parent = parent.parentElement;
         }
         return true;
      });

      return topLevelElements.map(el => {
         const tagName = (el.tagName || '').toLowerCase();
         console.log(tagName);
         return {
            tagName: tagName,
            text: (el).innerText || el.textContent || ''
         }
      })
  });
  console.log(messagesData);
  await browser.close();
})();
