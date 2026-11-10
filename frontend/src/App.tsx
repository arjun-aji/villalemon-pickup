import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';

// Layouts
import AdminLayout from './components/layout/AdminLayout';
import DriverLayout from './components/layout/DriverLayout';

// Auth Pages
import LandingPage from './pages/auth/LandingPage';
import AdminLogin from './pages/auth/AdminLogin';
import DriverLogin from './pages/auth/DriverLogin';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import TripsPage from './pages/admin/TripsPage';
import AddTripPage from './pages/admin/AddTripPage';
import DriversPage from './pages/admin/DriversPage';
import EnrollmentRequestsPage from './pages/admin/EnrollmentRequestsPage';
import SettlementsPage from './pages/admin/SettlementsPage';
import ProfitAnalyticsPage from './pages/admin/ProfitAnalyticsPage';
import MonthlyReportsPage from './pages/admin/MonthlyReportsPage';
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

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing & Login Selection */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/driver/login" element={<DriverLogin />} />

          {/* Admin Protected Portal */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="trips" element={<TripsPage />} />
            <Route path="trips/create" element={<AddTripPage />} />
            <Route path="drivers" element={<DriversPage />} />
            <Route path="enrollment-requests" element={<EnrollmentRequestsPage />} />
            <Route path="settlements" element={<SettlementsPage />} />
            <Route path="profit-analytics" element={<ProfitAnalyticsPage />} />
            <Route path="monthly-reports" element={<MonthlyReportsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Driver Protected Portal */}
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

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
