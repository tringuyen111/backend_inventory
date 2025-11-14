import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import * as Icons from '../../components/icons';

// Simple Toast component to mimic Sonner for notifications
const Toast: React.FC<{ message: string; show: boolean; onDismiss: () => void; type?: 'error' }> = ({ message, show, onDismiss, type = 'error' }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onDismiss();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [show, onDismiss]);

  if (!show) return null;
  
  const bgColor = type === 'error' ? 'bg-red-600' : 'bg-gray-900';

  return (
    <div className={`fixed bottom-5 right-5 z-50 text-white py-2 px-4 rounded-lg shadow-lg animate-fade-in-up ${bgColor}`}>
      {message}
    </div>
  );
};


const Login: React.FC = () => {
  const [email, setEmail] = useState('nguyenmanhtri2907@gmail.com');
  const [password, setPassword] = useState('nmt29072002');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '' });
  const { login, session } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setToast({ show: false, message: '' });
    const { error: loginError } = await login(email, password);
    if (loginError) {
      setToast({ show: true, message: loginError.message || "Invalid login credentials." });
    } else {
      navigate('/dashboard');
    }
    setLoading(false);
  };
  
  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  const dismissToast = () => {
    setToast({ show: false, message: '' });
  };

  return (
    <>
      <Toast message={toast.message} show={toast.show} onDismiss={dismissToast} type="error" />
      <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2">
        <div className="hidden lg:flex flex-col items-center justify-center bg-gray-900 text-white p-12 text-center">
          <Icons.XCloudLogo className="h-24 w-24 text-blue-500 mb-6" />
          <h1 className="text-4xl font-bold tracking-tight">Inventory XCloud</h1>
          <p className="text-lg text-gray-400 mt-2">Warehouse Management, Simplified.</p>
        </div>
        <div className="flex items-center justify-center p-6 sm:p-12 bg-gray-100 dark:bg-gray-950">
          <Card className="w-full max-w-md bg-white dark:bg-gray-900">
            <CardHeader className="space-y-1 text-left">
              <CardTitle className="text-2xl font-bold">Welcome back!</CardTitle>
              <CardDescription>Please enter your details to sign in.</CardDescription>
            </CardHeader>
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                     <Label htmlFor="password">Password</Label>
                     <a href="#" className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-500">
                        Forgot Password?
                     </a>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing In...' : 'Login'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
       <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default Login;
