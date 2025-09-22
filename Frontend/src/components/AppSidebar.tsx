import { Home, Database, Zap, Search, ChevronDown, ChevronRight, Table, FileText, Calculator, BookOpen, Book, Receipt, BarChart3 } from "lucide-react"
import { NavLink } from "react-router-dom"
import { useState, useEffect } from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { moduleService } from "@/services/moduleService"
import { useUser } from "@/contexts/UserContext"

const staticNavigation = [
  {
    title: "Consultas Manuales",
    url: "/query-manual",
    icon: Database,
  },
]

const inicioNavigation = [
  {
    title: "Inicio",
    url: "/",
    icon: Home,
  },
]

const librosOficialesNavigation = [
  {
    title: "Comprobante Diario",
    url: "/ComprobanteDiarioPage",
    icon: Receipt,
  },
  {
    title: "Libro Diario por Sucursal",
    url: "/LibroDiarioPorSucursalPage",
    icon: Book,
  },
  {
    title: "Libro Mayor y Balances por Sucursal",
    url: "/LibroMayorBalancesPorSucursalPage",
    icon: BookOpen,
  },
  {
    title: "Libro Mayor y Balances Simplificado",
    url: "/LibroMayorBalancesSimplificadoPage",
    icon: FileText,
  },
  {
    title: "Libros de Inventarios y Balances",
    url: "/LibrosInventariosBalancesPage",
    icon: Table,
  },
]

const procesoDocumentosNavigation = [
  {
    title: "Consulta de Documentos",
    url: "/ConsultaDocumentosPage",
    icon: Search,
  },
  {
    title: "Auxiliar de Cuentas",
    url: "/AuxiliarDeCuentasPage",
    icon: Table,
  },
  {
    title: "Auxiliar Cuentas Extranjeras",
    url: "/AuxiliarDeCuentasExtranjerasPage",
    icon: Calculator,
  },
  {
    title: "Diario por Documentos",
    url: "/DiarioPorDocumentosPage",
    icon: BookOpen,
  },
]

const estadosFinancierosNavigation = [
  {
    title: "Consulta Balance de Comprobación",
    url: "/ConsultaBalanceComprobacionPage",
    icon: BarChart3,
  },
  {
    title: "Balance Comprobación Rango Fechas Centro y Terceros",
    url: "/BalanceComprobacionRangoFechasCentroTercerosPage",
    icon: FileText,
  },
  {
    title: "Balance General por Sucursal",
    url: "/BalanceGeneralPorSucursalPage",
    icon: Calculator,
  },
]

const testPortfolioNavigation = [
  {
    title: "Consulta de Documentos",
    url: "/ConsultaDocumentosPage",
    icon: Search,
  },
  {
    title: "Auxiliar de Cuentas",
    url: "/AuxiliarDeCuentasPage",
    icon: Table,
  },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"
  // Obtener usuario y su compañía desde el contexto
  const { user } = useUser()
  const [dynamicFunctions, setDynamicFunctions] = useState(moduleService.getMainFunctions())
  const [isTestPortfolioExpanded, setIsTestPortfolioExpanded] = useState(false)
  const [isProcesoDocumentosExpanded, setIsProcesoDocumentosExpanded] = useState(false)
  const [isLibrosOficialesExpanded, setIsLibrosOficialesExpanded] = useState(false)
  const [isEstadosFinancierosExpanded, setIsEstadosFinancierosExpanded] = useState(false)

  useEffect(() => {
    const updateDynamicFunctions = () => {
      const newFunctions = moduleService.getMainFunctions()
      setDynamicFunctions(newFunctions)
    }

    updateDynamicFunctions()
    const interval = setInterval(updateDynamicFunctions, 2000)

    return () => clearInterval(interval)
  }, [])

  return (
    <Sidebar
      className="border-r border-slate-200 dark:border-slate-700 bg-[#002550] dark:bg-[#002550]"
      collapsible="icon"
    >
      <SidebarContent>
        <div className="p-6">
          <div className={`${isCollapsed ? "hidden" : "block"}`}>
            <NavLink
              to="/"
              className="font-bold text-xl bg-[#F7722F] bg-clip-text text-transparent cursor-pointer no-underline hover:underline"
            >
              {/* Si existe ciaraz mostrarlo, sino mostrar 'Nova' */}
              {user?.ciaraz || "Nova"}
            </NavLink>
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {inicioNavigation.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-slate-700 dark:text-slate-300 ${
                          isActive
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                            : "hover:bg-slate-100 dark:hover:bg-slate-800 hover:translate-x-1"
                        }`
                      }
                      end
                    >
                      <item.icon className="h-5 w-5 transition-transform group-hover:scale-110" />
                      {!isCollapsed && <span className="font-medium">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel
            className={`${isCollapsed ? "hidden" : "block"} text-[#F7722F] dark:text-[#F7722F] font-semibold`}
          >
            Portafolio
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {dynamicFunctions.map((func) => (
                <SidebarMenuItem key={func.id}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={`/dynamic-function/${func.id}`}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-slate-700 dark:text-slate-300 ${
                          isActive
                            ? "bg-purple-600 text-white shadow-lg shadow-purple-600/25"
                            : "hover:bg-slate-100 dark:hover:bg-slate-800 hover:translate-x-1"
                        }`
                      }
                    >
                      <Zap className="h-5 w-5 transition-transform group-hover:scale-110" />
                      {!isCollapsed && <span className="font-medium">{func.name}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {!isCollapsed && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <button
                      onClick={() => setIsLibrosOficialesExpanded(!isLibrosOficialesExpanded)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-[#F7722F] dark:text-[#F7722F] hover:bg-blue-500 dark:hover:bg-[#F7722F] hover:translate-x-1 w-full text-left"
                    >
                      {isLibrosOficialesExpanded ? (
                        <ChevronDown className="h-5 w-5 transition-transform group-hover:scale-110" />
                      ) : (
                        <ChevronRight className="h-5 w-5 transition-transform group-hover:scale-110" />
                      )}
                      <span className="font-medium">Libros Oficiales</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {isLibrosOficialesExpanded && !isCollapsed && (
                <>
                  {librosOficialesNavigation.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 ml-6 rounded-xl transition-all duration-200 group text-slate-700 dark:text-slate-300 ${
                              isActive
                                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                                : "hover:bg-slate-100 dark:hover:bg-slate-800 hover:translate-x-1"
                            }`
                          }
                          end
                        >
                          <item.icon className="h-4 w-4 transition-transform group-hover:scale-110" />
                          <span className="font-medium text-sm">{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </>
              )}

              {!isCollapsed && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <button
                      onClick={() => setIsProcesoDocumentosExpanded(!isProcesoDocumentosExpanded)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-[#F7722F] dark:text-[#F7722F] hover:bg-blue-500 dark:hover:bg-[#F7722F] hover:translate-x-1 w-full text-left"
                    >
                      {isProcesoDocumentosExpanded ? (
                        <ChevronDown className="h-5 w-5 transition-transform group-hover:scale-110" />
                      ) : (
                        <ChevronRight className="h-5 w-5 transition-transform group-hover:scale-110" />
                      )}
                      <span className="font-medium">Proceso Documentos</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {isProcesoDocumentosExpanded && !isCollapsed && (
                <>
                  {procesoDocumentosNavigation.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 ml-6 rounded-xl transition-all duration-200 group text-slate-700 dark:text-slate-300 ${
                              isActive
                                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                                : "hover:bg-slate-100 dark:hover:bg-slate-800 hover:translate-x-1"
                            }`
                          }
                          end
                        >
                          <item.icon className="h-4 w-4 transition-transform group-hover:scale-110" />
                          <span className="font-medium text-sm">{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </>
              )}

              {!isCollapsed && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <button
                      onClick={() => setIsEstadosFinancierosExpanded(!isEstadosFinancierosExpanded)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-[#F7722F] dark:text-[#F7722F] hover:bg-blue-500 dark:hover:bg-[#F7722F] hover:translate-x-1 w-full text-left"
                    >
                      {isEstadosFinancierosExpanded ? (
                        <ChevronDown className="h-5 w-5 transition-transform group-hover:scale-110" />
                      ) : (
                        <ChevronRight className="h-5 w-5 transition-transform group-hover:scale-110" />
                      )}
                      <span className="font-medium">Estados Financieros</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {isEstadosFinancierosExpanded && !isCollapsed && (
                <>
                  {estadosFinancierosNavigation.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 ml-6 rounded-xl transition-all duration-200 group text-slate-700 dark:text-slate-300 ${
                              isActive
                                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                                : "hover:bg-slate-100 dark:hover:bg-slate-800 hover:translate-x-1"
                            }`
                          }
                          end
                        >
                          <item.icon className="h-4 w-4 transition-transform group-hover:scale-110" />
                          <span className="font-medium text-sm">{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </>
              )}

              {/* {!isCollapsed && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <button
                      onClick={() => setIsTestPortfolioExpanded(!isTestPortfolioExpanded)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-[#F7722F] dark:text-[#F7722F] hover:bg-blue-500 dark:hover:bg-[#F7722F] hover:translate-x-1 w-full text-left"
                    >
                      {isTestPortfolioExpanded ? (
                        <ChevronDown className="h-5 w-5 transition-transform group-hover:scale-110" />
                      ) : (
                        <ChevronRight className="h-5 w-5 transition-transform group-hover:scale-110" />
                      )}
                      <span className="font-medium">Portafolio de Pruebas</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {isTestPortfolioExpanded && !isCollapsed && (
                <>
                  {testPortfolioNavigation.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 ml-6 rounded-xl transition-all duration-200 group text-slate-700 dark:text-slate-300 ${
                              isActive
                                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                                : "hover:bg-slate-100 dark:hover:bg-slate-800 hover:translate-x-1"
                            }`
                          }
                          end
                        >
                          <item.icon className="h-4 w-4 transition-transform group-hover:scale-110" />
                          <span className="font-medium text-sm">{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </>
              )} */}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel
            className={`${isCollapsed ? "hidden" : "block"} text-[#F7722F] dark:text-[#F7722F] font-semibold`}
          >
            Herramientas de Desarrollo
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {staticNavigation.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-slate-700 dark:text-slate-300 ${
                          isActive
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                            : "hover:bg-slate-100 dark:hover:bg-slate-800 hover:translate-x-1"
                        }`
                      }
                      end
                    >
                      <item.icon className="h-5 w-5 transition-transform group-hover:scale-110" />
                      {!isCollapsed && <span className="font-medium">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}