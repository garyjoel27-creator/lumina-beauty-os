import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientProfile from './pages/ClientProfile';
import SuperAdminView from './pages/SuperAdminView';
import PublicBookingView from './pages/PublicBookingView';
import { ShopProvider } from './context/ShopContext';
import { ClientProvider } from './context/ClientContext';

function App() {
  return (
    <Router>
      <ShopProvider>
        <ClientProvider>
          <Routes>
            {/* Standalone Public Client Booking Portal (100% Isolated, Zero /sync) */}
            <Route path="/reservar" element={<PublicBookingView />} />
            <Route path="/r/:shopSlug" element={<PublicBookingView />} />

            {/* Standalone Super-Admin Salon Panel */}
            <Route path="/admin" element={<SuperAdminView />} />

            {/* Private Beauty Salon Hub */}
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="clients" element={<Clients />} />
              <Route path="clients/:id" element={<ClientProfile />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </ClientProvider>
      </ShopProvider>
    </Router>
  );
}

export default App;
