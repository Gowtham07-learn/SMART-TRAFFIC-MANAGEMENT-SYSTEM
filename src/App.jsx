import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, ROLES } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { ToastProvider } from './components/ui/Toast';
import Login from './pages/Auth/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import LiveTrafficMap from './pages/TrafficMap/TrafficMap';
import SignalControl from './pages/SignalControl/SignalControl';
import EmergencyPriority from './pages/Emergency/Emergency';
import TrafficPrediction from './pages/Prediction/Prediction';
import DigitalTwin from './pages/DigitalTwin/DigitalTwin';
import Analytics from './pages/Analytics/Analytics';
import SystemHealth from './pages/SystemHealth/SystemHealth';
import Alerts from './pages/Alerts/Alerts';
import ReportIncident from './pages/ReportIncident/ReportIncident';
import RouteRecommendations from './pages/RouteRecommendations/RouteRecommendations';
import EmergencyRoute from './pages/EmergencyRoute/EmergencyRoute';

// Placeholder components for other pages
const Placeholder = ({ name }) => (
  <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500">
    <h2 className="text-2xl font-bold text-slate-100 mb-2">{name}</h2>
    <p>Module configuration pending...</p>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={
            <DashboardLayout>
              <Routes>
                <Route path="/" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.TRAFFIC_CONTROLLER]}><Dashboard /></ProtectedRoute>} />
                <Route path="/map" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.TRAFFIC_CONTROLLER, ROLES.CITIZEN]}><LiveTrafficMap /></ProtectedRoute>} />
                <Route path="/signals" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.TRAFFIC_CONTROLLER]}><SignalControl /></ProtectedRoute>} />
                <Route path="/emergency" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.EMERGENCY_DRIVER]}><EmergencyPriority /></ProtectedRoute>} />
                <Route path="/predictions" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]}><TrafficPrediction /></ProtectedRoute>} />
                <Route path="/digital-twin" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]}><DigitalTwin /></ProtectedRoute>} />
                <Route path="/analytics" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.TRAFFIC_CONTROLLER]}><Analytics /></ProtectedRoute>} />
                <Route path="/health" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]}><SystemHealth /></ProtectedRoute>} />
                
                <Route path="/emergency-route" element={<ProtectedRoute allowedRoles={[ROLES.EMERGENCY_DRIVER]}><EmergencyRoute /></ProtectedRoute>} />

                <Route path="/alerts" element={<ProtectedRoute allowedRoles={[ROLES.CITIZEN]}><Alerts /></ProtectedRoute>} />
                <Route path="/report" element={<ProtectedRoute allowedRoles={[ROLES.CITIZEN]}><ReportIncident /></ProtectedRoute>} />
                <Route path="/routes" element={<ProtectedRoute allowedRoles={[ROLES.CITIZEN]}><RouteRecommendations /></ProtectedRoute>} />
              </Routes>
            </DashboardLayout>
          } />
        </Routes>
      </Router>
      <ToastProvider />
    </AuthProvider>
  );
}

export default App;
