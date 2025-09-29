"use client"
import {
  Home,
  Database,
  Zap,
  Search,
  ChevronDown,
  ChevronRight,
  Table,
  FileText,
  Calculator,
  BookOpen,
  Book,
  Receipt,
  BarChart3,
} from "lucide-react"
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { moduleService } from "@/services/moduleService"
import { useUser } from "@/contexts/UserContext"

// Definiciones de navegación que faltaban
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

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar()
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
      className={`border-r border-slate-200 dark:border-slate-700 bg-[#002550] dark:bg-[#002550] h-screen z-30 transition-all duration-200 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
      collapsible="icon"
    >
      <SidebarContent className="h-full overflow-y-auto py-4">
        {/* Header del Sidebar */}
        <div className={`px-4 mb-6 ${isCollapsed ? "px-2" : "px-6"}`}>
          {!isCollapsed ? (
            <div>
              <NavLink
                to="/"
                className="font-bold text-xl bg-[#F7722F] bg-clip-text text-transparent cursor-pointer no-underline hover:underline"
              >
                {user?.ciaraz || "Nova"}
              </NavLink>
            </div>
          ) : (
            <div className="flex justify-center">
              <span className="font-bold text-sm text-[#F7722F]">
                {(user?.ciaraz || "Nova").slice(0, 3).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Navegación de Inicio */}
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

        {/* Portafolio Section */}
        <SidebarGroup>
          <SidebarGroupLabel
            className={`${isCollapsed ? "hidden" : "block"} text-[#F7722F] dark:text-[#F7722F] font-semibold px-4`}
          >
            Portafolio
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              

              {/* Libros Oficiales */}
              {isCollapsed ? (
                <SidebarMenuItem>
                  <Popover>
                    <PopoverTrigger asChild>
                      <SidebarMenuButton className="w-full justify-center p-2 hover:bg-slate-800">
                        <BookOpen className="h-5 w-5 text-[#F7722F]" />
                      </SidebarMenuButton>
                    </PopoverTrigger>
                    <PopoverContent
                      side="right"
                      align="start"
                      className="w-64 p-3 bg-white border-slate-600 ml-2 z-50"
                    >
                      <div className="space-y-2">
                        <div className="text-[#F7722F] font-semibold text-sm mb-3">Libros Oficiales</div>
                        {librosOficialesNavigation.map((item) => (
                          <NavLink
                            key={item.title}
                            to={item.url}
                            className={({ isActive }) =>
                              `flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                                isActive ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-200"
                              }`
                            }
                            end
                          >
                            <item.icon className="h-4 w-4" />
                            <span className="font-medium text-sm">{item.title}</span>
                          </NavLink>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </SidebarMenuItem>
              ) : (
                <>
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
                        <BookOpen className="h-5 w-5" />
                        <span className="font-medium">Libros Oficiales</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  {isLibrosOficialesExpanded && (
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
                </>
              )}

              {/* Proceso Documentos */}
              {isCollapsed ? (
                <SidebarMenuItem>
                  <Popover>
                    <PopoverTrigger asChild>
                      <SidebarMenuButton className="w-full justify-center p-2 hover:bg-slate-800">
                        <FileText className="h-5 w-5 text-[#F7722F]" />
                      </SidebarMenuButton>
                    </PopoverTrigger>
                    <PopoverContent
                      side="right"
                      align="start"
                      className="w-64 p-3 bg-white border-slate-600 ml-2 z-50"
                    >
                      <div className="space-y-2">
                        <div className="text-[#F7722F] font-semibold text-sm mb-3">Proceso Documentos</div>
                        {procesoDocumentosNavigation.map((item) => (
                          <NavLink
                            key={item.title}
                            to={item.url}
                            className={({ isActive }) =>
                              `flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                                isActive ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-200"
                              }`
                            }
                            end
                          >
                            <item.icon className="h-4 w-4" />
                            <span className="font-medium text-sm">{item.title}</span>
                          </NavLink>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </SidebarMenuItem>
              ) : (
                <>
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
                        <FileText className="h-5 w-5" />
                        <span className="font-medium">Proceso Documentos</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  {isProcesoDocumentosExpanded && (
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
                </>
              )}

              {/* Estados Financieros */}
              {isCollapsed ? (
                <SidebarMenuItem>
                  <Popover>
                    <PopoverTrigger asChild>
                      <SidebarMenuButton className="w-full justify-center p-2 hover:bg-slate-800">
                        <BarChart3 className="h-5 w-5 text-[#F7722F]" />
                      </SidebarMenuButton>
                    </PopoverTrigger>
                    <PopoverContent
                      side="right"
                      align="start"
                      className="w-64 p-3 bg-white border-slate-600 ml-2 z-50"
                    >
                      <div className="space-y-2">
                        <div className="text-[#F7722F] font-semibold text-sm mb-3">Estados Financieros</div>
                        {estadosFinancierosNavigation.map((item) => (
                          <NavLink
                            key={item.title}
                            to={item.url}
                            className={({ isActive }) =>
                              `flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                                isActive ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-200"
                              }`
                            }
                            end
                          >
                            <item.icon className="h-4 w-4" />
                            <span className="font-medium text-sm">{item.title}</span>
                          </NavLink>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </SidebarMenuItem>
              ) : (
                <>
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
                        <BarChart3 className="h-5 w-5" />
                        <span className="font-medium">Estados Financieros</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  {isEstadosFinancierosExpanded && (
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
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Herramientas de Desarrollo */}
        <SidebarGroup>
          <SidebarGroupLabel
            className={`${isCollapsed ? "hidden" : "block"} text-[#F7722F] dark:text-[#F7722F] font-semibold px-4`}
          >
            Herramientas de Desarrollo
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {staticNavigation.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {isCollapsed ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <SidebarMenuButton className="w-full justify-center p-2 hover:bg-slate-800">
                          <item.icon className="h-5 w-5 text-slate-300" />
                        </SidebarMenuButton>
                      </PopoverTrigger>
                      <PopoverContent
                        side="right"
                        align="start"
                        className="w-48 p-2 bg-[#002550] border-slate-600 ml-2 z-50"
                      >
                        <NavLink
                          to={item.url}
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group ${
                              isActive ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800"
                            }`
                          }
                          end
                        >
                          <item.icon className="h-4 w-4" />
                          <span className="font-medium text-sm">{item.title}</span>
                        </NavLink>
                      </PopoverContent>
                    </Popover>
                  ) : (
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
                        <span className="font-medium">{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
