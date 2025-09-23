import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Product2 from "./pages/Product2";
import Product3 from "./pages/Product3";
import Product4 from "./pages/Product4";
import Product5 from "./pages/Product5";
import EnaWheyRedirect from "./pages/EnaWheyRedirect";
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
          <Route path="/ena-whey-930" element={<Index />} />
          <Route path="/ena-whey" element={<EnaWheyRedirect />} />
          <Route path="/sn-creatina-500" element={<Product2 />} />
          <Route path="/sn-whey-908" element={<Product3 />} />
          <Route path="/sn-pumpv8-285" element={<Product4 />} />
          <Route path="/gn-gainer-2267" element={<Product5 />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
