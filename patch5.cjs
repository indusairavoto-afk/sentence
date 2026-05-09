const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const importFind = `import { ArrowRight, Download, Copy, Link as LinkIcon, Trash2, FileJson, FileText, CheckCircle2, Loader2, Sun, Moon, Search, Database, ExternalLink } from 'lucide-react';`;
const importRepl = `import { Lock, Image as ImageIcon, ArrowRight, Download, Copy, Link as LinkIcon, Trash2, FileJson, FileText, CheckCircle2, Loader2, Sun, Moon, Search, Database, ExternalLink } from 'lucide-react';`;
content = content.replace(importFind, importRepl);

const chatImageComponent = `
const ChatImage = ({ url, isAbsolute }: { url: string, isAbsolute: boolean }) => {
  const [error, setError] = useState(false);
  const finalUrl = isAbsolute ? url : \`/\${url}\`;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center w-[180px] h-[320px] rounded-xl border border-zinc-200/50 dark:border-white/10 shadow-sm bg-zinc-100/50 dark:bg-zinc-800/50 backdrop-blur-sm group/img relative overflow-hidden">
        <Lock className="w-8 h-8 text-zinc-400 dark:text-zinc-500 mb-2" />
        <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">Secured Image</span>
        <span className="text-[10px] px-4 text-center mt-2 text-zinc-400/50">Cannot be displayed directly due to authorization.</span>
        {isAbsolute && url.startsWith('http') && (
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-500 hover:underline opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center gap-1 absolute bottom-3">
            <ExternalLink size={10} /> Open Original
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1 group/img relative">
      <img 
        src={finalUrl} 
        alt="Attached image" 
        onError={() => setError(true)}
        className="max-w-full rounded-xl border border-zinc-200/50 dark:border-white/10 shadow-sm max-h-64 object-contain bg-white/50 dark:bg-black/50 backdrop-blur-sm" 
      />
      {isAbsolute && url.startsWith('http') && (
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-500 hover:underline opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center gap-1 mt-1">
          <ExternalLink size={10} /> Original Link
        </a>
      )}
    </div>
  );
};
`;

content = content.replace('function App() {', chatImageComponent + '\nfunction App() {');

const imageMapperFind = `{msg.images.map((imgUrl, i) => {
                                const isAbsolute = imgUrl.startsWith('http') || imgUrl.startsWith('data:');
                                const finalUrl = isAbsolute ? imgUrl : \`/\${imgUrl}\`;
                                return (
                                  <div key={i} className="flex flex-col items-center gap-1 group/img">
                                    <img src={finalUrl} alt="Attached image" className="max-w-full rounded-xl border border-zinc-200/50 dark:border-white/10 shadow-sm max-h-64 object-contain bg-white/50 dark:bg-black/50 backdrop-blur-sm" />
                                    {isAbsolute && imgUrl.startsWith('http') && (
                                      <a href={imgUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-500 hover:underline opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center gap-1">
                                        <ExternalLink size={10} /> Original Link
                                      </a>
                                    )}
                                  </div>
                                );
                              })}`;
const imageMapperRepl = `{msg.images.map((imgUrl, i) => {
                                const isAbsolute = imgUrl.startsWith('http') || imgUrl.startsWith('data:');
                                return <ChatImage key={i} url={imgUrl} isAbsolute={isAbsolute} />;
                              })}`;

content = content.replace(imageMapperFind, imageMapperRepl);

fs.writeFileSync('src/App.tsx', content);
