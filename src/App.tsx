import React, { useState, useEffect, useMemo } from 'react';
import { Lock, Image as ImageIcon, ArrowRight, Download, Copy, Link as LinkIcon, Trash2, FileJson, FileText, CheckCircle2, Loader2, Sun, Moon, Search, Database, ExternalLink, Heart, AlertCircle, Users, Activity, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { DonationSection } from './components/DonationSection';
import { DonationModal } from './components/DonationModal';
import { Vault } from './components/Vault';
import { About } from './components/About';
import { Impact } from './components/Impact';
import { FAQ } from './components/FAQ';
import { Privacy } from './components/Privacy';
import { Terms } from './components/Terms';
import { Contact } from './components/Contact';
import { Security } from './components/Security';
import { ApiDocs } from './components/ApiDocs';
import { AILogoMarquee } from './components/AILogoMarquee';
import { vaultDbTools } from './lib/vaultDb';
import { db, incrementGlobalStat, auth, signInWithGoogle, logOut } from './firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';

const DB_NAME = 'BridgeDB';
const STORE_NAME = 'drafts';
const DRAFT_KEY = 'current_html';

const dbTools = {
  async save(file: File) {
    try {
      const db = await new Promise<IDBDatabase>((res, rej) => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME);
        req.onsuccess = () => res(req.result);
        req.onerror = () => rej(req.error);
      });
      db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put(file, DRAFT_KEY);
    } catch(e) { console.warn('IDB save error', e); }
  },
  async get(): Promise<File | null> {
    try {
      const db = await new Promise<IDBDatabase>((res, rej) => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME);
        req.onsuccess = () => res(req.result);
        req.onerror = () => rej(req.error);
      });
      return new Promise((res, rej) => {
        const req = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(DRAFT_KEY);
        req.onsuccess = () => res(req.result || null);
        req.onerror = () => rej(req.error);
      });
    } catch(e) { console.warn('IDB get error', e); return null; }
  },
  async clear() {
    try {
      const db = await new Promise<IDBDatabase>((res, rej) => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME);
        req.onsuccess = () => res(req.result);
        req.onerror = () => rej(req.error);
      });
      db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).delete(DRAFT_KEY);
    } catch(e) { console.warn('IDB clear error', e); }
  }
};

interface Message {
  role: string;
  content: string;
  images?: string[];
  timestamp?: string;
}

export interface ChatData {
  title: string;
  messages: Message[];
}

interface ErrorData {
  error: string;
  message: string;
  suggestion?: string;
}

const URL_PLACEHOLDERS = [
  "https://chatgpt.com/share/...",
  "https://gemini.google.com/share/...",
  "https://claude.ai/chat/...",
  "https://chat.deepseek.com/...",
  "https://grok.com/chat/..."
];

function useTypewriterPlaceholder(phrases: string[], typingSpeed = 50, deletingSpeed = 30, pauseBeforeDelete = 2000, pauseBeforeType = 500) {
  const [text, setText] = useState('');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    
    const currentPhrase = phrases[phraseIndex];
    
    if (!isDeleting && text === currentPhrase) {
      timeoutId = setTimeout(() => setIsDeleting(true), pauseBeforeDelete);
    } else if (isDeleting && text === '') {
      setIsDeleting(false);
      setPhraseIndex((prev) => (prev + 1) % phrases.length);
      timeoutId = setTimeout(() => {}, pauseBeforeType);
    } else {
      const nextText = isDeleting 
        ? currentPhrase.substring(0, text.length - 1)
        : currentPhrase.substring(0, text.length + 1);
        
      const delay = isDeleting ? deletingSpeed : typingSpeed;
      timeoutId = setTimeout(() => setText(nextText), delay);
    }
    
    return () => clearTimeout(timeoutId);
  }, [text, isDeleting, phraseIndex, phrases, typingSpeed, deletingSpeed, pauseBeforeDelete, pauseBeforeType]);

  return text;
}

const ChatImage = ({ url, isAbsolute }: { url: string, isAbsolute: boolean }) => {
  const [error, setError] = useState(false);
  const finalUrl = isAbsolute ? url : `/${url}`;

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

export default function App() {
  const [stats, setStats] = useState({ visitors: 0, uses: 0, donationCount: 0 });
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Listen to Auth State
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    // Listen to global stats
    const unsub = onSnapshot(doc(db, 'stats', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setStats({
          visitors: data.visitors || 0,
          uses: data.visitors || 0,
          donationCount: data.visitors || 0
        });
      }
    });
    
    // Track unique visitor
    if (!localStorage.getItem('hasVisited')) {
      localStorage.setItem('hasVisited', 'true');
      incrementGlobalStat('visitors');
    }

    return () => {
      unsub();
      unsubAuth();
    };
  }, []);

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      if (stored === 'dark' || stored === 'light') return stored;
    }
    return 'dark'; // default
  });

  const toggleTheme = () => {
    setTheme(t => {
      const newTheme = t === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', newTheme);
      return newTheme;
    });
  };
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorData | null>(null);
  const [chatData, setChatData] = useState<ChatData | null>(null);
  const [htmlFileState, setHtmlFileState] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [vaultSaved, setVaultSaved] = useState(false);
  const [linkStatus, setLinkStatus] = useState<{ step: string; progress: number } | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ phase: string; percent: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTab, setCurrentTab] = useState<'converter' | 'vault' | 'about' | 'impact' | 'faq' | 'privacy' | 'terms' | 'contact' | 'security' | 'apidocs'>('converter');
  const [inputMode, setInputMode] = useState<'file' | 'link'>('link');
  const [shareLink, setShareLink] = useState('');
  const [showDonationModal, setShowDonationModal] = useState(false);
  const placeholderText = useTypewriterPlaceholder(URL_PLACEHOLDERS);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentTab]);

  const htmlFile = htmlFileState;
  const setHtmlFile = (file: File | null) => {
    setHtmlFileState(file);
    if (file) dbTools.save(file).catch(console.error);
    else dbTools.clear().catch(console.error);
  };

  useEffect(() => {
    dbTools.get().then(file => {
      if (file) setHtmlFileState(file);
    }).catch(console.error);
  }, []);

  const handleExtract = async (e: React.FormEvent | React.MouseEvent, extractImages: boolean = true) => {
    e.preventDefault();
    setError(null);
    
    if (inputMode === 'file' && !htmlFile) {
      setError({
        error: 'MISSING_INPUT',
        message: 'No file selected.',
        suggestion: 'Please select an HTML file to continue.'
      });
      return;
    }

    if (inputMode === 'link') {
      if (!shareLink) {
        setError({
          error: 'MISSING_INPUT',
          message: 'No link provided.',
          suggestion: 'Please paste a valid share link from ChatGPT or Claude.'
        });
        return;
      }
    }
    
    try {
      setLoading(true);

      let payload: any = {};
      let endpoint: string = '';

      if (inputMode === 'file') {
        setUploadProgress({ phase: 'Initializing File Stream...', percent: 0 });
        
        const htmlText = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onprogress = (e) => {
            if (e.lengthComputable) {
              setUploadProgress({ phase: 'Reading Local File...', percent: Math.round((e.loaded / e.total) * 20) });
            }
          };
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = () => reject(new Error('Failed to read file block'));
          reader.readAsText(htmlFile!);
        });

        setUploadProgress({ phase: 'Preparing Payload...', percent: 25 });
        await new Promise(r => setTimeout(r, 150));
        payload = { html: htmlText };
        endpoint = '/api/extract-html';
      } else {
        setUploadProgress({ phase: 'Validating Link...', percent: 10 });
        payload = { url: shareLink, extractImages };
        endpoint = '/api/extract';
        await new Promise(r => setTimeout(r, 200));
        setUploadProgress({ phase: 'Fetching Remote Page...', percent: 40 });
      }

      const res = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', endpoint);
        xhr.setRequestHeader('Content-Type', 'application/json');
        
        let progressInterval: NodeJS.Timeout;

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable && inputMode === 'file') {
            const uploadPercent = Math.round((e.loaded / e.total) * 45);
            setUploadProgress({ phase: `Transmitting Data (${(e.loaded/1024/1024).toFixed(1)}MB)...`, percent: 25 + uploadPercent });
          }
        };
        
        xhr.upload.onload = () => {
          setUploadProgress({ phase: inputMode === 'link' ? 'Server Analyzing Link...' : 'Server Processing HTML...', percent: 70 });
          let simulatedProgress = 70;
          progressInterval = setInterval(() => {
            simulatedProgress += (Math.random() * 2);
            if (simulatedProgress < 90) {
              const phases = ['Parsing DOM Structure...', 'Extracting Chat Nodes...', 'Formatting Messages...'];
              const currentPhase = phases[Math.floor((simulatedProgress - 70) / 7)] || phases[2];
              setUploadProgress({ phase: currentPhase, percent: Math.round(simulatedProgress) });
            }
          }, 150);
        };
        
        xhr.onload = () => {
          if (progressInterval) clearInterval(progressInterval);
          setUploadProgress({ phase: 'Finalizing Extraction...', percent: 95 });
          try {
            const data = JSON.parse(xhr.responseText);
            resolve({ ok: xhr.status >= 200 && xhr.status < 300, data });
          } catch {
            reject(new Error('Server returned an invalid response format.'));
          }
        };
        
        xhr.onerror = () => {
          if (progressInterval) clearInterval(progressInterval);
          reject(new Error('Network error during transmission.'));
        };
        
        xhr.send(JSON.stringify(payload));
      });

      if (!res.ok) {
        setError(res.data as ErrorData);
        setUploadProgress(null);
        setLoading(false);
        return;
      }

      setUploadProgress({ phase: 'Extraction Complete! Bridging...', percent: 100 });
      
      setTimeout(() => {
        setChatData(res.data);
        incrementGlobalStat('uses');
        setUploadProgress(null);
        setLoading(false);
        setShowDonationModal(true);
      }, 800);
    } catch(err: any) {
      setError({ 
        error: 'EXTRACTION_ERROR', 
        message: err.message || 'Failed to process the input.', 
        suggestion: 'Ensure your file or link is correctly formatted and accessible.' 
      });
      setUploadProgress(null);
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const downloadFile = (content: string, filename: string, type: 'text/markdown' | 'application/json') => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatAsMarkdown = (data: ChatData) => {
    return `# ${data.title}\n\n` + data.messages.map(m => `### ${m.role.toUpperCase()}\n\n${m.content}\n\n---\n`).join('\n');
  };

  const formatAsPrompt = (data: ChatData) => {
    return `Below is a conversation history. Please process it and continue the conversation as the assistant.\n\n` + 
           data.messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');
  };

  const filteredMessages = useMemo(() => {
    if (!chatData) return [];
    if (!searchQuery.trim()) return chatData.messages;
    const lowerQ = searchQuery.toLowerCase();
    return chatData.messages.filter(m => 
      m.content.toLowerCase().includes(lowerQ) || m.role.toLowerCase().includes(lowerQ)
    );
  }, [chatData, searchQuery]);

  return (
    <div className={`min-h-screen flex flex-col overflow-x-hidden transition-colors duration-300 ${theme === 'dark' ? 'dark bg-[#0a0a0a] text-zinc-100 selection:bg-zinc-800 selection:text-white relative' : 'bg-white text-zinc-900 selection:bg-zinc-200 selection:text-black relative'}`}>
      <DonationModal isOpen={showDonationModal} onClose={() => setShowDonationModal(false)} />

      {/* Background gradients / grid */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-50 dark:opacity-[0.15]">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#8086ff] to-[#80ffc7] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)'}}></div>
        </div>
      </div>

      <header className="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6 md:px-12 py-4 sm:py-6 border-b border-zinc-200/50 dark:border-white/5 backdrop-blur-xl bg-white/70 dark:bg-black/50 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-zinc-800 to-black dark:from-zinc-200 dark:to-white flex items-center justify-center shadow-inner">
            <div className="w-3 h-3 rounded-sm bg-white dark:bg-black"></div>
          </div>
          <span className="text-xl font-bold tracking-[0.15em] uppercase font-mono bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-500">Bridge</span>
        </div>
        <nav className="flex items-center gap-2">
          <div className="hidden lg:flex items-center gap-6 font-medium text-xs uppercase tracking-widest text-zinc-500 mr-4">
            <button onClick={() => setCurrentTab('about')} className={`transition-colors ${currentTab === 'about' ? 'text-zinc-900 dark:text-zinc-100 font-bold' : 'hover:text-zinc-900 dark:hover:text-zinc-300'}`}>About</button>
            <button onClick={() => setCurrentTab('impact')} className={`transition-colors ${currentTab === 'impact' ? 'text-zinc-900 dark:text-zinc-100 font-bold' : 'hover:text-zinc-900 dark:hover:text-zinc-300'}`}>Impact</button>
            <button onClick={() => setCurrentTab('faq')} className={`transition-colors ${currentTab === 'faq' ? 'text-zinc-900 dark:text-zinc-100 font-bold' : 'hover:text-zinc-900 dark:hover:text-zinc-300'}`}>FAQ</button>
          </div>
          <div className="hidden md:flex bg-zinc-100 dark:bg-zinc-900/50 p-1 rounded-full border border-zinc-200/50 dark:border-white/5 mr-2 transition-all">
            <button 
              onClick={() => setCurrentTab('converter')} 
              className={`px-4 py-1.5 rounded-full text-[11px] uppercase tracking-widest font-semibold transition-all ${currentTab === 'converter' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'}`}
            >
              Converter
            </button>
            <button 
              onClick={() => setCurrentTab('vault')} 
              className={`px-4 py-1.5 rounded-full text-[11px] uppercase tracking-widest font-semibold transition-all ${currentTab === 'vault' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'}`}
            >
              Vault
            </button>
          </div>
          <button onClick={() => setShowDonationModal(true)} className="hidden md:flex items-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-2 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors mr-2">
            <Heart className="w-3.5 h-3.5" />
            Donate
          </button>
          <button onClick={toggleTheme} className="w-10 h-10 rounded-full border border-zinc-200 dark:border-white/10 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-all flex items-center justify-center shrink-0">
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          {user && (
            <button onClick={logOut} title="Sign Out" className="w-10 h-10 rounded-full border border-zinc-200 dark:border-white/10 text-zinc-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-white/5 transition-all flex items-center justify-center shrink-0 ml-1">
              <LogOut size={14} />
            </button>
          )}
        </nav>
      </header>

      <main className="flex-1 flex flex-col items-center py-10 sm:py-16 px-4 sm:px-6 md:px-12 w-full z-10 relative">
        {currentTab === 'vault' ? (
          <Vault />
        ) : currentTab === 'about' ? (
          <About />
        ) : currentTab === 'impact' ? (
          <Impact />
        ) : currentTab === 'faq' ? (
          <FAQ />
        ) : currentTab === 'privacy' ? (
          <Privacy />
        ) : currentTab === 'terms' ? (
          <Terms />
        ) : currentTab === 'contact' ? (
          <Contact />
        ) : currentTab === 'security' ? (
          <Security />
        ) : currentTab === 'apidocs' ? (
          <ApiDocs />
        ) : (
          <>
            <div className="w-full max-w-2xl text-center mb-0 relative">
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-500">Seamless AI Continuity</h1>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm md:text-base tracking-wide max-w-lg mx-auto leading-relaxed mb-12">Upload an exported HTML chat or paste a Share Link to bridge the gap between different LLMs flawlessly.</p>
            </div>

            <AILogoMarquee />

            <AnimatePresence mode="wait">
          
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full max-w-3xl mt-8"
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4">
                <h3 className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-bold bg-zinc-100 dark:bg-zinc-900 px-3 py-1 rounded inline-flex">Bridged Conversion</h3>
              </div>

              <div className="bg-white/50 backdrop-blur-sm dark:bg-[#0a0a0a]/50 border border-zinc-200 dark:border-white/10 overflow-hidden mb-12 rounded-xl shadow-2xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between p-4 border-b border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-black/20 gap-4">
                  <div className="h-4 w-48 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded"></div>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded"></div>
                    <div className="flex gap-2 flex-wrap">
                      <div className="h-7 w-24 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded"></div>
                      <div className="h-7 w-16 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded"></div>
                      <div className="h-7 w-16 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded"></div>
                    </div>
                  </div>
                </div>

                <div className="border-b border-zinc-200 dark:border-white/10 overflow-hidden">
                  <div className="p-4 bg-zinc-50/80 dark:bg-zinc-900/40">
                    <div className="flex justify-between items-center mb-2 font-mono text-[10px] uppercase tracking-widest text-zinc-700 dark:text-zinc-400">
                      <span className="flex items-center gap-2">
                        <Loader2 size={10} className="animate-spin text-zinc-500" />
                        {uploadProgress?.phase || 'Processing Data...'}
                      </span>
                      <span className="text-zinc-900 dark:text-white font-bold">{uploadProgress?.percent || 0}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-200/50 dark:bg-black/50 overflow-hidden relative rounded-full shadow-inner">
                      <motion.div
                        className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-zinc-500 to-zinc-900 dark:from-zinc-400 dark:to-white rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress?.percent || 0}%` }}
                        transition={{ ease: "easeOut", duration: 0.3 }}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="divide-y divide-zinc-200 dark:divide-white/5 bg-white dark:bg-[#0a0a0a] w-full">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-6 md:p-8 flex flex-col md:flex-row gap-6">
                      <div className="w-24 shrink-0 flex items-start pt-1">
                        <div className="h-5 w-16 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded"></div>
                      </div>
                      <div className="flex-1 flex flex-col gap-3">
                        <div className={`h-3 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded ${i % 2 === 0 ? 'w-full' : 'w-5/6'}`}></div>
                        <div className={`h-3 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded ${i % 2 === 0 ? 'w-4/5' : 'w-full'}`}></div>
                        <div className={`h-3 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded ${i % 2 === 0 ? 'w-full' : 'w-2/3'}`}></div>
                        {i === 2 && <div className="h-3 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded w-1/2"></div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : !chatData ? (
            <motion.div
              key="input"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full flex flex-col items-center group/container"
            >
              <div className="w-full max-w-2xl border border-zinc-200/50 dark:border-transparent p-[1.5px] bg-zinc-200/50 dark:bg-zinc-800/50 mb-12 rounded-2xl shadow-2xl overflow-hidden relative">
                
                {/* Moving light border effect */}
                <div className="absolute inset-0 z-0">
                  <div className="absolute inset-[-150%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300%] h-[300%] animate-[spin_5s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#00000000_50%,#18181b_100%)] dark:bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#00000000_50%,#ffffff_100%)] opacity-30 group-hover/container:opacity-100 transition-opacity duration-700"></div>
                </div>

              <div className="absolute inset-[1.5px] bg-white dark:bg-[#0a0a0a] rounded-2xl z-10 pointer-events-none"></div>
              
              <div className="flex flex-col p-6 rounded-xl border border-zinc-200/50 dark:border-white/5 bg-white dark:bg-zinc-950 w-full relative z-20 shadow-[0_0_40px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_0_40px_-15px_rgba(255,255,255,0.05)]">
                <div className="flex justify-center mb-8">
                  <div className="flex bg-zinc-100/80 dark:bg-zinc-900/80 rounded-lg p-1 backdrop-blur-md border border-zinc-200/50 dark:border-white/5">
                    <button 
                      onClick={() => setInputMode('link')}
                      className={`px-6 py-2 text-[10px] font-bold uppercase tracking-[0.15em] rounded-md transition-all ${inputMode === 'link' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm ring-1 ring-zinc-200/50 dark:ring-white/10' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                    >
                      Share Link
                    </button>
                    <button 
                      onClick={() => setInputMode('file')}
                      className={`px-6 py-2 text-[10px] font-bold uppercase tracking-[0.15em] rounded-md transition-all ${inputMode === 'file' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm ring-1 ring-zinc-200/50 dark:ring-white/10' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                    >
                      HTML File
                    </button>
                  </div>
                </div>
                <form onSubmit={handleExtract} className="w-full">
                  {inputMode === 'file' ? (
                    <motion.div
                      onDragEnter={() => setIsDragging(true)}
                      onDragOver={(e: any) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e: any) => {
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
                        y: isDragging ? -2 : 0
                      }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      style={{ perspective: 1000 }}
                      className={`relative w-full h-[280px] rounded-xl transition-all duration-300 flex flex-col items-center justify-center overflow-hidden group cursor-pointer ${isDragging ? 'border-zinc-900 border-[3px] dark:border-white bg-zinc-50 dark:bg-zinc-900 shadow-2xl ring-4 ring-zinc-900/10 dark:ring-white/10' : 'border-zinc-200 dark:border-zinc-800/50 border-2 border-dashed bg-zinc-50/50 hover:bg-zinc-50 dark:bg-[#0a0a0a] hover:border-zinc-400 dark:hover:border-zinc-600'} mb-8`}
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
                          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-5 transition-colors duration-300 shadow-sm ${
                            isDragging ? 'bg-black text-white dark:bg-white dark:text-black shadow-xl ring-4 ring-black/5 dark:ring-white/10' : 'bg-white dark:bg-zinc-900 text-zinc-400 dark:text-zinc-500 shadow-md border border-zinc-200 dark:border-zinc-800/50'
                          }`}>
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
                      
                      <div className={`absolute inset-0 bg-gradient-to-br from-black/[0.02] to-transparent dark:from-white/[0.03] dark:to-transparent pointer-events-none transition-opacity duration-500 ${isDragging ? 'opacity-100' : 'opacity-0'}`} />
                    </motion.div>
                  ) : (
                    <div className="w-full h-[280px] rounded-xl border-2 border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-black/40 flex flex-col items-center justify-center p-8 mb-8 relative shadow-inner">
                      <div className="absolute inset-0 bg-gradient-to-br from-black/[0.02] to-transparent dark:from-white/[0.02] dark:to-transparent pointer-events-none" />
                      <div className="w-16 h-16 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-white/5 text-zinc-400 dark:text-zinc-500 flex items-center justify-center mb-6 shadow-xl shadow-black/5 dark:shadow-white/5 z-10">
                        <LinkIcon size={24} />
                      </div>
                      <h3 className="text-zinc-900 dark:text-white font-bold text-xl mb-6 tracking-tight z-10">Paste Share Link</h3>
                      <div className="relative w-full max-w-md z-10">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-xl group-focus-within:opacity-100 opacity-0 transition-opacity duration-500"></div>
                        <input
                          type="url"
                          value={shareLink}
                          onChange={(e) => setShareLink(e.target.value)}
                          placeholder={placeholderText}
                          className="w-full bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-white/10 text-sm px-6 py-4 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-zinc-500 dark:focus:border-zinc-500 rounded-xl shadow-lg relative z-10 text-center transition-all focus:ring-4 focus:ring-zinc-900/5 dark:focus:ring-white/5"
                        />
                      </div>
                      
                      {shareLink.toLowerCase().includes('grok.com') && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="w-full max-w-md mt-6 p-4 border border-orange-500/30 bg-orange-50 dark:bg-orange-950/20 rounded-xl text-left shadow-lg relative z-20"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <AlertCircle size={16} className="text-orange-600 dark:text-orange-400" />
                            <h4 className="text-orange-800 dark:text-orange-300 font-bold text-xs uppercase tracking-wider">Cloudflare Protected</h4>
                          </div>
                          <p className="text-orange-700 dark:text-orange-400/80 text-xs leading-relaxed mb-4">
                            Grok blocks automated access (CAPTCHA). To import your chat, please open Grok in your browser, press <kbd className="bg-orange-100 dark:bg-orange-900/40 px-1 py-0.5 rounded border border-orange-200 dark:border-orange-800 font-mono">Ctrl+S</kbd> to save it as HTML, and upload the file instead.
                          </p>
                          <button
                            type="button"
                            onClick={() => setInputMode('file')}
                            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors shadow shadow-orange-500/20"
                          >
                            Switch to HTML Upload
                          </button>
                        </motion.div>
                      )}
                    </div>
                  )}
                    
                    {inputMode === 'link' ? (
                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={(e) => handleExtract(e, false)}
                          disabled={loading || !shareLink || shareLink.toLowerCase().includes('grok.com')}
                          className="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 px-6 py-5 rounded-xl font-bold text-xs uppercase tracking-[0.2em] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex flex-col items-center justify-center gap-1 border border-zinc-200 dark:border-white/10 group relative overflow-hidden"
                        >
                          <span className="relative z-10">{uploadProgress ? `${uploadProgress.percent}%` : loading ? 'Bridging...' : 'Only Text'}</span>
                          {!loading && !uploadProgress && <span className="text-[9px] font-normal opacity-70 normal-case tracking-normal">Speedy Mode</span>}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleExtract(e, true)}
                          disabled={loading || !shareLink || shareLink.toLowerCase().includes('grok.com')}
                          className="w-full bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-100 px-6 py-5 rounded-xl font-bold text-xs uppercase tracking-[0.2em] shadow-2xl hover:shadow-[0_0_40px_rgba(0,0,0,0.3)] dark:hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center gap-1 border border-transparent dark:border-white/10 group relative overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-white/20 dark:bg-black/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                          <span className="relative z-10">{uploadProgress ? `${uploadProgress.percent}%` : loading ? 'Bridging...' : 'With Img'}</span>
                          {!loading && !uploadProgress && <span className="text-[9px] font-normal opacity-70 dark:opacity-60 normal-case tracking-normal relative z-10">Includes images</span>}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="submit"
                        disabled={loading || !htmlFile}
                        className="w-full bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-100 px-10 py-5 rounded-xl font-bold text-xs uppercase tracking-[0.2em] shadow-2xl hover:shadow-[0_0_40px_rgba(0,0,0,0.3)] dark:hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3 border border-transparent dark:border-white/10 group relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-white/20 dark:bg-black/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                        <span className="relative z-10">{uploadProgress ? `${uploadProgress.percent}%` : loading ? 'Bridging...' : 'Bridge'}</span>
                        {!loading && !uploadProgress && <ArrowRight size={14} className="relative z-10 group-hover:translate-x-1 transition-transform" />}
                      </button>
                    )}

                  

                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      className="mt-6 flex flex-col gap-0 border border-red-900/40 bg-red-950/20 backdrop-blur-sm shadow-xl"
                    >
                      <div className="flex items-center gap-3 p-4 border-b border-red-900/30">
                        <div className="w-2 h-2 bg-red-500 animate-pulse"></div>
                        <div className="text-red-400 font-mono text-[10px] uppercase tracking-[0.2em] font-bold">
                          System Alert: {error.error}
                        </div>
                      </div>
                      <div className="p-5 flex flex-col gap-4">
                        <p className="text-red-200 text-sm leading-relaxed">
                          {error.message}
                        </p>
                        
                        {error.suggestion && (
                          <div className="bg-zinc-50 dark:bg-black/40 p-4 border-l-2 border-red-500/50">
                            <h4 className="text-[9px] uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-2 font-bold">Recommended Action</h4>
                            <p className="text-zinc-700 dark:text-zinc-300 text-xs leading-relaxed">{error.suggestion}</p>
                          </div>
                        )}

                        {error.error === 'CLOUDFLARE_BLOCKED' && (
                          <div className="flex gap-3">
                             <button
                                type="button"
                                onClick={() => setHtmlFile(null)}
                                className="bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white font-mono text-[9px] uppercase tracking-widest border border-zinc-400 dark:border-zinc-700 py-2 px-4 transition-colors"
                              >
                                Retry Upload
                              </button>
                             <button
                                type="button"
                                onClick={() => {
                                  const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                                  if (fileInput) fileInput.click();
                                }}
                                className="bg-zinc-900 dark:bg-white text-white dark:text-black font-mono text-[9px] uppercase tracking-widest py-2 px-4 font-bold transition-transform active:scale-95"
                              >
                                Browse HTML File
                              </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </form>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 border-t border-zinc-200 dark:border-zinc-900">
                <div className="p-6 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-900">
                  <label className="text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-500 dark:text-zinc-600 block mb-3">Source Data</label>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-700 dark:text-zinc-300">
                      HTML Extract
                    </span>
                  </div>
                </div>
                <div className="p-6 border-b md:border-b-0 border-zinc-200 dark:border-zinc-900">
                  <label className="text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-500 dark:text-zinc-600 block mb-3">Output Type</label>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-700 dark:text-zinc-300">Prompt / Export</span>
                  </div>
                </div>
              </div>
            </div>

              <div className="w-full max-w-2xl mt-12 mb-8 border border-zinc-200/50 dark:border-white/5 bg-zinc-50/50 dark:bg-black/20 rounded-2xl p-4 sm:p-8 shadow-sm">
                <div className="flex items-center justify-center gap-6 sm:gap-16 flex-wrap">
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-[10px] uppercase tracking-[0.2em] font-bold">
                      <Users size={16} className="text-yellow-500 dark:text-yellow-400" /> Visitors
                    </div>
                    <div className="text-3xl font-extrabold font-mono text-zinc-900 dark:text-white tracking-tight">{stats.visitors.toLocaleString()}</div>
                  </div>
                  <div className="w-12 h-px sm:w-px sm:h-12 bg-zinc-200 dark:bg-zinc-800"></div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-[10px] uppercase tracking-[0.2em] font-bold">
                      <Activity size={16} className="text-green-500 dark:text-green-400" /> Uses
                    </div>
                    <div className="text-3xl font-extrabold font-mono text-zinc-900 dark:text-white tracking-tight">{stats.uses.toLocaleString()}</div>
                  </div>
                  <div className="w-12 h-px sm:w-px sm:h-12 bg-zinc-200 dark:bg-zinc-800"></div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-[10px] uppercase tracking-[0.2em] font-bold">
                      <Heart size={16} className="text-rose-500 dark:text-rose-400" /> Support
                    </div>
                    <div className="text-3xl font-extrabold font-mono text-zinc-900 dark:text-white tracking-tight">{stats.donationCount.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              <div 
                className="w-full max-w-2xl mt-4 mb-8"
              >
                <div className="text-center mb-8">
                  <h3 className="text-sm uppercase tracking-[0.2em] text-zinc-500 font-bold mb-2">How it works</h3>
                  <p className="text-zinc-600 dark:text-zinc-400 text-xs mb-8">Extract your conversations in 3 simple steps</p>
                  
                  <div className="w-full flex justify-center mb-8 bg-zinc-50/50 dark:bg-black/20 rounded-2xl border border-zinc-100 dark:border-zinc-800/50 p-4 sm:p-8 shadow-sm">
                    <motion.svg 
                      width="480" 
                      height="140" 
                      viewBox="0 0 480 140" 
                      fill="none" 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="text-white w-full max-w-full h-auto drop-shadow-sm"
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      {/* Character Pointing */}
                      <circle cx="40" cy="40" r="14" stroke="currentColor" strokeWidth="3" fill="none" />
                      <path d="M40 54 V100 M40 70 Q 60 60 90 40 M40 70 L 20 90 M40 100 L 25 130 M40 100 L 55 130" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      
                      {/* Flow Line */}
                      <motion.path 
                        d="M95 40 Q 150 40 180 70 T 420 70" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeDasharray="4 6" 
                        fill="none" 
                        strokeLinecap="round" 
                        animate={{ strokeDashoffset: [0, -20] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      />
                      
                      {/* Step 1: AI Chat Context */}
                      <g transform="translate(140, 45)">
                        <rect x="0" y="0" width="50" height="50" rx="8" fill="currentColor" fillOpacity="0.05" stroke="currentColor" strokeWidth="2" />
                        <path d="M12 15 h26 M12 25 h20 M12 35 h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <path d="M35 30 l8 8 l-2 -8 z" fill="currentColor" />
                      </g>
                      
                      {inputMode === 'file' ? (
                        <>
                          {/* Step 2: Keyboard / Save Context */}
                          <g transform="translate(260, 45)">
                            <rect x="0" y="0" width="60" height="50" rx="6" fill="currentColor" fillOpacity="0.05" stroke="currentColor" strokeWidth="2" />
                            
                            {/* CTRL Key */}
                            <rect x="6" y="10" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
                            <text x="15" y="19.5" fontSize="6" fontWeight="bold" fill="currentColor" textAnchor="middle" dominantBaseline="middle">Ctrl</text>
                            
                            {/* + Key */}
                            <rect x="26" y="10" width="12" height="14" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
                            <text x="32" y="19.5" fontSize="8" fontWeight="bold" fill="currentColor" textAnchor="middle" dominantBaseline="middle">+</text>
                            
                            {/* S Key */}
                            <rect x="40" y="10" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
                            <text x="47" y="19.5" fontSize="8" fontWeight="bold" fill="currentColor" textAnchor="middle" dominantBaseline="middle">S</text>
                            
                            <rect x="8" y="28" width="44" height="12" rx="3" stroke="currentColor" strokeWidth="2" fill="none" />
                          </g>

                          {/* Step 3: Extract / HTML Document */}
                          <g transform="translate(390, 40)">
                            <path d="M0 0 L35 0 L50 15 L50 60 L0 60 Z" fill="currentColor" fillOpacity="0.05" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                            <path d="M35 0 L35 15 L50 15" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                            <path d="M10 30 L16 25 L10 20 M20 30 L26 25 L20 20 M30 30 L35 30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M15 45 H35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          </g>
                        </>
                      ) : (
                        <>
                          {/* Step 2: Share Link */}
                          <g transform="translate(260, 45)">
                            <rect x="0" y="0" width="60" height="50" rx="6" fill="currentColor" fillOpacity="0.05" stroke="currentColor" strokeWidth="2" />
                            
                            {/* Inner Box */}
                            <rect x="14" y="12" width="32" height="26" rx="4" stroke="currentColor" strokeWidth="2" fill="none" />
                            
                            {/* Link Icon */}
                            <path d="M 25 29 h -2 a 4 4 0 0 1 0 -8 h 2 M 35 21 h 2 a 4 4 0 0 1 0 8 h -2 M 25 25 h 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                          </g>

                          {/* Step 3: Paste Input */}
                          <g transform="translate(390, 40)">
                            {/* Clipboard Icon */}
                            <rect x="10" y="15" width="30" height="35" rx="3" fill="currentColor" fillOpacity="0.05" stroke="currentColor" strokeWidth="2" />
                            <rect x="18" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
                            <path d="M18 28 h14 m-14 8 h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          </g>
                        </>
                      )}
                    </motion.svg>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
                  {inputMode === 'file' ? (
                    <>
                      <div className="flex flex-col items-center text-center p-6 bg-zinc-100/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl relative">
                        <div className="w-8 h-8 rounded-full bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-bold text-xs mb-4 absolute -top-4 shadow-lg uppercase tracking-widest font-mono">1</div>
                        <div className="bg-white dark:bg-zinc-950 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm mb-4 w-full flex justify-center">
                          <svg className="w-6 h-6 text-zinc-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                        </div>
                        <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm mb-2">Open AI Chat</h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">Navigate to your finished conversation in ChatGPT, Claude, or any AI platform.</p>
                      </div>

                      <div className="flex flex-col items-center text-center p-6 bg-zinc-100/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl relative">
                        <div className="w-8 h-8 rounded-full bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-bold text-xs mb-4 absolute -top-4 shadow-lg uppercase tracking-widest font-mono">2</div>
                        <div className="bg-white dark:bg-zinc-950 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm mb-4 w-full flex justify-center">
                          <svg className="w-6 h-6 text-zinc-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                        </div>
                        <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm mb-2">Save as HTML</h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">Press <strong className="text-zinc-900 dark:text-white">Ctrl+S</strong> (or <strong className="text-zinc-900 dark:text-white">Cmd+S</strong>) on your keyboard and save as "Webpage, HTML Only".</p>
                      </div>

                      <div className="flex flex-col items-center text-center p-6 bg-zinc-100/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl relative">
                        <div className="w-8 h-8 rounded-full bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-bold text-xs mb-4 absolute -top-4 shadow-lg uppercase tracking-widest font-mono">3</div>
                        <div className="bg-white dark:bg-zinc-950 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm mb-4 w-full flex justify-center">
                          <svg className="w-6 h-6 text-zinc-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                        </div>
                        <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm mb-2">Upload File</h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">Drag & drop the saved HTML file into the dropzone above to extract the chat.</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex flex-col items-center text-center p-6 bg-zinc-100/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl relative">
                        <div className="w-8 h-8 rounded-full bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-bold text-xs mb-4 absolute -top-4 shadow-lg uppercase tracking-widest font-mono">1</div>
                        <div className="bg-white dark:bg-zinc-950 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm mb-4 w-full flex justify-center">
                          <svg className="w-6 h-6 text-zinc-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                        </div>
                        <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm mb-2">Open AI Chat</h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">Navigate to your finished conversation in ChatGPT.</p>
                      </div>

                      <div className="flex flex-col items-center text-center p-6 bg-zinc-100/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl relative">
                        <div className="w-8 h-8 rounded-full bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-bold text-xs mb-4 absolute -top-4 shadow-lg uppercase tracking-widest font-mono">2</div>
                        <div className="bg-white dark:bg-zinc-950 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm mb-4 w-full flex justify-center">
                          <LinkIcon className="w-6 h-6 text-zinc-400 dark:text-zinc-500" />
                        </div>
                        <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm mb-2">Create Link</h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">Click the Share icon in the top right corner and create a public link.</p>
                      </div>

                      <div className="flex flex-col items-center text-center p-6 bg-zinc-100/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl relative">
                        <div className="w-8 h-8 rounded-full bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-bold text-xs mb-4 absolute -top-4 shadow-lg uppercase tracking-widest font-mono">3</div>
                        <div className="bg-white dark:bg-zinc-950 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm mb-4 w-full flex justify-center">
                          <Copy className="w-6 h-6 text-zinc-400 dark:text-zinc-500" />
                        </div>
                        <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm mb-2">Paste & Extract</h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">Paste the copied share link into the input field above to parse the conversation.</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <DonationSection />
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-3xl mt-8"
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4">
                <h3 className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-bold bg-zinc-100 dark:bg-zinc-900 px-3 py-1 rounded inline-flex">Bridged Conversion</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => { setChatData(null); setHtmlFile(null); setShareLink(''); setInputMode('file'); }}
                    className="text-[9px] uppercase tracking-[0.2em] text-zinc-500 hover:text-red-500 flex items-center gap-1.5 transition-colors font-bold"
                  >
                    <Trash2 size={12} /> Clear Bridge
                  </button>
                </div>
              </div>

              <div className="bg-white/50 backdrop-blur-xl dark:bg-[#0a0a0a]/50 border border-zinc-200/50 dark:border-white/10 overflow-hidden mb-12 rounded-2xl shadow-2xl relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-zinc-100 dark:to-white/5 pointer-events-none"></div>
                <div className="flex flex-col md:flex-row md:items-center justify-between p-5 border-b border-zinc-200/50 dark:border-white/5 bg-zinc-50/50 dark:bg-black/20 gap-4 relative z-10">
                  <div className="font-sans text-[13px] text-zinc-900 dark:text-white font-bold truncate leading-tight select-all">{chatData.title}</div>
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="text-[9px] uppercase tracking-[0.2em] text-zinc-500 font-mono flex items-center gap-1"><FileText size={10}/> {chatData.messages.length} msgs</span>
                    <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={async () => {
                            if (!chatData) return;
                            try {
                              let currentUser = user;
                              if (!currentUser) {
                                currentUser = await signInWithGoogle();
                              }
                              setVaultSaved(false);
                              await vaultDbTools.saveItem({
                                id: chatData.title + '_' + Date.now(),
                                date: Date.now(),
                                data: chatData
                              });
                              setVaultSaved(true);
                              setTimeout(() => setVaultSaved(false), 2000);
                            } catch (error) {
                              console.error('Failed to save to vault:', error);
                            }
                          }}
                          className="px-3 py-1.5 border border-zinc-200 dark:border-white/10 text-[9px] uppercase tracking-[0.15em] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800 rounded-lg transition-all flex items-center gap-1.5 shadow-sm font-bold"
                        >
                          {vaultSaved ? <CheckCircle2 size={12} /> : <Database size={12} />}
                          {vaultSaved ? 'Saved to Vault' : 'Save to Vault'}
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              setCopied('loading');
                              setLinkStatus({ step: 'Formatting conversation payload...', progress: 10 });
                              await new Promise(r => setTimeout(r, 400));
                              
                              setLinkStatus({ step: 'Transmitting to secure pastebin...', progress: 45 });
                              const res = await fetch('/api/public-bridge', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ text: formatAsPrompt(chatData) })
                              });
                              
                              setLinkStatus({ step: 'Generating text-only public endpoint...', progress: 85 });
                              const { url } = await res.json();
                              
                              setLinkStatus({ step: 'Finalizing bridge...', progress: 100 });
                              await new Promise(r => setTimeout(r, 300));
                              
                              copyToClipboard(url, 'bridge');
                            } catch (e) {
                              console.error(e);
                              setCopied(null);
                            } finally {
                              setLinkStatus(null);
                            }
                          }}
                          disabled={copied === 'loading'}
                          className="px-4 py-1.5 bg-zinc-900 border border-transparent dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-100 rounded-lg text-[9px] uppercase tracking-[0.15em] font-bold transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-80 disabled:cursor-not-allowed group relative overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-white/20 dark:bg-black/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                          {copied === 'bridge' ? <CheckCircle2 size={12} className="text-green-400 relative z-10" /> : copied === 'loading' ? <Loader2 size={12} className="animate-spin relative z-10 text-white/70 dark:text-black/70" /> : <LinkIcon size={12} className="relative z-10 text-white/70 dark:text-black/70" />}
                          <span className="relative z-10">{copied === 'bridge' ? 'Link Copied' : copied === 'loading' ? 'Generating...' : 'Public Link'}</span>
                        </button>
                        <button
                          onClick={() => copyToClipboard(formatAsPrompt(chatData), 'prompt')}
                          className="px-3 py-1.5 border border-zinc-200 dark:border-white/10 text-[9px] uppercase tracking-[0.15em] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800 rounded-lg transition-all flex items-center gap-1.5 shadow-sm font-bold"
                        >
                          {copied === 'prompt' ? <CheckCircle2 size={12} className="text-green-500" /> : <Copy size={12} className="text-zinc-400" />}
                          {copied === 'prompt' ? 'Copied' : 'Copy Text'}
                        </button>
                        <button
                          onClick={() => downloadFile(formatAsMarkdown(chatData), 'chat-export.md', 'text/markdown')}
                          className="px-3 py-1.5 border border-zinc-200 dark:border-white/10 text-[9px] uppercase tracking-[0.15em] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800 rounded-lg transition-all flex items-center gap-1.5 shadow-sm font-bold"
                        >
                          <FileText size={12} className="text-zinc-400" /> MD
                        </button>
                        <button
                          onClick={() => downloadFile(JSON.stringify(chatData.messages, null, 2), 'chat-export.json', 'application/json')}
                          className="px-3 py-1.5 border border-zinc-200 dark:border-white/10 text-[9px] uppercase tracking-[0.15em] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800 rounded-lg transition-all flex items-center gap-1.5 shadow-sm font-bold"
                        >
                          <FileJson size={12} className="text-zinc-400" /> JSON
                        </button>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {linkStatus && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-b border-zinc-200/50 dark:border-white/10 overflow-hidden"
                    >
                      <div className="p-4 bg-zinc-50/80 dark:bg-zinc-900/40 backdrop-blur-md">
                        <div className="flex justify-between items-center mb-2 font-mono text-[10px] uppercase tracking-widest text-zinc-600 dark:text-zinc-400">
                          <span>{linkStatus.step}</span>
                          <span className="text-zinc-900 dark:text-white font-bold">{linkStatus.progress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-200/50 dark:bg-black/50 overflow-hidden relative rounded-full shadow-inner">
                          <motion.div
                            className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-zinc-500 to-zinc-900 dark:from-zinc-400 dark:to-white rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${linkStatus.progress}%` }}
                            transition={{ ease: "easeOut", duration: 0.3 }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="bg-zinc-50/50 dark:bg-[#0a0a0a]/50 border-b border-zinc-200/50 dark:border-white/5 p-3 flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-sm relative z-10">
                  <div className="text-[10px] text-zinc-600 dark:text-zinc-400 font-mono flex items-center gap-3">
                    <span className="text-zinc-900 dark:text-white bg-white dark:bg-black border border-zinc-200/50 dark:border-white/10 px-2 py-0.5 rounded shadow-sm uppercase tracking-widest text-[8px] font-bold">Tip</span>
                    Claude and Grok do not support secure automatic link extraction. Use HTML export instead.
                  </div>
                  <div className="relative w-full md:w-64 group">
                    <div className="absolute inset-0 bg-gradient-to-r from-zinc-200 to-transparent dark:from-white/10 blur-md group-focus-within:opacity-100 opacity-0 transition-opacity"></div>
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                      <Search size={14} className="text-zinc-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search messages..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white dark:bg-black border border-zinc-200/50 dark:border-white/10 rounded-lg text-sm pl-9 pr-4 py-2.5 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 dark:focus:ring-white/5 focus:border-zinc-500 dark:focus:border-zinc-500 relative z-10 shadow-sm transition-all"
                    />
                  </div>
                </div>
                
                <div className="divide-y divide-zinc-200/50 dark:divide-white/5 bg-white dark:bg-[#0a0a0a] max-h-[600px] overflow-y-auto">
                  {filteredMessages.length === 0 && (
                    <div className="p-8 text-center text-sm text-zinc-500 dark:text-zinc-400 font-mono">
                      No messages found matching your search.
                    </div>
                  )}
                  {filteredMessages.map((msg, idx) => (
                    <motion.div 
                      key={idx} 
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(idx * 0.05, 0.5), duration: 0.3 }}
                      className={`px-4 py-6 md:px-8 flex flex-col group relative ${
                        msg.role === 'user' 
                          ? 'items-end' 
                          : 'items-start hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors'
                      }`}
                    >
                      <button
                        onClick={() => copyToClipboard(msg.content, `msg-${idx}`)}
                        className={`absolute top-4 ${msg.role === 'user' ? 'left-4' : 'right-4'} p-2 opacity-0 group-hover:opacity-100 transition-all text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-[#0a0a0a] border border-zinc-200/50 dark:border-white/10 shadow-lg hover:shadow-xl rounded-xl z-20`}
                        title="Copy message"
                      >
                        {copied === `msg-${idx}` ? <CheckCircle2 size={14} className="text-green-500" /> : <Copy size={14} />}
                      </button>

                      <div className={`flex flex-col w-full max-w-[85%] md:max-w-3xl ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        {msg.role !== 'unknown' && (
                          <div className="flex items-center gap-2 mb-1.5 px-1">
                            <span className="text-[10px] font-mono tracking-widest uppercase text-zinc-400 dark:text-zinc-500 font-medium">
                              {msg.role}
                            </span>
                          </div>
                        )}
                        
                        <div className={`flex-1 min-w-0 prose dark:prose-invert prose-p:leading-relaxed prose-pre:bg-zinc-100 dark:prose-pre:bg-zinc-900/80 prose-pre:border prose-pre:border-zinc-200/50 dark:prose-pre:border-white/5 prose-pre:rounded-xl prose-pre:shadow-inner max-w-none text-sm font-sans relative z-10 w-full ${
                          msg.role === 'user' 
                            ? 'text-left text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800/80 px-5 py-4 rounded-3xl rounded-tr-md shadow-sm border border-black/5 dark:border-white/5' 
                            : 'text-left text-zinc-700 dark:text-zinc-300 md:pl-2'
                        }`} style={{ wordBreak: 'break-word' }}>
                          
                          {msg.images && msg.images.length > 0 && (
                            <div className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end mb-4' : 'items-start mb-4'}`}>
                              {msg.images.map((imgUrl, i) => {
                                const isAbsolute = imgUrl.startsWith('http') || imgUrl.startsWith('data:');
                                return <ChatImage key={i} url={imgUrl} isAbsolute={isAbsolute} />;
                              })}
                            </div>
                          )}

                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                          </ReactMarkdown>

                          {msg.content.includes('Uploaded image') && msg.role === 'user' && (!msg.images || msg.images.length === 0) && (
                            <div className="mt-3 text-xs opacity-80 bg-black/5 dark:bg-white/5 p-3 rounded-lg border border-black/10 dark:border-white/10 flex flex-col gap-1.5">
                              <span className="font-bold flex items-center gap-1"><span className="text-amber-500">⚠</span> ChatGPT Limitation</span>
                              <span>OpenAI currently removes images from shared links for privacy reasons. Because of this, we can't extract it from the link. To include images, please save the ChatGPT page as an HTML file (Cmd/Ctrl + S) and use the "Local HTML File" upload option instead.</span>
                            </div>
                          )}
                          
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </>
        )}
      </main>

      <footer className="px-4 sm:px-6 md:px-12 py-6 sm:py-8 border-t border-zinc-200/50 dark:border-white/5 flex flex-col md:flex-row gap-4 justify-between items-center bg-white/50 dark:bg-[#0a0a0a]/50 backdrop-blur-xl mt-auto shrink-0 z-10 relative">
        <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-mono flex items-center gap-2">
          System Status: <span className="flex items-center gap-1.5 text-zinc-900 dark:text-white font-bold"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Operational</span> <span className="opacity-50">•</span> V2.0-Alpha
        </div>
        <div className="flex gap-6 text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">
          <button onClick={() => setCurrentTab('security')} className="hover:text-zinc-900 dark:text-white transition-colors">Security</button>
          <button onClick={() => setCurrentTab('apidocs')} className="hover:text-zinc-900 dark:text-white transition-colors">API Docs</button>
          <button onClick={() => setCurrentTab('privacy')} className="hover:text-zinc-900 dark:text-white transition-colors">Privacy Policy</button>
          <button onClick={() => setCurrentTab('terms')} className="hover:text-zinc-900 dark:text-white transition-colors">Terms of Service</button>
          <button onClick={() => setCurrentTab('contact')} className="hover:text-zinc-900 dark:text-white transition-colors">Contact</button>
        </div>
      </footer>

      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="flex flex-col items-center gap-6 p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl max-w-sm w-full mx-4"
            >
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 bg-zinc-100 dark:bg-white/10 rounded-full animate-ping opacity-50" style={{ animationDuration: '2s' }}></div>
                <div className="bg-zinc-900 dark:bg-white text-white dark:text-black p-4 rounded-xl relative z-10">
                  <Loader2 size={32} className="animate-spin" />
                </div>
              </div>
              
              <div className="flex flex-col items-center text-center w-full">
                <span className="text-zinc-900 dark:text-white font-bold text-lg mb-2 tracking-tight">Processing...</span>
                <span className="text-zinc-500 dark:text-zinc-400 font-mono text-[10px] uppercase tracking-widest">{uploadProgress?.phase || 'Initializing...'}</span>
              </div>
              
              <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-950 overflow-hidden rounded-full border border-zinc-200 dark:border-zinc-800">
                 <motion.div
                   className="h-full bg-zinc-900 dark:bg-white w-full"
                   initial={{ x: '-100%' }}
                   animate={{ x: `${(uploadProgress?.percent || 0) - 100}%` }}
                   transition={{ ease: "easeOut", duration: 0.3 }}
                 />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
