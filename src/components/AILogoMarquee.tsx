import React from 'react';
import { motion } from 'motion/react';

const aiModels = [
  { name: 'ChatGPT', color: 'text-emerald-500' },
  { name: 'Gemini', color: 'text-blue-500' },
  { name: 'Claude', color: 'text-orange-500' },
  { name: 'Llama 3', color: 'text-indigo-500' },
  { name: 'Mistral', color: 'text-yellow-500' },
  { name: 'Perplexity', color: 'text-cyan-500' },
  { name: 'Cohere', color: 'text-violet-500' },
];

const shapes = [
  "M12 2L2 22h20L12 2z", // Triangle
  "M2 12A10 10 0 1 0 22 12A10 10 0 1 0 2 12Z", // Circle
  "M3 3h18v18H3V3z", // Square
  "M12 2l8.66 5v10L12 22l-8.66-5V7L12 2z", // Hexagon
  "M12 2L2 22h20L12 2z" // Back to triangle
];

export function AILogoMarquee() {
  const duplicatedModels = [...aiModels, ...aiModels, ...aiModels, ...aiModels];

  return (
    <div className="w-full max-w-5xl mx-auto overflow-hidden relative mb-16 -mt-4 opacity-80 pointer-events-none">
      {/* Fade edges */}
      <div className="absolute inset-y-0 left-0 w-24 md:w-48 bg-gradient-to-r from-zinc-50 dark:from-[#0a0a0a] to-transparent z-10"></div>
      <div className="absolute inset-y-0 right-0 w-24 md:w-48 bg-gradient-to-l from-zinc-50 dark:from-[#0a0a0a] to-transparent z-10"></div>
      
      <motion.div
        className="flex gap-16 whitespace-nowrap items-center w-max"
        animate={{ x: ['0%', '-50%'] }}
        transition={{
          duration: 35,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        {duplicatedModels.map((model, i) => (
          <div key={i} className="flex items-center gap-4 shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" className={`fill-current ${model.color}`}>
              <motion.path
                animate={{
                  d: shapes
                }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  ease: "linear",
                  delay: (i % aiModels.length) * 0.5
                }}
              />
            </svg>
            <span className="font-bold tracking-[0.2em] uppercase text-xs md:text-sm text-zinc-500/80 dark:text-zinc-400/80">
              {model.name}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
