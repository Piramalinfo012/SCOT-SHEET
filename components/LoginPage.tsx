import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import logo from '../Assets/PPPl Logo copy.png';

const LoginPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const { login, loading } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username || !password) {
            setError("Please enter both username and password");
            return;
        }
        setError('');
        const success = await login(username, password);
        if (success) {
            navigate('/');
        } else {
            setError("Invalid credentials. Please check your username and password.");
        }
    };

    return (
        <div className="min-h-screen bg-[#f1f5f9] flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Soft background accents */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-200/30 blur-[150px] rounded-full"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-200/30 blur-[150px] rounded-full"></div>

            <div className="bg-white p-8 sm:p-12 rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] w-full max-w-md border border-slate-100 relative z-10 scale-100 hover:scale-[1.01] transition-transform duration-500">
                <div className="text-center mb-10">
                    <div className="relative inline-block mb-6">
                        <div className="absolute inset-0 bg-indigo-500/5 blur-xl rounded-full scale-150"></div>
                        <img src={logo} alt="Logo" className="h-20 w-auto mx-auto relative z-10 object-contain drop-shadow-md" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none mb-3">
                        SCOT<span className="text-indigo-600"> SHEET</span>
                    </h1>
                    <p className="text-slate-500 font-medium text-sm mt-2">Sign in to access your dashboard</p>
                    <div className="h-1 w-12 bg-indigo-600 mx-auto rounded-full mt-4"></div>
                </div>

                {error && (
                    <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-2xl flex items-center space-x-3 text-red-600 text-[11px] font-black uppercase tracking-wider animate-in slide-in-from-top-2">
                        <i className="fa-solid fa-triangle-exclamation text-base"></i>
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-7">
                    <div className="group">
                        <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2.5 px-1">Username</label>
                        <div className="relative group/input h-14">
                            <input
                                type="text"
                                className="w-full h-full pl-12 pr-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none font-bold text-slate-800 transition-all placeholder:text-slate-500/60 shadow-inner"
                                placeholder="Enter your username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                            <div className="absolute left-4 inset-y-0 flex items-center justify-center w-6 text-slate-300 group-focus-within/input:text-indigo-600 transition-colors duration-300">
                                <i className="fa-solid fa-user-circle text-lg"></i>
                            </div>
                        </div>
                    </div>

                    <div className="group">
                        <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2.5 px-1">Password</label>
                        <div className="relative group/input h-14">
                            <input
                                type={showPassword ? "text" : "password"}
                                className="w-full h-full pl-12 pr-14 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none font-bold text-slate-800 transition-all placeholder:text-slate-500/60 shadow-inner"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <div className="absolute left-4 inset-y-0 flex items-center justify-center w-6 text-slate-300 group-focus-within/input:text-indigo-600 transition-colors duration-300">
                                <i className="fa-solid fa-shield-halved text-lg"></i>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 inset-y-0 w-10 flex items-center justify-center text-slate-300 hover:text-indigo-600 transition-all focus:outline-none px-1"
                            >
                                <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-lg`}></i>
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-5 rounded-2xl text-white font-black uppercase tracking-[0.25em] text-[12px] shadow-lg transition-all relative overflow-hidden group shadow-[0_8px_0_0_rgba(79,70,229,1)] active:shadow-none active:translate-y-[4px] ${loading
                            ? 'bg-indigo-400 shadow-none cursor-wait translate-y-[4px]'
                            : 'bg-indigo-600 hover:bg-indigo-700'
                            }`}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center space-x-3 relative z-10">
                                <i className="fa-solid fa-spinner fa-spin text-lg"></i>
                                <span>Verifying...</span>
                            </span>
                        ) : "Sign In Authenticate"}
                    </button>
                </form>

                <div className="mt-12 pt-10 border-t border-slate-100 text-center">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                        Developed By <span className="text-indigo-600 font-black">Deepak Sahu</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
