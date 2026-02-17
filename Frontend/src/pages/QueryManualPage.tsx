import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { databaseService } from '@/services/database';
import { moduleService, type PersistentModule } from '@/services/moduleService';
import { schemaService, type QueryConfiguration } from '@/services/schemaService';
import { useToast } from '@/hooks/use-toast';
import { QueryEditor } from '@/components/query-manual/QueryEditor';
import { DynamicFilterPanel } from '@/components/query-manual/DynamicFilterPanel';
import { ModulesPanel } from '@/components/query-manual/ModulesPanel';
import { ResultsTable } from '@/components/query-manual/ResultsTable';
import { SaveModuleDialog } from '@/components/query-manual/SaveModuleDialog';
import { QueryBuilder } from '@/components/query-builder/QueryBuilder';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Filter, Search, } from 'lucide-react';
import { FilterConfigDialog } from '@/components/query-manual/FilterConfigDialog';
import { saveUserModule } from '@/services/userModulesApi';
import { useUser } from '@/contexts/UserContext';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface FilterConfig {
  columnName: string;
  enabled: boolean;
}

interface FilterValue {
  columnName: string;
  value: any;
  operator?: string;
  secondValue?: any;
}

const QueryManualPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();
  const { user } = useUser();
  const [selectedPortafolio, setSelectedPortafolio] = useState<number | null>(null);

  const [query, setQuery] = useState('');
  const [queryConfig, setQueryConfig] = useState<QueryConfiguration>({
    selectedFields: [],
    conditions: [],
    orderBy: [],
    groupBy: []
  });

  const [results, setResults] = useState<any[]>([]);
  const [filteredResults, setFilteredResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedModules, setSavedModules] = useState<PersistentModule[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [moduleForm, setModuleForm] = useState({ name: '', description: '' });

  // Estados para filtros dinámicos
  const [filterConfig, setFilterConfig] = useState<FilterConfig[]>([]);
  const [appliedFilters, setAppliedFilters] = useState<FilterValue[]>([]);
  const [showFilterConfigDialog, setShowFilterConfigDialog] = useState(false);

  const [activeTab, setActiveTab] = useState<'visual' | 'sql' | 'filters' | 'modules'>('visual');

  // Obtener campos disponibles de la tabla
  const availableFields = schemaService.getTableColumns().map(col => col.name);

  const updateModules = () => {
    setSavedModules(moduleService.getAllModules().filter(m => !m.isMainFunction));
  };

  useEffect(() => {
    updateModules();
  }, []);

  useEffect(() => {
    if (location.state?.loadModule) {
      const module = location.state.loadModule as PersistentModule;
      loadModule(module);
      navigate('/query-manual', { replace: true });
    }
  }, [location.state, navigate]);

  const handleQueryGenerated = (sql: string, config: QueryConfiguration) => {
    setQuery(sql);
    setQueryConfig(config);
  };
  const executeQuery = async () => {
    if (!query.trim()) {
      setError('No hay consulta para ejecutar');
      return;
    }

    console.log(">>> Consulta enviada al backend:", query); // DEBUG

    setIsLoading(true);
    setError('');

    try {
      const result = await databaseService.executeCustomQuery(query);
      setResults(result);
      setFilteredResults(result);
      setActiveTab('filters');

      toast({
        title: "Query ejecutado",
        description: `Se obtuvieron ${result.length} registros`,
      });

    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(errorMessage);

      toast({
        title: "Error ejecutando query",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };



  const applyDynamicFilters = (filters: FilterValue[]) => {
    let filtered = [...results];

    filters.forEach(filter => {
      if (!filter.value && filter.value !== false) return;

      const column = schemaService.getTableColumns().find(col => col.name === filter.columnName);
      if (!column) return;

      filtered = filtered.filter(row => {
        const cellValue = row[filter.columnName];

        if (column.type === 'boolean') {
          return cellValue === filter.value;
        }

        if (column.isDate) {
          const rowDate = new Date(cellValue);
          const filterDate = new Date(filter.value);

          switch (filter.operator) {
            case '=':
              return rowDate.toDateString() === filterDate.toDateString();
            case '>=':
              return rowDate >= filterDate;
            case '<=':
              return rowDate <= filterDate;
            case 'BETWEEN':
              if (filter.secondValue) {
                const endDate = new Date(filter.secondValue);
                return rowDate >= filterDate && rowDate <= endDate;
              }
              return true;
            default:
              return true;
          }
        }

        if (column.isNumeric) {
          const numValue = Number(cellValue);
          const filterNum = Number(filter.value);

          switch (filter.operator) {
            case '=':
              return numValue === filterNum;
            case '>':
              return numValue > filterNum;
            case '>=':
              return numValue >= filterNum;
            case '<':
              return numValue < filterNum;
            case '<=':
              return numValue <= filterNum;
            case 'BETWEEN':
              if (filter.secondValue) {
                const endNum = Number(filter.secondValue);
                return numValue >= filterNum && numValue <= endNum;
              }
              return true;
            default:
              return true;
          }
        }

        // Campo de texto
        const strValue = String(cellValue).toLowerCase();
        const filterStr = String(filter.value).toLowerCase();

        switch (filter.operator) {
          case '=':
            return strValue === filterStr;
          case 'LIKE':
            return strValue.includes(filterStr);
          case 'STARTS_WITH':
            return strValue.startsWith(filterStr);
          case 'ENDS_WITH':
            return strValue.endsWith(filterStr);
          default:
            return strValue.includes(filterStr);
        }
      });
    });

    setFilteredResults(filtered);
    setAppliedFilters(filters);

    toast({
      title: "Filtros aplicados",
      description: `Se filtraron ${filtered.length} de ${results.length} registros`,
    });
  };

  const handleFilterConfigSave = (newFilterConfig: FilterConfig[]) => {
    setFilterConfig(newFilterConfig);
    setAppliedFilters([]); // Limpiar filtros aplicados al cambiar configuración

    const enabledCount = newFilterConfig.filter(f => f.enabled).length;
    toast({
      title: "Filtros configurados",
      description: `Se configuraron ${enabledCount} filtros dinámicos para este módulo`,
    });
  };

  const handleSave = async () => {
    if (!selectedPortafolio) {
      toast({ title: 'Selecciona un portafolio' });
      return;
    }

    const newModule = {
      porcod: selectedPortafolio,
      name: moduleForm.name.trim(),
      description: moduleForm.description.trim(),
      query: query,
      filters: queryConfig,
      dynamic_filters: filterConfig,
      dashboard_config: { charts: [], kpis: [] },
      is_main_function: false,
      shared: false
    };

    try {
      const saved = await saveUserModule(newModule, user.token);
      toast({ title: 'Módulo guardado', description: `ID: ${saved.id}` });
    } catch (err: any) {
      toast({ title: 'Error al guardar módulo', description: err.message, variant: 'destructive' });
    }
  };

  const saveAsModule = async (dashboardConfig?: any, dynamicFilterConfig?: FilterConfig[]) => {
    if (!moduleForm.name.trim() || !selectedPortafolio) {
      toast({
        title: "Datos requeridos",
        description: "Debes ingresar un nombre y seleccionar un portafolio",
        variant: "destructive",
      });
      return;
    }

    const newModule = {
      porcod: selectedPortafolio,
      name: moduleForm.name.trim(),
      description: moduleForm.description.trim(),
      query: query,
      filters: queryConfig,
      dynamic_filters: dynamicFilterConfig || filterConfig,
      dashboard_config: dashboardConfig || { charts: [], kpis: [] },
      is_main_function: true,
      shared: false
    };

    try {
      const saved = await saveUserModule(newModule, user.token);
      toast({
        title: "Módulo guardado correctamente",
        description: `ID: ${saved.id}`,
      });

      // Limpia todo
      setShowSaveDialog(false);
      setModuleForm({ name: '', description: '' });
      setSelectedPortafolio(null);
      updateModules();

    } catch (err: any) {
      toast({
        title: "Error al guardar el módulo",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const loadModule = (module: PersistentModule) => {
    setQuery(module.query);

    if (module.filters && typeof module.filters === 'object' && 'selectedFields' in module.filters) {
      setQueryConfig(module.filters as QueryConfiguration);
    }

    // Cargar configuración de filtros dinámicos
    if (module.dynamicFilters) {
      setFilterConfig(module.dynamicFilters as FilterConfig[]);
    } else {
      setFilterConfig([]);
    }

    setAppliedFilters([]);

    moduleService.updateModuleLastUsed(module.id);
    updateModules();

    toast({
      title: "Módulo cargado",
      description: `Se cargó el módulo "${module.name}"`,
    });
  };

  const deleteModule = (moduleId: string) => {
    const module = savedModules.find(m => m.id === moduleId);
    if (module?.isMainFunction) {
      toast({
        title: "Error",
        description: "No se puede eliminar una función principal desde aquí",
        variant: "destructive",
      });
      return;
    }

    moduleService.deleteModule(moduleId);
    updateModules();

    toast({
      title: "Módulo eliminado",
      description: "El módulo se eliminó correctamente",
    });
  };

  const exportResults = () => {
    if (filteredResults.length === 0) return;

    const csv = [
      Object.keys(filteredResults[0]).join(','),
      ...filteredResults.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query_results_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();

    toast({
      title: "Datos exportados",
      description: "Los resultados se exportaron a CSV",
    });
  };

  const exportPDF = () => {
    if (filteredResults.length === 0) return;

    const doc = new jsPDF();
    const columns = Object.keys(filteredResults[0]);
    const rows = filteredResults.map(row => columns.map(col => row[col] ?? ''));

    autoTable(doc, {
      head: [columns],
      body: rows,
      startY: 20,
      margin: { horizontal: 10 },
      styles: { fontSize: 8 }
    });

    doc.save(`query_results_${new Date().toISOString().split('T')[0]}.pdf`);

    toast({
      title: "Datos exportados",
      description: "Los resultados se exportaron a PDF",
    });
  };

  const enabledFiltersCount = filterConfig.filter(f => f.enabled).length;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center space-x-4 mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="hover:bg-white/80">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al inicio
        </Button>
        <div className="h-6 w-px bg-gray-300" />
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Search className="h-6 w-6 mr-2 text-blue-600" />
          Query Manual
        </h1>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value: string) => setActiveTab(value as 'visual' | 'sql' | 'filters' | 'modules')}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="visual">Constructor Visual</TabsTrigger>
          <TabsTrigger value="sql">Editor SQL</TabsTrigger>
          <TabsTrigger value="filters">
            Filtros y Resultados
            {enabledFiltersCount > 0 && (
              <span className="ml-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                {enabledFiltersCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="modules">Módulos Guardados ({savedModules.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="visual" className="space-y-4">
          <QueryBuilder
            onQueryGenerated={handleQueryGenerated}
            initialConfig={queryConfig}
          />
          <div className="flex gap-2">
            <Button onClick={executeQuery} disabled={isLoading || !query.trim()}>
              {isLoading ? 'Ejecutando...' : 'Ejecutar Consulta'}
            </Button>
            <Button variant="outline" disabled={!query.trim()} onClick={() => setShowSaveDialog(true)}>
              Guardar como Módulo
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="sql" className="space-y-4">
          <QueryEditor
            query={query}
            setQuery={setQuery}
            executeQuery={executeQuery}
            isLoading={isLoading}
            error={error}
            onSaveModule={() => setShowSaveDialog(true)}
            hasResults={results.length > 0}
            resultsCount={results.length}
          />
        </TabsContent>

        <TabsContent value="filters">
          <div className="space-y-6">
            {results.length > 0 ? (
              <>
                <div className="flex gap-2 mb-4">
                  <Button onClick={exportResults} disabled={filteredResults.length === 0}>
                    Exportar CSV
                  </Button>
                  <Button onClick={exportPDF} disabled={filteredResults.length === 0}>
                    Exportar PDF
                  </Button>
                  {enabledFiltersCount === 0 && (
                    <Button
                      onClick={() => setShowFilterConfigDialog(true)}
                      variant="outline"
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      Configurar Filtros
                    </Button>
                  )}
                </div>

                {enabledFiltersCount > 0 ? (
                  <DynamicFilterPanel
                    filterConfig={filterConfig}
                    onFiltersApply={applyDynamicFilters}
                    appliedFilters={appliedFilters}
                    setAppliedFilters={setAppliedFilters}
                    onConfigureFilters={() => setShowFilterConfigDialog(true)}
                  />
                ) : (
                  <Card>
                    <CardContent className="text-center py-8">
                      <Filter className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-400">
                        Sin Filtros Configurados
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-500 mt-2 mb-4">
                        Este módulo no tiene filtros dinámicos configurados.
                      </p>
                      <Button onClick={() => setShowFilterConfigDialog(true)}>
                        <Filter className="h-4 w-4 mr-2" />
                        Configurar Filtros
                      </Button>
                    </CardContent>
                  </Card>
                )}

                <ResultsTable results={filteredResults} />
              </>
            ) : (
              <div className="space-y-4">
                <Card>
                  <CardContent className="text-center py-12">
                    <Filter className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-slate-600 dark:text-slate-400 mb-2">
                      No hay resultados para filtrar
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-500 mb-6">
                      Ejecuta una consulta primero para ver los resultados y aplicar filtros dinámicos.
                      <br />
                      También puedes configurar qué filtros estarán disponibles para este módulo.
                    </p>
                    <div className="flex justify-center gap-3">
                      <Button
                        onClick={() => setActiveTab('visual')}
                        variant="outline"
                      >
                        Ir al Constructor Visual
                      </Button>
                      <Button
                        onClick={() => setActiveTab('sql')}
                        variant="outline"
                      >
                        Ir al Editor SQL
                      </Button>
                      <Button
                        onClick={() => setShowFilterConfigDialog(true)}
                      >
                        <Filter className="h-4 w-4 mr-2" />
                        Configurar Filtros
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="modules">
          <ModulesPanel
            savedModules={savedModules}
            onLoadModule={loadModule}
            onDeleteModule={deleteModule}
            onModulesUpdate={updateModules}
          />
        </TabsContent>
      </Tabs>

      <SaveModuleDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        moduleForm={moduleForm}
        setModuleForm={setModuleForm}
        onSave={saveAsModule}
        availableFields={availableFields}
        filterConfig={filterConfig}
        setFilterConfig={setFilterConfig}
        portafolio={selectedPortafolio}
        setPortafolio={setSelectedPortafolio}

      />

      <FilterConfigDialog
        isOpen={showFilterConfigDialog}
        onClose={() => setShowFilterConfigDialog(false)}
        selectedFilters={filterConfig}
        onFiltersChange={handleFilterConfigSave}
      />
    </div>
  );
};

export default QueryManualPage;
