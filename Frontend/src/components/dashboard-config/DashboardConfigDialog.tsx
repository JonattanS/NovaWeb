
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { BarChart, PieChart, TrendingUp, Table, Plus, X, Save, Hash, Calendar, Type } from 'lucide-react';
import { schemaService } from '@/services/schemaService';

interface ChartConfig {
  id: string;
  type: 'pie' | 'bar' | 'line' | 'kpi' | 'table' | 'top';
  title: string;
  field: string;
  aggregation?: 'count' | 'sum' | 'avg' | 'max' | 'min';
  limit?: number;
  groupBy?: string;
  topN?: number;
}

interface DashboardConfig {
  charts: ChartConfig[];
  kpis: ChartConfig[];
}

interface DashboardConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
  config: DashboardConfig;
  onSave: (config: DashboardConfig) => void;
  availableFields: string[];
}

export const DashboardConfigDialog = ({
  isOpen,
  onClose,
  config,
  onSave,
  availableFields
}: DashboardConfigDialogProps) => {
  const [currentConfig, setCurrentConfig] = useState<DashboardConfig>(config);
  const columns = schemaService.getTableColumns();

  useEffect(() => {
    setCurrentConfig(config);
  }, [config]);

  const addChart = () => {
    const newChart: ChartConfig = {
      id: `chart-${Date.now()}`,
      type: 'bar',
      title: 'Nueva Gráfica',
      field: '',
      aggregation: 'count'
    };
    
    setCurrentConfig(prev => ({
      ...prev,
      charts: [...prev.charts, newChart]
    }));
  };

  const addKPI = () => {
    const newKPI: ChartConfig = {
      id: `kpi-${Date.now()}`,
      type: 'kpi',
      title: 'Nuevo KPI',
      field: '',
      aggregation: 'count'
    };
    
    setCurrentConfig(prev => ({
      ...prev,
      kpis: [...prev.kpis, newKPI]
    }));
  };

  const updateChart = (id: string, updates: Partial<ChartConfig>) => {
    setCurrentConfig(prev => ({
      ...prev,
      charts: prev.charts.map(chart => 
        chart.id === id ? { ...chart, ...updates } : chart
      )
    }));
  };

  const updateKPI = (id: string, updates: Partial<ChartConfig>) => {
    setCurrentConfig(prev => ({
      ...prev,
      kpis: prev.kpis.map(kpi => 
        kpi.id === id ? { ...kpi, ...updates } : kpi
      )
    }));
  };

  const removeChart = (id: string) => {
    setCurrentConfig(prev => ({
      ...prev,
      charts: prev.charts.filter(chart => chart.id !== id)
    }));
  };

  const removeKPI = (id: string) => {
    setCurrentConfig(prev => ({
      ...prev,
      kpis: prev.kpis.filter(kpi => kpi.id !== id)
    }));
  };

  const handleSave = () => {
    onSave(currentConfig);
    onClose();
  };

  const getChartIcon = (type: string) => {
    switch (type) {
      case 'pie': return <PieChart className="h-4 w-4" />;
      case 'bar': return <BarChart className="h-4 w-4" />;
      case 'line': return <TrendingUp className="h-4 w-4" />;
      case 'table': return <Table className="h-4 w-4" />;
      case 'top': return <Hash className="h-4 w-4" />;
      default: return <BarChart className="h-4 w-4" />;
    }
  };

  const getColumnIcon = (fieldName: string) => {
    const column = columns.find(col => col.name === fieldName);
    if (!column) return <Type className="h-3 w-3" />;
    
    if (column.isNumeric) return <Hash className="h-3 w-3 text-blue-500" />;
    if (column.isDate) return <Calendar className="h-3 w-3 text-green-500" />;
    return <Type className="h-3 w-3 text-slate-500" />;
  };

  const getColumnType = (fieldName: string) => {
    const column = columns.find(col => col.name === fieldName);
    return column ? (column.isNumeric ? 'numeric' : column.isDate ? 'date' : 'text') : 'text';
  };

  const getAvailableAggregations = (fieldName: string) => {
    const columnType = getColumnType(fieldName);
    if (columnType === 'numeric') {
      return [
        { value: 'count', label: 'Contar registros' },
        { value: 'sum', label: 'Sumar valores' },
        { value: 'avg', label: 'Promedio' },
        { value: 'max', label: 'Valor máximo' },
        { value: 'min', label: 'Valor mínimo' }
      ];
    }
    return [{ value: 'count', label: 'Contar registros' }];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurador Visual de Dashboard</DialogTitle>
          <DialogDescription>
            Diseña tu dashboard ejecutivo seleccionando visualizaciones, campos y filtros de forma visual
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="charts" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="charts">
              <BarChart className="h-4 w-4 mr-2" />
              Gráficos ({currentConfig.charts.length})
            </TabsTrigger>
            <TabsTrigger value="kpis">
              <TrendingUp className="h-4 w-4 mr-2" />
              KPIs ({currentConfig.kpis.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="charts" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Visualizaciones Gráficas</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Crea gráficos interactivos para visualizar tus datos
                </p>
              </div>
              <Button onClick={addChart} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Gráfico
              </Button>
            </div>

            <div className="grid gap-4">
              {currentConfig.charts.map((chart) => (
                <Card key={chart.id} className="border-2 hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getChartIcon(chart.type)}
                        <CardTitle className="text-base">{chart.title || 'Sin título'}</CardTitle>
                        <Badge variant="outline" className="capitalize">
                          {chart.type === 'top' ? `Top ${chart.topN || 5}` : chart.type}
                        </Badge>
                      </div>
                      <Button variant="destructive" size="sm" onClick={() => removeChart(chart.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <Label>Título del Gráfico</Label>
                      <Input
                        value={chart.title}
                        onChange={(e) => updateChart(chart.id, { title: e.target.value })}
                        placeholder="Nombre descriptivo"
                      />
                    </div>

                    <div>
                      <Label>Tipo de Visualización</Label>
                      <Select value={chart.type} onValueChange={(value) => updateChart(chart.id, { type: value as any })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bar">📊 Gráfico de Barras</SelectItem>
                          <SelectItem value="pie">🥧 Gráfico de Pastel</SelectItem>
                          <SelectItem value="line">📈 Gráfico de Líneas</SelectItem>
                          <SelectItem value="table">📋 Tabla</SelectItem>
                          <SelectItem value="top">🏆 Top N</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Campo de Datos</Label>
                      <Select value={chart.field} onValueChange={(value) => updateChart(chart.id, { field: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar campo" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableFields.map(field => (
                            <SelectItem key={field} value={field}>
                              <div className="flex items-center space-x-2">
                                {getColumnIcon(field)}
                                <span>{field}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Tipo de Cálculo</Label>
                      <Select 
                        value={chart.aggregation} 
                        onValueChange={(value) => updateChart(chart.id, { aggregation: value as any })}
                        disabled={!chart.field}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Operación" />
                        </SelectTrigger>
                        <SelectContent>
                          {chart.field && getAvailableAggregations(chart.field).map(agg => (
                            <SelectItem key={agg.value} value={agg.value}>
                              {agg.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {chart.type === 'top' && (
                      <div>
                        <Label>Cantidad (Top N)</Label>
                        <Input
                          type="number"
                          value={chart.topN || 5}
                          onChange={(e) => updateChart(chart.id, { topN: parseInt(e.target.value) || 5 })}
                          placeholder="5"
                          min="1"
                          max="20"
                        />
                      </div>
                    )}

                    {(chart.type === 'bar' || chart.type === 'pie') && (
                      <div>
                        <Label>Agrupar por Campo</Label>
                        <Select value={chart.groupBy || ''} onValueChange={(value) => updateChart(chart.id, { groupBy: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Campo de agrupación" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableFields.filter(field => field !== chart.field).map(field => (
                              <SelectItem key={field} value={field}>
                                <div className="flex items-center space-x-2">
                                  {getColumnIcon(field)}
                                  <span>{field}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div>
                      <Label>Límite de Registros</Label>
                      <Input
                        type="number"
                        value={chart.limit || ''}
                        onChange={(e) => updateChart(chart.id, { limit: e.target.value ? parseInt(e.target.value) : undefined })}
                        placeholder="Todos"
                        min="1"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}

              {currentConfig.charts.length === 0 && (
                <Card className="border-dashed border-2">
                  <CardContent className="text-center py-12">
                    <BarChart className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-400">
                      Sin gráficos configurados
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-500 mt-2 mb-4">
                      Agrega visualizaciones para mostrar tus datos de forma gráfica
                    </p>
                    <Button onClick={addChart} variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Crear Primer Gráfico
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="kpis" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Indicadores Clave (KPIs)</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Crea métricas importantes para tu dashboard ejecutivo
                </p>
              </div>
              <Button onClick={addKPI} className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo KPI
              </Button>
            </div>

            <div className="grid gap-4">
              {currentConfig.kpis.map((kpi) => (
                <Card key={kpi.id} className="border-2 hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4" />
                        <CardTitle className="text-base">{kpi.title || 'Sin título'}</CardTitle>
                        <Badge variant="outline">KPI</Badge>
                      </div>
                      <Button variant="destructive" size="sm" onClick={() => removeKPI(kpi.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-3">
                    <div>
                      <Label>Nombre del Indicador</Label>
                      <Input
                        value={kpi.title}
                        onChange={(e) => updateKPI(kpi.id, { title: e.target.value })}
                        placeholder="Ej: Total de Ventas"
                      />
                    </div>

                    <div>
                      <Label>Campo de Datos</Label>
                      <Select value={kpi.field} onValueChange={(value) => updateKPI(kpi.id, { field: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar campo" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableFields.map(field => (
                            <SelectItem key={field} value={field}>
                              <div className="flex items-center space-x-2">
                                {getColumnIcon(field)}
                                <span>{field}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Tipo de Cálculo</Label>
                      <Select 
                        value={kpi.aggregation} 
                        onValueChange={(value) => updateKPI(kpi.id, { aggregation: value as any })}
                        disabled={!kpi.field}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Operación" />
                        </SelectTrigger>
                        <SelectContent>
                          {kpi.field && getAvailableAggregations(kpi.field).map(agg => (
                            <SelectItem key={agg.value} value={agg.value}>
                              {agg.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {currentConfig.kpis.length === 0 && (
                <Card className="border-dashed border-2">
                  <CardContent className="text-center py-12">
                    <TrendingUp className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-400">
                      Sin KPIs configurados
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-500 mt-2 mb-4">
                      Agrega indicadores clave para monitorear métricas importantes
                    </p>
                    <Button onClick={addKPI} variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Crear Primer KPI
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700">
            <Save className="h-4 w-4 mr-2" />
            Guardar Configuración
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
