import * as fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// The loading view to insert
const loadingView = `
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full max-w-3xl mt-8"
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4">
                <h3 className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-bold">Bridged Conversion</h3>
              </div>

              <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 overflow-hidden mb-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-black/50 gap-4">
                  <div className="h-4 w-48 bg-zinc-200 dark:bg-zinc-800 animate-pulse"></div>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-800 animate-pulse"></div>
                    <div className="flex gap-2 flex-wrap">
                      <div className="h-7 w-24 bg-zinc-200 dark:bg-zinc-800 animate-pulse"></div>
                      <div className="h-7 w-16 bg-zinc-200 dark:bg-zinc-800 animate-pulse"></div>
                      <div className="h-7 w-16 bg-zinc-200 dark:bg-zinc-800 animate-pulse"></div>
                    </div>
                  </div>
                </div>

                <div className="border-b border-zinc-200 dark:border-zinc-900 overflow-hidden">
                  <div className="p-4 bg-zinc-100 dark:bg-zinc-100/50 dark:bg-zinc-900/50">
                    <div className="flex justify-between items-center mb-2 font-mono text-[10px] uppercase tracking-widest text-zinc-700 dark:text-zinc-400">
                      <span className="flex items-center gap-2">
                        <Loader2 size={10} className="animate-spin text-zinc-500" />
                        {uploadProgress?.phase || 'Processing HTML...'}
                      </span>
                      <span>{uploadProgress?.percent || 0}%</span>
                    </div>
                    <div className="h-1 lg:h-1.5 w-full bg-zinc-50 dark:bg-black overflow-hidden relative border border-zinc-300 dark:border-zinc-800">
                      <motion.div
                        className="absolute top-0 bottom-0 left-0 bg-zinc-900 dark:bg-white"
                        initial={{ width: 0 }}
                        animate={{ width: \`\${uploadProgress?.percent || 0}%\` }}
                        transition={{ ease: "easeOut", duration: 0.3 }}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="divide-y divide-zinc-200 dark:divide-zinc-900 bg-zinc-50 dark:bg-black w-full">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-6 md:p-8 flex flex-col md:flex-row gap-6">
                      <div className="w-24 shrink-0 flex items-start pt-1">
                        <div className="h-5 w-16 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-none"></div>
                      </div>
                      <div className="flex-1 flex flex-col gap-3">
                        <div className={\`h-3 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-none \${i % 2 === 0 ? 'w-full' : 'w-5/6'}\`}></div>
                        <div className={\`h-3 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-none \${i % 2 === 0 ? 'w-4/5' : 'w-full'}\`}></div>
                        <div className={\`h-3 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-none \${i % 2 === 0 ? 'w-full' : 'w-2/3'}\`}></div>
                        {i === 2 && <div className="h-3 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-none w-1/2"></div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : !chatData ? (`;

content = content.replace(
  /\{\!chatData \? \(/,
  loadingView
);

// Remove the upload progress from the input form
content = content.replace(
  /<AnimatePresence>\s*\{uploadProgress && \([\s\S]*?<\/AnimatePresence>/,
  ""
);

// Adjust the Bridge button to not show progress percentage anymore
// since it will transition to the skeleton loader immediately
content = content.replace(
  /<span>\{uploadProgress \? \`\$\\{uploadProgress\.percent\\}%\` : loading \? 'Bridging\.\.\.' : 'Bridge'\}<\/span>\s*\{\!loading && \!uploadProgress && <ArrowRight size=\{14\} \/>\}/,
  "<span>Bridge</span>\n                      <ArrowRight size={14} />"
);

fs.writeFileSync('src/App.tsx', content);
