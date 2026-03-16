import React, { useState } from 'react';
import { Client } from '../types';

interface AddClientModalProps {
  onClose: () => void;
  onSave: (client: Partial<Client>) => Promise<void>;
  uniqueCrms: string[];
}

const AddClientModal: React.FC<AddClientModalProps> = ({ onClose, onSave, uniqueCrms }) => {
  const [formData, setFormData] = useState<Partial<Client>>({
    crmName: '',
    clientName: '',
    number: '',
    contactPerson: '',
    productName: '',
    averageOrderSize: '',
    orderFrequency: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-lg font-black text-slate-800 flex items-center">
            <i className="fa-solid fa-user-plus mr-3 text-indigo-600"></i>
            Add New Client
          </h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <i className="fa-solid fa-times text-xl"></i>
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh]">
          <form id="add-client-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">CRM NAME *</label>
                <div className="relative">
                  <select
                    required
                    name="crmName"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm appearance-none cursor-pointer"
                    value={formData.crmName}
                    onChange={handleChange as any}
                  >
                    <option value="" disabled>Select CRM Name</option>
                    {uniqueCrms.map(crm => (
                      <option key={crm} value={crm}>{crm}</option>
                    ))}
                  </select>
                  <i className="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">CLIENT NAME *</label>
                <input 
                  required
                  type="text"
                  name="clientName"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  value={formData.clientName}
                  onChange={handleChange}
                  placeholder="e.g. ABC Corp"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">NUMBER *</label>
                <input 
                  required
                  type="text"
                  name="number"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  value={formData.number}
                  onChange={handleChange}
                  placeholder="e.g. 9876543210"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">CONTACT PERSON</label>
                <input 
                  type="text"
                  name="contactPerson"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  value={formData.contactPerson}
                  onChange={handleChange}
                  placeholder="e.g. John Doe"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">PRODUCT NAME</label>
                <input 
                  type="text"
                  name="productName"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  value={formData.productName}
                  onChange={handleChange}
                  placeholder="e.g. Software License"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">AVERAGE ORDER SIZE</label>
                <input 
                  type="text"
                  name="averageOrderSize"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  value={formData.averageOrderSize}
                  onChange={handleChange}
                  placeholder="e.g. 5000"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">ORDER FREQUENCY IN DAYS</label>
                <input 
                  type="text"
                  name="orderFrequency"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  value={formData.orderFrequency}
                  onChange={handleChange}
                  placeholder="e.g. 30"
                />
              </div>
            </div>
          </form>
        </div>

        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex justify-end space-x-3">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors text-sm"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button 
            type="submit"
            form="add-client-form"
            disabled={isSaving}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm"
          >
            {isSaving ? (
              <>
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                Saving...
              </>
            ) : (
              'Add Client'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddClientModal;
