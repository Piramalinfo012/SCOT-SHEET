import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

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
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-slate-200">
                <div className="text-center mb-8">
                    <div className="bg-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-600/30">
                        <i className="fa-solid fa-chart-line text-white text-3xl"></i>
                    </div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">SCOT<span className="text-indigo-600"> SHEET</span></h1>
                    <p className="text-slate-500 font-medium text-sm mt-2">Sign in to access your dashboard</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3 text-red-600 text-sm font-bold">
                        <i className="fa-solid fa-circle-exclamation mt-0.5"></i>
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Username</label>
                        <div className="relative">
                            <input
                                type="text"
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-indigo-600 focus:bg-white outline-none font-bold text-slate-800 transition-all"
                                placeholder="Enter your username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                            <i className="fa-solid fa-user absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"></i>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                className="w-full pl-10 pr-12 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-indigo-600 focus:bg-white outline-none font-bold text-slate-800 transition-all"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <i className="fa-solid fa-lock absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"></i>
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors focus:outline-none px-1"
                            >
                                <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-4 rounded-xl text-white font-black uppercase tracking-widest text-sm shadow-lg transition-all ${loading
                            ? 'bg-indigo-400 cursor-wait'
                            : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30 transform hover:-translate-y-0.5 active:translate-y-0'
                            }`}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center space-x-2">
                                <i className="fa-solid fa-circle-notch fa-spin"></i>
                                <span>Verifying...</span>
                            </span>
                        ) : "Sign In"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
