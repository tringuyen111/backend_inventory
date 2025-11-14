import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { Badge } from '../../components/ui/Badge';
import { usePermissions } from '../../contexts/PermissionsContext';

// Simple Toast component to mimic Sonner
const Toast: React.FC<{ message: string; show: boolean; onDismiss: () => void }> = ({ message, show, onDismiss }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onDismiss();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onDismiss]);

  if (!show) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 bg-gray-900 text-white py-2 px-4 rounded-lg shadow-lg animate-fade-in-up dark:bg-gray-50 dark:text-gray-900">
      {message}
    </div>
  );
};


const UserProfile: React.FC = () => {
  const { user, profile, loading: authLoading, updateProfile } = useAuth();
  const { permissions, loading: permissionsLoading } = usePermissions();
  
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [toast, setToast] = useState({ show: false, message: '' });

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);
  
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
        setError("You must be logged in to update your profile.");
        return;
    }
    
    setIsSaving(true);
    setError(null);
    
    try {
        const { error: updateError } = await updateProfile({
            full_name: fullName,
            phone: phone,
        });
            
        if (updateError) {
            throw updateError;
        }
        
        setToast({ show: true, message: 'Cập nhật thành công' });
        
    } catch (err: any) {
        console.error("Error updating profile:", err);
        setError("Failed to update profile. Please try again.");
    } finally {
        setIsSaving(false);
    }
  };
  
  const dismissToast = () => {
    setToast({ show: false, message: '' });
  };

  const displayInitial = (profile?.full_name || user?.email || 'U').charAt(0).toUpperCase();
  const loading = authLoading || permissionsLoading;
  const isAdmin = permissions.includes('*');
  
  return (
    <>
      <Toast message={toast.message} show={toast.show} onDismiss={dismissToast} />
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>My Profile</CardTitle>
            <CardDescription>Manage your personal information and account settings.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-8">
              {loading ? (
                <>
                  <div className="md:col-span-1 flex flex-col items-center text-center space-y-3 pt-4">
                    <Skeleton className="w-24 h-24 rounded-full" />
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                  <div className="md:col-span-2 space-y-6">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="md:col-span-1 flex flex-col items-center text-center space-y-1 pt-4 border-r-0 md:border-r border-gray-200 dark:border-gray-700 pr-0 md:pr-8">
                     <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-4xl font-bold text-blue-600 dark:text-blue-300 mb-3">
                        {displayInitial}
                     </div>
                     <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 break-words">{profile?.full_name || 'User'}</h2>
                     <p className="text-sm text-gray-500 dark:text-gray-400 break-all">{user?.email}</p>
                     {isAdmin && (
                        <Badge variant="secondary" className="mt-2 capitalize">Admin</Badge>
                      )}
                  </div>
                  <div className="md:col-span-2">
                    <form onSubmit={handleSave}>
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor="fullName">Full Name</Label>
                          <Input
                            id="fullName"
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Your full name"
                            disabled={isSaving}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Your phone number"
                            disabled={isSaving}
                          />
                        </div>
                        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
                      </div>
                      <div className="mt-8 flex justify-end border-t border-gray-200 dark:border-gray-700 pt-6">
                        <Button type="submit" disabled={loading || isSaving}>
                           {isSaving ? 'Saving...' : 'Save Changes'}
                       </Button>
                      </div>
                    </form>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
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

export default UserProfile;