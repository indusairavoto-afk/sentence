import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Lock, Unlock, FileText, Database, Shield, Key, Trash2, Eye } from 'lucide-react';
import { vaultDbTools } from '../lib/vaultDb';
import { ChatData } from '../App';

export function Vault() {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [items, setItems] = useState<{id: string, date: number, data: ChatData}[]>([]);

  const loadItems = async () => {
    try {
      const dbItems = await vaultDbTools.getItems();
      setItems(dbItems.sort((a, b) => b.date - a.date));
    } catch (e) {
      console.error('Failed to load vault items:', e);
    }
  };

  useEffect(() => {
    if (unlocked) {
      loadItems();
    }
  }, [unlocked]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await vaultDbTools.deleteItem(id);
      loadItems();
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin' || password.length >= 4) {
      setUnlocked(true);
      setError(false);
    } else {
      setError(true);
      setPassword('');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center py-12 relative z-10">
      <div className="text-center mb-12 relative">
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter mb-4 bg-clip-text text-transparent bg-gradient-to-b from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-500">Secure Vault</h2>
        <p className="text-zinc-500 text-sm tracking-wide font-mono">Store your extracted conversations securely.</p>
      </div>

      {!unlocked ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white/50 backdrop-blur-xl dark:bg-[#0a0a0a]/50 border border-zinc-200/50 dark:border-white/10 p-8 shadow-2xl rounded-2xl overflow-hidden relative"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-zinc-400 dark:via-zinc-600 to-transparent opacity-20"></div>
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-white/5 flex items-center justify-center text-zinc-400 shadow-lg shadow-black/5 dark:shadow-white/5 relative z-10">
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-zinc-200 dark:to-white/10 rounded-2xl opacity-50 pointer-events-none"></div>
              <Lock size={24} className="relative z-10" />
            </div>
          </div>
          
          <form onSubmit={handleUnlock} className="flex flex-col gap-5">
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold mb-3 block text-center">Master Password</label>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-xl group-focus-within:opacity-100 opacity-0 transition-opacity duration-500"></div>
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 z-20" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full bg-white dark:bg-black border ${error ? 'border-red-500 text-red-500 focus:ring-red-500/20' : 'border-zinc-200/50 dark:border-white/10 text-zinc-900 dark:text-white'} text-sm pl-12 pr-4 py-4 placeholder-zinc-400 focus:outline-none focus:border-zinc-500 dark:focus:border-zinc-500 rounded-xl transition-all shadow-sm relative z-10 focus:ring-4 focus:ring-black/5 dark:focus:ring-white/5`}
                  placeholder="Enter any password to unlock..."
                />
              </div>
            </div>
            {error && <p className="text-[10px] text-red-500 font-mono text-center uppercase tracking-widest bg-red-50 dark:bg-red-950/20 py-2 rounded">Password too short. Try again.</p>}
            <button 
              type="submit"
              className="w-full bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-100 px-6 py-4 rounded-xl font-bold text-[10px] uppercase tracking-[0.2em] shadow-xl hover:shadow-[0_0_30px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 mt-2 group outline-none overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-white/20 dark:bg-black/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
              <span className="relative z-10">Unlock Vault</span>
            </button>
          </form>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full"
        >
          <div className="w-full flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-zinc-100/50 dark:bg-zinc-900/50 p-4 rounded-2xl border border-zinc-200/50 dark:border-white/5 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 dark:bg-green-500/20 rounded-lg">
                <Unlock size={16} className="text-green-600 dark:text-green-400" />
              </div>
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-900 dark:text-white">Vault Access Granted</span>
            </div>
            <button 
              onClick={() => setUnlocked(false)}
              className="text-[10px] uppercase tracking-[0.15em] px-4 py-2 border border-zinc-200 dark:border-white/10 hover:bg-white dark:hover:bg-black rounded-lg transition-colors text-zinc-600 dark:text-zinc-400 font-bold shadow-sm"
            >
              Lock Vault
            </button>
          </div>

          {items.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item) => (
                  <div key={item.id} className="bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md border border-zinc-200/50 dark:border-white/10 p-6 rounded-2xl hover:border-zinc-400 dark:hover:border-zinc-600 transition-all group relative flex flex-col justify-between min-h-[160px] shadow-sm hover:shadow-xl hover:-translate-y-1">
                    <div>
                      <div className="flex justify-between items-start mb-5">
                        <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-500 border border-zinc-200/50 dark:border-white/5 shadow-inner">
                          <Database size={16} />
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            title="Delete from Vault"
                            onClick={(e) => handleDelete(item.id, e)}
                            className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors border border-transparent hover:border-red-100 dark:hover:border-red-900/50"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-2 line-clamp-2 leading-snug" title={item.data.title}>{item.data.title}</h3>
                    </div>
                    <div className="flex items-center justify-between mt-6 border-t border-zinc-200/50 dark:border-white/5 pt-4">
                      <div className="flex items-center gap-3 text-[10px] text-zinc-500 font-mono tracking-wider uppercase">
                        <span className="flex items-center gap-1.5"><FileText size={12} className="text-zinc-400" /> {item.data.messages.length} msgs</span>
                        <span className="opacity-50">•</span>
                        <span>{new Date(item.date).toLocaleDateString()}</span>
                      </div>
                      <Shield size={14} className="text-green-500/70" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-12 p-6 bg-zinc-50/50 dark:bg-[#0a0a0a]/50 border border-zinc-200/50 dark:border-white/5 rounded-2xl text-center border-dashed">
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono uppercase tracking-[0.2em] opacity-75">No more items in the vault.</p>
              </div>
            </>
          ) : (
            <div className="w-full mt-8 p-12 bg-white/50 backdrop-blur-md dark:bg-[#0a0a0a]/50 border border-zinc-200/50 dark:border-white/10 rounded-2xl text-center flex flex-col items-center justify-center min-h-[350px] shadow-sm">
              <div className="w-24 h-24 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/50 dark:border-white/5 flex items-center justify-center text-zinc-300 dark:text-zinc-700 mb-8 border-dashed">
                <Database size={32} />
              </div>
              <h3 className="text-xl font-extrabold text-zinc-900 dark:text-white mb-3 tracking-tight">Vault is Empty</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mb-6 leading-relaxed">You haven't saved any extracted conversations to your secure vault yet.</p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
