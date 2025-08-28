
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Filter, FileText, BarChart3, Settings } from 'lucide-react';
import { FilterConfigDialog } from './FilterConfigDialog';
import { DashboardConfigDialog } from '../dashboard-config/DashboardConfigDialog';
import { useUser } from '@/contexts/UserContext';
import { moduleService } from '@/services/moduleService';

interface FilterConfig {
  columnName: string;
  enabled: boolean;
}

interface SaveModuleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  moduleForm: { name: string; description: string };
  setModuleForm: (form: { name: string; description: string }) => void;
  onSave: (dashboardConfig?: any, dynamicFilterConfig?: FilterConfig[]) => void;
  availableFields: string[];
  filterConfig?: FilterConfig[];
  setFilterConfig?: (config: FilterConfig[]) => void;
  dashboardConfig?: any;
  onConfigureDashboard?: () => void;
  portafolio: number | null;
  setPortafolio: (value: number | null) => void;

}

export const SaveModuleDialog = ({ 
  isOpen, 
  onClose, 
  moduleForm, 
  setModuleForm, 
  onSave, 
  availableFields,
  filterConfig = [],
  setFilterConfig,
  dashboardConfig,
  onConfigureDashboard,
  portafolio,          
  setPortafolio
}: SaveModuleDialogProps) => {
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [showDashboardDialog, setShowDashboardDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'filters' | 'dashboard'>('basic');
  const [currentDashboardConfig, setCurrentDashboardConfig] = useState(dashboardConfig || { charts: [], kpis: [] });
  const PORTFOLIOS = moduleService.getAllFolders(); // Si ya está expuesto así
  const { user } = useUser();

  const handleSave = () => {
    console.log('Guardando módulo con dashboard config:', currentDashboardConfig);
    onSave(currentDashboardConfig, filterConfig);
  };

  const handleDashboardSave = (config: any) => {
    console.log('Configuración de dashboard guardada:', config);
    setCurrentDashboardConfig(config);
    setShowDashboardDialog(false);
  };

  const enabledFiltersCount = filterConfig.filter(f => f.enabled).length;
  const hasChartsConfigured = currentDashboardConfig && currentDashboardConfig.charts && currentDashboardConfig.charts.length > 0;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Save className="h-5 w-5" />
              <span>Guardar como Módulo</span>
            </DialogTitle>
            <DialogDescription>
              Configura los detalles del módulo, filtros dinámicos y dashboard que estarán disponibles
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as 'basic' | 'filters' | 'dashboard')}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic" className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Información</span>
              </TabsTrigger>
              <TabsTrigger value="filters" className="flex items-center space-x-2">
                <Filter className="h-4 w-4" />
                <span>Filtros ({enabledFiltersCount})</span>
              </TabsTrigger>
              <TabsTrigger value="dashboard" className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span>Dashboard</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Módulo *</Label>
                <Input
                  id="name"
                  value={moduleForm.name}
                  onChange={(e) => setModuleForm({...moduleForm, name: e.target.value})}
                  placeholder="Ej: Movimientos por Tercero"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={moduleForm.description}
                  onChange={(e) => setModuleForm({...moduleForm, description: e.target.value})}
                  placeholder="Describe qué hace este módulo y para qué se usa..."
                  rows={3}
                />
              </div>

              <div className="space-y-2 mt-4">
                <Label>Portafolio *</Label>
                <select
                  value={portafolio ?? ''}
                  onChange={(e) => setPortafolio(+e.target.value || null)}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Selecciona un portafolio</option>
                  {PORTFOLIOS
                    .filter(pf => user.portafolios.includes(pf.porcod))
                    .map(p => (
                      <option key={p.porcod} value={p.porcod}>
                        {p.name}
                      </option>
                    ))}
                </select>
              </div>

            </TabsContent>

            <TabsContent value="filters" className="space-y-4 mt-6">
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Filtros Dinámicos
                  </h4>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mb-3">
                    Selecciona qué columnas estarán disponibles como filtros en este módulo. 
                    Los usuarios podrán filtrar los resultados usando estos campos.
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {enabledFiltersCount} filtros configurados
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowFilterDialog(true)}
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      Configurar Filtros
                    </Button>
                  </div>
                </div>

                {enabledFiltersCount > 0 && (
                  <div className="space-y-2">
                    <Label>Filtros Seleccionados:</Label>
                    <div className="flex flex-wrap gap-2">
                      {filterConfig
                        .filter(f => f.enabled)
                        .map(filter => (
                          <div 
                            key={filter.columnName}
                            className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-sm"
                          >
                            {filter.columnName}
                          </div>
                        ))
                      }
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="dashboard" className="space-y-4 mt-6">
              <div className={`${hasChartsConfigured ? 'bg-green-50 dark:bg-green-900/20' : 'bg-yellow-50 dark:bg-yellow-900/20'} p-4 rounded-lg`}>
                <h4 className={`font-medium ${hasChartsConfigured ? 'text-green-900 dark:text-green-100' : 'text-yellow-900 dark:text-yellow-100'} mb-2`}>
                  Configuración del Dashboard
                </h4>
                <p className={`text-sm ${hasChartsConfigured ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'} mb-3`}>
                  {hasChartsConfigured 
                    ? `Dashboard configurado con ${currentDashboardConfig.charts.length} gráfico(s). Esta configuración se guardará con el módulo.`
                    : 'No hay dashboard configurado para este módulo. Puedes configurar uno ahora o después de guardar el módulo.'
                  }
                </p>
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <strong>Estado:</strong> {hasChartsConfigured ? '✅ Configurado' : '⚠️ Sin configurar'}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowDashboardDialog(true)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    {hasChartsConfigured ? 'Editar Dashboard' : 'Configurar Dashboard'}
                  </Button>
                </div>
              </div>

              {hasChartsConfigured && (
                <div className="space-y-2">
                  <Label>Resumen de Configuración:</Label>
                  <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <strong>Gráficos:</strong> {currentDashboardConfig.charts?.length || 0}
                      </div>
                      <div>
                        <strong>KPIs:</strong> {currentDashboardConfig.kpis?.length || 0}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={!moduleForm.name.trim()}>
              <Save className="h-4 w-4 mr-2" />
              Guardar Módulo
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {setFilterConfig && (
        <FilterConfigDialog
          isOpen={showFilterDialog}
          onClose={() => setShowFilterDialog(false)}
          selectedFilters={filterConfig}
          onFiltersChange={setFilterConfig}
        />
      )}

      <DashboardConfigDialog
        isOpen={showDashboardDialog}
        onClose={() => setShowDashboardDialog(false)}
        config={currentDashboardConfig}
        onSave={handleDashboardSave}
        availableFields={availableFields}
      />
    </>
  );
};
