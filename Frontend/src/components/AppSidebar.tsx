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

  const navigateToModuleRepository = (porcod: number, portfolioName: string) => {
    navigate("/portafolios", {
      state: {
        selectedPortfolio: {
          porcod,
          name: portfolioName,
          id: porcod.toString(),
        },
      },
    })
  }

  /**
   * Nueva función: Navega a ModuleViewer con el módulo dinámico
   * Este es el manejador clave para módulos del backend
   */
  const handleDynamicModuleClick = (module: NovModule) => {
    // Crear un objeto compatible con PersistentModule para ModuleViewer
    const dynamicModuleData = {
      id: module.id.toString(),
      name: module.mennom,
      description: `Módulo del sistema: ${module.mencod}`,
      query: "", // Los módulos del sistema no tienen query directa
      filters: {},
      folderId: "",
      createdAt: new Date().toISOString(),
      isDynamicModule: true, // Bandera para identificar módulo dinámico
      systemModuleData: module, // Guardar datos originales del sistema
    }

    // Navegar a ModuleViewer con los datos del módulo
    navigate("/module-viewer", {
      state: {
        loadModule: dynamicModuleData,
        isDynamicModule: true,
        systemModule: module,
      },
    })
  }

  return (
    <Sidebar
      className={`border-r border-slate-200 dark:border-slate-700 bg-[#41B9E8] dark:bg-[#41B9E8] h-screen z-30 transition-transform-smooth duration-200 ease-in-out${
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

        <SidebarGroup>
          <SidebarGroupLabel
            className={`${isCollapsed ? "hidden" : "block"} text-[#F7722F] dark:text-[#F7722F] font-semibold px-4`}
          >
            Portafolio
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {loading ? (
                <SidebarMenuItem>
                  <div className="flex items-center gap-3 px-4 py-3 text-slate-300">
                    <Settings className="w-5 h-5 animate-spin" />
                    {!isCollapsed && <span>Cargando portafolios...</span>}
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
                            className="w-64 p-3 bg-white border-slate-600 ml-2 z-50"
                          >
                            <div className="space-y-2">
                              <div className="text-[#F7722F] font-semibold text-sm mb-3">{portfolio.name}</div>
                              {portfolio.modules.map((module) => (
                                <button
                                  key={module.id}
                                  onClick={() => handleDynamicModuleClick(module)}
                                  className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-slate-600 hover:bg-slate-200 w-full text-left"
                                >
                                  <Settings className="w-4 h-4" />
                                  <span className="font-medium text-sm">{module.mennom}</span>
                                </button>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      ) : (
                        <>
                          <SidebarMenuButton asChild>
                            <button
                              onClick={() => togglePortfolio(porcod)}
                              className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-[#F7722F] dark:text-[#F7722F] hover:bg-blue-500 dark:hover:bg-[#F7722F] hover:translate-x-1 w-full text-left"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-5 w-5 transition-transform group-hover:scale-110" />
                              ) : (
                                <ChevronRight className="h-5 w-5 transition-transform group-hover:scale-110" />
                              )}
                              <Folder className="h-5 w-5" />
                              <span className="font-medium">{portfolio.name}</span>
                            </button>
                          </SidebarMenuButton>

                          {isExpanded && (
                            <>
                              {portfolio.modules.map((module) => (
                                <SidebarMenuItem key={module.id}>
                                  <SidebarMenuButton asChild>
                                    <button
                                      onClick={() => handleDynamicModuleClick(module)}
                                      className="flex items-center gap-3 px-4 py-3 ml-6 rounded-xl transition-all duration-200 group text-slate-200 dark:text-slate-300 hover:bg-slate-700 dark:hover:bg-slate-800 hover:translate-x-1 text-left w-full"
                                    >
                                      <Settings className="h-4 w-4 transition-transform group-hover:scale-110" />
                                      <span className="font-medium text-sm">{module.mennom}</span>
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

        {/* Funciones Dinámicas */}
        {dynamicFunctions.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel
              className={`${isCollapsed ? "hidden" : "block"} text-[#F7722F] dark:text-[#F7722F] font-semibold px-4`}
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
                            <Zap className="h-4 w-4" />
                            <span className="font-medium text-sm">{func.name}</span>
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
                          <Zap className="h-5 w-5 transition-transform group-hover:scale-110" />
                          <span className="font-medium">{func.name}</span>
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
