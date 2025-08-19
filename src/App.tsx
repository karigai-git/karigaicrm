import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme/theme-provider";
import DashboardPage from "./pages/admin/DashboardPage";
import OrdersPage from "./pages/admin/OrdersPage";
import CustomersPage from "./pages/admin/CustomersPage";
import ProductsPage from "./pages/admin/ProductsPage";
import PaymentsPage from "./pages/admin/PaymentsPage";
import SettingsPage from "./pages/admin/SettingsPage";
import WhatsAppActivitiesPage from "./pages/admin/WhatsAppActivitiesPage";
import WhatsAppTemplatesPage from "./pages/admin/WhatsAppTemplatesPage";
import EmailActivitiesPage from "./pages/admin/EmailActivitiesPage";
import EmailTemplatesPage from "./pages/admin/EmailTemplatesPage";
import LoginPage from "./pages/LoginPage";
import NotFound from "./pages/NotFound";
import CampaignsPage from "./pages/admin/CampaignsPage";
import { requestNotificationPermission } from '@/lib/push-notifications';

// Set PocketBase URL from environment variable
if (import.meta.env.VITE_POCKETBASE_URL) {
  console.log("PocketBase URL:", import.meta.env.VITE_POCKETBASE_URL);
} else {
  console.warn("PocketBase URL not found in environment variables, using default");
}

// Configure React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const App = () => {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(registration => {
            console.log('Service Worker registered: ', registration);
          })
          .catch(registrationError => {
            console.log('Service Worker registration failed: ', registrationError);
          });
      });
    }
    requestNotificationPermission();
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" storageKey="konipai-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<LoginPage />} />
            
            {/* Admin routes */}
            <Route path="/admin" element={<DashboardPage />} />
            <Route path="/admin/orders" element={<OrdersPage />} />
            <Route path="/admin/customers" element={<CustomersPage />} />
            <Route path="/admin/products" element={<ProductsPage />} />
            <Route path="/admin/payments" element={<PaymentsPage />} />
            <Route path="/admin/settings" element={<SettingsPage />} />
            <Route path="/admin/whatsapp" element={<WhatsAppActivitiesPage />} />
            <Route path="/admin/whatsapp-templates" element={<WhatsAppTemplatesPage />} />
            <Route path="/admin/email" element={<EmailActivitiesPage />} />
            <Route path="/admin/email-templates" element={<EmailTemplatesPage />} />
            <Route path="/admin/campaigns" element={<CampaignsPage />} />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
  );
};

export default App;
