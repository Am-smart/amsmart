import React, { useState, useMemo, useEffect } from 'react';
import { Calendar as CalendarIcon, List, ChevronLeft, ChevronRight } from 'lucide-react';

interface Event {
    id: string;
    title: string;
    date: string;
    type: 'assignment' | 'quiz' | 'live';
    color: string;
}

interface CalendarViewProps {
    events: Event[];
}

export const CalendarView: React.FC<CalendarViewProps> = ({ events }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<'grid' | 'list'>('grid');

    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 768;
            if (mobile) setView('list');
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const calendarDays = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const days = [];
        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }
        return days;
    }, [currentDate]);

    const getEventsForDay = (date: Date) => {
        const dateStr = date.toISOString().split('T')[0];
        return events.filter(e => e.date === dateStr);
    };

    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <header className="p-4 md:p-8 border-b flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">
                        {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </h2>
                    <div className="flex bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
                        <button
                            onClick={() => setView('grid')}
                            className={`p-1.5 rounded-lg transition-all ${view === 'grid' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            title="Grid View"
                        >
                            <CalendarIcon size={18} />
                        </button>
                        <button
                            onClick={() => setView('list')}
                            className={`p-1.5 rounded-lg transition-all ${view === 'list' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            title="List View"
                        >
                            <List size={18} />
                        </button>
                    </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button onClick={prevMonth} className="flex-1 md:flex-none p-2 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 transition-all flex items-center justify-center">
                        <ChevronLeft size={20} />
                    </button>
                    <button onClick={() => setCurrentDate(new Date())} className="flex-[2] md:flex-none px-4 py-2 bg-white hover:bg-slate-50 text-xs font-bold text-slate-600 rounded-xl border border-slate-200 transition-all">
                        Today
                    </button>
                    <button onClick={nextMonth} className="flex-1 md:flex-none p-2 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 transition-all flex items-center justify-center">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </header>

            {view === 'grid' ? (
                <>
                    <div className="grid grid-cols-7 border-b bg-slate-50">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                            <div key={d} className="py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{d}</div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7">
                        {calendarDays.map((date, i) => (
                            <div key={i} className={`min-h-[100px] md:min-h-[140px] p-1 md:p-2 border-r border-b border-slate-50 transition-colors hover:bg-slate-50/50 ${!date ? 'bg-slate-50/30' : ''}`}>
                                {date && (
                                    <>
                                        <div className={`text-xs md:text-sm font-bold mb-1 md:mb-2 ${date.toDateString() === new Date().toDateString() ? 'bg-blue-600 text-white w-6 h-6 md:w-7 md:h-7 flex items-center justify-center rounded-full mx-auto' : 'text-slate-400 text-center'}`}>
                                            {date.getDate()}
                                        </div>
                                        <div className="space-y-1">
                                            {getEventsForDay(date).map(event => (
                                                <div key={event.id} className={`text-[8px] md:text-[9px] p-1 md:p-1.5 rounded-lg font-bold border-l-4 ${event.color} truncate shadow-sm`}>
                                                    {event.title}
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div className="divide-y divide-slate-50">
                    {calendarDays.filter(d => d !== null).map((date) => {
                        const dayEvents = getEventsForDay(date!);
                        if (dayEvents.length === 0) return null;

                        return (
                            <div key={date!.toISOString()} className="p-4 md:p-6 hover:bg-slate-50/50 transition-colors">
                                <div className="flex gap-4 md:gap-6">
                                    <div className="shrink-0 text-center w-12">
                                        <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{date!.toLocaleString('default', { weekday: 'short' })}</div>
                                        <div className="text-2xl font-black text-slate-900">{date!.getDate()}</div>
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        {dayEvents.map(event => (
                                            <div key={event.id} className={`flex items-center gap-3 p-3 rounded-2xl border-l-4 ${event.color} shadow-sm bg-white`}>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-0.5">{event.type}</div>
                                                    <div className="font-bold text-slate-900 truncate">{event.title}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {calendarDays.every(d => d === null || getEventsForDay(d).length === 0) && (
                        <div className="p-12 text-center text-slate-400">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CalendarIcon size={32} className="text-slate-200" />
                            </div>
                            <p className="font-bold">No events scheduled for this month</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
