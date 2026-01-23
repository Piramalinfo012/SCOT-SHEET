
import React, { useState, useEffect, useMemo } from 'react';
import { GoogleSheetsService } from './services/googleSheets';
import { Client, OrderLog, Tab, DashboardStats } from './types';
import DashboardCard from './components/DashboardCard';
import ClientList from './components/ClientList';
import FollowUpModal from './components/FollowUpModal';
import { isOverdue, isUpcoming, formatDateString, parseDateString } from './utils';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth,
  isToday,
  subMonths,
  addMonths
} from 'date-fns';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [clients, setClients] = useState<Client[]>([]);
  const [logs, setLogs] = useState<OrderLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [scriptUrl, setScriptUrl] = useState(localStorage.getItem('APPS_SCRIPT_URL') || '');

  // Dashboard Filters
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'MMMM yyyy'));
  const [selectedPartyId, setSelectedPartyId] = useState<string>('all');

  const fetchData = async () => {
    const url = localStorage.getItem('APPS_SCRIPT_URL')?.trim();
    if (!url) {
      setError("Please configure the Apps Script URL in Settings.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await GoogleSheetsService.fetchClients();
      // FIX: Defensive coding to prevent "undefined reading filter" errors
      setClients(data?.clients || []);
      setLogs(data?.logs || []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch data. Please check your URL and connection.");
      setClients([]);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [scriptUrl]);

  // Derived unique months from data for filter dropdown
  const uniqueMonths = useMemo(() => {
    const dates = [new Date()]; // Include current month
    if (logs) {
      logs.forEach(l => {
        const d = new Date(l.timestamp);
        if (!isNaN(d.getTime())) dates.push(d);
      });
    }
    const months = dates.map(d => format(d, 'MMMM yyyy'));
    return Array.from(new Set(months)).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  }, [logs]);

  // Calendar Logic
  const calendarDays = useMemo(() => {
    const monthDate = new Date(selectedMonth);
    if (isNaN(monthDate.getTime())) return [];
    const start = startOfWeek(startOfMonth(monthDate));
    const end = endOfWeek(endOfMonth(monthDate));
    return eachDayOfInterval({ start, end });
  }, [selectedMonth]);

  // Party specific orders for calendar
  const partyOrders = useMemo(() => {
    if (selectedPartyId === 'all') return [];
    return logs.filter(l => l.id === selectedPartyId && l.orderStatus === 'RECIEVED');
  }, [logs, selectedPartyId]);

  // Calculate dashboard statistics
  const stats: DashboardStats = useMemo(() => {
    const safeClients = clients || [];
    const safeLogs = logs || [];
    const todayStr = formatDateString(new Date());

    // Filter logs by selected month for order stats
    const monthLogs = safeLogs.filter(l => format(new Date(l.timestamp), 'MMMM yyyy') === selectedMonth);
    const monthOrders = monthLogs.filter(l => l.orderStatus === 'RECIEVED').length;

    const overdueCount = safeClients.filter(c => isOverdue(c.nextFollowUpDate)).length;
    const todayCount = safeClients.filter(c => c.nextFollowUpDate === todayStr).length;
    
    const completedToday = safeLogs.filter(l => {
      try {
        if (!l.timestamp) return false;
        return formatDateString(new Date(l.timestamp)) === todayStr;
      } catch { return false; }
    }).length;

    return {
      totalClients: safeClients.length,
      overdue: overdueCount,
      plannedToday: todayCount,
      completedToday: completedToday,
      upcoming7Days: safeClients.filter(c => isUpcoming(c.nextFollowUpDate, 7)).length,
      totalOrdersReceived: monthOrders,
      conversionRate: monthLogs.length > 0 ? (monthOrders / monthLogs.length) * 100 : 0
    };
  }, [clients, logs, selectedMonth]);

  const handleUpdateClient = async (updatedData: Client) => {
    try {
      await GoogleSheetsService.updateClient(updatedData);
      setTimeout(() => fetchData(), 1000);
      setSelectedClient(null);
    } catch (err: any) {
      alert("Error saving log: " + err.message);
    }
  };

  const handleSaveSettings = () => {
    localStorage.setItem('APPS_SCRIPT_URL', scriptUrl);
    fetchData();
    setActiveTab('dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-600 p-2 rounded-lg shadow-md">
                <i className="fa-solid fa-chart-line text-white text-xl"></i>
              </div>
              <h1 className="text-xl font-black tracking-tight text-slate-800">
                SCOT<span className="text-indigo-600">PRO</span>
              </h1>
            </div>
            <div className="flex space-x-1 items-center">
              {(['dashboard', 'clients', 'settings'] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    activeTab === tab 
                      ? 'bg-indigo-50 text-indigo-600 shadow-sm' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center space-x-4 text-red-700 shadow-sm">
            <i className="fa-solid fa-triangle-exclamation text-xl"></i>
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 animate-pulse">
            <div className="h-12 w-12 rounded-full border-4 border-slate-200 border-t-indigo-600 animate-spin"></div>
            <p className="text-slate-500 font-bold mt-4">Syncing data...</p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                {/* Global Month Filter */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
                   <div className="flex items-center space-x-3">
                     <i className="fa-solid fa-filter text-indigo-500"></i>
                     <span className="text-xs font-black uppercase text-slate-400">Month Filter:</span>
                     <select 
                        className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-1.5 text-xs font-bold outline-none"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                     >
                       {uniqueMonths.map(m => <option key={m} value={m}>{m}</option>)}
                     </select>
                   </div>
                   <div className="text-xs font-bold text-slate-400">
                     Performance Report for {selectedMonth}
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <DashboardCard 
                    title="Month Orders" 
                    value={stats.totalOrdersReceived} 
                    icon="fa-shopping-bag" 
                    color="bg-indigo-500" 
                    description={`Total "RECIEVED" in ${selectedMonth}`}
                  />
                  <DashboardCard 
                    title="Conversion" 
                    value={Math.round(stats.conversionRate)} 
                    icon="fa-percentage" 
                    color="bg-emerald-500" 
                    description="% of calls leading to orders"
                  />
                  <DashboardCard 
                    title="Today's Goal" 
                    value={stats.plannedToday} 
                    icon="fa-phone-volume" 
                    color="bg-amber-500" 
                    description="Calls scheduled for today"
                  />
                   <DashboardCard 
                    title="Missed Calls" 
                    value={stats.overdue} 
                    icon="fa-clock-rotate-left" 
                    color="bg-red-500" 
                    description="Total follow-ups overdue"
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Party Specific Calendar */}
                  <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
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
                            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none max-w-[200px]"
                            value={selectedPartyId}
                            onChange={(e) => setSelectedPartyId(e.target.value)}
                         >
                           <option value="all">Select Party...</option>
                           {(clients || []).map(c => <option key={c.id} value={c.id}>{c.clientName}</option>)}
                         </select>
                       </div>
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center text-[10px] font-black text-slate-400 uppercase py-2">{day}</div>
                      ))}
                      {calendarDays.map((day, idx) => {
                        const isCurrentMonth = isSameMonth(day, new Date(selectedMonth));
                        const hasOrder = partyOrders.some(l => isSameDay(new Date(l.timestamp), day));
                        const isDayToday = isToday(day);
                        
                        return (
                          <div 
                            key={idx} 
                            className={`aspect-square rounded-xl border flex flex-col items-center justify-center relative transition-all ${
                              !isCurrentMonth ? 'bg-slate-50/30 border-transparent opacity-20' : 
                              hasOrder ? 'bg-indigo-600 text-white border-indigo-700 shadow-lg scale-105' : 
                              isDayToday ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100 hover:border-slate-300'
                            }`}
                          >
                            <span className={`text-xs font-bold ${hasOrder ? 'text-white' : isDayToday ? 'text-indigo-600' : 'text-slate-600'}`}>
                              {format(day, 'd')}
                            </span>
                            {hasOrder && <i className="fa-solid fa-check text-[8px] absolute bottom-1 right-1 opacity-60"></i>}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Recent Logs List */}
                  <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm h-fit">
                    <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center">
                      <i className="fa-solid fa-history mr-3 text-indigo-600"></i>
                      Recent Logs
                    </h2>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                      {(logs || []).slice(-8).reverse().map((log, idx) => (
                        <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-[10px] font-black text-slate-800 uppercase">{log.clientName}</span>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${log.orderStatus === 'RECIEVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                              {log.orderStatus}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 italic mb-1">"{log.remark || 'No remark'}"</p>
                          <p className="text-[9px] font-bold text-slate-400">{format(new Date(log.timestamp), 'MMM d, h:mm a')}</p>
                        </div>
                      ))}
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
            )}

            {activeTab === 'clients' && (
              <div className="animate-in fade-in duration-500">
                <ClientList clients={clients || []} onSelectClient={setSelectedClient} />
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="max-w-2xl mx-auto bg-white p-10 rounded-3xl border border-slate-200 shadow-xl mt-10">
                <h2 className="text-2xl font-black text-slate-800 mb-8">Connection Settings</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Google Apps Script URL</label>
                    <input
                      type="text"
                      className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-indigo-600 outline-none text-sm font-bold"
                      placeholder="https://script.google.com/macros/s/.../exec"
                      value={scriptUrl}
                      onChange={(e) => setScriptUrl(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={handleSaveSettings}
                    className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
                  >
                    Save & Reconnect
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {selectedClient && (
        <FollowUpModal
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
          onSave={handleUpdateClient}
        />
      )}
    </div>
  );
};

export default App;
