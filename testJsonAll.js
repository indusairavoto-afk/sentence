function extractAllJsonObjects(text) {
  const results = [];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '{' || text[i] === '[') {
      let j = i;
      let insideString = false;
      let escapeNext = false;
      let openCount = 0;
      const openChar = text[i];
      const closeChar = openChar === '{' ? '}' : ']';
      let found = false;

      for (; j < text.length; j++) {
        const char = text[j];
        if (escapeNext) { escapeNext = false; continue; }
        if (char === '\\') { escapeNext = true; continue; }
        if (char === '"') { insideString = !insideString; continue; }
        if (!insideString) {
          if (char === openChar) openCount++;
          else if (char === closeChar) openCount--;
          if (openCount === 0) {
            found = true;
            break;
          }
        }
      }
      
      if (found) {
        const jsonStr = text.substring(i, j + 1);
        if (jsonStr.length > 50 && (jsonStr.includes('"role"') || jsonStr.includes('"parts"') || jsonStr.includes('"human"'))) {
          try {
            results.push(JSON.parse(jsonStr));
          } catch(e) {}
        }
        i = j; // skip the parsed part
      }
    }
  }
  return results;
}

const text = `
const a = 1;
window.__remixContext = {"loaderData": {"message": {"author": {"role": "user"}, "content": {"parts": ["hello world"]}}}};
console.log(a);
`;
const results = extractAllJsonObjects(text);
console.log(JSON.stringify(results, null, 2));
