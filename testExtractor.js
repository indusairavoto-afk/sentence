function extractJsonObject(text, prefix) {
  const index = text.indexOf(prefix);
  if (index === -1) return null;
  let startIndex = index + prefix.length;
  // Skip whitespace
  while (startIndex < text.length && /\s/.test(text[startIndex])) startIndex++;
  
  if (text[startIndex] !== '{' && text[startIndex] !== '[') return null;
  
  const isArray = text[startIndex] === '[';
  const openChar = isArray ? '[' : '{';
  const closeChar = isArray ? ']' : '}';
  let openCount = 0;
  let insideString = false;
  let escapeNext = false;
  
  for (let i = startIndex; i < text.length; i++) {
    const char = text[i];
    
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      escapeNext = true;
      continue;
    }
    
    if (char === '"') {
      insideString = !insideString;
      continue;
    }
    
    if (!insideString) {
      if (char === openChar) openCount++;
      else if (char === closeChar) openCount--;
      
      if (openCount === 0) {
        return text.substring(startIndex, i + 1);
      }
    }
  }
  return null;
}

const text = 'blah window.__remixContext = {"test":"hello","nested":{"a":"};"}}; console.log(1);';
console.log(extractJsonObject(text, 'window.__remixContext ='));
