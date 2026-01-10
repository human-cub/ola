import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import DynamicProduct from "./pages/DynamicProduct";
import Category from "./pages/Category";
import AuthPage from "./pages/AuthPage";
import ProfileComplete from "./pages/ProfileComplete";
import Profile from "./pages/Profile";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Admin from "./pages/Admin";
import Cart from "./pages/Cart";
import WaitingList from "./pages/WaitingList";
import Checkout from "./pages/Checkout";
import OrderDetail from "./pages/OrderDetail";
import NotFound from "./pages/NotFound";
import { FloatingWhatsApp } from "./components/FloatingWhatsApp";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/categoria/:category" element={<Category />} />
          <Route path="/producto/:slug" element={<DynamicProduct />} />
          <Route path="/:slug" element={<DynamicProduct />} />
          <Route path="/ingresar" element={<AuthPage />} />
          <Route path="/completar-perfil" element={<ProfileComplete />} />
          <Route path="/mi-cuenta" element={<Profile />} />
          <Route path="/recuperar-clave" element={<ForgotPassword />} />
          <Route path="/restablecer-clave" element={<ResetPassword />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/carrito" element={<Cart />} />
          <Route path="/lista-espera" element={<WaitingList />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/checkout-colectivo" element={<Checkout isCollective />} />
          <Route path="/pedido/:orderNumber" element={<OrderDetail />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <FloatingWhatsApp />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
