import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import EnaWhey930 from "./pages/EnaWhey930";
import Product2 from "./pages/Product2";
import Product3 from "./pages/Product3";
import Product4 from "./pages/Product4";
import Product5 from "./pages/Product5";
import Product6 from "./pages/Product6";
import Product7 from "./pages/Product7";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/ena-whey-930" element={<EnaWhey930 />} />
          <Route path="/sn-creatina-500" element={<Product2 />} />
          <Route path="/sn-whey-908" element={<Product3 />} />
          <Route path="/sn-pumpv8-285" element={<Product4 />} />
          <Route path="/gn-gainer-2267" element={<Product5 />} />
          <Route path="/sn-platinum-908" element={<Product6 />} />
          <Route path="/ena-bars-16" element={<Product7 />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin" element={<Admin />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
