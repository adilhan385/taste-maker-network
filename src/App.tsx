import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuthContext } from "@/contexts/AuthContext";
import { AppProvider } from "@/contexts/AppContext";
import ForcePasswordChange from "@/components/auth/ForcePasswordChange";
import Index from "./pages/Index";
import Catalog from "./pages/Catalog";
import BecomeChef from "./pages/BecomeChef";
import Orders from "./pages/Orders";
import Chat from "./pages/Chat";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Cart from "./pages/Cart";
import Wallet from "./pages/Wallet";
import AdminPanel from "./pages/AdminPanel";
import ChefDashboard from "./pages/ChefDashboard";
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";

const queryClient = new QueryClient();

function AppRoutes() {
  const { profile, refetchProfile } = useAuthContext();
  const [forceChangeComplete, setForceChangeComplete] = useState(false);

  const showForceChange = profile?.forcePasswordChange && !forceChangeComplete;

  return (
    <>
      {showForceChange && (
        <ForcePasswordChange
          open={true}
          userId={profile.userId}
          onComplete={() => {
            setForceChangeComplete(true);
            refetchProfile();
          }}
        />
      )}
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/become-chef" element={<BecomeChef />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/chef-dashboard" element={<ChefDashboard />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AppProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AppProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
