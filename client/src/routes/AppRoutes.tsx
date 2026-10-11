import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { ProtectedRoute } from '../components/layout/ProtectedRoute';
import { AppLayout } from '../components/layout/AppLayout';

// Auth
import { LoginPage } from '../features/auth/LoginPage';

// Employee
import { EmployeeDashboard } from '../features/employee/EmployeeDashboard';
import { CreateVoucherPage } from '../features/employee/CreateVoucherPage';
import { EditVoucherPage } from '../features/employee/EditVoucherPage';
import { MyVouchersPage } from '../features/employee/MyVouchersPage';

// Director
import { DirectorDashboard } from '../features/director/DirectorDashboard';
import { PendingApprovalsPage } from '../features/director/PendingApprovalsPage';
import { DirectorAllVouchersPage } from '../features/director/DirectorAllVouchersPage';

// Accounts
import { AccountsDashboard } from '../features/accounts/AccountsDashboard';
import { AccountsAllVouchersPage } from '../features/accounts/AccountsAllVouchersPage';

// Shared Voucher Views
import { VoucherDetailPage } from '../features/vouchers/VoucherDetailPage';
import { PrintVoucherView } from '../features/vouchers/PrintVoucherView';

export const AppRoutes: React.FC = () => {
  const { user } = useAuth();

  const getDefaultRedirect = () => {
    if (!user) return <Navigate to="/login" replace />;
    if (user.role === UserRole.EMPLOYEE) return <Navigate to="/employee/dashboard" replace />;
    if (user.role === UserRole.DIRECTOR) return <Navigate to="/director/dashboard" replace />;
    if (user.role === UserRole.ACCOUNTS) return <Navigate to="/accounts/dashboard" replace />;
    return <Navigate to="/login" replace />;
  };

  return (
    <Routes>
      {/* Public Login Route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Root redirect */}
      <Route path="/" element={getDefaultRedirect()} />

      {/* Standalone Printable View */}
      <Route
        path="/vouchers/:id/print"
        element={
          <ProtectedRoute>
            <PrintVoucherView />
          </ProtectedRoute>
        }
      />

      {/* Main Authenticated Layout Routes */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* Employee Routes */}
        <Route
          path="/employee/dashboard"
          element={
            <ProtectedRoute allowedRoles={[UserRole.EMPLOYEE]}>
              <EmployeeDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/create-voucher"
          element={
            <ProtectedRoute allowedRoles={[UserRole.EMPLOYEE]}>
              <CreateVoucherPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/edit-voucher/:id"
          element={
            <ProtectedRoute allowedRoles={[UserRole.EMPLOYEE]}>
              <EditVoucherPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/my-vouchers"
          element={
            <ProtectedRoute allowedRoles={[UserRole.EMPLOYEE]}>
              <MyVouchersPage />
            </ProtectedRoute>
          }
        />

        {/* Director Routes */}
        <Route
          path="/director/dashboard"
          element={
            <ProtectedRoute allowedRoles={[UserRole.DIRECTOR]}>
              <DirectorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/director/pending"
          element={
            <ProtectedRoute allowedRoles={[UserRole.DIRECTOR]}>
              <PendingApprovalsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/director/all-vouchers"
          element={
            <ProtectedRoute allowedRoles={[UserRole.DIRECTOR]}>
              <DirectorAllVouchersPage />
            </ProtectedRoute>
          }
        />

        {/* Accounts Routes */}
        <Route
          path="/accounts/dashboard"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ACCOUNTS]}>
              <AccountsDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/accounts/all-vouchers"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ACCOUNTS]}>
              <AccountsAllVouchersPage />
            </ProtectedRoute>
          }
        />

        {/* Shared Voucher Detail View */}
        <Route path="/vouchers/:id" element={<VoucherDetailPage />} />
      </Route>

      {/* Wildcard Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
