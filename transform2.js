import * as fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Remove inputText state
content = content.replace(/const \[inputText, setInputText\] = useState\(''\);\n/, '');

// 2. Update detectedMode
content = content.replace(
  /const detectedMode = React\.useMemo\(\(\) => \{[\s\S]*?return 'none';\n  \}, \[htmlFile, inputText\]\);/,
  `const detectedMode = React.useMemo(() => {
    if (htmlFile) return 'html';
    return 'none';
  }, [htmlFile]);`
);

// 3. Remove text/url mode from handleExtract
content = content.replace(
  /if \(detectedMode === 'text'\) \{[\s\S]*?if \(detectedMode === 'html'\) \{/,
  `if (detectedMode === 'html') {`
);

content = content.replace(
  /if \(detectedMode === 'url'\) \{[\s\S]*?\}\n  \};\n\n  const copyToClipboard/,
  `};\n\n  const copyToClipboard`
);

// 4. Update the input UI section
content = content.replace(
  /<div \n\s*onDragOver=\{[\s\S]*?<\/div>\n\s*<button\n\s*type="submit"/,
  `<motion.div
                      onDragOver={(e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e: React.DragEvent) => {
                        e.preventDefault();
                        setIsDragging(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file && (file.name.endsWith('.html') || file.name.endsWith('.htm'))) {
                          setHtmlFile(file);
                        }
                      }}
                      animate={{
                        scale: isDragging ? 1.02 : 1,
                        rotateX: isDragging ? 5 : 0,
                        rotateY: isDragging ? -2 : 0,
                        y: isDragging ? -5 : 0
                      }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      style={{ perspective: 1000 }}
                      className={\`relative w-full h-[280px] rounded-xl border-dashed transition-colors flex flex-col items-center justify-center overflow-hidden group cursor-pointer \${isDragging ? 'border-zinc-900 border-2 dark:border-white bg-zinc-100 dark:bg-white/5 shadow-2xl' : 'border-zinc-300 dark:border-zinc-800 border-2 bg-zinc-50 hover:bg-zinc-100/50 dark:bg-zinc-950 hover:border-zinc-400 dark:hover:border-zinc-700'} mb-6\`}
                    >
                      <input 
                        type="file" 
                        accept=".html,.htm" 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50" 
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            setHtmlFile(e.target.files[0]);
                          }
                        }}
                      />
                      
                      {htmlFile ? (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex flex-col items-center z-10 pointer-events-none"
                        >
                          <div className="w-16 h-16 bg-zinc-900 dark:bg-white text-white dark:text-black flex items-center justify-center rounded-2xl shadow-xl mb-4">
                            <FileText size={32} />
                          </div>
                          <span className="text-zinc-900 dark:text-white font-bold text-xl truncate px-8 max-w-[80%] text-center">{htmlFile.name}</span>
                          <span className="text-xs text-zinc-500 mt-3 font-mono uppercase tracking-widest">
                            {(htmlFile.size / 1024).toFixed(1)} KB • Ready to extract
                          </span>
                        </motion.div>
                      ) : (
                        <motion.div 
                          animate={{ 
                            y: isDragging ? [0, -8, 0] : 0 
                          }}
                          transition={{ repeat: isDragging ? Infinity : 0, duration: 1.5, ease: "easeInOut" }}
                          className="flex flex-col items-center z-10 pointer-events-none"
                        >
                          <div className={\`w-16 h-16 rounded-full flex items-center justify-center mb-5 transition-colors duration-300 shadow-sm \${
                            isDragging ? 'bg-black text-white dark:bg-white dark:text-black shadow-xl ring-4 ring-black/5 dark:ring-white/10' : 'bg-white dark:bg-zinc-900 text-zinc-400 dark:text-zinc-500 shadow-md border border-zinc-200 dark:border-zinc-800/50'
                          }\`}>
                            <Download size={24} className={isDragging ? 'animate-bounce' : ''} />
                          </div>
                          <h3 className="text-zinc-900 dark:text-white font-bold text-xl mb-2 tracking-tight">Upload HTML Export</h3>
                          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-[260px] text-center leading-relaxed">
                            Drop your saved chat page here, or click to browse files.
                          </p>
                          <div className="mt-8 px-5 py-2 border border-zinc-200 dark:border-zinc-800 text-[10px] text-zinc-500 dark:text-zinc-400 rounded-full uppercase tracking-widest font-mono group-hover:border-zinc-300 dark:group-hover:border-zinc-700 transition-colors shadow-sm bg-white/50 dark:bg-black/20">
                            Press Ctrl+S in your AI Chat
                          </div>
                        </motion.div>
                      )}
                      
                      <div className={\`absolute inset-0 bg-gradient-to-br from-black/[0.02] to-transparent dark:from-white/[0.03] dark:to-transparent pointer-events-none transition-opacity duration-500 \${isDragging ? 'opacity-100' : 'opacity-0'}\`} />
                    </motion.div>
                    
                    <button
                      type="submit"`
);

// 5. Update Error suggestions
content = content.replace(
  /Try Generic Text/g,
  `Retry Upload`
);
content = content.replace(
  /onClick=\{.*?setInputText\(''\).*?\}/s,
  `onClick={() => setHtmlFile(null)}`
);

// 6. Update Target Data / Clear button
content = content.replace(
  /setChatData\(null\); setInputText\(''\); setHtmlFile\(null\);/,
  `setChatData(null); setHtmlFile(null);`
);

content = content.replace(
  /detectedMode === 'url' \? 'URL Fetch' :\n\s*detectedMode === 'html' \? 'HTML Extract' :\n\s*detectedMode === 'text' \? 'Raw Text' : 'Ready'/g,
  `detectedMode === 'html' ? 'HTML Extract' : 'Ready'`
);

content = content.replace(
  /<div className="w-full max-w-3xl border border-zinc-300 dark:border-zinc-800 p-1 bg-white dark:bg-zinc-950 mb-12"/,
  `<div className="w-full max-w-2xl border border-zinc-300 dark:border-zinc-800 p-1 bg-white dark:bg-zinc-950 mb-12 shadow-2xl shadow-black/5"`
);

content = content.replace(
  /className="flex gap-4 flex-col md:flex-row"/,
  `className="flex flex-col w-full"`
);

content = content.replace(
  /className="bg-zinc-900 dark:bg-white text-white dark:text-black px-10 py-4 md:py-0 font-bold text-xs uppercase tracking-widest hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"/,
  `className="w-full bg-zinc-900 border border-transparent dark:border-zinc-800 dark:bg-white text-white dark:text-black px-10 py-5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-md hover:shadow-lg dark:hover:bg-zinc-100 disabled:opacity-50 disabled:shadow-none hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 flex items-center justify-center gap-2"`
);

fs.writeFileSync('src/App.tsx', content);
