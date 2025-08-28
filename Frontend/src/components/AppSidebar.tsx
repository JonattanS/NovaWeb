
import { BarChart3, Users, FileText, Home, CreditCard, Database, Zap, Search } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
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
} from '@/components/ui/sidebar';
import { moduleService } from '@/services/moduleService';
import { useUser } from '@/contexts/UserContext';


const staticNavigation = [  
  {
    title: 'Consultas Manuales',
    url: '/query-manual',
    icon: Database,
  },
];

const inicioNavigation = [
  {
    title: 'Inicio',
    url: '/',
    icon: Home,
  },
];

const portafolioNavigation = [
  {
    title: 'Consulta de Documentos',
    url: '/ConsultaDocumentosPage',
    icon: Search,
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  // Obtener usuario y su compañía desde el contexto
  const { user } = useUser();
  const [dynamicFunctions, setDynamicFunctions] = useState(moduleService.getMainFunctions());

  useEffect(() => {
    const updateDynamicFunctions = () => {
      const newFunctions = moduleService.getMainFunctions();
      setDynamicFunctions(newFunctions);
    };

    updateDynamicFunctions();
    const interval = setInterval(updateDynamicFunctions, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Sidebar className="border-r border-slate-200 dark:border-slate-700 bg-[#002550] dark:bg-[#002550]" collapsible="icon">
      <SidebarContent>
        <div className="p-6">
          <div className={`${isCollapsed ? 'hidden' : 'block'}`}>
            <NavLink to="/"
              className="font-bold text-xl bg-[#F7722F] bg-clip-text text-transparent cursor-pointer no-underline hover:underline">
              {/* Si existe ciaraz mostrarlo, sino mostrar 'Nova' */}
              {user?.ciaraz || 'Nova'}
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
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 hover:translate-x-1'
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
          <SidebarGroupLabel className={`${isCollapsed ? 'hidden' : 'block'} text-[#F7722F] dark:text-[#F7722F] font-semibold`}>
            Portafolio
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {portafolioNavigation.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-slate-700 dark:text-slate-300 ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 hover:translate-x-1'
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
          <SidebarGroupLabel className={`${isCollapsed ? 'hidden' : 'block'} text-[#F7722F] dark:text-[#F7722F] font-semibold`}>
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
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 hover:translate-x-1'
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

        {dynamicFunctions.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className={`${isCollapsed ? 'hidden' : 'block'} text-[#F7722F] dark:text-[#F7722F] font-semibold`}>
              Funciones Personalizadas
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
                              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800 hover:translate-x-1'
                          }`
                        }
                      >
                        <Zap className="h-5 w-5 transition-transform group-hover:scale-110" />
                        {!isCollapsed && <span className="font-medium">{func.name}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
