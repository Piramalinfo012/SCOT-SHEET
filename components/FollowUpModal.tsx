
import React, { useState } from 'react';
import { Client } from '../types';
import { formatDateString } from '../utils';

interface FollowUpModalProps {
  client: Client;
  onClose: () => void;
  onSave: (updatedClient: Client) => void;
}

const FollowUpModal: React.FC<FollowUpModalProps> = ({ client, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    orderStatus: 'RECIEVED',
    remark: '',
    nextFollowUpDate: '', // Default to blank
    attachmentBase64: '',
    attachmentName: '',
    attachmentMimeType: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    // Prepare data to send to Google Sheets
    // Note: nextFollowUpDate here is what will be written to Column H of DATA sheet
    const logData = {
      ...client,
      orderStatus: formData.orderStatus,
      remark: formData.remark,
      nextFollowUpDate: formData.nextFollowUpDate, // This is the manually entered next follow up
      attachmentBase64: formData.attachmentBase64,
      attachmentName: formData.attachmentName,
      attachmentMimeType: formData.attachmentMimeType
    };

    onSave(logData);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert("File size exceeds 5MB limit.");
        (e.target as HTMLInputElement).value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        const base64Data = result.split(',')[1];
        setFormData({
          ...formData,
          attachmentBase64: base64Data,
          attachmentName: file.name,
          attachmentMimeType: file.type
        });
      };
      reader.readAsDataURL(file);
    } else {
      setFormData({
        ...formData,
        attachmentBase64: '',
        attachmentName: '',
        attachmentMimeType: ''
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-slate-200 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center space-x-4">
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">ID</span>
              <span className="text-sm font-black bg-blue-600 text-white px-3 py-1 rounded shadow-md min-w-[60px] text-center">
                {client.id || '---'}
              </span>
            </div>
            <div className="h-10 w-px bg-slate-200 mx-1"></div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">{client.clientName}</h2>
              <p className="text-xs text-slate-500 font-medium">CRM: <span className="text-blue-600 font-bold">{client.crmName}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-full">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
          {/* Client Info Panel */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
            <div className="col-span-2 md:col-span-3 flex items-center justify-between border-b border-slate-200 pb-2 mb-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Client Business Profile</span>
              <span className="text-[10px] font-bold text-blue-600 px-2 py-0.5 bg-blue-50 rounded-md border border-blue-100">{client.productName}</span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Avg Order Size</p>
              <p className="text-sm font-bold text-slate-800">{client.averageOrderSize}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Order Frequency</p>
              <p className="text-sm font-semibold text-slate-800">{client.orderFrequency || 'N/A'}</p>
            </div>
            {client.lastRateQuoted && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Last Rate</p>
                <p className="text-sm font-bold text-emerald-600">{client.lastRateQuoted}</p>
              </div>
            )}
          </div>

          {/* Input Fields */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Order Status */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 tracking-wider">Order Status</label>
                <div className="relative">
                  <select
                    className="w-full pl-3 pr-10 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-0 outline-none text-sm font-bold appearance-none transition-all cursor-pointer"
                    value={formData.orderStatus}
                    onChange={(e) => setFormData({ ...formData, orderStatus: e.target.value })}
                    required
                  >
                    <option value="RECIEVED">RECIEVED</option>
                    <option value="NOT RECIEVED">NOT RECIEVED</option>
                    <option value="NO REQUIRMENT AS OF NOW">NO REQUIRMENT AS OF NOW</option>
                    <option value="RATE ISSUE">RATE ISSUE</option>
                    <option value="RATE SHARED">RATE SHARED</option>
                    <option value="HE WILL ORDER WHEN REQUIRMENT">HE WILL ORDER WHEN REQUIRMENT</option>
                    <option value="PAYMENT PENDING">PAYMENT PENDING</option>
                  </select>
                  <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"></i>
                </div>
              </div>

              {/* Next Follow Up Date */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 tracking-wider">Next Follow-Up Date</label>
                <div className="relative">
                  <input
                    type="date"
                    className="w-full pl-10 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-0 outline-none text-sm font-bold transition-all"
                    value={formData.nextFollowUpDate ? formData.nextFollowUpDate.split('/').reverse().join('-') : ''}
                    onChange={(e) => {
                      if (!e.target.value) {
                        setFormData({ ...formData, nextFollowUpDate: '' });
                        return;
                      }
                      const dateParts = e.target.value.split('-');
                      if (dateParts.length === 3) {
                        setFormData({ ...formData, nextFollowUpDate: `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` });
                      }
                    }}
                  />
                  <i className="fa-solid fa-calendar-day absolute left-4 top-1/2 -translate-y-1/2 text-blue-500"></i>
                </div>
              </div>
            </div>

            {/* Remark */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 tracking-wider">Remark (Optional)</label>
              <textarea
                className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-0 outline-none text-sm min-h-[80px] resize-none transition-all"
                placeholder="Write your follow-up remark here..."
                value={formData.remark}
                onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
              />
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 tracking-wider">Attachment (Audio/Image)</label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*,audio/*"
                  onChange={handleFileChange}
                  className="w-full px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-0 outline-none text-sm font-medium transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Max file size: 5MB.</p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border-2 border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-bold text-sm transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className={`flex-2 md:flex-2 px-4 py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center space-x-2 transition-all shadow-lg ${isSaving ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/25'
                }`}
            >
              {isSaving ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-paper-plane"></i>}
              <span>{isSaving ? 'Logging...' : 'Save Log & Date'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FollowUpModal;
