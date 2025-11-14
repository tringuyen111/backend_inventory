import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import * as Icons from '../../components/icons';

const Login: React.FC = () => {
  const [email, setEmail] = useState('nguyenmanhtri2907@gmail.com');
  const [password, setPassword] = useState('nmt29072002');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, session } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: loginError } = await login(email, password);
    if (loginError) {
      setError(loginError.message || "Invalid login credentials.");
    } else {
      navigate('/dashboard');
    }
    setLoading(false);
  };
  
  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="bg-[#2A3042] min-h-screen flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-4xl">
        <main className="grid md:grid-cols-2 rounded-2xl shadow-2xl overflow-hidden">
            {/* Left Branding Panel */}
            <div className="bg-[#1E2230] p-8 sm:p-12 flex flex-col justify-center items-center text-white order-last md:order-first">
                <Icons.InventoryXCloudLogo className="w-32 text-indigo-400 mb-4" />
                <h2 className="text-3xl font-bold text-center">Inventory XCloud</h2>
                <p className="text-slate-400 mt-2 text-center text-sm">Intelligent Warehouse Management System</p>
            </div>
            
            {/* Right Login Panel */}
            <div className="bg-white p-8 sm:p-12">
                <h1 className="text-2xl font-bold text-gray-800 mb-1">Đăng nhập</h1>
                <p className="text-gray-500 mb-6">Chào mừng trở lại! Vui lòng nhập thông tin của bạn.</p>
                
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <Label htmlFor="email" className="text-sm font-medium text-gray-700">Tài khoản</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="m@example.com"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <Label htmlFor="password" className="text-sm font-medium text-gray-700">Mật khẩu</Label>
                        <div className="relative mt-1">
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700"
                              aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                              {showPassword ? <Icons.Eye className="h-5 w-5" /> : <Icons.EyeOff className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <div className="flex items-center">
                        <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
                        <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700"> Ghi nhớ đăng nhập </label>
                    </div>
                    <Button type="submit" className="w-full text-base py-2.5 bg-violet-600 hover:bg-violet-700" disabled={loading}>
                        {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                    </Button>
                </form>
            </div>
        </main>
        <footer className="w-full text-center text-sm text-gray-400 mt-8">
            Copyright © 2024. Design & Develop by Tringuyen.
        </footer>
      </div>
    </div>
  );
};

export default Login;