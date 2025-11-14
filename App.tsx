import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import ProtectedRoute from './routes/ProtectedRoute';
import Layout from './components/layout/Layout';
import { PermissionsProvider } from './contexts/PermissionsContext';
import UserProfile from './pages/profile/UserProfile';
import OrganizationsList from './pages/master-data/organizations/OrganizationsList';

function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <PermissionsProvider>
                  <Layout />
                </PermissionsProvider>
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="profile" element={<UserProfile />} />
            <Route path="master-data/organizations" element={<OrganizationsList />} />
            {/* Add other protected routes here */}
          </Route>
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}

export default App;