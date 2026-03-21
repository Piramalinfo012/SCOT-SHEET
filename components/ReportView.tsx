import React, { useState, useMemo } from 'react';
import { OrderLog } from '../types';
import * as XLSX from 'xlsx';
import { isWithinInterval, parse, startOfDay, endOfDay, isValid } from 'date-fns';

interface ReportViewProps {
  logs: OrderLog[];
  uniqueCrms: string[];
}

const ReportView: React.FC<ReportViewProps> = ({ logs, uniqueCrms }) => {
  const [viewMode, setViewMode] = useState<'today' | 'history'>('today');
  
  // Date range state (only used for History view)
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // Filter state
  const [crmFilter, setCrmFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [partySearch, setPartySearch] = useState<string>('');

  // Extract unique statuses
  const uniqueStatuses = useMemo(() => {
    const statuses = logs.map(l => l.orderStatus).filter(Boolean);
    return Array.from(new Set(statuses)).sort();
  }, [logs]);

  // Filter logs based on active criteria
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Date Filter
      let matchesDate = true;
      try {
        const logDate = new Date(log.timestamp);
        
        if (viewMode === 'today') {
           // Display only logs for TODAY
           matchesDate = isValid(logDate) && logDate.toDateString() === new Date().toDateString();
        } else {
           // History view: apply date range filter if values exist
           if (startDate && endDate) {
             const start = startOfDay(new Date(startDate));
             const end = endOfDay(new Date(endDate));
             if (isValid(logDate) && isValid(start) && isValid(end)) {
               matchesDate = isWithinInterval(logDate, { start, end });
             }
           }
        }
      } catch (e) {
        matchesDate = false;
      }

      // CRM Filter
      const matchesCrm = crmFilter === 'all' || log.crmName === crmFilter;

      // Status Filter
      const matchesStatus = statusFilter === 'all' || log.orderStatus === statusFilter;

      // Party Search Filter
      const term = partySearch.toLowerCase();
      const matchesParty = !term || 
        log.clientName.toLowerCase().includes(term) || 
        log.id.toLowerCase().includes(term);

      return matchesDate && matchesCrm && matchesStatus && matchesParty;
    });
  }, [logs, startDate, endDate, crmFilter, statusFilter, partySearch, viewMode]);

  // Handle Export to Excel
  const handleExport = () => {
    // Format data for Excel
    const exportData = filteredLogs.map(log => ({
      'Date & Time': log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A',
      'Client ID': log.id,
      'CRM Name': log.crmName,
      'Client Name': log.clientName,
      'Order Status': log.orderStatus,
      'Remark': log.remark,
      'Next Follow-Up': log.nextFollowUpDate
    }));

    // Generate Excel File
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Call Logs');
    
    // Auto-size columns slightly
    const columnWidths = [
      { wch: 20 }, // Date
      { wch: 15 }, // ID
      { wch: 20 }, // CRM
      { wch: 25 }, // Client Name
      { wch: 15 }, // Status
      { wch: 40 }, // Remark
      { wch: 15 }  // Follow Up
    ];
    worksheet['!cols'] = columnWidths;

    // Trigger download
    const fileName = `Call_Logs_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const getStatusBadgeColor = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('recieved') || s.includes('received')) return 'bg-emerald-100 text-emerald-700';
    if (s.includes('not recieved') || s.includes('not received')) return 'bg-red-100 text-red-700';
    if (s.includes('payment pending')) return 'bg-amber-100 text-amber-700';
    return 'bg-blue-100 text-blue-700'; // Default fallback
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-500">
      
      {/* Header & Filters */}
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 space-y-4">
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-black text-slate-800 flex items-center">
              <i className="fa-solid fa-chart-pie mr-3 text-indigo-600"></i>
              Call Logs Report
            </h2>
            
            {/* View Toggle */}
            <div className="bg-slate-200/60 p-1 rounded-lg flex space-x-1">
              <button
                onClick={() => setViewMode('today')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                  viewMode === 'today' 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setViewMode('history')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                  viewMode === 'history' 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                History
              </button>
            </div>
          </div>
          
          <button 
            onClick={handleExport}
            disabled={filteredLogs.length === 0}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-emerald-700 transition flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="fa-solid fa-file-excel mr-2"></i> Download Excel
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          {viewMode === 'history' ? (
            <>
              {/* Start Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">From Date</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                />
              </div>
              
              {/* End Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">To Date</label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                />
              </div>
            </>
          ) : (
            <div className="col-span-1 md:col-span-2 flex items-center border border-indigo-100 bg-indigo-50/50 rounded-lg px-4 text-indigo-600 text-sm font-semibold">
              <i className="fa-solid fa-clock-rotate-left mr-3"></i>
              Showing logs created exactly today. Switch to History for date range formatting.
            </div>
          )}

          {/* CRM Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">CRM Name</label>
            <div className="relative">
              <select 
                title="crmNameFilter"
                value={crmFilter}
                onChange={(e) => setCrmFilter(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm appearance-none cursor-pointer"
              >
                <option value="all">All CRMs</option>
                {uniqueCrms.map(crm => (
                  <option key={crm} value={crm}>{crm}</option>
                ))}
              </select>
              <i className="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] pointer-events-none"></i>
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Order Status</label>
            <div className="relative">
              <select 
                title="statusFilter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm appearance-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                {uniqueStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <i className="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] pointer-events-none"></i>
            </div>
          </div>

          {/* Party Search */}
          <div className="lg:col-span-1">
            <label className="block text-xs font-bold text-slate-700 mb-1">Search Party / ID</label>
            <div className="relative">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]"></i>
              <input 
                type="text" 
                placeholder="Name or ID..."
                value={partySearch}
                onChange={(e) => setPartySearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
              />
            </div>
          </div>
        </div>
        
        {/* Quick clear filters */}
        {(startDate || endDate || crmFilter !== 'all' || statusFilter !== 'all') && (
          <div className="flex justify-end">
            <button 
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setCrmFilter('all');
                setStatusFilter('all');
                setPartySearch('');
              }}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Results Subheader */}
      <div className="px-6 py-3 bg-white border-b border-slate-100 flex justify-between items-center text-xs font-medium text-slate-500">
        <span>Showing {filteredLogs.length} logs</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-h-[600px]">
        <table className="w-full text-left border-collapse relative">
          <thead className="sticky top-0 z-10">
            <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-bold">
              <th className="px-6 py-4 border-b border-slate-200 whitespace-nowrap">Date & Time</th>
              <th className="px-6 py-4 border-b border-slate-200 whitespace-nowrap">Client</th>
              <th className="px-6 py-4 border-b border-slate-200 whitespace-nowrap">CRM Name</th>
              <th className="px-6 py-4 border-b border-slate-200 whitespace-nowrap">Order Status</th>
              <th className="px-6 py-4 border-b border-slate-200 whitespace-nowrap">Remark</th>
              <th className="px-6 py-4 border-b border-slate-200 whitespace-nowrap text-center">Attachment</th>
              <th className="px-6 py-4 border-b border-slate-200 whitespace-nowrap text-right">Follow-Up</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-xs font-bold text-slate-700 border bg-white px-2 py-1 rounded-md shadow-sm">
                      {log.timestamp ? new Date(log.timestamp).toLocaleDateString('en-GB') : 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white bg-slate-900 px-1.5 py-0.5 rounded w-fit mb-1">{log.id}</span>
                      <span className="text-sm font-semibold text-slate-700">{log.clientName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100">
                      <i className="fa-solid fa-user-tie mr-1.5 text-indigo-400"></i>
                      {log.crmName}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded-full ${getStatusBadgeColor(log.orderStatus)}`}>
                      {log.orderStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-slate-600 min-w-[200px] italic">
                      {log.remark ? `"${log.remark}"` : '-'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      {(() => {
                        const url = log.attachmentUrl;
                        if (!url || !url.startsWith('http')) {
                          return <span className="text-[10px] text-slate-300 italic">None</span>;
                        }

                        // Drive Direct Download URL conversion
                        let previewUrl = url;
                        let fileId = "";
                        if (url.includes('drive.google.com')) {
                          const match = url.match(/[?&]id=([^&]+)/) || url.match(/\/d\/([^\/]+)/);
                          if (match) {
                            fileId = match[1];
                            previewUrl = `https://docs.google.com/uc?export=view&id=${fileId}`;
                          }
                        }

                        // Determine file type 
                        const isImage = url.match(/\.(jpeg|jpg|png|gif|webp)$/i) || (url.includes('docs.google.com') && !url.match(/\.(mp3|wav|ogg|m4a)$/i));
                        const isAudio = url.match(/\.(mp3|wav|ogg|m4a)$/i);

                        // Force download mode for ALL Drive URLs
                        let finalUrl = url;
                        if (url.includes('drive.google.com') && fileId) {
                          finalUrl = `https://docs.google.com/uc?export=download&id=${fileId}`;
                        }

                        return (
                          <div className="flex flex-col items-center gap-1 group">
                            <a 
                              href={finalUrl} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              download={`${log.clientName}_attachment`}
                              className="relative"
                            >
                              <div className="w-16 h-12 bg-slate-100 rounded border border-slate-200 overflow-hidden flex items-center justify-center transition-all group-hover:border-indigo-400 group-hover:shadow-md">
                                {isImage && fileId ? (
                                  <img 
                                    src={previewUrl} 
                                    alt="Preview" 
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.target as any).style.display = 'none';
                                      (e.target as any).nextSibling.style.display = 'flex';
                                    }}
                                  />
                                ) : null}
                                <div className={`${isImage && fileId ? 'hidden' : 'flex'} items-center justify-center w-full h-full text-slate-400`}>
                                  <i className={`fa-solid ${isAudio ? 'fa-music' : 'fa-file-lines'} text-lg`}></i>
                                </div>
                              </div>
                              <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/10 transition-colors flex items-center justify-center">
                                <i className="fa-solid fa-download text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></i>
                              </div>
                            </a>
                            <span className="text-[8px] font-black text-indigo-600 uppercase tracking-tighter">
                              {isAudio ? 'Audio' : 'Download'}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <span className="text-xs font-medium text-slate-500 flex justify-end items-center">
                      <i className="fa-regular fa-calendar mr-1.5 opacity-50"></i>
                      {log.nextFollowUpDate || 'N/A'}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center text-slate-400">
                  <div className="flex flex-col items-center">
                    <i className="fa-solid fa-filter-circle-xmark text-4xl mb-4 opacity-20"></i>
                    <p className="text-sm font-medium text-slate-500">No logs found matching criteria.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportView;
