
import React, { useState, useMemo } from 'react';
import { Client } from '../types';
import { getStatusColor, isOverdue, parseDateString } from '../utils';
import { subDays, addDays, isSameDay, parse, format } from 'date-fns';

interface ClientListProps {
  clients: Client[];
  onSelectClient: (client: Client) => void;
  loading?: boolean;
}

type SortKey = 'lastOrderDate' | 'nextFollowUpDate';
interface SortConfig {
  key: SortKey | null;
  direction: 'asc' | 'desc';
}

const ClientList: React.FC<ClientListProps> = ({ clients, onSelectClient, loading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'overdue' | 'today' | '7days_before' | '10days_before'>('all');
  const [crmFilter, setCrmFilter] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });

  // Extract unique CRM Names for the filter dropdown
  const uniqueCrms = useMemo(() => {
    const crms = clients.map(c => c.crmName).filter(Boolean);
    return Array.from(new Set(crms)).sort();
  }, [clients]);

  const handleSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedAndFilteredClients = useMemo(() => {
    // 1. Filter
    let result = clients.filter(client => {
      const term = searchTerm.toLowerCase();

      const clientName = String(client.clientName || '').toLowerCase();
      const crmName = String(client.crmName || '').toLowerCase();
      const phoneNumber = String(client.number || '');
      const id = String(client.id || '').toLowerCase();

      const matchesSearch =
        clientName.includes(term) ||
        crmName.includes(term) ||
        phoneNumber.includes(searchTerm) ||
        id.includes(term);

      const status = getStatusColor(client.nextFollowUpDate);

      let matchesStatus = false;
      if (statusFilter === 'all') matchesStatus = true;
      else if (statusFilter === 'overdue') matchesStatus = status === 'red';
      else if (statusFilter === 'today') matchesStatus = status === 'orange';
      else if (statusFilter === '7days_before') {
        if (!client.nextFollowUpDate || client.nextFollowUpDate === 'N/A') matchesStatus = false;
        else {
          const d = parse(client.nextFollowUpDate, 'dd/MM/yyyy', new Date());
          matchesStatus = isSameDay(d, addDays(new Date(), 3));
        }
      }
      else if (statusFilter === '10days_before') {
        if (!client.nextFollowUpDate || client.nextFollowUpDate === 'N/A') matchesStatus = false;
        else {
          const d = parse(client.nextFollowUpDate, 'dd/MM/yyyy', new Date());
          matchesStatus = isSameDay(d, addDays(new Date(), 10));
        }
      }

      const matchesCrm =
        crmFilter === 'all' ||
        client.crmName === crmFilter;

      return matchesSearch && matchesStatus && matchesCrm;
    });

    // 2. Sort
    if (sortConfig.key) {
      result.sort((a, b) => {
        const valA = a[sortConfig.key!];
        const valB = b[sortConfig.key!];

        // Handle "N/A" or empty strings by treating them as very old dates
        const dateA = parseDateString(valA === 'N/A' || !valA ? '01/01/1970' : valA);
        const dateB = parseDateString(valB === 'N/A' || !valB ? '01/01/1970' : valB);

        const timeA = dateA.getTime();
        const timeB = dateB.getTime();

        return sortConfig.direction === 'asc' ? timeA - timeB : timeB - timeA;
      });
    }

    return result;
  }, [clients, searchTerm, statusFilter, crmFilter, sortConfig]);

  const SortIndicator = ({ column }: { column: SortKey }) => {
    if (sortConfig.key !== column) return <i className="fa-solid fa-sort ml-1 opacity-20 group-hover:opacity-100 transition-opacity"></i>;
    return sortConfig.direction === 'asc'
      ? <i className="fa-solid fa-sort-up ml-1 text-blue-600"></i>
      : <i className="fa-solid fa-sort-down ml-1 text-blue-600"></i>;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Filters Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input
              type="text"
              placeholder="Search by ID, Client, CRM..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* CRM Filter Dropdown */}
            <div className="relative min-w-[180px]">
              <i className="fa-solid fa-user-tie absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
              <select
                className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs font-semibold appearance-none cursor-pointer shadow-sm"
                value={crmFilter}
                onChange={(e) => setCrmFilter(e.target.value)}
              >
                <option value="all">All CRMs</option>
                {uniqueCrms.map(crm => (
                  <option key={crm} value={crm}>{crm}</option>
                ))}
              </select>
              <i className="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 text-[10px] pointer-events-none"></i>
            </div>

            {/* Status Tabs */}
            <div className="flex bg-white border border-slate-200 rounded-lg p-1 shadow-sm overflow-x-auto">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${statusFilter === 'all' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'
                  }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('overdue')}
                className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${statusFilter === 'overdue' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'
                  }`}
              >
                Overdue
              </button>
              <button
                onClick={() => setStatusFilter('today')}
                className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${statusFilter === 'today' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'
                  }`}
              >
                Today
              </button>
              <button
                onClick={() => setStatusFilter('7days_before')}
                className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${statusFilter === '7days_before' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'
                  }`}
              >
                3 Days Before
              </button>
              <button
                onClick={() => setStatusFilter('10days_before')}
                className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${statusFilter === '10days_before' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'
                  }`}
              >
                10 Days Before
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-bold">
              <th className="px-6 py-4">ID & Client</th>
              <th className="px-6 py-4">CRM / Product</th>
              <th
                className="px-6 py-4 cursor-pointer group hover:bg-slate-100 transition-colors"
                onClick={() => handleSort('lastOrderDate')}
              >
                <div className="flex items-center">
                  Order & Call Metrics
                  <SortIndicator column="lastOrderDate" />
                </div>
              </th>
              <th
                className="px-6 py-4 cursor-pointer group hover:bg-slate-100 transition-colors"
                onClick={() => handleSort('nextFollowUpDate')}
              >
                <div className="flex items-center">
                  Next Follow-Up
                  <SortIndicator column="nextFollowUpDate" />
                </div>
              </th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-24 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="h-10 w-10 rounded-full border-4 border-slate-200 border-t-indigo-600 animate-spin mb-4"></div>
                    <p className="text-slate-400 font-bold text-xs tracking-widest uppercase">Loading Clients...</p>
                  </div>
                </td>
              </tr>
            ) : sortedAndFilteredClients.length > 0 ? (
              sortedAndFilteredClients.map((client) => {
                const status = getStatusColor(client.nextFollowUpDate);
                const isTodayStatus = status === 'orange';
                const isOverdueStatus = status === 'red';

                const colorMap = {
                  red: 'bg-red-100 text-red-700 border-red-200',
                  orange: 'bg-amber-500 text-white border-amber-600 shadow-sm animate-pulse-slow',
                  blue: 'bg-blue-100 text-blue-700 border-blue-200'
                };

                return (
                  <tr
                    key={client.id}
                    className={`transition-all group relative ${isTodayStatus
                      ? 'bg-amber-50/60 border-l-4 border-l-amber-500'
                      : isOverdueStatus
                        ? 'bg-red-50/30'
                        : 'hover:bg-slate-50'
                      }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded-md shadow-sm">
                            {client.id}
                          </span>
                          {isTodayStatus && (
                            <span className="text-[8px] font-black text-amber-600 uppercase mt-1 tracking-tighter">Today</span>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900">{client.clientName}</span>
                          <span className="text-xs text-slate-500">{client.contactPerson} • {client.number}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-700">{client.crmName}</span>
                        <span className="text-xs text-blue-600 font-medium">{client.productName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center text-[10px] text-slate-600 font-semibold">
                          <i className="fa-solid fa-cart-shopping mr-2 w-3 text-slate-400"></i>
                          Last Order: <span className={`ml-1 ${sortConfig.key === 'lastOrderDate' ? 'text-blue-600 font-black' : 'text-slate-900'}`}>{client.lastOrderDate || 'N/A'}</span>
                        </div>
                        <div className="flex items-center text-[10px] text-slate-500">
                          <i className="fa-solid fa-money-bill-trend-up mr-2 w-3 text-slate-400"></i>
                          Avg Size: <span className="ml-1 font-bold text-slate-700">{client.averageOrderSize}</span>
                        </div>
                        <div className="flex items-center text-[10px] text-slate-500">
                          <i className="fa-solid fa-calendar-check mr-2 w-3 text-slate-400"></i>
                          Order Freq: <span className="ml-1 text-slate-700">{client.orderFrequency || 'N/A'}</span>
                        </div>
                        <div className="flex items-center text-[10px] text-slate-500 font-medium border-t border-slate-100 pt-1 mt-0.5">
                          <i className="fa-solid fa-phone-volume mr-2 w-3 text-slate-400"></i>
                          Last Call: <span className="ml-1 text-slate-700">{client.lastCallingDate || 'Never'}</span>
                        </div>
                        <div className="flex items-center text-[10px] text-slate-400">
                          <i className="fa-solid fa-rotate mr-2 w-3 text-slate-300"></i>
                          Call Freq: <span className="ml-1 text-slate-500">{client.frequencyOfCalling} Days</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${colorMap[status as keyof typeof colorMap]} ${sortConfig.key === 'nextFollowUpDate' ? 'ring-2 ring-blue-400 ring-offset-1' : ''}`}>
                        <i className={`fa-solid ${status === 'red' ? 'fa-clock' : status === 'orange' ? 'fa-bolt-lightning' : 'fa-calendar'} mr-1.5`}></i>
                        {isTodayStatus ? 'TODAY' : client.nextFollowUpDate}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => onSelectClient(client)}
                        className={`p-2 rounded-lg transition-all inline-flex items-center space-x-1 ${isTodayStatus
                          ? 'bg-amber-600 text-white hover:bg-amber-700 shadow-md shadow-amber-600/20'
                          : 'text-blue-600 hover:bg-blue-50'
                          }`}
                      >
                        <i className={`fa-solid ${isTodayStatus ? 'fa-phone-flip' : 'fa-pen-to-square'}`}></i>
                        <span className="text-xs font-bold">{isTodayStatus ? 'Call Now' : 'Follow Up'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                  <i className="fa-solid fa-folder-open text-4xl mb-3 opacity-20"></i>
                  <p className="text-sm font-medium">No clients match your current filters.</p>
                  <button
                    onClick={() => { setSearchTerm(''); setStatusFilter('all'); setCrmFilter('all'); setSortConfig({ key: null, direction: 'asc' }); }}
                    className="mt-4 text-blue-600 text-xs font-bold hover:underline"
                  >
                    Clear all filters
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.01); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}} />
    </div>
  );
};

export default ClientList;
