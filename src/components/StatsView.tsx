import React, { useMemo } from 'react';
import { Book, ReadingSession } from '../types';
import { motion } from 'motion/react';

interface StatsViewProps {
  books: Book[];
  sessions: ReadingSession[];
}

export const StatsView: React.FC<StatsViewProps> = ({ books, sessions }) => {
  const currentYear = new Date().getFullYear();
  
  const booksDoneThisYear = books.filter(b => 
    b.status === 'finished' && b.dateFinished && new Date(b.dateFinished).getFullYear() === currentYear
  ).length;

  const totalPagesRead = sessions.reduce((acc, s) => acc + s.pagesRead, 0);
  
  const avgRating = useMemo(() => {
    const ratedBooks = books.filter(b => b.rating && b.rating > 0);
    if (ratedBooks.length === 0) return 0;
    return (ratedBooks.reduce((acc, b) => acc + (b.rating || 0), 0) / ratedBooks.length).toFixed(1);
  }, [books]);

  // Pages per month calculation
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const pagesPerMonth = months.map((_, i) => {
    return sessions
      .filter(s => new Date(s.date).getMonth() === i && new Date(s.date).getFullYear() === currentYear)
      .reduce((acc, s) => acc + s.pagesRead, 0);
  });

  const maxPages = Math.max(...pagesPerMonth, 1);

  // Top Genres
  const genres = useMemo(() => {
    const counts: Record<string, number> = {};
    books.forEach(b => {
      if (b.genre) {
        counts[b.genre] = (counts[b.genre] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
  }, [books]);

  return (
    <div className="space-y-12 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] opacity-40 mb-2">Performance_Metrics</p>
          <h2 className="text-4xl font-bold uppercase tracking-tighter">System_Stats</h2>
        </div>
        <div className="flex bg-braun-panel/10 p-1 rounded-sm border border-braun-panel/20">
          {['2026', '2025', 'ALL'].map(y => (
            <button 
              key={y} 
              className={`px-4 py-1.5 text-[10px] font-mono uppercase transition-all ${
                y === '2026' 
                  ? 'bg-braun-ink text-white shadow-sm' 
                  : 'opacity-40 hover:opacity-100'
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Books_Done', value: booksDoneThisYear.toString().padStart(2, '0'), sub: '+4_YTD', target: 'Target: 24', active: true },
          { label: 'Pages_Read', value: totalPagesRead.toLocaleString(), sub: 'In_Progress', target: 'Avg: 312/d', active: false },
          { label: 'Avg_Rating', value: avgRating, sub: 'System_Wide', target: 'Scale: 5.0', active: false, isRating: true }
        ].map((stat, idx) => (
          <div key={idx} className="lcd-display h-40 flex flex-col justify-between group">
            {/* LCD Texture Layers */}
            <div className="absolute inset-0 dot-pattern opacity-[0.08] pointer-events-none" />
            <div className="absolute inset-0 lcd-scanline pointer-events-none" />
            
            <div className="flex justify-between items-start relative z-10">
              <span className="text-[9px] uppercase font-bold tracking-widest opacity-60">{stat.label}</span>
              <div className={`w-2 h-2 rounded-full ${stat.active ? 'bg-braun-accent orange-glow' : 'opacity-20 bg-braun-ink'}`} />
            </div>

            <div className="flex items-baseline gap-3 relative z-10">
              <span className="text-6xl font-space font-medium tracking-tighter leading-none">
                {stat.value}
              </span>
              <div className="flex flex-col">
                <span className="text-[8px] font-mono text-braun-accent uppercase font-bold">{stat.sub}</span>
                <span className="text-[8px] font-mono opacity-40 uppercase">{stat.target}</span>
              </div>
            </div>

            {stat.isRating && (
              <div className="flex gap-1 relative z-10">
                {[...Array(5)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-3 h-1 rounded-full transition-all ${
                      i < Math.round(Number(avgRating)) 
                        ? 'bg-braun-accent orange-glow' 
                        : 'bg-braun-ink/10'
                    }`} 
                  />
                ))}
              </div>
            )}
            
            {/* Subtle corner accent */}
            <div className="absolute bottom-1 right-1 w-2 h-2 border-r border-b border-braun-ink/10" />
          </div>
        ))}
      </div>

      {/* Pages per Month Chart */}
      <div className="bg-braun-bg border border-braun-panel p-10 relative group/chart">
        <div className="absolute inset-0 grid-background pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-full dot-pattern opacity-[0.1] pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-12 relative z-10">
          <div>
            <h3 className="text-[10px] font-mono uppercase tracking-[0.3em] opacity-40">Activity_Log_Matrix</h3>
            <p className="text-[8px] font-mono opacity-20 uppercase mt-1">Ref_ID: {currentYear}_LOG_01</p>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-[9px] font-mono opacity-40">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-braun-panel/30 border border-braun-panel/50 rounded-sm" />
              <span>Historical_Data</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-braun-accent rounded-sm orange-glow" />
              <span>Active_Session</span>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto pb-4 scrollbar-thin relative z-10">
          <div className="flex items-end justify-between h-56 gap-3 md:gap-6 min-w-[600px] md:min-w-0 px-4">
            {pagesPerMonth.map((pages, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-4 group/bar h-full">
                <div className="relative w-full flex flex-col items-center justify-end h-full">
                  {/* Background Track */}
                  <div className="absolute inset-x-0 bottom-0 top-0 w-full bg-braun-panel/5 rounded-t-sm border-x border-t border-braun-panel/10" />
                  
                  {/* Value Label on Hover */}
                  <div className="absolute -top-10 opacity-0 group-hover/bar:opacity-100 transition-all duration-300 transform translate-y-2 group-hover/bar:translate-y-0 whitespace-nowrap z-20">
                    <div className="bg-braun-ink text-white px-3 py-1.5 rounded-sm shadow-xl relative">
                      <span className="text-[10px] font-mono font-bold tracking-wider">{pages}</span>
                      <span className="text-[8px] opacity-50 ml-1">pp</span>
                      {/* Tooltip Arrow */}
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-braun-ink rotate-45" />
                    </div>
                  </div>

                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${(pages / maxPages) * 100}%` }}
                    className={`w-full max-w-[24px] rounded-t-sm relative transition-all duration-700 ease-out ${
                      i === new Date().getMonth() 
                        ? 'bg-braun-accent orange-glow' 
                        : 'bg-braun-panel group-hover/bar:bg-braun-ink/30'
                    }`}
                  >
                    {/* Glossy Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-50" />
                    {/* Top Cap */}
                    <div className={`absolute top-0 left-0 w-full h-1.5 ${i === new Date().getMonth() ? 'bg-white/30' : 'bg-braun-ink/10'} rounded-t-sm`} />
                  </motion.div>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className={`text-[10px] font-mono uppercase tracking-tighter transition-colors ${
                    i === new Date().getMonth() ? 'text-braun-accent font-bold' : 'opacity-30'
                  }`}>
                    {months[i]}
                  </span>
                  {i === new Date().getMonth() && (
                    <div className="w-1 h-1 rounded-full bg-braun-accent animate-pulse" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Genres */}
        <div className="bg-braun-bg border border-braun-panel p-10 relative overflow-hidden">
          <div className="absolute inset-0 grid-background pointer-events-none" />
          <div className="absolute top-0 left-0 w-full h-full dot-pattern opacity-[0.1] pointer-events-none" />
          
          <div className="flex justify-between items-center mb-10 relative z-10">
            <h3 className="text-[10px] font-mono uppercase tracking-[0.3em] opacity-40">Genre_Distribution</h3>
            <span className="text-[8px] font-mono opacity-20 uppercase">Total_Samples: {books.length}</span>
          </div>

          <div className="space-y-10 relative z-10">
            {genres.length > 0 ? genres.map(([genre, count]) => (
              <div key={genre} className="space-y-4">
                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold uppercase tracking-widest">{genre}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] font-mono opacity-40 uppercase">{count} Entries</span>
                      <div className="w-1 h-1 rounded-full bg-braun-ink/20" />
                      <span className="text-[9px] font-mono text-braun-accent font-bold">
                        {Math.round((count / books.length) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Stepped Progress Bar */}
                <div className="flex gap-1 h-3">
                  {[...Array(20)].map((_, i) => {
                    const percentage = (count / books.length) * 100;
                    const isActive = (i / 20) * 100 < percentage;
                    return (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, scaleY: 0 }}
                        animate={{ opacity: 1, scaleY: 1 }}
                        transition={{ delay: i * 0.02 }}
                        className={`flex-1 rounded-sm transition-all duration-500 ${
                          isActive 
                            ? 'bg-braun-ink shadow-[0_0_5px_rgba(0,0,0,0.1)]' 
                            : 'bg-braun-panel/10 border border-braun-panel/20'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
            )) : (
              <div className="py-16 text-center border border-dashed border-braun-panel/30 rounded-sm">
                <p className="text-[10px] font-mono opacity-20 uppercase tracking-widest">No_Data_Available</p>
              </div>
            )}
          </div>
        </div>

        {/* System Health / Reading Consistency */}
        <div className="bg-braun-bg border border-braun-panel p-10 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 grid-background pointer-events-none" />
          <div className="absolute top-0 left-0 w-full h-full dot-pattern opacity-[0.1] pointer-events-none" />
          
          <div className="relative z-10">
            <h3 className="text-[10px] font-mono uppercase tracking-[0.3em] opacity-40 mb-10">Consistency_Index</h3>
            <div className="flex items-center justify-center py-10">
              <div className="relative w-48 h-48 flex items-center justify-center">
                {/* Circular Progress (SVG) */}
                <svg className="w-full h-full -rotate-90 filter drop-shadow-lg">
                  <circle 
                    cx="96" cy="96" r="80" 
                    className="stroke-braun-panel/10 fill-none" 
                    strokeWidth="16" 
                  />
                  {/* Segmented background track */}
                  <circle 
                    cx="96" cy="96" r="80" 
                    className="stroke-braun-ink/5 fill-none" 
                    strokeWidth="16"
                    strokeDasharray="4 4"
                  />
                  <motion.circle 
                    cx="96" cy="96" r="80" 
                    className="stroke-braun-accent fill-none" 
                    strokeWidth="16"
                    strokeDasharray="502"
                    initial={{ strokeDashoffset: 502 }}
                    animate={{ strokeDashoffset: 502 - (502 * 0.85) }} // Mock 85% consistency
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    strokeLinecap="butt"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-5xl font-space font-medium tracking-tighter leading-none">85</span>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-[10px] font-mono font-bold">%</span>
                    <span className="text-[8px] font-mono uppercase opacity-40 tracking-widest">Index</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="pt-8 border-t border-braun-ink/5 space-y-5 relative z-10">
            <div className="flex justify-between items-center text-[9px] font-mono uppercase">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="opacity-40">System_Status</span>
              </div>
              <span className="text-emerald-500 font-bold tracking-widest">Operational</span>
            </div>
            <div className="flex justify-between text-[9px] font-mono uppercase">
              <span className="opacity-40">Last_Sync_Cycle</span>
              <span className="tracking-tighter">21.03.2026_10:50:48</span>
            </div>
          </div>
        </div>
      </div>

      <button className="w-full bg-braun-ink text-white py-5 text-[11px] font-bold uppercase tracking-[0.4em] hover:brightness-110 transition-all shadow-lg active:translate-y-0.5">
        Generate_System_Recap_05
      </button>
    </div>
  );
};
