import React, { useState } from "react";
import { X, UserPlus, Gift, Copy } from "lucide-react";

export default function LeaderProfileModal({ isOpen, onClose, user }) {
  // GitHub-like heatmap data (weeks x 7 days)
  const [year, setYear] = useState(new Date().getFullYear());
  const [tooltip, setTooltip] = useState(null); // {left, top, dateStr, minutes}

  if (!isOpen || !user) return null;

  const stats = [
    { title: 'Current Streak', value: '1', sub: 'DAY', color: 'from-orange-500/30 to-orange-600/30' },
    { title: 'Total hours', value: '419h 26m', sub: '', color: 'from-emerald-500/30 to-emerald-600/30' },
    { title: 'Pomodoros Completed', value: '533', sub: '', color: 'from-violet-500/30 to-violet-600/30' },
    { title: 'This Week', value: '8', sub: 'POMODOROS', color: 'from-sky-500/30 to-sky-600/30' },
    { title: 'Daily average', value: '5h 40m', sub: 'LAST 30 DAYS', color: 'from-cyan-500/30 to-cyan-600/30' },
    { title: 'Gifts Sent', value: '9', sub: '', color: 'from-rose-500/30 to-rose-600/30' },
  ];

  const heatmap = buildHeatmap(year);
  const gifts = Array.from({ length: 4 }, (_, i) => ({ id: i+1, label: '1⭐' }));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl bg-black/30 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl mx-4 h-[70vh] max-h-[70vh] flex flex-col pointer-events-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 overflow-hidden flex items-center justify-center text-white font-semibold">
              {user?.avatar || 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-white text-lg font-semibold">{user?.name || 'User'}</h3>
                {user?.country && <span className="px-2 py-0.5 text-xs rounded bg-white/10 text-white/80">{user.country}</span>}
              </div>
              <div className="text-xs text-white/60 mt-1">LV. 20</div>
              {/* Progress bar */}
              <div className="mt-2 w-72 h-2 rounded-full bg-white/10">
                <div className="h-2 rounded-full bg-emerald-500" style={{ width: '85%' }} />
              </div>
              <div className="text-[10px] text-white/50 mt-1">5647 / 5727 XP • 80 XP to next</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm flex items-center gap-2">
              <Gift className="w-4 h-4"/> Send Gift
            </button>
            <button className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm flex items-center gap-2">
              <UserPlus className="w-4 h-4"/> Add friend
            </button>
            <button className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm flex items-center gap-2">
              <Copy className="w-4 h-4"/> Copy link
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">
              <X className="w-5 h-5 text-white/80"/>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scroll p-6 space-y-8" style={{ touchAction: 'pan-y' }}>
          {/* Stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.map((s, i) => (
              <div key={i} className={`rounded-xl p-4 bg-gradient-to-br ${s.color} border border-white/10`}>
                <div className="text-white/80 text-sm">{s.title}</div>
                <div className="text-white text-2xl font-bold mt-1">{s.value}</div>
                {s.sub && <div className="text-white/60 text-xs mt-1">{s.sub}</div>}
              </div>
            ))}
          </div>

          {/* Activity heatmap (Month-based) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white font-semibold">Study Activity</h4>
              <div className="flex items-center gap-2 text-white/80">
                <button onClick={()=>setYear(y=>y-1)} className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-xs">Prev</button>
                <span className="min-w-[64px] text-center text-sm">{year}</span>
                <button onClick={()=>setYear(y=>y+1)} className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-xs">Next</button>
              </div>
            </div>
            <div className="relative overflow-auto custom-scroll p-4 rounded-lg border border-white/10 bg-white/5">
              <div className="flex flex-col gap-6">
                {/* Row 1: Jan - Jun */}
                <div className="flex gap-6">
                  {heatmap.months.slice(0,6).map((month, mi) => (
                    <div key={mi} className="flex flex-col">
                      {/* Month label */}
                      <div className="text-center text-[10px] text-white/60 select-none mb-1 h-3">
                        {month.label}
                      </div>
                      {/* Rows = weeks (dọc), Columns = days (ngang: Sun→Sat) */}
                      <div className="flex flex-col gap-1">
                        {month.rows.map((week, wi) => (
                          <div key={wi} className="flex gap-1">
                            {week.map((cell, ci) => (
                              <div
                                key={`${mi}-w${wi}-d${ci}`}
                                className="w-3 h-3 rounded-[2px] flex-shrink-0"
                                style={{ backgroundColor: cell ? minutesToColor(cell.minutes) : '#161b22' }}
                                onMouseEnter={(e)=>{
                                  if (!cell) return;
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setTooltip({
                                    left: rect.left + window.scrollX + 8,
                                    top: rect.top + window.scrollY - 8,
                                    dateStr: cell.date.toLocaleDateString('en-GB', { weekday:'short', day:'2-digit', month:'short', year:'numeric' }),
                                    minutes: cell.minutes,
                                  });
                                }}
                                onMouseLeave={()=> setTooltip(null)}
                                title={cell ? `${formatMinutes(cell.minutes)} • ${cell.date.toDateString()}` : ''}
                              />
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Row 2: Jul - Dec */}
                <div className="flex gap-6">
                  {heatmap.months.slice(6,12).map((month, mi) => (
                    <div key={mi+6} className="flex flex-col">
                      {/* Month label */}
                      <div className="text-center text-[10px] text-white/60 select-none mb-1 h-3">
                        {month.label}
                      </div>
                      {/* Rows = weeks (dọc), Columns = days (ngang: Sun→Sat) */}
                      <div className="flex flex-col gap-1">
                        {month.rows.map((week, wi) => (
                          <div key={wi} className="flex gap-1">
                            {week.map((cell, ci) => (
                              <div
                                key={`${mi+6}-w${wi}-d${ci}`}
                                className="w-3 h-3 rounded-[2px] flex-shrink-0"
                                style={{ backgroundColor: cell ? minutesToColor(cell.minutes) : '#161b22' }}
                                onMouseEnter={(e)=>{
                                  if (!cell) return;
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setTooltip({
                                    left: rect.left + window.scrollX + 8,
                                    top: rect.top + window.scrollY - 8,
                                    dateStr: cell.date.toLocaleDateString('en-GB', { weekday:'short', day:'2-digit', month:'short', year:'numeric' }),
                                    minutes: cell.minutes,
                                  });
                                }}
                                onMouseLeave={()=> setTooltip(null)}
                                title={cell ? `${formatMinutes(cell.minutes)} • ${cell.date.toDateString()}` : ''}
                              />
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {tooltip && (
                <div
                  className="fixed z-[110] px-2 py-1 rounded bg-black/80 text-white text-xs border border-white/10 pointer-events-none whitespace-nowrap"
                  style={{ left: tooltip.left, top: tooltip.top }}
                >
                  {formatMinutes(tooltip.minutes)} · {tooltip.dateStr}
                </div>
              )}
            </div>
          </div>

          {/* Gifts received */}
          <div>
            <h4 className="text-white font-semibold mb-3">Gifts Received</h4>
            <div className="flex flex-wrap gap-4 items-center">
              {gifts.map(g => (
                <div key={g.id} className="px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white flex items-center gap-2">
                  <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-400/20 text-yellow-300 border border-yellow-400/40">{g.label}</span>
                  <span className="text-sm">🌱</span>
                </div>
              ))}
              <div className="ml-auto text-white/80 text-sm">Total: 60</div>
            </div>
          </div>
        </div>

        {/* Local scroll style - hidden scrollbar but still scrollable */}
        <style>{`
          .custom-scroll {
            overflow-y: auto !important;
            overflow-x: hidden !important;
            -webkit-overflow-scrolling: touch !important;
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
            touch-action: pan-y !important;
          }
          .custom-scroll::-webkit-scrollbar {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
          }
          .custom-scroll::-webkit-scrollbar-track {
            display: none !important;
          }
          .custom-scroll::-webkit-scrollbar-thumb {
            display: none !important;
          }
        `}</style>
      </div>
    </div>
  );
}

function minutesToColor(min){
  if (!min || min === 0) return '#161b22'; // Very dark gray (no activity)
  if (min < 15) return '#0e4429'; // Dark green (low activity)
  if (min < 45) return '#006d32'; // Medium green
  if (min < 120) return '#26a641';
  return '#39d353';
}

function formatMinutes(min){
  const m = Math.max(0, Math.floor(min||0));
  const h = Math.floor(m/60);
  const mm = m % 60;
  if (h) return `${h}h ${mm}m`;
  return `${mm}m`;
}

function buildHeatmap(year){
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const months = [];
  let maxRows = 0;

  // Build each month
  for (let m = 0; m < 12; m++) {
    const firstDay = new Date(year, m, 1);
    const lastDay = new Date(year, m + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay(); // 0=Sun, 6=Sat
    
    // Create rows (weeks) for this month
    const rows = [];
    let currentRow = [];
    
    // Fill empty cells at the start of first week
    for (let i = 0; i < startDayOfWeek; i++) {
      currentRow.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, m, day);
      const minutes = ((m * 13 + day) % 5) * 30; // mock minutes pattern
      currentRow.push({ date, minutes });
      
      // Start new row every Sunday (day 0)
      if (date.getDay() === 6) { // Saturday, so next is Sunday
        rows.push(currentRow);
        currentRow = [];
      }
    }
    
    // Fill remaining empty cells in last row
    if (currentRow.length > 0) {
      while (currentRow.length < 7) {
        currentRow.push(null);
      }
      rows.push(currentRow);
    }
    
    maxRows = Math.max(maxRows, rows.length);
    months.push({ label: monthNames[m], rows });
  }

  return { months, maxRows };
}