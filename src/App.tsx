import { lazy, Suspense, useEffect } from "react";
import * as amplitude from "@amplitude/analytics-browser";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useParams } from "react-router-dom";
import { Spinner } from "@/components/ui/spinner";
// Ruta crítica de compra: eager (en el bundle principal)
import Index from "./pages/Index";
import Catalogo from "./pages/v2/Catalogo";
import Categoria from "./pages/v2/Categoria";
import Marca from "./pages/v2/Marca";
import Marcas from "./pages/v2/Marcas";
import Producto from "./pages/v2/Producto";
import { Navigate } from "react-router-dom";
// Resto: chunks separados (lazy) para achicar el bundle inicial
const AuthPage = lazy(() => import("./pages/AuthPage"));
const Profile = lazy(() => import("./pages/Profile"));
const ReviewEmail = lazy(() => import("./pages/ReviewEmail"));
const ProfileComplete = lazy(() => import("./pages/ProfileComplete"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Admin = lazy(() => import("./pages/Admin"));
const Cart = lazy(() => import("./pages/Cart"));
const WaitingList = lazy(() => import("./pages/WaitingList"));
const Checkout = lazy(() => import("./pages/Checkout"));
const CompletarDatosColectiva = lazy(() => import("./pages/CompletarDatosColectiva"));
const OrderDetail = lazy(() => import("./pages/OrderDetail"));
const ComoComprar = lazy(() => import("./pages/ComoComprar"));
const EnviosYDevoluciones = lazy(() => import("./pages/EnviosYDevoluciones"));
const Mayoristas = lazy(() => import("./pages/Mayoristas"));
const Contacto = lazy(() => import("./pages/Contacto"));
const QuienesSomos = lazy(() => import("./pages/QuienesSomos"));
const NotFound = lazy(() => import("./pages/NotFound"));

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Spinner size="lg" />
  </div>
);
import { FloatingWhatsApp } from "./components/FloatingWhatsApp";
import { ScrollToTop } from "./components/ScrollToTop";
import { captureRefFromUrl } from "@/lib/referral";
import { CartProvider } from "./contexts/CartContext";
import { isSociosHost } from "./socios/lib/host";
import SociosApp from "./socios/SociosApp";

const SHORT_LINK_REDIRECTS: Record<string, string> = {
  s1: "https://alaola.com.ar/?utm_source=offline&utm_medium=sticker&utm_campaign=gym&utm_term=12-4&utm_content=v1",
  s2: "https://alaola.com.ar/?utm_source=offline&utm_medium=sticker&utm_campaign=gym&utm_term=12-4&utm_content=v2",
  s3: "https://alaola.com.ar/?utm_source=offline&utm_medium=sticker&utm_campaign=gym&utm_term=12-4&utm_content=v3",
  s4: "https://alaola.com.ar/?utm_source=offline&utm_medium=sticker&utm_campaign=out&utm_term=12-4&utm_content=v1",
  s5: "https://alaola.com.ar/?utm_source=offline&utm_medium=sticker&utm_campaign=out&utm_term=12-4&utm_content=v2",
  s6: "https://alaola.com.ar/?utm_source=offline&utm_medium=sticker&utm_campaign=out&utm_term=12-4&utm_content=v3",
};

// Offline-стикеры s1..s6 -> внешний UTM-URL (явные роуты, без catch-all).
const ShortLinkRedirect = ({ code }: { code: string }) => {
  const url = SHORT_LINK_REDIRECTS[code];
  if (url) window.location.replace(url);
  return null;
};

const V2Redirect = ({ to, param }: { to: string; param: string }) => {
  const params = useParams();
  const value = params[param];
  return <Navigate to={value ? `${to}/${value}` : to} replace />;
};

const queryClient = new QueryClient();

const App = () => {
  // Precarga en idle de los chunks del flujo de compra para que la primera
  // navegación a carrito/lista/checkout no espere la descarga del chunk.
  useEffect(() => {
    const prefetch = () => {
      void import("./pages/Cart");
      void import("./pages/WaitingList");
      void import("./pages/Checkout");
    };
    if ("requestIdleCallback" in window) {
      (window as any).requestIdleCallback(prefetch, { timeout: 4000 });
    } else {
      setTimeout(prefetch, 2500);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('utm_source')) {
      amplitude.track('UTM Visit', {
        utm_source: params.get('utm_source'),
        utm_medium: params.get('utm_medium'),
        utm_campaign: params.get('utm_campaign'),
        utm_term: params.get('utm_term'),
        utm_content: params.get('utm_content'),
      });
    }
  }, []);

  // Capture personal referral code (?ref=CODE) into localStorage for the signup loop.
  useEffect(() => {
    captureRefFromUrl();
  }, []);

  if (isSociosHost()) {
    const pathname = typeof window !== "undefined" ? window.location.pathname : "/";
    const useBasename = pathname === "/socios" || pathname.startsWith("/socios/");
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter basename={useBasename ? "/socios" : undefined}>
            <ScrollToTop />
            <SociosApp />
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <CartProvider>
        <ScrollToTop />
        <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/catalogo" element={<Catalogo />} />
          <Route path="/categoria/:category" element={<Categoria />} />
          <Route path="/marcas" element={<Marcas />} />
          <Route path="/marcas/:slug" element={<Marca />} />
          <Route path="/productos/:urlSlug" element={<Producto />} />
          <Route path="/ingresar" element={<AuthPage />} />
          <Route path="/revisar-email" element={<ReviewEmail />} />
          <Route path="/mi-cuenta" element={<Profile />} />
          <Route path="/completar-perfil" element={<ProfileComplete />} />
          <Route path="/recuperar-clave" element={<ForgotPassword />} />
          <Route path="/restablecer-clave" element={<ResetPassword />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/carrito" element={<Cart />} />
          <Route path="/mis-grupos" element={<WaitingList />} />
          <Route path="/finalizar-compra" element={<Checkout />} />
          <Route path="/finalizar-compra-grupal" element={<Checkout isCollective />} />
          <Route path="/completar-datos-grupo" element={<CompletarDatosColectiva />} />
          <Route path="/pedido/:orderId" element={<OrderDetail />} />
          <Route path="/mi-cuenta/pedidos/:orderId" element={<OrderDetail />} />
          <Route path="/como-comprar" element={<ComoComprar />} />
          <Route path="/envios-y-devoluciones" element={<EnviosYDevoluciones />} />
          <Route path="/mayoristas" element={<Mayoristas />} />
          <Route path="/contacto" element={<Contacto />} />
          <Route path="/quienes-somos" element={<QuienesSomos />} />

          {/* Offline-стикеры (UTM) — явные роуты */}
          <Route path="/s1" element={<ShortLinkRedirect code="s1" />} />
          <Route path="/s2" element={<ShortLinkRedirect code="s2" />} />
          <Route path="/s3" element={<ShortLinkRedirect code="s3" />} />
          <Route path="/s4" element={<ShortLinkRedirect code="s4" />} />
          <Route path="/s5" element={<ShortLinkRedirect code="s5" />} />
          <Route path="/s6" element={<ShortLinkRedirect code="s6" />} />

          {/* Редиректы со старых путей (сохранённые product_link в БД, чужие ссылки) */}
          <Route path="/p/:urlSlug" element={<V2Redirect to="/productos" param="urlSlug" />} />
          <Route path="/lista-espera" element={<Navigate to="/mis-grupos" replace />} />
          <Route path="/checkout" element={<Navigate to="/finalizar-compra" replace />} />
          <Route path="/checkout-colectivo" element={<Navigate to="/finalizar-compra-grupal" replace />} />
          <Route path="/completar-datos-colectiva" element={<Navigate to="/completar-datos-grupo" replace />} />
          <Route path="/marca/:slug" element={<V2Redirect to="/marcas" param="slug" />} />
          <Route path="/producto/:slug" element={<Navigate to="/catalogo" replace />} />
          {/* Legacy /v2/* */}
          <Route path="/v2/catalogo" element={<Navigate to="/catalogo" replace />} />
          <Route path="/v2/categoria/:category" element={<V2Redirect to="/categoria" param="category" />} />
          <Route path="/v2/marcas" element={<Navigate to="/marcas" replace />} />
          <Route path="/v2/marcas/:slug" element={<V2Redirect to="/marcas" param="slug" />} />
          <Route path="/v2/marca/:slug" element={<V2Redirect to="/marcas" param="slug" />} />
          <Route path="/v2/p/:urlSlug" element={<V2Redirect to="/productos" param="urlSlug" />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
        <FloatingWhatsApp />
        </CartProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
