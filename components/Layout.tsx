import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { NavLink, Outlet } from 'react-router-dom';
import logo from '../Assets/PPPl Logo copy.png';

const Layout: React.FC = () => {
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans overflow-x-hidden">
            <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
                <div className="w-full px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                            <img src={logo} alt="Logo" className="h-8 sm:h-10 w-auto object-contain" />
                            <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-800 truncate">
                                SCOT<span className="text-indigo-600"> SHEET</span>
                            </h1>
                        </div>

                        <div className="flex items-center space-x-2 sm:space-x-4">
                            <div className="flex space-x-1 items-center bg-slate-100 p-1 rounded-xl">
                                <NavLink
                                    to="/"
                                    className={({ isActive }) => `flex items-center px-3 py-2 rounded-lg text-sm font-bold transition-all ${isActive ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <i className="fa-solid fa-house sm:mr-2 text-lg sm:text-base"></i>
                                    <span className="hidden sm:inline">Dashboard</span>
                                </NavLink>
                                <NavLink
                                    to="/clients"
                                    className={({ isActive }) => `flex items-center px-3 py-2 rounded-lg text-sm font-bold transition-all ${isActive ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <i className="fa-solid fa-users sm:mr-2 text-lg sm:text-base"></i>
                                    <span className="hidden sm:inline">Clients</span>
                                </NavLink>
                                <NavLink
                                    to="/report"
                                    className={({ isActive }) => `flex items-center px-3 py-2 rounded-lg text-sm font-bold transition-all ${isActive ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <i className="fa-solid fa-chart-pie sm:mr-2 text-lg sm:text-base"></i>
                                    <span className="hidden sm:inline">Report</span>
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

            <main className="w-full px-2 sm:px-4 lg:px-6 pt-4 pb-12 sm:pt-8 sm:pb-16 flex-grow">
                <Outlet />
            </main>

            <footer className="fixed bottom-0 left-0 w-full py-1.5 bg-slate-50/90 backdrop-blur-sm border-t border-slate-200/50 flex justify-center items-center z-50">
                <style dangerouslySetInnerHTML={{__html: `
                    .typing-container {
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 11px;
                        font-weight: 900;
                        letter-spacing: 0.15em;
                        color: #7c3aed;
                    }
                    .typing-text {
                        overflow: hidden;
                        white-space: nowrap;
                        border-right: 2px solid #7c3aed;
                        animation: typing 5s steps(32, end) infinite, blink-caret .75s step-end infinite;
                    }
                    @keyframes typing {
                        0%, 10% { width: 0; }
                        40%, 80% { width: 32ch; }
                        90%, 100% { width: 0; }
                    }
                    @keyframes blink-caret {
                        from, to { border-color: transparent }
                        50% { border-color: #7c3aed; }
                    }
                `}} />
                <div className="typing-container">
                    <span className="mr-2 text-[8px]">●</span>
                    <div className="typing-text uppercase">
                        DEVELOPED BY DEEPAK SAHU
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Layout;
