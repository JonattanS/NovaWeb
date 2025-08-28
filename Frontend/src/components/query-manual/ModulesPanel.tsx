
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FolderOpen, Play, Trash2, Zap, Shield } from 'lucide-react';
import { moduleService, type PersistentModule } from '@/services/moduleService';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface ModulesPanelProps {
  savedModules: PersistentModule[];
  onLoadModule: (module: PersistentModule) => void;
  onDeleteModule: (moduleId: string) => void;
  onModulesUpdate: () => void;
}

export const ModulesPanel = ({ savedModules, onLoadModule, onDeleteModule, onModulesUpdate }: ModulesPanelProps) => {
  const { canCreateMainFunctions, canDeleteMainFunctions } = useUser();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handlePromoteToMainFunction = async (module: PersistentModule) => {
    if (!canCreateMainFunctions()) {
      toast({
        title: "Permisos insuficientes",
        description: "Solo los administradores pueden crear funciones principales",
        variant: "destructive",
      });
      return;
    }

    console.log('Promoviendo módulo a función principal:', module.name);
    console.log('Filtros dinámicos originales:', module.dynamicFilters);
    
    try {
      // Crear un nuevo módulo como función principal preservando todos los datos
      const newMainFunction = moduleService.saveModule({
        name: module.name,
        description: module.description,
        query: module.query,
        filters: module.filters,
        folderId: 'default-folder',
        isMainFunction: true,
        dashboardConfig: module.dashboardConfig || { charts: [], kpis: [] },
        dynamicFilters: module.dynamicFilters || [] // Preservar filtros exactos
      });

      console.log('Nueva función principal creada:', newMainFunction);
      console.log('Filtros dinámicos preservados:', newMainFunction.dynamicFilters);

      // Eliminar el módulo original
      moduleService.deleteModule(module.id);
      
      // Actualizar la lista inmediatamente
      onModulesUpdate();
      
      toast({
        title: "Función principal creada",
        description: `${module.name} ahora es una función principal con los filtros configurados preservados`,
      });
      
      // Pequeño delay para asegurar que el módulo se actualice
      setTimeout(() => {
        navigate(`/dynamic-function/${newMainFunction.id}`);
      }, 500);
      
    } catch (error) {
      console.error('Error promoting module:', error);
      toast({
        title: "Error",
        description: "Error al promover el módulo a función principal",
        variant: "destructive",
      });
    }
  };

  const handleDeleteModule = (moduleId: string) => {
    const module = savedModules.find(m => m.id === moduleId);
    if (module?.isMainFunction && !canDeleteMainFunctions()) {
      toast({
        title: "Permisos insuficientes",
        description: "Solo los administradores pueden eliminar funciones principales",
        variant: "destructive",
      });
      return;
    }
    
    onDeleteModule(moduleId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FolderOpen className="h-5 w-5" />
          <span>Módulos Guardados</span>
        </CardTitle>
        <CardDescription>
          Gestiona tus consultas guardadas como módulos reutilizables
        </CardDescription>
      </CardHeader>
      <CardContent>
        {savedModules.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            No tienes módulos guardados aún. Crea tu primer módulo desde el editor SQL.
          </div>
        ) : (
          <div className="space-y-4">
            {savedModules.map((module) => (
              <div key={module.id} className="border rounded-lg p-4 space-y-2 bg-white dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold">{module.name}</h3>
                      {module.isMainFunction && (
                        <span className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 text-xs px-2 py-1 rounded-full flex items-center space-x-1">
                          <Zap className="h-3 w-3" />
                          <span>Función Principal</span>
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{module.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-500">
                      <span>Creado: {new Date(module.createdAt).toLocaleDateString()}</span>
                      <span>Último uso: {new Date(module.lastUsed || module.createdAt).toLocaleDateString()}</span>
                      {module.dynamicFilters && module.dynamicFilters.length > 0 && (
                        <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded-full">
                          {module.dynamicFilters.filter(f => f.enabled).length} filtros
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      onClick={() => onLoadModule(module)}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Cargar
                    </Button>
                    
                    {!module.isMainFunction && canCreateMainFunctions() && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handlePromoteToMainFunction(module)}
                        className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 dark:bg-purple-950 dark:border-purple-800 dark:text-purple-300"
                      >
                        <Shield className="h-4 w-4 mr-1" />
                        Grabar como Función Principal
                      </Button>
                    )}
                    
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={() => handleDeleteModule(module.id)}
                      disabled={module.isMainFunction && !canDeleteMainFunctions()}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded text-xs font-mono">
                  {module.query.substring(0, 100)}...
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
