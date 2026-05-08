import * as fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

const replacements = [
  { p: /\bbg-black\b/g, r: 'bg-zinc-50 dark:bg-black' },
  { p: /\btext-white\b/g, r: 'text-zinc-900 dark:text-white' },
  { p: /\bbg-white\b/g, r: 'bg-zinc-900 dark:bg-white' },
  { p: /\bbg-white\/5\b/g, r: 'bg-black/5 dark:bg-white/5' },
  { p: /\btext-black\b/g, r: 'text-white dark:text-black' },
  { p: /\bbg-zinc-950\b/g, r: 'bg-white dark:bg-zinc-950' },
  { p: /\bbg-zinc-900\b/g, r: 'bg-zinc-100 dark:bg-zinc-900' },
  { p: /\bbg-zinc-900\/50\b/g, r: 'bg-zinc-100/50 dark:bg-zinc-900/50' },
  { p: /\bbg-zinc-900\/30\b/g, r: 'bg-zinc-100/30 dark:bg-zinc-900/30' },
  { p: /\bbg-zinc-800\b/g, r: 'bg-zinc-200 dark:bg-zinc-800' },
  { p: /\bborder-zinc-900\b/g, r: 'border-zinc-200 dark:border-zinc-900' },
  { p: /\bborder-zinc-800\b/g, r: 'border-zinc-300 dark:border-zinc-800' },
  { p: /\bborder-zinc-700\b/g, r: 'border-zinc-400 dark:border-zinc-700' },
  { p: /\bborder-white\b/g, r: 'border-black dark:border-white' },
  { p: /\bborder-black\b/g, r: 'border-zinc-200 dark:border-black' },
  { p: /\bhover:border-zinc-600\b/g, r: 'hover:border-zinc-400 dark:hover:border-zinc-600' },
  { p: /\bhover:border-zinc-500\b/g, r: 'hover:border-zinc-500 dark:hover:border-zinc-500' },
  { p: /\bhover:border-white\b/g, r: 'hover:border-black dark:hover:border-white' },
  { p: /\btext-zinc-700\b/g, r: 'text-zinc-400 dark:text-zinc-700' },
  { p: /\btext-zinc-600\b/g, r: 'text-zinc-500 dark:text-zinc-600' },
  { p: /\btext-zinc-500\b/g, r: 'text-zinc-500 dark:text-zinc-500' },
  { p: /\btext-zinc-400\b/g, r: 'text-zinc-600 dark:text-zinc-400' },
  { p: /\btext-zinc-300\b/g, r: 'text-zinc-700 dark:text-zinc-300' },
  { p: /\btext-zinc-200\b/g, r: 'text-zinc-800 dark:text-zinc-200' },
  { p: /\bplaceholder-zinc-600\b/g, r: 'placeholder-zinc-400 dark:placeholder-zinc-600' },
  { p: /\bhover:bg-zinc-900\/30\b/g, r: 'hover:bg-zinc-100/50 dark:hover:bg-zinc-900/30' },
  { p: /\bhover:bg-zinc-800\b/g, r: 'hover:bg-zinc-200 dark:hover:bg-zinc-800' },
  { p: /\bhover:bg-zinc-200\b/g, r: 'hover:bg-zinc-800 dark:hover:bg-zinc-200' },
  { p: /\bhover:text-white\b/g, r: 'hover:text-black dark:hover:text-white' },
  { p: /\bprose-invert\b/g, r: 'dark:prose-invert' },
];

replacements.forEach(({p, r}) => {
  content = content.replace(p, r);
});

content = content.replace(
  "import { ArrowRight, Download, Copy, Link as LinkIcon, Trash2, FileJson, FileText, CheckCircle2, Loader2 } from 'lucide-react';",
  "import { ArrowRight, Download, Copy, Link as LinkIcon, Trash2, FileJson, FileText, CheckCircle2, Loader2, Sun, Moon } from 'lucide-react';"
);

content = content.replace(
  "export default function App() {",
  "export default function App() {\n  const [theme, setTheme] = useState<'dark' | 'light'>('dark');\n\n  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');"
);

// We need to fix the root div
content = content.replace(
  /className="min-h-screen[^"]*"/,
  "className={`min-h-screen font-sans flex flex-col overflow-x-hidden transition-colors duration-300 ${theme === 'dark' ? 'dark bg-black text-white selection:bg-white selection:text-black' : 'bg-zinc-50 text-zinc-900 selection:bg-black selection:text-white'}`}"
);

// Add the toggle button in the header - find first <button and insert before it
content = content.replace(
  /<button className="px-5 py-2 border border-zinc-400([^>]*>[\s\S]*?<\/button>)/,
  (match, p1) => `<button onClick={toggleTheme} className="px-3 py-2 border border-zinc-300 dark:border-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors mr-2 md:mr-4 flex items-center justify-center shrink-0">\n          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}\n        </button>\n        <button className="px-5 py-2 border border-zinc-400` + p1
);

fs.writeFileSync('src/App.tsx', content);
