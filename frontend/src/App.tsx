import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';

// Layouts
import AdminLayout from './components/layout/AdminLayout';
import DriverLayout from './components/layout/DriverLayout';
import OrganizationLayout from './components/layout/OrganizationLayout';

// Auth Pages
import LandingPage from './pages/auth/LandingPage';
import AdminLogin from './pages/auth/AdminLogin';
import DriverLogin from './pages/auth/DriverLogin';
import OrganizationLogin from './pages/auth/OrganizationLogin';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import TripsPage from './pages/admin/TripsPage';
import AddTripPage from './pages/admin/AddTripPage';
import ClientsPage from './pages/admin/ClientsPage';
import DriversPage from './pages/admin/DriversPage';
import VehiclesPage from './pages/admin/VehiclesPage';
import ExpensesPage from './pages/admin/ExpensesPage';
import DriverLedgerPage from './pages/admin/DriverLedgerPage';
import InvoicesPage from './pages/admin/InvoicesPage';
import PaymentsPage from './pages/admin/PaymentsPage';
import EnrollmentRequestsPage from './pages/admin/EnrollmentRequestsPage';
import SettlementsPage from './pages/admin/SettlementsPage';
import ProfitAnalyticsPage from './pages/admin/ProfitAnalyticsPage';
import MonthlyReportsPage from './pages/admin/MonthlyReportsPage';
import BackupPage from './pages/admin/BackupPage';
import SettingsPage from './pages/admin/SettingsPage';

// Driver Pages
import DriverDashboard from './pages/driver/DriverDashboard';
import DriverAvailableTrips from './pages/driver/DriverAvailableTrips';
import DriverUpcomingTrips from './pages/driver/DriverUpcomingTrips';
import DriverEnrolledTrips from './pages/driver/DriverEnrolledTrips';
import DriverTripDetail from './pages/driver/DriverTripDetail';
import DriverExpenseEntry from './pages/driver/DriverExpenseEntry';
import DriverCompletedTrips from './pages/driver/DriverCompletedTrips';
import DriverSettlements from './pages/driver/DriverSettlements';
import DriverProfile from './pages/driver/DriverProfile';

// Organization Partner Pages
import OrganizationDashboard from './pages/organization/OrganizationDashboard';
import OrganizationSubmitTrip from './pages/organization/OrganizationSubmitTrip';
import OrganizationTrips from './pages/organization/OrganizationTrips';
import OrganizationInvoices from './pages/organization/OrganizationInvoices';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing & Login Selection */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Navigate to="/admin/login" replace />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/driver/login" element={<DriverLogin />} />
          <Route path="/org/login" element={<OrganizationLogin />} />

          {/* 1. Admin Portal */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole={['admin', 'super_admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="trips" element={<TripsPage />} />
            <Route path="trips/create" element={<AddTripPage />} />
            <Route path="clients" element={<ClientsPage />} />
            <Route path="drivers" element={<DriversPage />} />
            <Route path="vehicles" element={<VehiclesPage />} />
            <Route path="expenses" element={<ExpensesPage />} />
            <Route path="driver-ledger" element={<DriverLedgerPage />} />
            <Route path="invoices" element={<InvoicesPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="enrollment-requests" element={<EnrollmentRequestsPage />} />
            <Route path="settlements" element={<SettlementsPage />} />
            <Route path="profit-analytics" element={<ProfitAnalyticsPage />} />
            <Route path="monthly-reports" element={<MonthlyReportsPage />} />
            <Route path="backup" element={<BackupPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* 2. Driver Employee Portal */}
          <Route
            path="/driver"
            element={
              <ProtectedRoute requiredRole="driver">
                <DriverLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/driver/dashboard" replace />} />
            <Route path="dashboard" element={<DriverDashboard />} />
            <Route path="available-trips" element={<DriverAvailableTrips />} />
            <Route path="upcoming-trips" element={<DriverUpcomingTrips />} />
            <Route path="enrolled-trips" element={<DriverEnrolledTrips />} />
            <Route path="trips/:tripId" element={<DriverTripDetail />} />
            <Route path="trips/:tripId/expenses" element={<DriverExpenseEntry />} />
            <Route path="completed-trips" element={<DriverCompletedTrips />} />
            <Route path="settlements" element={<DriverSettlements />} />
            <Route path="profile" element={<DriverProfile />} />
          </Route>

          {/* 3. Organization / Partner Portal */}
          <Route
            path="/org"
            element={
              <ProtectedRoute requiredRole="organization">
                <OrganizationLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/org/dashboard" replace />} />
            <Route path="dashboard" element={<OrganizationDashboard />} />
            <Route path="trips/new" element={<OrganizationSubmitTrip />} />
            <Route path="trips" element={<OrganizationTrips />} />
            <Route path="invoices" element={<OrganizationInvoices />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
