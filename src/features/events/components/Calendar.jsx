import { useState, useRef } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, parseISO, startOfDay, differenceInDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Download, Image as ImageIcon } from 'lucide-react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { createPortal } from 'react-dom';

const categoryColors = {
  'Rapat': 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-200 dark:hover:bg-blue-800/60',
  'Pelatihan': 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800 hover:bg-green-200 dark:hover:bg-green-800/60',
  'Tamu Kunjungan': 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 hover:bg-purple-200 dark:hover:bg-purple-800/60',
  'Event': 'bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800 hover:bg-pink-200 dark:hover:bg-pink-800/60',
  'Inspeksi': 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800 hover:bg-teal-200 dark:hover:bg-teal-800/60',
  'Lainnya': 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800 hover:bg-orange-200 dark:hover:bg-orange-800/60'
};

export default function Calendar({ events = [], onEventClick }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isDownloading, setIsDownloading] = useState(false);
  const calendarRef = useRef(null);
  const reportRef = useRef(null);

  const handleDownloadImage = async () => {
    if (!calendarRef.current || isDownloading) return;
    setIsDownloading(true);
    try {
      const isDark = document.documentElement.classList.contains('dark');
      const dataUrl = await toPng(calendarRef.current, { backgroundColor: isDark ? '#1e293b' : '#ffffff', pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `Calendar_${format(currentMonth, 'MMMM_yyyy')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error generating image', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!calendarRef.current || !reportRef.current || isDownloading) return;
    setIsDownloading(true);
    try {
      const isDark = document.documentElement.classList.contains('dark');
      const bgColor = isDark ? '#1e293b' : '#ffffff';
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Page 1: Calendar
      const calDataUrl = await toPng(calendarRef.current, { backgroundColor: bgColor, pixelRatio: 2 });
      const calImgHeight = (calendarRef.current.offsetHeight * pdfWidth) / calendarRef.current.offsetWidth;
      pdf.addImage(calDataUrl, 'PNG', 0, 0, pdfWidth, calImgHeight);

      // Render Report for screenshot
      reportRef.current.style.display = 'block';
      reportRef.current.style.left = '0px';
      reportRef.current.style.top = '0px';
      
      // Wait for browser to paint the DOM
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const repDataUrl = await toPng(reportRef.current, { backgroundColor: bgColor, pixelRatio: 2 });
      const repImgHeight = (reportRef.current.offsetHeight * pdfWidth) / reportRef.current.offsetWidth;
      reportRef.current.style.display = 'none';
      reportRef.current.style.left = '-9999px';
      reportRef.current.style.top = '-9999px';

      // Pages 2+: Report
      let heightLeft = repImgHeight;
      let position = 0;

      while (heightLeft > 0) {
          pdf.addPage();
          pdf.addImage(repDataUrl, 'PNG', 0, position, pdfWidth, repImgHeight);
          heightLeft -= pdfHeight;
          position -= pdfHeight;
      }
      
      pdf.save(`Calendar_Report_${format(currentMonth, 'MMMM_yyyy')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF', error);
      alert('Terjadi kesalahan saat mengunduh PDF.');
    } finally {
      setIsDownloading(false);
    }
  };

  const renderHeader = () => {
    return (
      <div className="flex items-center mb-4 relative z-20">
        <div className="flex-1 flex justify-start">
          <button type="button" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 glass rounded-full hover:bg-white/50 dark:hover:bg-slate-800/50 dark:hover:bg-slate-700/50 transition-colors">
            <ChevronLeft size={20} className="text-slate-700 dark:text-slate-300" />
          </button>
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex-1 flex justify-end gap-2">
            <button type="button" disabled={isDownloading} onClick={handleDownloadImage} title="Download as Image" className={`p-2 glass rounded-full text-slate-600 dark:text-slate-300 transition-colors ${isDownloading ? 'opacity-50 cursor-wait' : 'hover:bg-white/50 dark:hover:bg-slate-800/50 dark:hover:bg-slate-700/50 cursor-pointer'}`}>
              <ImageIcon size={20} />
            </button>
            <button type="button" disabled={isDownloading} onClick={handleDownloadPDF} title="Download as PDF" className={`p-2 glass rounded-full text-slate-600 dark:text-slate-300 transition-colors ${isDownloading ? 'opacity-50 cursor-wait' : 'hover:bg-white/50 dark:hover:bg-slate-800/50 dark:hover:bg-slate-700/50 cursor-pointer'}`}>
              <Download size={20} />
            </button>
            <button type="button" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 glass rounded-full hover:bg-white/50 dark:hover:bg-slate-800/50 dark:hover:bg-slate-700/50 transition-colors">
              <ChevronRight size={20} className="text-slate-700 dark:text-slate-300" />
            </button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = [];
    const startDate = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
    for (let i = 0; i < 7; i++) {
      days.push(
        <div className="text-center font-semibold text-slate-500 dark:text-slate-400 py-2 border-b border-slate-200 dark:border-slate-700/50" key={i}>
          {format(addDays(startDate, i), 'EEE')}
        </div>
      );
    }
    return <div className="grid grid-cols-7 mb-2">{days}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const weeks = [];
    let day = startDate;

    while (day <= endDate) {
      const weekDays = [];
      for(let i=0; i<7; i++) {
          weekDays.push(addDays(day, i));
      }
      weeks.push(weekDays);
      day = addDays(day, 7);
    }

    // Process events for continuous bar rendering
    const parsedEvents = events.map(e => {
        let s, eDate;
        try {
            s = startOfDay(parseISO(e.Start_Date));
            eDate = startOfDay(parseISO(e.End_Date || e.Start_Date));
        } catch(err) {
            s = new Date(0); eDate = new Date(0);
        }
        return { ...e, _start: s, _end: eDate };
    }).filter(e => e._start.getTime() > 0);

    return (
      <div className="flex flex-col border-l border-t border-slate-200 dark:border-slate-700/50 bg-white/5 dark:bg-slate-800/50 dark:bg-slate-800/20 backdrop-blur-sm rounded-lg overflow-hidden">
        {weeks.map((week, wIndex) => {
           const weekStart = week[0];
           const weekEnd = week[6];

           // Filter events active in this particular week
           const weekEvents = parsedEvents.filter(e => e._start <= weekEnd && e._end >= weekStart)
               .sort((a,b) => a._start - b._start);
           
           // Slot allocation to avoid overlaps
           const slots = [];
           const allocatedEvents = weekEvents.map(ev => {
               // Gunakan pembulatan matematis absolut untuk hindari isu timezone date-fns
               const startDiffDays = Math.round((ev._start.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));
               const endDiffDays = Math.round((ev._end.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));
               
               const evStartIdx = Math.max(0, startDiffDays);
               const evEndIdx = Math.min(6, endDiffDays);
               const duration = (evEndIdx - evStartIdx) + 1;
               
               let level = 0;
               while(level < 50) { // Safety cap
                   if (slots[level] === undefined || slots[level] < evStartIdx) {
                       slots[level] = evEndIdx;
                       break;
                   }
                   level++;
               }
               return { ev, evStartIdx, duration, level };
           });

           const weekHeight = Math.max(100, 35 + (slots.length * 28));

           return (
             <div key={wIndex} className="relative flex w-full border-b border-slate-200 dark:border-slate-700/50" style={{ height: `${weekHeight}px` }}>
                {/* Day Background Cells */}
                {week.map((d, dIndex) => (
                    <div key={dIndex} className={`flex-1 border-r border-slate-200 dark:border-slate-700/50 p-1 ${!isSameMonth(d, monthStart) ? 'bg-slate-100 dark:bg-slate-800/60 dark:bg-slate-800/40' : 'bg-transparent'}`}>
                        <div className={`text-right text-sm ${isSameDay(d, new Date()) ? 'font-bold text-primary dark:text-sky-400' : 'text-slate-500 dark:text-slate-400'}`}>
                            <span className={`inline-flex items-center justify-center w-6 h-6 ${isSameDay(d, new Date()) ? 'bg-primary/20 dark:bg-sky-500/20 rounded-full' : ''}`}>{format(d, 'd')}</span>
                        </div>
                    </div>
                ))}

                {/* Continuous Event Bars */}
                {allocatedEvents.map((item) => {
                    const { ev, evStartIdx, duration, level } = item;
                    const colorClass = categoryColors[ev.Kategori] || categoryColors['Lainnya'];
                    const isClosed = ev.Status === 'Closed';
                    
                    const leftPercent = (evStartIdx / 7) * 100;
                    const widthPercent = (duration / 7) * 100;
                    const topPx = 30 + (level * 26); // offset from top

                    // Visual continuity across weeks
                    const startsThisWeek = ev._start >= weekStart;
                    const endsThisWeek = ev._end <= weekEnd;

                    return (
                        <div 
                           key={`${ev.ID_Event}-${level}-${wIndex}`}
                           onClick={() => onEventClick && onEventClick(ev)}
                           className={`absolute h-[22px] border shadow-sm text-xs px-2 flex items-center truncate cursor-pointer transition-all z-10
                              ${colorClass} 
                              ${isClosed ? 'opacity-40 line-through' : 'opacity-90 hover:opacity-100 hover:shadow-md'}
                              ${startsThisWeek ? 'rounded-l-md ml-1' : 'border-l-0 ml-0'}
                              ${endsThisWeek ? 'rounded-r-md mr-1' : 'border-r-0 mr-0'}
                           `}
                           style={{
                               left: `calc(${leftPercent}% + ${startsThisWeek ? '4px' : '0px'})`,
                               width: `calc(${widthPercent}% - ${startsThisWeek? '8px' : '0px'} - ${endsThisWeek? '4px': '0px'})`,
                               top: `${topPx}px`
                           }}
                           title={`${ev.Nama_Kegiatan} (${ev.Status})`}
                        >
                           {startsThisWeek ? ev.Nama_Kegiatan : '\u00A0'}
                           {ev.hasUnread && <span className="ml-1 flex-shrink-0 w-2 h-2 bg-red-500 rounded-full border border-white shadow-sm inline-block"></span>}
                        </div>
                    );
                })}
             </div>
           )
        })}
      </div>
    );
  };

  const renderLegend = () => {
    return (
      <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50 flex flex-wrap items-center justify-center gap-4 text-xs">
        {Object.entries(categoryColors).map(([name, classes]) => {
          const bgClass = classes.split(' ').find(c => c.startsWith('bg-'));
          const darkBgClass = classes.split(' ').find(c => c.startsWith('dark:bg-'));
          const borderClass = classes.split(' ').find(c => c.startsWith('border-'));
          const darkBorderClass = classes.split(' ').find(c => c.startsWith('dark:border-'));
          return (
            <div key={name} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded border shadow-sm ${bgClass} ${darkBgClass || ''} ${borderClass} ${darkBorderClass || ''}`}></div>
              <span className="text-slate-700 dark:text-slate-300 font-medium">{name}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderReport = () => {
      const sortedEvents = [...events].sort((a,b) => new Date(b.Start_Date) - new Date(a.Start_Date));

      return (
          <div ref={reportRef} style={{ display: 'none', width: '800px', position: 'absolute', top: '-9999px', left: '-9999px', zIndex: -1000 }} className={`p-8 ${document.documentElement.classList.contains('dark') ? 'bg-slate-900 text-slate-100' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100'}`}>
              <h2 className="text-2xl font-bold mb-6 text-primary border-b pb-4">Laporan Rincian Event (Calendar of Events) - {format(currentMonth, 'MMMM yyyy')}</h2>
              <div className="flex flex-col gap-6">
                  {sortedEvents.map(ev => {
                      let chk = [];
                      let tl = [];
                      try { chk = JSON.parse(ev.Checklist_JSON || '[]'); } catch(e){}
                      try { tl = JSON.parse(ev.Timeline_JSON || '[]'); } catch(e){}

                      const totalChk = chk.length;
                      const doneChk = chk.filter(c => c.done).length;
                      const pct = totalChk === 0 ? 0 : Math.round((doneChk/totalChk)*100);

                      return (
                          <div key={ev.ID_Event} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                              <div className="flex justify-between items-start mb-2">
                                  <div>
                                      <h3 className="text-xl font-bold">{ev.Nama_Kegiatan}</h3>
                                      <p className="text-sm text-slate-500 dark:text-slate-400">{new Date(ev.Start_Date).toLocaleDateString()} - {new Date(ev.End_Date).toLocaleDateString()} | Kategori: {ev.Kategori}</p>
                                  </div>
                                  <span className="px-3 py-1 bg-primary/10 text-primary font-bold rounded-full text-sm">{ev.Status}</span>
                              </div>
                              
                              <div className="mt-4">
                                  <h4 className="font-semibold text-sm mb-2 flex justify-between">
                                      <span>Progress Checklist ({doneChk}/{totalChk})</span>
                                      <span>{pct}%</span>
                                  </h4>
                                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 mb-2">
                                      <div className="bg-primary h-2.5 rounded-full" style={{ width: `${pct}%` }}></div>
                                  </div>
                                  <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                                      {chk.map((c, i) => (
                                          <li key={i} className="flex items-center gap-2">
                                              <span className={c.done ? 'text-green-500' : 'text-slate-300'}>{c.done ? '☑' : '☐'}</span>
                                              <span className={c.done ? 'line-through opacity-70' : ''}>{c.text}</span>
                                          </li>
                                      ))}
                                  </ul>
                              </div>

                              <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                                  <h4 className="font-semibold text-sm mb-2">Timeline / Milestone</h4>
                                  {tl.length === 0 ? <p className="text-sm text-slate-500 dark:text-slate-400 italic">Tidak ada timeline</p> : (
                                      <div className="space-y-2">
                                          {tl.sort((a,b)=>new Date(a.date)-new Date(b.date)).map((t, i) => (
                                              <div key={i} className="flex gap-4 text-sm">
                                                  <span className="font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap min-w-[80px]">{new Date(t.date).toLocaleDateString('id-ID', {day:'2-digit', month:'short'})}</span>
                                                  <span className="text-slate-700 dark:text-slate-300">{t.note} {t.attachment_url ? '📎 (Ada Lampiran)' : ''}</span>
                                              </div>
                                          ))}
                                      </div>
                                  )}
                              </div>
                          </div>
                      )
                  })}
              </div>
          </div>
      )
  };

  return (
    <>
        <div ref={calendarRef} className="glass-card p-6 w-full overflow-hidden bg-white/8 dark:bg-slate-800/80 dark:bg-slate-800/40 relative">
          {renderHeader()}
          {renderDays()}
          {renderCells()}
          {renderLegend()}
        </div>
        {createPortal(renderReport(), document.body)}
    </>
  );
}
