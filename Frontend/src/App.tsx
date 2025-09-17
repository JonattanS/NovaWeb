import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { UserMenu } from "@/components/UserMenu";
import { useUser } from "@/contexts/UserContext";
import HomePage from "./pages/HomePage";
import CuentasPorCobrarPage from "./pages/CuentasPorCobrarPage";
import CuentasPorPagarPage from "./pages/CuentasPorPagarPage";
import QueryManualPage from "./pages/QueryManualPage";
import DynamicFunctionPage from "./pages/DynamicFunctionPage";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import ConsultaDocumentosPage from "./pages/ProcesoDocumentos/ConsultaDocumentosPage";
import AuxiliarDeCuentasPage from "./pages/ProcesoDocumentos/AuxiliarDeCuentasPage";
import ConsultaBalanceComprobacionPage from "./pages/EstadosFinancieros/ConsultaBalanceComprobacionPage";
import { ModuleRepository } from './components/ModuleRepository';
import { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import React from "react";
import { UserProvider } from "@/contexts/UserContext";
import { ModuleViewer } from "./components/ModuleViewer";
import ComprobanteDiarioPage from "./pages/LibrosOficiales/ComprobanteDiarioPage";


const queryClient = new QueryClient();

function useAutoLogout(onLogout: () => void, delay = 30 * 60 * 1000) {
  const timer = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      onLogout();
    }, delay);
  }, [onLogout, delay]);

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'scroll', 'click'];
    const handleActivity = () => resetTimer();

    events.forEach(event => window.addEventListener(event, handleActivity));
    resetTimer();

    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity));
      if (timer.current) clearTimeout(timer.current);
    };
  }, [resetTimer]);
}

/**
 * Layout principal de la app, solo visible si el usuario está autenticado
 */
const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const { user } = useUser();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">

        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 shadow-sm sticky top-0 z-40">
            <div className="flex h-16 items-center justify-between px-6">
              <div className="flex items-center space-x-4">
                <SidebarTrigger className="hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" />
                <div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-[#F7722F] bg-clip-text text-transparent">
                    Nova Web
                  </h2>
                </div>
              </div>
              <UserMenu />
            </div>
          </header>
          <main className="flex-1 p-6 overflow-auto bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            <div className="max-w-7xl mx-auto w-full">{children}</div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

const AppRoutes = () => {
  const { login } = useUser();

  <Login onLogin={login} />

  return (
    <Routes>
      console.log('Renderizando Login');
      <Route path="/login" element={<Login onLogin={login} />} />

    <Route
      path="/"
      element={
        <ProtectedRoute>
          <MainLayout>
            <HomePage />
          </MainLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/portafolios"
      element={
        <ProtectedRoute>
          <MainLayout>
            <ModuleRepository onClose={function (): void {
              throw new Error("Function not implemented.");
            } } />
          </MainLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/cuentas-por-cobrar"
      element={
        <ProtectedRoute>
          <MainLayout>
            <CuentasPorCobrarPage />
          </MainLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/cuentas-por-pagar"
      element={
        <ProtectedRoute>
          <MainLayout>
            <CuentasPorPagarPage />
          </MainLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/ConsultaDocumentosPage"
      element={
        <ProtectedRoute>
          <MainLayout>
            <ConsultaDocumentosPage />
          </MainLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/AuxiliarDeCuentasPage"
      element={
        <ProtectedRoute>
          <MainLayout>
            <AuxiliarDeCuentasPage />
          </MainLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/ComprobanteDiario"
      element={
        <ProtectedRoute>
          <MainLayout>
            <ComprobanteDiarioPage />
          </MainLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/ConsultaBalanceComprobacionPage"
      element={
        <ProtectedRoute>
          <MainLayout>
            <ConsultaBalanceComprobacionPage />
          </MainLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/module-viewer"
      element={
        <ProtectedRoute>
          <MainLayout>
            <ModuleViewer />
          </MainLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/query-manual"
      element={
        <ProtectedRoute>
          <MainLayout>
            <QueryManualPage />
          </MainLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/dynamic-function/:id"
      element={
        <ProtectedRoute>
          <MainLayout>
            <DynamicFunctionPage />
          </MainLayout>
        </ProtectedRoute>
      }
    />
    {/* NotFound también protegido */}
    <Route
      path="*"
      element={
        <ProtectedRoute>
          <MainLayout>
            <NotFound />
          </MainLayout>
        </ProtectedRoute>
      }
    />
  </Routes>
  );
};

const App = () => {
  const { user, logout } = useUser();
  const navigate = useNavigate();

  useAutoLogout(logout, 30 * 60 * 1000);

  // Usar useEffect después del <BrowserRouter> en el árbol para que useNavigate funcione
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppRoutes />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
