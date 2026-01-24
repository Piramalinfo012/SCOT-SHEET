import React, { useState, useMemo } from 'react';
import { DashboardStats, OrderLog, Client } from '../types';
import DashboardCard from './DashboardCard';
import { format, startOfWeek, startOfMonth, endOfWeek, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, isValid, parse } from 'date-fns';
import { formatDateString, isOverdue, isUpcoming } from '../utils';

interface DashboardViewProps {
    clients: Client[];
    logs: OrderLog[];
}

const DashboardView: React.FC<DashboardViewProps> = ({ clients, logs }) => {
    // Dashboard Filters
    const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'MMMM yyyy'));
    const [selectedPartyId, setSelectedPartyId] = useState<string>('all');

    // Derived unique months from data for filter dropdown
    const uniqueMonths = useMemo(() => {
        const dates = [new Date()]; // Always include current month
        if (Array.isArray(logs)) {
            logs.forEach(l => {
                if (l.timestamp) {
                    const d = new Date(l.timestamp);
                    if (isValid(d)) dates.push(d);
                }
            });
        }
        const months = dates.map(d => format(d, 'MMMM yyyy'));
        // Sort descending by date
        return Array.from(new Set(months)).sort((a, b) => {
            const dateA = parse(a, 'MMMM yyyy', new Date());
            const dateB = parse(b, 'MMMM yyyy', new Date());
            return dateB.getTime() - dateA.getTime();
        });
    }, [logs]);

    // Calendar Logic
    const calendarDays = useMemo(() => {
        try {
            const monthDate = parse(selectedMonth, 'MMMM yyyy', new Date());
            if (!isValid(monthDate)) return [];
            const start = startOfWeek(startOfMonth(monthDate));
            const end = endOfWeek(endOfMonth(monthDate));
            return eachDayOfInterval({ start, end });
        } catch (e) {
            console.error("Calendar generation failed", e);
            return [];
        }
    }, [selectedMonth]);

    // Party specific orders for calendar
    const partyOrders = useMemo(() => {
        if (selectedPartyId === 'all' || !Array.isArray(logs)) return [];
        return logs.filter(l => l.id === selectedPartyId);
    }, [logs, selectedPartyId]);

    // Calculate dashboard statistics
    const stats: DashboardStats = useMemo(() => {
        const safeClients = Array.isArray(clients) ? clients : [];
        const safeLogs = Array.isArray(logs) ? logs : [];
        const todayStr = formatDateString(new Date());

        // Filter logs by selected month for order stats
        const monthLogs = safeLogs.filter(l => {
            if (!l.timestamp) return false;
            const logDate = new Date(l.timestamp);
            return isValid(logDate) && format(logDate, 'MMMM yyyy') === selectedMonth;
        });

        const totalCalls = monthLogs.length;
        // Filter for "Received" or "Recieved" (common typo) case-insensitive
        const totalOrdersReceived = monthLogs.filter(l => /rec(ei|ie)ved/i.test(l.orderStatus || '')).length;

        // "Other" count: All logs minus Received logs
        const overdueCount = totalCalls - totalOrdersReceived;

        const todayCount = safeClients.filter(c => c.nextFollowUpDate === todayStr).length;

        const completedToday = safeLogs.filter(l => {
            try {
                if (!l.timestamp) return false;
                const logDate = new Date(l.timestamp);
                return isValid(logDate) && formatDateString(logDate) === todayStr;
            } catch { return false; }
        }).length;

        return {
            totalClients: safeClients.length,
            overdue: overdueCount,
            plannedToday: todayCount,
            completedToday: completedToday,
            upcoming7Days: safeClients.filter(c => isUpcoming(c.nextFollowUpDate, 7)).length,
            totalOrdersReceived: totalOrdersReceived,
            totalCalls: totalCalls,
            conversionRate: totalCalls > 0 ? (totalOrdersReceived / totalCalls) * 100 : 0
        };
    }, [clients, logs, selectedMonth]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Global Month Filter */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                    <i className="fa-solid fa-filter text-indigo-500"></i>
                    <span className="text-xs font-black uppercase text-slate-400">Month Filter:</span>
                    <select
                        className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-1.5 text-xs font-bold outline-none cursor-pointer hover:border-indigo-300 transition-colors"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                    >
                        {uniqueMonths.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>
                <div className="text-xs font-bold text-slate-400 flex items-center bg-slate-50 px-3 py-1.5 rounded-full">
                    <i className="fa-solid fa-calendar-check mr-2 text-indigo-400"></i>
                    Performance Report for {selectedMonth}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <DashboardCard
                    title="Month Activity"
                    value={stats.totalCalls}
                    icon="fa-list-check"
                    color="bg-indigo-500"
                    description={`Total interactions in ${selectedMonth}`}
                />
                <DashboardCard
                    title="Total Order Received"
                    value={stats.totalOrdersReceived}
                    icon="fa-percentage"
                    color="bg-emerald-500"
                    description="% of month calls leading to orders"
                />
                <DashboardCard
                    title="Other"
                    value={stats.overdue}
                    icon="fa-clock-rotate-left"
                    color="bg-red-500"
                    description="Total other status orders"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Party Specific Calendar */}
                <div className="lg:col-span-2 bg-white p-4 sm:p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h2 className="text-xl font-black text-slate-800 flex items-center">
                                <i className="fa-solid fa-calendar-days mr-3 text-indigo-600"></i>
                                Party Order Calendar
                            </h2>
                            <p className="text-[11px] font-bold text-slate-400 uppercase mt-1">Order tracking for {selectedMonth}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <span className="text-[10px] font-black uppercase text-slate-400">Select Party:</span>
                            <select
                                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none max-w-[200px] cursor-pointer"
                                value={selectedPartyId}
                                onChange={(e) => setSelectedPartyId(e.target.value)}
                            >
                                <option value="all">-- Select Party --</option>
                                {(clients || []).map(c => <option key={c.id} value={c.id}>{c.clientName}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="text-center text-[10px] font-black text-slate-400 uppercase py-2">{day}</div>
                        ))}
                        {calendarDays.map((day, idx) => {
                            const monthDate = parse(selectedMonth, 'MMMM yyyy', new Date());
                            const isCurrentMonth = isSameMonth(day, monthDate);
                            // Find the log for this day to determine status color
                            const logForDay = partyOrders.find(l => isSameDay(new Date(l.timestamp), day));
                            const hasOrder = !!logForDay;
                            const isDayToday = isToday(day);

                            const getStatusColor = (status: string) => {
                                const s = (status || '').toLowerCase();
                                if (s.includes('recieved') || s.includes('received')) return 'bg-emerald-500 border-emerald-600';
                                if (s.includes('payment pending')) return 'bg-amber-500 border-amber-600';
                                if (s.includes('not recieved') || s.includes('not received')) return 'bg-red-500 border-red-600';
                                if (s.includes('rate issue')) return 'bg-orange-500 border-orange-600';
                                if (s.includes('rate shared')) return 'bg-blue-500 border-blue-600';
                                if (s.includes('no requirment')) return 'bg-slate-400 border-slate-500';
                                if (s.includes('he will order')) return 'bg-purple-500 border-purple-600';
                                return 'bg-indigo-600 border-indigo-700'; // Default fallback
                            };

                            const statusColor = hasOrder ? getStatusColor(logForDay.orderStatus) : '';

                            return (
                                <div
                                    key={idx}
                                    className={`aspect-square rounded-xl border flex flex-col items-center justify-center relative transition-all ${!isCurrentMonth ? 'bg-slate-50/30 border-transparent opacity-20' :
                                        hasOrder ? `${statusColor} text-white shadow-lg scale-105` :
                                            isDayToday ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100 hover:border-slate-300'
                                        }`}
                                    title={hasOrder ? logForDay.orderStatus : ''}
                                >
                                    <span className={`text-xs font-bold mb-1 ${hasOrder ? 'text-white' : isDayToday ? 'text-indigo-600' : 'text-slate-600'}`}>
                                        {format(day, 'd')}
                                    </span>
                                    {hasOrder && (
                                        <span className="text-[9px] font-medium leading-[1.1] text-center w-full px-0.5 break-words">
                                            {logForDay.orderStatus}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    {selectedPartyId === 'all' && (
                        <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center space-x-3">
                            <i className="fa-solid fa-circle-info text-indigo-500"></i>
                            <p className="text-xs font-medium text-indigo-700">Select a party from the dropdown above to see their specific order dates in this calendar.</p>
                        </div>
                    )}
                </div>

                {/* Recent Logs List */}
                <div className="bg-white p-4 sm:p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm h-fit">
                    <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center">
                        <i className="fa-solid fa-history mr-3 text-indigo-600"></i>
                        Recent Logs
                    </h2>
                    <div className="space-y-4 max-h-[460px] overflow-y-auto pr-2 scrollbar-hide">
                        {[...(logs || [])].reverse().map((log, idx) => {
                            const logDate = new Date(log.timestamp);
                            return (
                                <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-colors">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-[10px] font-black text-slate-800 uppercase line-clamp-1 flex-1">{log.clientName}</span>
                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ml-2 ${log.orderStatus === 'RECIEVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                                            {log.orderStatus}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-slate-500 italic mb-1 line-clamp-2">"{log.remark || 'No remark provided'}"</p>
                                    <p className="text-[9px] font-bold text-slate-400">
                                        {isValid(logDate) ? format(logDate, 'MMM d, h:mm a') : 'Invalid date'}
                                    </p>
                                </div>
                            );
                        })}
                        {(!logs || logs.length === 0) && (
                            <div className="text-center py-12 text-slate-400">
                                <i className="fa-solid fa-ghost text-2xl mb-2 opacity-20"></i>
                                <p className="text-xs font-bold">No activity recorded yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardView;
