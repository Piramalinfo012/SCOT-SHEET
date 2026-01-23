import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { NavLink, Outlet } from 'react-router-dom';

const Layout: React.FC = () => {
    const { user, logout } = useAuth();

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
                                SCOT<span className="text-indigo-600"> SHEET</span>
                            </h1>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="flex space-x-1 items-center bg-slate-100 p-1 rounded-xl">
                                <NavLink
                                    to="/"
                                    className={({ isActive }) => `px-4 py-2 rounded-lg text-sm font-bold transition-all ${isActive ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Dashboard
                                </NavLink>
                                <NavLink
                                    to="/clients"
                                    className={({ isActive }) => `px-4 py-2 rounded-lg text-sm font-bold transition-all ${isActive ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Clients
                                </NavLink>
                            </div>

                            {/* User Profile Info */}
                            <div className="hidden md:flex flex-col items-end border-r border-slate-200 pr-4 mr-2">
                                <span className="text-sm font-black text-slate-700">{user?.name}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user?.role}</span>
                            </div>

                            <button
                                onClick={logout}
                                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                title="Sign Out"
                            >
                                <i className="fa-solid fa-right-from-bracket text-lg"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
