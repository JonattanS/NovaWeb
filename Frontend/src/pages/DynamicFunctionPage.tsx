
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import { moduleService, type PersistentModule } from '@/services/moduleService';
import { FilterPanel } from '@/components/query-manual/FilterPanel';
import { ResultsTable } from '@/components/query-manual/ResultsTable';
import { databaseService } from '@/services/database';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { getUserModules } from "@/services/userModulesApi"; 
import { useUser } from '@/contexts/UserContext';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const DynamicFunctionPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('filters');
  const [results, setResults] = useState<any[]>([]);
  const [filteredResults, setFilteredResults] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    ter_nit: '',
    fecha_desde: '',
    fecha_hasta: '',
    clc_cod: '',
    min_valor: '',
    max_valor: ''
  });
  const [module, setModule] = useState<any>(null);
  const { user } = useUser();

  const executeQuery = async (module?: PersistentModule) => {
    let usedQuery = query;

    // Si recibe un módulo, utiliza el query del módulo
    if (module && module.query) {
      usedQuery = module.query;
      setQuery(module.query);
    }
    if (!usedQuery || !usedQuery.trim()) {
      setError('No hay consulta para ejecutar');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await databaseService.executeCustomQuery(usedQuery);
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

  useEffect(() => {
  const loadModule = async () => {
    const hardcodedModules = moduleService.getAllModules();
    let backendModules: PersistentModule[] = [];
    let backendError = false;

    try {
      backendModules = await getUserModules(user.token);
    } catch (e) {
      backendError = true;
      toast({
        title: "Error cargando módulos personalizados",
        description: "No se pudieron obtener los módulos personalizados del servidor. Se mostrarán solo los predefinidos.",
        variant: "destructive",
      });
    }

    // Combina y deduplica
    const allModules: PersistentModule[] = [
      ...backendModules,
      ...hardcodedModules.filter(hm => !backendModules.some(bm => String(bm.id) === String(hm.id)))
    ];

    const foundModule = allModules.find(m => String(m.id) === String(id));

    if (foundModule) {
      setModule(foundModule);
      setQuery(foundModule.query || "");

      // Adaptar a tus nombres de filtro y formato según exactamente cómo estén guardados
      const moduleFilters = Array.isArray(foundModule.filters) ? {} : (foundModule.filters || {});
      setFilters({
        ter_nit: moduleFilters.ter_nit || '',
        fecha_desde: moduleFilters.fecha_desde || '',
        fecha_hasta: moduleFilters.fecha_hasta || '',
        clc_cod: moduleFilters.clc_cod || '',
        min_valor: moduleFilters.min_valor || '',
        max_valor: moduleFilters.max_valor || ''
      });

      // Ejecutar query sólo si lo tienes definido
      if (foundModule.query) executeQuery(foundModule);

      // Solo para hardcodeados
      if (hardcodedModules.find(hm => String(hm.id) === String(foundModule.id))) {
        moduleService.updateModuleLastUsed(foundModule.id);
      }

    } else {
      // Si vino error del backend y no encontró el módulo, detalla el mensaje
      toast({
        title: backendError ? "Error general de conexión" : "Módulo no encontrado",
        description: backendError
          ? "No se encontraron módulos personalizados y hubo un error al conectar con el backend."
          : "El módulo solicitado no existe.",
        variant: "destructive",
      });
      navigate('/');
    }
  };

  if (id && user?.token) loadModule();
}, [id, user?.token, navigate, toast]);

  const applyFilters = () => {
    let filtered = results;

    if (filters.ter_nit) {
      filtered = filtered.filter(r => r.ter_nit?.toString().includes(filters.ter_nit));
    }
    if (filters.fecha_desde) {
      filtered = filtered.filter(r => r.doc_fec >= filters.fecha_desde);
    }
    if (filters.fecha_hasta) {
      filtered = filtered.filter(r => r.doc_fec <= filters.fecha_hasta);
    }
    if (filters.clc_cod) {
      filtered = filtered.filter(r => r.clc_cod === filters.clc_cod);
    }
    if (filters.min_valor) {
      filtered = filtered.filter(r => Math.abs(r.mov_val) >= Number(filters.min_valor));
    }
    if (filters.max_valor) {
      filtered = filtered.filter(r => Math.abs(r.mov_val) <= Number(filters.max_valor));
    }

    setFilteredResults(filtered);

    toast({
      title: "Filtros aplicados",
      description: `Se encontraron ${filtered.length} registros`,
    });
  };

  const processDataForChart = (chart: any, data: any[]) => {
    if (!data || data.length === 0) return [];

    switch (chart.type) {
      case 'pie':
      case 'bar':
        if (chart.groupBy) {
          const grouped = data.reduce((acc, item) => {
            const key = item[chart.groupBy] || 'Sin datos';
            if (!acc[key]) {
              acc[key] = { name: key, value: 0, count: 0 };
            }
            if (chart.valueField) {
              acc[key].value += Number(item[chart.valueField]) || 0;
            }
            acc[key].count += 1;
            return acc;
          }, {});
          
          let result = Object.values(grouped);
          if (chart.topN) {
            result = result
              .sort((a: any, b: any) => b.value - a.value)
              .slice(0, chart.topN);
          }
          return result;
        }
        break;
      
      case 'line':
        if (chart.xField && chart.yField) {
          return data.map(item => ({
            name: item[chart.xField],
            value: Number(item[chart.yField]) || 0
          }));
        }
        break;
    }
    return [];
  };

  const calculateKPI = (kpi: any, data: any[]) => {
    if (!data || data.length === 0) return 0;

    const values = data
      .map(item => Number(item[kpi.field]) || 0)
      .filter(val => !isNaN(val));

    switch (kpi.aggregation) {
      case 'sum':
        return values.reduce((a, b) => a + b, 0);
      case 'avg':
        return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      case 'count':
        return data.length;
      case 'max':
        return Math.max(...values);
      case 'min':
        return Math.min(...values);
      default:
        return 0;
    }
  };

  const formatKPIValue = (value: number, aggregation: string) => {
    if (aggregation === 'count') {
      return value.toLocaleString();
    }
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const renderChart = (chart: any) => {
    const chartData = processDataForChart(chart, filteredResults);
    
    if (chartData.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center text-slate-500">
          No hay datos para mostrar
        </div>
      );
    }

    switch (chart.type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
      
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        );
      
      default:
        return <div>Tipo de gráfico no soportado</div>;
    }
  };

  if (!module) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Cargando módulo...</h2>
        </div>
      </div>
    );
  }

  const hasDashboardConfig = module.dashboardConfig && 
    (module.dashboardConfig.charts?.length > 0 || module.dashboardConfig.kpis?.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al inicio
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{module.name}</h1>
          <p className="text-slate-600 dark:text-slate-400">
            {module.description}
          </p>
        </div>
      </div>

      {/* Dashboard Ejecutivo */}
      {hasDashboardConfig ? (
        <div className="space-y-6">
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Dashboard Ejecutivo</span>
              </CardTitle>
              <CardDescription>
                Vista de KPIs y gráficos para {module.name}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* KPIs */}
          {module.dashboardConfig.kpis && module.dashboardConfig.kpis.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {module.dashboardConfig.kpis.map((kpi: any) => {
                const value = calculateKPI(kpi, filteredResults);
                return (
                  <Card key={kpi.id}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatKPIValue(value, kpi.aggregation)}</div>
                      <p className="text-xs text-muted-foreground">
                        {kpi.aggregation} de {kpi.field}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Gráficos */}
          {module.dashboardConfig.charts && module.dashboardConfig.charts.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2">
              {module.dashboardConfig.charts.map((chart: any) => (
                <Card key={chart.id}>
                  <CardHeader>
                    <CardTitle>{chart.title}</CardTitle>
                    <CardDescription>
                      {chart.description || `Gráfico de ${chart.type}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {renderChart(chart)}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Dashboard Ejecutivo</span>
            </CardTitle>
            <CardDescription>
              Vista de KPIs y gráficos para {module.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              No hay dashboard configurado para este módulo.
              Puedes configurarlo editando el módulo desde Query Manual.
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p>Ejecutando consulta...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <FilterPanel
            filters={filters}
            setFilters={setFilters}
            onApplyFilters={applyFilters}
          />
          <ResultsTable results={filteredResults} />
        </div>
      )}
    </div>
  );
};

export default DynamicFunctionPage;
