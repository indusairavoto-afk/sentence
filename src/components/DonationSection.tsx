import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, X, Sparkles, Coffee } from 'lucide-react';

export function DonationSection() {
  const [showQr, setShowQr] = useState(false);
  const [activeTab, setActiveTab] = useState<'upi' | 'crypto'>('upi');

  return (
    <div className="w-full bg-zinc-900 text-white rounded-3xl p-8 mb-8 relative overflow-hidden shadow-2xl border border-zinc-800">
      <div className="absolute top-0 right-0 p-8 opacity-10">
        <Heart size={120} />
      </div>
      
      <div className="relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-800 rounded-full text-xs font-mono mb-6 border border-zinc-700">
          <Sparkles size={12} className="text-yellow-400" />
          <span className="text-zinc-300">Support the Project</span>
        </div>
        
        <h3 className="text-2xl font-bold mb-3 font-sans">Help us keep building</h3>
        <p className="text-zinc-400 text-sm max-w-md mb-8 leading-relaxed">
          This tool is free and open source. If you find it useful, consider buying us a coffee or donating to support server costs.
        </p>

        {!showQr ? (
          <button 
            onClick={() => setShowQr(true)}
            className="group flex items-center gap-3 bg-white text-black px-6 py-3 rounded-full font-medium hover:bg-zinc-200 transition-all font-mono text-sm"
          >
            <Coffee size={16} />
            Show Donation Options
          </button>
        ) : (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 max-w-sm"
          >
            <div className="flex gap-2 mb-6">
              <button 
                onClick={() => setActiveTab('upi')}
                className={`flex-1 py-2 text-xs font-mono font-bold rounded-lg transition-colors ${activeTab === 'upi' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                UPI (India)
              </button>
              <button 
                onClick={() => setActiveTab('crypto')}
                className={`flex-1 py-2 text-xs font-mono font-bold rounded-lg transition-colors ${activeTab === 'crypto' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Crypto (Global)
              </button>
            </div>

            <div className="flex flex-col items-center">
              {activeTab === 'upi' && (
                <div className="flex flex-col items-center">
                  <div className="w-48 h-48 bg-white p-2 rounded-xl mb-4 border border-zinc-700">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=your-upi@id&pn=Developer" alt="UPI QR" className="w-full h-full rounded-md" />
                  </div>
                  <p className="text-xs font-mono text-zinc-400">Scan to pay with any UPI app</p>
                  <p className="text-xs font-mono text-zinc-500 mt-2">your-upi@id</p>
                </div>
              )}

              {activeTab === 'crypto' && (
                <div className="flex flex-col items-center w-full">
                  <div className="w-48 h-48 bg-white p-2 rounded-xl mb-4 border border-zinc-700 leading-none">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=bitcoin:your-btc-address" alt="Crypto QR" className="w-full h-full rounded-md" />
                  </div>
                  <p className="text-xs font-mono text-zinc-400 mb-2">BTC Network</p>
                  <div className="bg-zinc-900 p-2 rounded w-full flex items-center justify-between border border-zinc-800">
                    <span className="text-[10px] font-mono text-zinc-500 break-all">your-btc-address</span>
                  </div>
                </div>
              )}
            </div>
            
            <button 
              onClick={() => setShowQr(false)}
              className="mt-6 w-full py-2 text-xs font-mono text-zinc-500 hover:text-zinc-300"
            >
              Hide
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
