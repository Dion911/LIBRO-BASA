import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface ProgressIndicatorProps {
  progress: number;
  trend: number;
  totalPages: number;
  currentPage: number;
  onClick?: () => void;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ progress, trend, totalPages, currentPage, onClick }) => {
  const segments = 32;
  const activeSegments = Math.floor((progress / 100) * segments);
  const [hoveredSegment, setHoveredSegment] = React.useState<number | null>(null);

  const getPagesForSegment = (index: number) => {
    const pagesPerSegment = totalPages / segments;
    const start = Math.round(index * pagesPerSegment);
    const end = Math.round((index + 1) * pagesPerSegment);
    return { start, end };
  };

  return (
    <motion.div 
      whileHover={{ scale: 1.01, borderColor: 'var(--braun-accent)' }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="bg-braun-panel/20 backdrop-blur-md text-braun-ink p-8 rounded-[2rem] shadow-xl w-full border border-braun-panel/30 relative overflow-hidden cursor-pointer group transition-colors duration-300"
    >
      {/* Background subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      
      <div className="flex justify-between items-start mb-2 relative z-10">
        <div className="space-y-1">
          <h3 className="text-[11px] font-mono uppercase tracking-[0.3em] opacity-60">Progress Indicator</h3>
          <p className="text-[10px] opacity-40">Keep reading to reach your goals</p>
        </div>
        <div className="w-2 h-2 rounded-full bg-braun-accent orange-glow mt-1" />
      </div>

      <div className="flex items-center gap-4 mb-8 mt-6 relative z-10">
        <motion.span 
          whileHover={{ scale: 1.1, color: 'var(--braun-accent)' }}
          className="text-5xl font-bold tracking-tighter leading-none transition-colors duration-300"
        >
          {progress}%
        </motion.span>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-braun-ink/5 px-3 py-1.5 rounded-full border border-braun-ink/10">
            {trend >= 0 ? <TrendingUp className="w-3 h-3 text-emerald-500" /> : <TrendingDown className="w-3 h-3 text-rose-500" />}
            <span className="text-[11px] font-bold tracking-tight">{Math.abs(trend)}%</span>
          </div>
          <span className="text-[10px] opacity-40 uppercase tracking-widest">vs. last period</span>
        </div>
      </div>

      <div className="relative">
        <div className="flex gap-[3px] h-8 relative z-10">
          {[...Array(segments)].map((_, i) => (
            <motion.div
              key={i}
              onMouseEnter={() => setHoveredSegment(i)}
              onMouseLeave={() => setHoveredSegment(null)}
              initial={{ opacity: 0.1 }}
              animate={{ 
                opacity: i < activeSegments ? 1 : (hoveredSegment === i ? 0.3 : 0.1),
                backgroundColor: i < activeSegments ? 'var(--braun-accent)' : 'currentColor',
                scaleY: hoveredSegment === i ? 1.2 : 1
              }}
              className="flex-1 rounded-[2px] transition-all duration-200"
            />
          ))}
        </div>

        <AnimatePresence>
          {hoveredSegment !== null && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute -top-8 left-0 right-0 flex justify-center pointer-events-none"
            >
              <div className="bg-braun-ink text-white text-[9px] font-mono px-2 py-1 rounded uppercase tracking-widest">
                Pages {getPagesForSegment(hoveredSegment).start} - {getPagesForSegment(hoveredSegment).end}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
