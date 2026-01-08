import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Inquiries } from './pages/Inquiries';
import { Quotations } from './pages/Quotations';
import { Shipments } from './pages/Shipments';
import { Customers } from './pages/Customers';
import { Vendors } from './pages/Vendors';
import { Rates } from './pages/Rates';
import { CurrencyPage } from './pages/Currency';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="inquiries" element={<Inquiries />} />
            <Route path="quotations" element={<Quotations />} />
            <Route path="shipments" element={<Shipments />} />
            <Route path="customers" element={<Customers />} />
            <Route path="vendors" element={<Vendors />} />
            <Route path="rates" element={<Rates />} />
            <Route path="currency" element={<CurrencyPage />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
