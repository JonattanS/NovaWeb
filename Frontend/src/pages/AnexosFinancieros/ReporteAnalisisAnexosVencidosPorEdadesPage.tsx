import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ArrowLeft, Search, Download, FileText, Calendar, Building2, Filter, ChevronUp, ChevronDown, Table, Building, CreditCard, Target, Hash, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DataPagination } from '@/components/DataPagination';
import { ExcelExporter } from '@/components/ExcelExporter';
import { databaseService } from '@/services/database';
import { useToast } from '@/hooks/use-toast';

export const mencod = '011814';

interface FiltrosReporte {
  suc_cod: string;
  cta_cod: string;
  anf_cod: string;
  tipoOrden: 'alfabetico' | 'numerico';
  ter_nit_ini: string;
  ter_nit_fin: string;
}

interface RegistroAnexoVencido {
  clc_cod: string;
  doc_num: string;
  doc_fec: string;
  vcto_fec: string;
  ter_nit: string;
  ter_raz: string;
  sin_vencer: number;
  dias_1_30: number;
  dias_31_60: number;
  dias_61_90: number;
  mas_90_dias: number;
  total: number;
  dias_vencido: number;
}

const ReporteAnalisisAnexosVencidosPorEdadesPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [filtros, setFiltros] = useState<FiltrosReporte>({
    suc_cod: '',
    cta_cod: '',
    anf_cod: '',
    tipoOrden: 'alfabetico',
    ter_nit_ini: '',
    ter_nit_fin: 'ZZZZZZZZZZZZZZ'
  });

  const [resultados, setResultados] = useState<RegistroAnexoVencido[]>([]);
  const [cargando, setCargando] = useState(false);
  const [paginaActual, setPaginaActual] = useState(1);
  const [isFiltersOpen, setIsFiltersOpen] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const registrosPorPagina = 50;

  const ejecutarConsulta = async () => {
    if (!filtros.anf_cod) {
      toast({
        title: "Campo requerido",
        description: "Debe especificar el código del anexo financiero",
        variant: "destructive"
      });
      return;
    }

    setCargando(true);
    try {
      const filtrosConsulta = {
        fuente: 'con_vctos_edades',
        suc_cod: filtros.suc_cod,
        cta_cod: filtros.cta_cod,
        anf_cod: filtros.anf_cod,
        ter_nit_ini: filtros.ter_nit_ini,
        ter_nit_fin: filtros.ter_nit_fin,
        tipoOrden: filtros.tipoOrden
      };

      const datos = await databaseService.consultaDocumentos(filtrosConsulta);
      setResultados(datos || []);
      setPaginaActual(1);
      
      toast({
        title: "Consulta ejecutada",
        description: `Se encontraron ${datos?.length || 0} registros`
      });
    } catch (error) {
      toast({
        title: "Error en la consulta",
        description: "No se pudo ejecutar la consulta. Verifique los parámetros.",
        variant: "destructive"
      });
    } finally {
      setCargando(false);
    }
  };

  const limpiarFiltros = () => {
    setFiltros({
      suc_cod: '',
      cta_cod: '',
      anf_cod: '',
      tipoOrden: 'alfabetico',
      ter_nit_ini: '',
      ter_nit_fin: 'ZZZZZZZZZZZZZZ'
    });
    setResultados([]);
  };

  const formatearMoneda = (valor: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(valor);
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-CO');
  };

  const totalPaginas = Math.ceil(resultados.length / registrosPorPagina);
  const indiceInicio = (paginaActual - 1) * registrosPorPagina;
  const indiceFin = Math.min(indiceInicio + registrosPorPagina, resultados.length);
  const resultadosPagina = resultados.slice(indiceInicio, indiceFin);

  const getColumnDescription = (key: string): string => {
    const descriptions: Record<string, string> = {
      clc_cod: 'Clase',
      doc_num: 'Documento No.',
      doc_fec: 'Fecha',
      vcto_fec: 'Vence el',
      ter_nit: 'NIT',
      ter_raz: 'Razón Social',
      sin_vencer: 'Sin Vencer',
      dias_1_30: '1-30 Días',
      dias_31_60: '31-60 Días',
      dias_61_90: '61-90 Días',
      mas_90_dias: 'Más 90 Días',
      total: 'Total',
      dias_vencido: 'Días Vencido'
    };
    return descriptions[key] || key;
  };

  const getActiveFiltersCount = () => {
    return Object.values(filtros).filter((value) => 
      typeof value === 'string' ? value.trim() !== '' : value !== true
    ).length;
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="hover:bg-white/80">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al inicio
            </Button>
            <div className="h-6 w-px bg-gray-300" />
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Table className="h-6 w-6 mr-2 text-blue-600" />
              Reporte Análisis Anexos Vencidos Por Edades
            </h1>
          </div>

          {resultados.length > 0 && (
            <div className="flex gap-2">
              <ExcelExporter
                data={resultados}
                filename={`analisis_anexos_vencidos_por_edades_CSV_${new Date().toISOString().split('T')[0]}`}
                sheetName="Anexos Vencidos Por Edades"
                format="csv"
                onProgressChange={(progress) => setExportProgress(progress)}
                onGeneratingChange={(generating) => setIsExporting(generating)}
                getColumnDescription={getColumnDescription}
              />
              <ExcelExporter
                data={resultados}
                filename={`analisis_anexos_vencidos_por_edades_${new Date().toISOString().split('T')[0]}`}
                sheetName="Anexos Vencidos Por Edades"
                format="xlsx"
                onProgressChange={(progress) => setExportProgress(progress)}
                onGeneratingChange={(generating) => setIsExporting(generating)}
                getColumnDescription={getColumnDescription}
              />
            </div>
          )}
        </div>

        {/* Filtros Colapsables */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Filter className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-lg">Parámetros de Consulta</CardTitle>
                    {getActiveFiltersCount() > 0 && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {getActiveFiltersCount()} activos
                      </Badge>
                    )}
                  </div>
                  {isFiltersOpen ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </CardHeader>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="space-y-6">
                  <div className="grid gap-6">
                    {/* Información General */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                        <span>Información General</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        <Input
                          value={filtros.suc_cod}
                          onChange={(e) => setFiltros(prev => ({ ...prev, suc_cod: e.target.value }))}
                          placeholder="Sucursal/Agencia"
                          className="bg-white"
                        />
                        <Input
                          value={filtros.cta_cod}
                          onChange={(e) => setFiltros(prev => ({ ...prev, cta_cod: e.target.value }))}
                          placeholder="Cuenta Contable"
                          className="bg-white"
                        />
                        <Input
                          value={filtros.anf_cod}
                          onChange={(e) => setFiltros(prev => ({ ...prev, anf_cod: e.target.value }))}
                          placeholder="Código Anexo Financiero *"
                          className="bg-white"
                          required
                        />
                      </div>
                    </div>

                    {/* Configuración */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                        <span>Configuración</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Select
                          value={filtros.tipoOrden}
                          onValueChange={(value: 'alfabetico' | 'numerico') => 
                            setFiltros(prev => ({ ...prev, tipoOrden: value }))
                          }
                        >
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Tipo de Orden" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="alfabetico">Alfabético</SelectItem>
                            <SelectItem value="numerico">Numérico</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Rango de Terceros */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                        <span>Rango de Terceros (NIT)</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                          value={filtros.ter_nit_ini}
                          onChange={(e) => setFiltros(prev => ({ ...prev, ter_nit_ini: e.target.value }))}
                          placeholder="NIT Inicial"
                          className="bg-white"
                        />
                        <Input
                          value={filtros.ter_nit_fin}
                          onChange={(e) => setFiltros(prev => ({ ...prev, ter_nit_fin: e.target.value }))}
                          placeholder="NIT Final"
                          className="bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center pt-4 border-t">
                    <div className="flex space-x-2">
                      <Button
                        onClick={ejecutarConsulta}
                        disabled={cargando}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2"
                      >
                        <Search className="h-4 w-4 mr-2" />
                        {cargando ? 'Consultando...' : 'Ejecutar Consulta'}
                      </Button>
                      <Button variant="outline" onClick={limpiarFiltros}>
                        Limpiar Filtros
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {isExporting && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-blue-700">
                  <span>Generando archivo Excel...</span>
                  <span>{Math.round(exportProgress)}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${exportProgress}%` }}
                  />
                </div>
                <div className="text-xs text-blue-600 text-center">
                  Procesando {resultados.length} registros...
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resultados */}
        {resultados.length > 0 && (
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-[#F7722F] to-[#00264D] text-white rounded-t-lg">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl flex items-center">
                  <Table className="h-5 w-5 mr-2" />
                  Resultados del Análisis Por Edades
                </CardTitle>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  {resultados.length} registros
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative overflow-x-auto" style={{ maxHeight: "70vh", overflowY: "auto" }}>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b-2 border-gray-200 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap">Clase</th>
                      <th className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap">Documento</th>
                      <th className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap">Fecha</th>
                      <th className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap">Vencimiento</th>
                      <th className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap">NIT</th>
                      <th className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap">Razón Social</th>
                      <th className="px-4 py-3 font-semibold text-right text-gray-700 whitespace-nowrap">Sin Vencer</th>
                      <th className="px-4 py-3 font-semibold text-right text-gray-700 whitespace-nowrap">1-30 Días</th>
                      <th className="px-4 py-3 font-semibold text-right text-gray-700 whitespace-nowrap">31-60 Días</th>
                      <th className="px-4 py-3 font-semibold text-right text-gray-700 whitespace-nowrap">61-90 Días</th>
                      <th className="px-4 py-3 font-semibold text-right text-gray-700 whitespace-nowrap">+90 Días</th>
                      <th className="px-4 py-3 font-semibold text-right text-gray-700 whitespace-nowrap">Total</th>
                      <th className="px-4 py-3 font-semibold text-right text-gray-700 whitespace-nowrap">Días Venc.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {resultadosPagina.map((registro, index) => (
                      <tr key={index} className="hover:bg-blue-50/50 transition-colors">
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap">{registro.clc_cod}</td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap">{registro.doc_num}</td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap">{formatearFecha(registro.doc_fec)}</td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap">{formatearFecha(registro.vcto_fec)}</td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap">{registro.ter_nit}</td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap">{registro.ter_raz}</td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap text-right">
                          {registro.sin_vencer > 0 ? formatearMoneda(registro.sin_vencer) : '-'}
                        </td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap text-right">
                          {registro.dias_1_30 > 0 ? formatearMoneda(registro.dias_1_30) : '-'}
                        </td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap text-right">
                          {registro.dias_31_60 > 0 ? formatearMoneda(registro.dias_31_60) : '-'}
                        </td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap text-right">
                          {registro.dias_61_90 > 0 ? formatearMoneda(registro.dias_61_90) : '-'}
                        </td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap text-right">
                          {registro.mas_90_dias > 0 ? formatearMoneda(registro.mas_90_dias) : '-'}
                        </td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap text-right font-medium">
                          {formatearMoneda(registro.total)}
                        </td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap text-right">
                          {registro.dias_vencido > 0 ? registro.dias_vencido : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t bg-gray-50">
                <DataPagination
                  currentPage={paginaActual}
                  totalPages={totalPaginas}
                  recordsPerPage={registrosPorPagina}
                  totalRecords={resultados.length}
                  onPageChange={setPaginaActual}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ReporteAnalisisAnexosVencidosPorEdadesPage;