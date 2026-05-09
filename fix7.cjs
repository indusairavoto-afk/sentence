const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const regex1 = /const cleanClassName \= cls\.replace\(\/user\-select\/g, ''\)\.replace\(\/select\-none\/g, ''\);\s*if \(cleanClassName\.includes\('font\-user\-message'\) \|\| testId\.includes\('user'\) \|\| cleanClassName\.match\(isUserClass\)\) \{\s*role = 'user';\s*\} else if \(cleanClassName\.includes\('font\-claude\-message'\) \|\| testId\.includes\('assistant'\) \|\| cleanClassName\.match\(isAssistantClass\)\) \{\s*role = 'assistant';\s*\} else \{\s*role = null;\s*\}/m;

const replacement1 = `const cleanClassName = cls.replace(/user-select/g, '').replace(/select-none/g, '');

            const hasUserChild = el.querySelector('[class*="user-message"], [class*="human"], [data-message-author-role="user"]');
            const hasAssistantChild = el.querySelector('[class*="claude-message"], [class*="assistant"], [class*="bot"], [data-message-author-role="assistant"]');

            if (cleanClassName.includes('font-user-message') || testId.includes('user') || cleanClassName.match(isUserClass) || hasUserChild) {
                role = 'user';
            } else if (cleanClassName.includes('font-claude-message') || testId.includes('assistant') || cleanClassName.match(isAssistantClass) || hasAssistantChild) {
                role = 'assistant';
            } else {
                role = null;
            }`;

if (regex1.test(content)) {
    fs.writeFileSync('server.ts', content.replace(regex1, replacement1));
    console.log("Replaced 1");
} else {
    console.log("Not found regex 1");
}

