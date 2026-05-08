const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const fixes = [
  // bg-white -> bg-zinc-900 dark:bg-white -> bg-zinc-100 dark:bg-zinc-900 dark:bg-white
  // The original text was bg-white. Let's map it to bg-zinc-900 dark:bg-white
  { p: /\bbg-zinc-100 dark:bg-zinc-900 dark:bg-white\b/g, r: 'bg-zinc-900 dark:bg-white' },

  // hover:bg-white -> hover:bg-zinc-900 dark:hover:bg-white
  { p: /\bhover:bg-zinc-100 dark:bg-zinc-900 dark:bg-white\b/g, r: 'hover:bg-zinc-900 dark:hover:bg-white' },

  // hover:text-black -> hover:text-white dark:hover:text-black
  { p: /\bhover:text-black dark:hover:text-white dark:text-black\b/g, r: 'hover:text-white dark:hover:text-black' },
  
  // bg-zinc-100 dark:bg-zinc-900 dark:bg-black/5 dark:bg-white/5
  // Original was bg-white/5 -> bg-black/5 dark:bg-white/5
  { p: /\bbg-zinc-100 dark:bg-zinc-900 dark:bg-black\/5 dark:bg-white\/5\b/g, r: 'bg-black/5 dark:bg-white/5' },

  // border-zinc-200 dark:border-black dark:border-white
  // Original was border-white -> border-black dark:border-white
  { p: /\bborder-zinc-200 dark:border-black dark:border-white\b/g, r: 'border-black dark:border-white' },
];

fixes.forEach(({p, r}) => {
  content = content.replace(p, r);
});

fs.writeFileSync('src/App.tsx', content);
