import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Code, Database, FolderOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ModuleCarousel } from '@/components/ModuleCarousel';
import { ModuleRepository } from '@/components/ModuleRepository';
import { databaseService } from '@/services/database';
import { moduleService, type PersistentModule } from '@/services/moduleService';
import { useUser } from '@/contexts/UserContext';

const HomePage = () => {
  const navigate = useNavigate();
  const [isDbConfigured, setIsDbConfigured] = useState(false);
  const [mostUsedModules, setMostUsedModules] = useState<PersistentModule[]>([]);
  const [personalModules, setPersonalModules] = useState<PersistentModule[]>([]);
  const [showRepository, setShowRepository] = useState(false);


  const { user } = useUser();
  const userPortafolios = user?.portafolios || [];



  const handlePersonalModuleClick = (module: PersistentModule) => {
    navigate('/query-manual', { state: { loadModule: module } });
  };

  if (showRepository) {
    return <ModuleRepository onClose={() => setShowRepository(false)} />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Sistema Financiero Nova
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 mt-2">
          Accede rápidamente a tus funciones principales y módulos personalizados
        </p>
        {/* Mostrar mensaje de error si ocurre */}
        
      </div>

      {/* Funciones Principales Más Usadas */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
            Funciones Principales Más Usadas
          </h2>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/portafolios')}
          >
            <FolderOpen className="h-4 w-4 mr-2" />
            Ver Todas
          </Button>
        </div>        
        <ModuleCarousel modules={mostUsedModules} />
        <div className="grid gap-6 md:grid-cols-2">
          <Card 
            className="cursor-pointer transition-all duration-200 hover:shadow-xl hover:scale-105 hover:-translate-y-1 border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm"
            onClick={() => navigate('/ConsultaDocumentosPage')} // Esto redirige directamente
          >
            
            <CardContent>
              <CardDescription className="text-sm mb-4 text-slate-600 dark:text-slate-400">
                Consulta avanzada de documentos contables con filtros personalizados.
              </CardDescription>
              
              <div className="mt-6">
                <Button 
                  className="w-full shadow-lg transition-all duration-200" 
                  variant="default"
                >
                  Ir a Consulta de Documentos
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Herramientas de Desarrollo */}
      <div>
        <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-200">
          Herramientas de Desarrollo
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          <Card 
            className="cursor-pointer transition-all duration-200 hover:shadow-xl hover:scale-105 hover:-translate-y-1 border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm"
            onClick={() => navigate('/query-manual')}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-xl bg-purple-500 text-white shadow-lg">
                  <Code className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-xl text-slate-800 dark:text-slate-200">
                    Query Manual
                  </CardTitle>
                  
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm mb-4 text-slate-600 dark:text-slate-400">
                Ejecuta consultas SQL personalizadas y crea módulos reutilizables
              </CardDescription>              
              <div className="mt-6">
                <Button 
                  className="w-full shadow-lg transition-all duration-200" 
                
                  variant="default"
                >
                  Acceder al Editor
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Módulos Personalizados */}
      {personalModules.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
              Módulos Personalizados Recientes
            </h2>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowRepository(true)}
            >
              <Database className="h-4 w-4 mr-2" />
              Todos los Módulos
            </Button>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {personalModules.slice(0, 6).map((module) => (
              <Card 
                key={module.id}
                className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 hover:-translate-y-1 border-0 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20"
                onClick={() => handlePersonalModuleClick(module)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 rounded-xl bg-emerald-500 text-white shadow-lg">
                      <Database className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-slate-800 dark:text-slate-200">
                        {module.name}
                      </CardTitle>
                      <span className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 px-2 py-1 rounded-full">
                        Módulo Personal
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm mb-4 text-slate-600 dark:text-slate-400">
                    {module.description || 'Módulo personalizado creado desde Query Manual'}
                  </CardDescription>                  
                  <div className="space-y-2">
                    <p className="text-xs text-slate-500 dark:text-slate-500">
                      Creado: {new Date(module.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500">
                      Último uso: {new Date(module.lastUsed).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="mt-4">
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 shadow-lg transition-all duration-200">
                      Ejecutar Módulo
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
