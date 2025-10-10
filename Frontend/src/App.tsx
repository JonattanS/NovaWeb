"use client"

import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Routes, Route } from "react-router-dom"
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { UserMenu } from "@/components/UserMenu"
import { useUser } from "@/contexts/UserContext"
import HomePage from "./pages/HomePage"
import CuentasPorCobrarPage from "./pages/CuentasPorCobrarPage"
import CuentasPorPagarPage from "./pages/CuentasPorPagarPage"
import QueryManualPage from "./pages/QueryManualPage"
import DynamicFunctionPage from "./pages/DynamicFunctionPage"
import NotFound from "./pages/NotFound"
import ProtectedRoute from "@/components/ProtectedRoute"
import Login from "./pages/Login"
import ConsultaDocumentosPage from "./pages/ProcesoDocumentos/ConsultaDocumentosPage"
import AuxiliarDeCuentasPage from "./pages/ProcesoDocumentos/AuxiliarDeCuentasPage"
import AuxiliarDeCuentasExtranjerasPage from "./pages/ProcesoDocumentos/AuxiliarDeCuentasExtranjerasPage"
import DiarioPorDocumentosPage from "./pages/ProcesoDocumentos/DiarioPorDocumentosPage"
import ComprobanteDiarioPage from "./pages/LibrosOficiales/ComprobanteDiarioPage"
import LibroDiarioPorSucursalPage from "./pages/LibrosOficiales/LibroDiarioPorSucursalPage"
import LibroMayorBalancesPorSucursalPage from "./pages/LibrosOficiales/LibroMayorBalancesPorSucursalPage"
import LibroMayorBalancesSimplificadoPage from "./pages/LibrosOficiales/LibroMayorBalancesSimplificadoPage"
import LibrosInventariosBalancesPage from "./pages/LibrosOficiales/LibrosInventariosBalancesPage"
import ConsultaBalanceComprobacionPage from "./pages/EstadosFinancieros/ConsultaBalanceComprobacionPage"
import BalanceComprobacionRangoFechasCentroTercerosPage from "./pages/EstadosFinancieros/BalanceComprobacionRangoFechasCentroTercerosPage"
import BalanceGeneralPorSucursalPage from "./pages/EstadosFinancieros/BalanceGeneralPorSucursalPage"
import EstadoResultadosPorSucursalPage from "./pages/EstadosFinancieros/EstadoResultadosPorSucursalPage"
import EstadoResultadosPorCentroActividadPage from "./pages/EstadosFinancieros/EstadoResultadosPorCentroActividadPage"
import EstadoResultadosPorSucursalCentroPage from "./pages/EstadosFinancieros/EstadoResultadosPorSucursalCentroPage"
import ConsultaSaldoPage from "./pages/EstadoDeSaldos/ConsultaSaldoPage"
import ReporteSaldosPorCuentaPage from "./pages/EstadoDeSaldos/ReporteSaldosPorCuentaPage"
import ReporteSaldosPorNitPage from "./pages/EstadoDeSaldos/ReporteSaldosPorNitPage"
import ReporteSaldosPorCentroPage from "./pages/EstadoDeSaldos/ReporteSaldosPorCentroPage"
import ReporteSaldosPorCentroNitPage from "./pages/EstadoDeSaldos/ReporteSaldosPorCentroNitPage"
import ReporteDeSaldosDeBancosPage from "./pages/EstadoDeSaldos/ReporteDeSaldosDeBancosPage"
import ReporteEstadoDeMultiplesAnexosPage from "./pages/AnexosFinancieros/ReporteEstadoDeMultiplesAnexosPage"
import { ModuleRepository } from "./components/ModuleRepository"
import { useEffect, useCallback, useRef } from "react"
import { useNavigate } from "react-router-dom"
import type React from "react"
import { ModuleViewer } from "./components/ModuleViewer"

const queryClient = new QueryClient()

function useAutoLogout(onLogout: () => void, delay = 30 * 60 * 1000) {
  const timer = useRef<NodeJS.Timeout | null>(null)

  const resetTimer = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      onLogout()
    }, delay)
  }, [onLogout, delay])

  useEffect(() => {
    const events = ["mousemove", "keydown", "scroll", "click"]
    const handleActivity = () => resetTimer()

    events.forEach((event) => window.addEventListener(event, handleActivity))
    resetTimer()

    return () => {
      events.forEach((event) => window.removeEventListener(event, handleActivity))
      if (timer.current) clearTimeout(timer.current)
    }
  }, [resetTimer])
}

/**
 * Componente interno que usa useSidebar para obtener el estado
 */
const MainLayoutContent = ({ children }: { children: React.ReactNode }) => {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <div className="min-h-screen flex w-full">
      <AppSidebar />
      
      <div className="flex-1 flex flex-col transition-all duration-200 overflow-x-hidden">
        {/* Header fijo con la MISMA transición que el sidebar */}
        <header 
          className={`
          border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl 
          supports-[backdrop-filter]:bg-white/60 shadow-sm 
          fixed top-0 right-0 z-40 
          transition-transform-smooth duration-200 ease-in-out
          ${isCollapsed ? 'left-12' : 'left-64'}`}
          >
        
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
        
        {/* Contenido principal */}
        <main className="flex-1 p-6 overflow-y-auto bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 pt-16">
          {children}
        </main>
      </div>
    </div>
  )
}

/**
 * Layout principal de la app, solo visible si el usuario está autenticado
 */
const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const { user } = useUser()

  return (
    <SidebarProvider>
      <MainLayoutContent>{children}</MainLayoutContent>
    </SidebarProvider>
  )
}

const AppRoutes = () => {
  const { login } = useUser()

  return (
    <Routes>
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
              <ModuleRepository
                onClose={(): void => {
                  throw new Error("Function not implemented.")
                }}
              />
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
        path="/AuxiliarDeCuentasExtranjerasPage"
        element={
          <ProtectedRoute>
            <MainLayout>
              <AuxiliarDeCuentasExtranjerasPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/DiarioPorDocumentosPage"
        element={
          <ProtectedRoute>
            <MainLayout>
              <DiarioPorDocumentosPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/ComprobanteDiarioPage"
        element={
          <ProtectedRoute>
            <MainLayout>
              <ComprobanteDiarioPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/LibroDiarioPorSucursalPage"
        element={
          <ProtectedRoute>
            <MainLayout>
              <LibroDiarioPorSucursalPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/LibroMayorBalancesPorSucursalPage"
        element={
          <ProtectedRoute>
            <MainLayout>
              <LibroMayorBalancesPorSucursalPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/LibroMayorBalancesSimplificadoPage"
        element={
          <ProtectedRoute>
            <MainLayout>
              <LibroMayorBalancesSimplificadoPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/LibrosInventariosBalancesPage"
        element={
          <ProtectedRoute>
            <MainLayout>
              <LibrosInventariosBalancesPage />
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
        path="/BalanceComprobacionRangoFechasCentroTercerosPage"
        element={
          <ProtectedRoute>
            <MainLayout>
              <BalanceComprobacionRangoFechasCentroTercerosPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/BalanceGeneralPorSucursalPage"
        element={
          <ProtectedRoute>
            <MainLayout>
              <BalanceGeneralPorSucursalPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/EstadoResultadosPorSucursalPage"
        element={
          <ProtectedRoute>
            <MainLayout>
              <EstadoResultadosPorSucursalPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/EstadoResultadosPorCentroActividadPage"
        element={
          <ProtectedRoute>
            <MainLayout>
              <EstadoResultadosPorCentroActividadPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/EstadoResultadosPorSucursalCentroPage"
        element={
          <ProtectedRoute>
            <MainLayout>
              <EstadoResultadosPorSucursalCentroPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/ConsultaSaldoPage"
        element={
          <ProtectedRoute>
            <MainLayout>
              <ConsultaSaldoPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/ReporteSaldosPorCuentaPage"
        element={
          <ProtectedRoute>
            <MainLayout>
              <ReporteSaldosPorCuentaPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/ReporteSaldosPorNitPage"
        element={
          <ProtectedRoute>
            <MainLayout>
              <ReporteSaldosPorNitPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/ReporteSaldosPorCentroPage"
        element={
          <ProtectedRoute>
            <MainLayout>
              <ReporteSaldosPorCentroPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/ReporteSaldosPorCentroNitPage"
        element={
          <ProtectedRoute>
            <MainLayout>
              <ReporteSaldosPorCentroNitPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/ReporteDeSaldosDeBancosPage"
        element={
          <ProtectedRoute>
            <MainLayout>
              <ReporteDeSaldosDeBancosPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/ReporteEstadoDeMultiplesAnexosPage"
        element={
          <ProtectedRoute>
            <MainLayout>
              <ReporteEstadoDeMultiplesAnexosPage />
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
  )
}

const App = () => {
  const { user, logout } = useUser()
  const navigate = useNavigate()

  useAutoLogout(logout, 30 * 60 * 1000)

  // Usar useEffect después del <BrowserRouter> en el árbol para que useNavigate funcione
  useEffect(() => {
    if (!user) {
      navigate("/login")
    }
  }, [user, navigate])

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppRoutes />
      </TooltipProvider>
    </QueryClientProvider>
  )
}

export default App
