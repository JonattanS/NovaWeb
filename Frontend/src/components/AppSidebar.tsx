"use client"

import { Home, Database, Zap, ChevronDown, ChevronRight, Folder, Settings } from "lucide-react"
import { NavLink, useNavigate } from "react-router-dom"
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
import { getModulesByPortfolio, type NovModule } from "@/services/novModulesApi"

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

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar()
  const isCollapsed = state === "collapsed"
  const navigate = useNavigate()

  const { user } = useUser()
  const portafoliosPermitidos: number[] = user?.portafolios || []

  const [dynamicFunctions, setDynamicFunctions] = useState(moduleService.getMainFunctions())

  const [portfolios, setPortfolios] = useState<{ [key: number]: { name: string; modules: NovModule[] } }>({})
  const [expandedPortfolios, setExpandedPortfolios] = useState<{ [key: number]: boolean }>({})
  const [loading, setLoading] = useState(true)

  // Calcular ancho dinámico basado en portafolios expandidos
  const hasExpandedPortfolios = Object.values(expandedPortfolios).some((expanded) => expanded)
  const dynamicWidth = isCollapsed ? "w-16" : hasExpandedPortfolios ? "w-96" : "w-64"

  useEffect(() => {
    const updateDynamicFunctions = () => {
      const newFunctions = moduleService.getMainFunctions()
      setDynamicFunctions(newFunctions)
    }

    updateDynamicFunctions()
    const interval = setInterval(updateDynamicFunctions, 2000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const loadPortfoliosAndModules = async () => {
      if (!user?.token) return

      try {
        setLoading(true)

        const allFolders = moduleService.getAllFolders()
        const allowedFolders = allFolders.filter((f) => portafoliosPermitidos.includes(f.porcod ?? -1))

        const portfolioMap: { [key: number]: { name: string; modules: NovModule[] } } = {}

        // Load modules for each portfolio
        for (const folder of allowedFolders) {
          if (folder.porcod) {
            try {
              const modules = await getModulesByPortfolio(folder.porcod, user.token)
              // Only include parent modules (menter = false) for the sidebar
              const parentModules = modules.filter((m: NovModule) => !m.menter)
              portfolioMap[folder.porcod] = {
                name: folder.name,
                modules: parentModules,
              }
            } catch (error) {
              console.error(`Error loading modules for portfolio ${folder.porcod}:`, error)
            }
          }
        }

        setPortfolios(portfolioMap)
      } catch (error) {
        console.error("Error loading portfolios:", error)
      } finally {
        setLoading(false)
      }
    }

    loadPortfoliosAndModules()
  }, [user, portafoliosPermitidos])

  const togglePortfolio = (porcod: number) => {
    setExpandedPortfolios((prev) => ({
      ...prev,
      [porcod]: !prev[porcod],
    }))
  }

  /**
   * Navega al portafolio específico mostrando los módulos del sistema
   * y expandiendo el módulo clickeado
   */
  const handleDynamicModuleClick = (module: NovModule, porcod: number, portfolioName: string) => {
    // Navegar a /portafolios con el portafolio y módulo seleccionados
    navigate("/portafolios", {
      state: {
        selectedPortfolio: {
          porcod,
          name: portfolioName,
          id: porcod.toString(),
        },
        showSystemModules: true,  // Mostrar tab de módulos del sistema
        selectedModuleCode: module.mencod,  // Expandir este módulo
      },
    })
  }

  /**
   * Navega al portafolio completo sin seleccionar módulo
   */
  const handlePortfolioClick = (porcod: number, portfolioName: string) => {
    navigate("/portafolios", {
      state: {
        selectedPortfolio: {
          porcod,
          name: portfolioName,
          id: porcod.toString(),
        },
        showSystemModules: false, // Mostrar módulos de usuario por defecto
      },
    })
  }

  return (
    <Sidebar
      className={`border-r border-slate-200 dark:border-slate-700 bg-[#41B9E8] dark:bg-[#41B9E8] h-screen z-30 transition-all duration-300 ease-in-out ${
        dynamicWidth
      }`}
      collapsible="icon"
      style={{
        width: isCollapsed ? '64px' : hasExpandedPortfolios ? '384px' : '256px',
      }}
    >
      <SidebarContent className="h-full overflow-y-auto overflow-x-hidden py-4">
        {/* Header del Sidebar */}
        <div className={`px-4 mb-6 ${isCollapsed ? "px-2" : "px-6"}`}>
          {!isCollapsed ? (
            <div>
              <NavLink
                to="/"
                className="font-bold text-xl bg-[#F7722F] bg-clip-text text-transparent cursor-pointer no-underline hover:underline truncate block"
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
                      <item.icon className="h-5 w-5 transition-transform group-hover:scale-110 flex-shrink-0" />
                      {!isCollapsed && <span className="font-medium truncate">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel
            className={`${isCollapsed ? "hidden" : "block"} text-[#F7722F] dark:text-[#F7722F] font-semibold px-4 truncate`}
          >
            Portafolio
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {loading ? (
                <SidebarMenuItem>
                  <div className="flex items-center gap-3 px-4 py-3 text-slate-300">
                    <Settings className="w-5 h-5 animate-spin flex-shrink-0" />
                    {!isCollapsed && <span className="truncate">Cargando portafolios...</span>}
                  </div>
                </SidebarMenuItem>
              ) : (
                Object.entries(portfolios).map(([porcodStr, portfolio]) => {
                  const porcod = Number.parseInt(porcodStr)
                  const isExpanded = expandedPortfolios[porcod]

                  return (
                    <SidebarMenuItem key={porcod}>
                      {isCollapsed ? (
                        <Popover>
                          <PopoverTrigger asChild>
                            <SidebarMenuButton className="w-full justify-center p-2 hover:bg-slate-800">
                              <Folder className="h-5 w-5 text-[#F7722F]" />
                            </SidebarMenuButton>
                          </PopoverTrigger>
                          <PopoverContent
                            side="right"
                            align="start"
                            className="w-64 p-3 bg-white border-slate-600 ml-2 z-50 max-h-96 overflow-y-auto"
                          >
                            <div className="space-y-2">
                              <button
                                onClick={() => handlePortfolioClick(porcod, portfolio.name)}
                                className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-[#F7722F] hover:bg-blue-100 w-full text-left font-semibold mb-3"
                              >
                                <Folder className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">{portfolio.name}</span>
                              </button>
                              <div className="border-t pt-2">
                                <div className="text-xs text-slate-600 font-semibold mb-2 px-1">Módulos:</div>
                                {portfolio.modules.map((module) => (
                                  <button
                                    key={module.id}
                                    onClick={() => handleDynamicModuleClick(module, porcod, portfolio.name)}
                                    className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-slate-600 hover:bg-slate-200 w-full text-left text-sm truncate"
                                  >
                                    <Settings className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate">{module.mennom}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 w-full px-4 py-3">
                            <SidebarMenuButton
                              asChild
                              className="flex-1 min-w-0"
                            >
                              <button
                                onClick={() => handlePortfolioClick(porcod, portfolio.name)}
                                className="flex items-center gap-3 px-0 py-0 rounded-xl transition-all duration-200 group text-[#F7722F] dark:text-[#F7722F] hover:bg-blue-500 dark:hover:bg-[#F7722F] hover:translate-x-1 w-full text-left min-w-0"
                              >
                                <Folder className="h-5 w-5 flex-shrink-0" />
                                <span className="font-medium flex-1 truncate">{portfolio.name}</span>
                              </button>
                            </SidebarMenuButton>
                            <button
                              onClick={() => togglePortfolio(porcod)}
                              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors flex-shrink-0"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                              ) : (
                                <ChevronRight className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                              )}
                            </button>
                          </div>

                          {isExpanded && (
                            <>
                              {portfolio.modules.map((module) => (
                                <SidebarMenuItem key={module.id}>
                                  <SidebarMenuButton asChild>
                                    <button
                                      onClick={() => handleDynamicModuleClick(module, porcod, portfolio.name)}
                                      className="flex items-center gap-3 px-4 py-3 ml-6 rounded-xl transition-all duration-200 group text-slate-200 dark:text-slate-300 hover:bg-slate-700 dark:hover:bg-slate-800 hover:translate-x-1 text-left w-full min-w-0"
                                    >
                                      <Settings className="h-4 w-4 transition-transform group-hover:scale-110 flex-shrink-0" />
                                      <span className="font-medium text-sm truncate">{module.mennom}</span>
                                    </button>
                                  </SidebarMenuButton>
                                </SidebarMenuItem>
                              ))}
                            </>
                          )}
                        </>
                      )}
                    </SidebarMenuItem>
                  )
                })
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Herramientas de Desarrollo */}
        <SidebarGroup>
          <SidebarGroupLabel
            className={`${isCollapsed ? "hidden" : "block"} text-[#F7722F] dark:text-[#F7722F] font-semibold px-4 truncate`}
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
                          <item.icon className="h-4 w-4 flex-shrink-0" />
                          <span className="font-medium text-sm truncate">{item.title}</span>
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
                        <item.icon className="h-5 w-5 transition-transform group-hover:scale-110 flex-shrink-0" />
                        <span className="font-medium truncate">{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Funciones Dinámicas */}
        {dynamicFunctions.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel
              className={`${isCollapsed ? "hidden" : "block"} text-[#F7722F] dark:text-[#F7722F] font-semibold px-4 truncate`}
            >
              Funciones Principales
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {dynamicFunctions.map((func) => (
                  <SidebarMenuItem key={func.id}>
                    {isCollapsed ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <SidebarMenuButton className="w-full justify-center p-2 hover:bg-slate-800">
                            <Zap className="h-5 w-5 text-slate-300" />
                          </SidebarMenuButton>
                        </PopoverTrigger>
                        <PopoverContent
                          side="right"
                          align="start"
                          className="w-48 p-2 bg-[#002550] border-slate-600 ml-2 z-50"
                        >
                          <NavLink
                            to={`/dynamic-function/${func.id}`}
                            className={({ isActive }) =>
                              `flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group ${
                                isActive ? "bg-purple-600 text-white" : "text-slate-300 hover:bg-slate-800"
                              }`
                            }
                          >
                            <Zap className="h-4 w-4 flex-shrink-0" />
                            <span className="font-medium text-sm truncate">{func.name}</span>
                          </NavLink>
                        </PopoverContent>
                      </Popover>
                    ) : (
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
                          <Zap className="h-5 w-5 transition-transform group-hover:scale-110 flex-shrink-0" />
                          <span className="font-medium truncate">{func.name}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  )
}
