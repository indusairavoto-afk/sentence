const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const cheerioNoiseTarget = `      // Make a clone to safely remove noise elements before extracting text
      const $clone = $el.clone();
      $clone.find('script, style, svg, noscript, nav, header, footer').remove();`;

const cheerioNoiseRepl = `      // Make a clone to safely remove noise elements before extracting text
      const $clone = $el.clone();
      $clone.find('script, style, svg, noscript, nav, header, footer').remove();
      $clone.find('[style*="display: none"], [style*="display:none"], [aria-hidden="true"], .cdk-visually-hidden, .sr-only').remove();`;

content = content.replace(cheerioNoiseTarget, cheerioNoiseRepl);

// Also for Puppeteer, wait, puppeteer evaluates innerText, which naturally skips display:none elements!
// But why did puppets OR cheerio produce 5 elements?
// Did it produce 5 elements in Puppeteer or Cheerio?
// In the user's second screenshot, we see the URL 'aistudio.google.com/apps/...'.
// And the applet says "You said: Slove it oops assignment".
// Since they pasted the content into the "Search messages..." or something?
// Actually wait! 
// "Please test the URL again on your end or paste your content in! The Claude responses should now be correctly recognized as assistant/Claude and extracted along with your user messages."
// If they pasted content, the Applet might have done Cheerio parsing.

// To fix the "5 duplicates" problem robustness, let's make deduplication collapse identical OR INCLUDED messages.
// e.g. "Slove it oops assignment" is included in "Slove it oops assignment Edit".
const cheerioDedupTarget = `  // Deduplicate adjacent messages with the exact same content
  const deduplicatedMessages = messages.filter((msg, idx) => {
    if (idx === 0) return true;
    const prevMsg = messages[idx - 1];
    return msg.content.trim() !== prevMsg.content.trim() || msg.role !== prevMsg.role;
  });`;

// We'll replace it with a more robust deduplication that checks if one includes the other.
const cheerioDedupRepl = `  // Deduplicate consecutive messages from the same role if their text is highly similar or included
  const deduplicatedMessages = [];
  for (const msg of messages) {
    if (deduplicatedMessages.length === 0) {
      deduplicatedMessages.push(msg);
      continue;
    }
    const prevMsg = deduplicatedMessages[deduplicatedMessages.length - 1];
    if (prevMsg.role === msg.role) {
       const prevText = prevMsg.content.trim();
       const currText = msg.content.trim();
       if (prevText === currText || prevText.includes(currText) || currText.includes(prevText)) {
          // Keep the longer one as it usually has the full text
          if (currText.length > prevText.length) {
             prevMsg.content = msg.content;
             if (msg.imagesUrls && msg.imagesUrls.length > 0) {
                 prevMsg.imagesUrls = [...new Set([...(prevMsg.imagesUrls || []), ...msg.imagesUrls])];
             }
          }
          continue;
       }
    }
    deduplicatedMessages.push(msg);
  }`;

content = content.replace(cheerioDedupTarget, cheerioDedupRepl);

const pupDedupTarget = `    // Deduplicate perfectly adjacent identical texts
    const deduplicatedMessages = messages.filter((msg, idx) => {
      if (idx === 0) return true;
      const prevMsg = messages[idx - 1];
      return msg.text.trim() !== prevMsg.text.trim() || msg.role !== prevMsg.role;
    });`;

const pupDedupRepl = `    // Deduplicate perfectly adjacent identical texts
    const deduplicatedMessages = [];
    for (const msg of messages) {
      if (deduplicatedMessages.length === 0) {
        deduplicatedMessages.push(msg);
        continue;
      }
      const prevMsg = deduplicatedMessages[deduplicatedMessages.length - 1];
      if (prevMsg.role === msg.role) {
         const prevText = prevMsg.text.trim();
         const currText = msg.text.trim();
         if (prevText === currText || prevText.includes(currText) || currText.includes(prevText)) {
            if (currText.length > prevText.length) {
               prevMsg.text = msg.text;
               if (msg.imagesUrls && msg.imagesUrls.length > 0) {
                 prevMsg.imagesUrls = [...new Set([...(prevMsg.imagesUrls || []), ...msg.imagesUrls])];
               }
            }
            continue;
         }
      }
      deduplicatedMessages.push(msg);
    }`;

content = content.replace(pupDedupTarget, pupDedupRepl);

fs.writeFileSync('server.ts', content);
