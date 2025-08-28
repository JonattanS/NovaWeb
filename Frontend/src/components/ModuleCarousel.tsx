
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  BarChart3, 
  Users, 
  FileText, 
  Play,
  TrendingUp,
  Database
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { moduleService, type PersistentModule } from '@/services/moduleService';

interface ModuleCarouselProps {
  modules: PersistentModule[];
}

export const ModuleCarousel = ({ modules }: ModuleCarouselProps) => {
  const navigate = useNavigate();

  const handleModuleClick = (module: PersistentModule) => {
    moduleService.updateModuleLastUsed(module.id);
    
    if (module.isMainFunction) {
      navigate(`/dynamic-function/${module.id}`);
    } else {
      navigate('/query-manual', { state: { loadModule: module } });
    }
  };

  const handleQuickAccess = (module: PersistentModule, section: string) => {
    moduleService.updateModuleLastUsed(module.id);
    
    if (module.isMainFunction) {
      navigate(`/dynamic-function/${module.id}?section=${section}`);
    }
  };

  const getQuickAccessSections = (module: PersistentModule) => {
    const sections = [];
    
    // Si tiene dashboard configurado
    if (module.dashboardConfig && 
        (module.dashboardConfig.charts?.length > 0 || module.dashboardConfig.kpis?.length > 0)) {
      sections.push({
        key: 'dashboard',
        label: 'Dashboard',
        icon: BarChart3,
        color: 'bg-blue-500'
      });
    }
    
    // Si es función principal, agregar sección de consulta
    if (module.isMainFunction) {
      sections.push({
        key: 'consulta',
        label: 'Consulta',
        icon: Database,
        color: 'bg-emerald-500'
      });
    }
    
    return sections;
  };

  if (modules.length === 0) {
    return (
      <div className="text-center py-12">
        <Zap className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-400">
          No hay funciones principales en uso
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
          Crea y promueve módulos para que aparezcan aquí
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {modules.map((mod) => {
        const quickSections = getQuickAccessSections(mod);
        
        return (
          <Card 
            key={mod.id}
            className="hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-0 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800"
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg">
                    <Zap className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{mod.name}</CardTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="default">Función Principal</Badge>
                      <Badge variant="outline">{mod.usageCount || 0} usos</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <CardDescription className="text-sm">
                {mod.description || 'Módulo de consultas personalizadas para análisis financiero'}
              </CardDescription>
              
              {/* Accesos rápidos */}
              {quickSections.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                    Accesos Rápidos
                  </h4>
                  <div className="grid gap-2">
                    {quickSections.map((section) => (
                      <Button
                        key={section.key}
                        variant="outline"
                        size="sm"
                        className="justify-start h-8"
                        onClick={() => handleQuickAccess(mod, section.key)}
                      >
                        <section.icon className="h-3 w-3 mr-2" />
                        {section.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Información adicional */}
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-500">
                  <span>Último uso: {new Date(mod.lastUsed).toLocaleDateString()}</span>
                  {mod.dashboardConfig && (
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="h-3 w-3" />
                      <span>Dashboard</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Botón principal */}
              <Button 
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg transition-all duration-200"
                onClick={() => handleModuleClick(mod)}
              >
                <Play className="h-4 w-4 mr-2" />
                Abrir Función
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
