
import React from 'react';

interface DashboardCardProps {
  title: string;
  value: number;
  icon: string;
  color: string;
  description: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, value, icon, color, description }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-start space-x-4 transition-transform hover:scale-[1.02]">
      <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
        <i className={`fa-solid ${icon} text-xl ${color.replace('bg-', 'text-')}`}></i>
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{title}</p>
        <h3 className="text-3xl font-bold text-slate-900 mt-1">{value}</h3>
        <p className="text-xs text-slate-400 mt-2">{description}</p>
      </div>
    </div>
  );
};

export default DashboardCard;
