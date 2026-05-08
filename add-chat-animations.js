import * as fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  /<div key=\{idx\} className="p-6 md:p-8 flex flex-col md:flex-row gap-6 hover:bg-zinc-100 dark:bg-zinc-100\/30 dark:bg-zinc-900\/30 transition-colors">/g,
  `<motion.div 
                      key={idx} 
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(idx * 0.05, 0.5), duration: 0.3 }}
                      className="p-6 md:p-8 flex flex-col md:flex-row gap-6 hover:bg-zinc-100 dark:bg-zinc-100/30 dark:bg-zinc-900/30 transition-colors"
                    >`
);

content = content.replace(
  /<\/div>\n                  \}\)\}\n                <\/div>/,
  `</motion.div>\n                  ))}\n                </div>`
);

fs.writeFileSync('src/App.tsx', content);
