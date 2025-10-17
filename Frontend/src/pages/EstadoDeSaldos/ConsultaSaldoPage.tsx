"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { databaseService } from "@/services/database"
import { formatCellValue } from "@/utils/formatters"
import { schemaService } from "@/services/schemaService"
import { DataPagination } from "@/components/DataPagination"
import { ExcelExporter } from "@/components/ExcelExporter"
import {
  ArrowLeft,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Table,
  Calendar,
  Building,
  User,
  CreditCard,
  Target,
  Activity,
} from "lucide-react"
import { useNavigate } from "react-router-dom"

export const mencod = '010310';

const getColumnDescription = (key: string): string => {
  const col = schemaService.getTableColumns().find((c) => c.name === key)
  return col?.description || key
}

type Filtros = {
  suc_cod: string
  doc_fec: string
  cta_cod: string
  ter_nit: string
  cto_cod: string
  act_cod: string
  enableTerNit: boolean
  enableCtoCod: boolean
  enableActCod: boolean
}

const ConsultaSaldoPage = () => {
  const navigate = useNavigate()
  const [filtros, setFiltros] = useState<Filtros>({
    suc_cod: "",
    doc_fec: new Date().toISOString().split('T')[0], // Fecha actual por defecto
    cta_cod: "",
    ter_nit: "",
    cto_cod: "",
    act_cod: "",
    enableTerNit: false,
    enableCtoCod: false,
    enableActCod: false,
  });

  const [resultado, setResultado] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const ROWS_PER_PAGE = 100;

  useEffect(() => {
    handleSubmit(new Event("submit") as unknown as React.FormEvent)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFiltros((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggleChange = (field: keyof Filtros, checked: boolean) => {
    setFiltros((prev) => ({ 
      ...prev, 
      [field]: checked,
      // Limpiar el campo si se deshabilita
      ...(field === 'enableTerNit' && !checked ? { ter_nit: '' } : {}),
      ...(field === 'enableCtoCod' && !checked ? { cto_cod: '' } : {}),
      ...(field === 'enableActCod' && !checked ? { act_cod: '' } : {}),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Preparar filtros para envío (solo incluir campos habilitados)
    const filtrosParaEnvio = {
      fuente: 'con_sal',
      suc_cod: filtros.suc_cod,
      doc_fec: filtros.doc_fec,
      cta_cod: filtros.cta_cod,
      ...(filtros.enableTerNit && filtros.ter_nit ? { ter_nit: filtros.ter_nit } : {}),
      ...(filtros.enableCtoCod && filtros.cto_cod ? { cto_cod: filtros.cto_cod } : {}),
      ...(filtros.enableActCod && filtros.act_cod ? { act_cod: filtros.act_cod } : {}),
    };

    console.log("Enviando filtros:", filtrosParaEnvio);
    setLoading(true);
    setError("");
    setPage(1);

    try {
      const response = await databaseService.consultaDocumentos(filtrosParaEnvio);
      console.log("Respuesta del servidor:", response);
      console.log("Cantidad de registros:", response?.length || 0);
      
      if (!response || response.length === 0) {
        setError("No se encontraron datos para los filtros especificados");
        setResultado([]);
        return;
      }
      
      // Procesar datos para mostrar formato de estado de saldos
      const datosProcessados = procesarEstadoSaldos(response, filtros.doc_fec);
      console.log("Datos procesados:", datosProcessados);
      setResultado(datosProcessados);
    } catch (err: any) {
      console.error("Error en consulta:", err);
      setError(err.message || "Error al consultar los datos");
      setResultado([]);
    } finally {
      setLoading(false);
    }
  };

  // Función para procesar los datos según la lógica del programa CGC250.w
  const procesarEstadoSaldos = (datos: any[], fechaCorte: string) => {
    console.log("Procesando datos:", datos);
    
    const año = fechaCorte ? new Date(fechaCorte).getFullYear() : new Date().getFullYear();
    const mesCorte = fechaCorte ? new Date(fechaCorte).getMonth() + 1 : 12;
    
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    // Acumular todos los datos en una sola estructura (como hace el programa original)
    const acumulado = {
      suc_cod: filtros.suc_cod || '',
      suc_nom: '',
      cta_cod: filtros.cta_cod || '',
      cta_nom: '',
      sal_ini: 0,
      mesesDebito: new Array(13).fill(0),
      mesesCredito: new Array(13).fill(0)
    };
    
    // Si hay datos, procesarlos
    if (datos && datos.length > 0) {
      // Solo mostrar sucursal y cuenta si están filtradas específicamente
      if (filtros.suc_cod) {
        acumulado.suc_cod = datos[0].suc_cod || filtros.suc_cod;
        acumulado.suc_nom = datos[0].suc_nom || '';
      }
      if (filtros.cta_cod) {
        acumulado.cta_cod = datos[0].cta_cod || filtros.cta_cod;
        acumulado.cta_nom = datos[0].cta_nom || '';
      }
      
      // Acumular todos los registros
      datos.forEach(item => {
        // Verificar sal_tip (puede ser nombre de tabla con o sin prefijo con_)
        const salTip = item.sal_tip;
        const esSaldo = salTip === 'S' || 
                       salTip === 'ssuc' || salTip === 'con_ssuc' ||
                       salTip === 'snit' || salTip === 'con_snit' ||
                       salTip === 'scto' || salTip === 'con_scto' ||
                       salTip === 'scnt' || salTip === 'con_scnt' ||
                       salTip === 'scac' || salTip === 'con_scac' ||
                       salTip === 'scna' || salTip === 'con_scna';
        
        if (esSaldo && item.cor_ano === año) {
          acumulado.sal_ini += parseFloat(item.sal_ini || 0);
          const mes = item.cor_mes;
          if (mes >= 1 && mes <= 12) {
            acumulado.mesesDebito[mes] += parseFloat(item.sal_deb || 0);
            acumulado.mesesCredito[mes] += parseFloat(item.sal_crd || 0);
          }
        }
      });
    }
    
    // Crear resultado consolidado (una sola vez cada mes)
    const resultado = [];
    let saldoAcumulado = acumulado.sal_ini;
    let totalDebito = 0;
    let totalCredito = 0;
    
    // Fila inicial
    resultado.push({
      suc_cod: acumulado.suc_cod,
      suc_nom: acumulado.suc_nom,
      cta_cod: acumulado.cta_cod,
      cta_nom: acumulado.cta_nom,
      mes: 'Inicial',
      credito: 0,
      debito: 0,
      saldo: saldoAcumulado
    });
    
    // Filas mensuales hasta el mes de corte
    for (let i = 1; i <= mesCorte; i++) {
      const debito = acumulado.mesesDebito[i];
      const credito = acumulado.mesesCredito[i];
      saldoAcumulado = saldoAcumulado + debito + credito;
      
      resultado.push({
        suc_cod: acumulado.suc_cod,
        suc_nom: acumulado.suc_nom,
        cta_cod: acumulado.cta_cod,
        cta_nom: acumulado.cta_nom,
        mes: meses[i - 1],
        credito: credito,
        debito: debito,
        saldo: saldoAcumulado
      });
      
      totalDebito += debito;
      totalCredito += credito;
    }
    
    // Fila total (una sola vez)
    resultado.push({
      suc_cod: acumulado.suc_cod,
      suc_nom: acumulado.suc_nom,
      cta_cod: acumulado.cta_cod,
      cta_nom: acumulado.cta_nom,
      mes: `TOTAL ${año}`,
      credito: totalCredito,
      debito: totalDebito,
      saldo: saldoAcumulado
    });
    
    console.log("Resultado procesado:", resultado);
    return resultado;
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filtros.suc_cod.trim()) count++;
    if (filtros.doc_fec.trim()) count++;
    if (filtros.cta_cod.trim()) count++;
    if (filtros.enableTerNit && filtros.ter_nit.trim()) count++;
    if (filtros.enableCtoCod && filtros.cto_cod.trim()) count++;
    if (filtros.enableActCod && filtros.act_cod.trim()) count++;
    return count;
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="hover:bg-white/80">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al inicio
            </Button>
            <div className="h-6 w-px bg-gray-300" />
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Table className="h-6 w-6 mr-2 text-blue-600" />
              Consulta Saldo
            </h1>
          </div>

          {resultado.length > 0 && (
            <div className="flex gap-2">
              <ExcelExporter
                data={resultado}
                filename={`consulta_saldo_CSV_${new Date().toISOString().split("T")[0]}`}
                sheetName="Consulta Saldo"
                format="csv"
                onProgressChange={(progress) => setExportProgress(progress)}
                onGeneratingChange={(generating) => setIsExporting(generating)}
                getColumnDescription={getColumnDescription}
              />
              <ExcelExporter
                data={resultado}
                filename={`consulta_saldo_${new Date().toISOString().split("T")[0]}`}
                sheetName="Consulta Saldo"
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
                    <CardTitle className="text-lg">Filtros de Búsqueda</CardTitle>
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
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-6">
                    {/* Filtros Básicos */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                        <Building className="h-4 w-4" />
                        <span>Información Básica</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Input
                          name="suc_cod"
                          placeholder="Sucursal"
                          value={filtros.suc_cod}
                          onChange={handleChange}
                          className="bg-white"
                        />
                        <Input
                          type="date"
                          name="doc_fec"
                          placeholder="Fecha de Corte"
                          value={filtros.doc_fec}
                          onChange={handleChange}
                          className="bg-white"
                        />
                        <Input
                          name="cta_cod"
                          placeholder="Cuenta"
                          value={filtros.cta_cod}
                          onChange={handleChange}
                          className="bg-white"
                        />
                      </div>
                    </div>

                    {/* Filtro NIT con Toggle */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                        <User className="h-4 w-4" />
                        <span>Filtro por NIT</span>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="enable-ter-nit"
                            checked={filtros.enableTerNit}
                            onCheckedChange={(checked) => handleToggleChange('enableTerNit', checked)}
                          />
                          <Label htmlFor="enable-ter-nit" className="text-sm">
                            Habilitar filtro por NIT
                          </Label>
                        </div>
                        <Input
                          name="ter_nit"
                          placeholder="NIT"
                          value={filtros.ter_nit}
                          onChange={handleChange}
                          disabled={!filtros.enableTerNit}
                          className={`bg-white ${!filtros.enableTerNit ? 'opacity-50' : ''}`}
                        />
                      </div>
                    </div>

                    {/* Filtro Centro con Toggle */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                        <Target className="h-4 w-4" />
                        <span>Filtro por Centro</span>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="enable-cto-cod"
                            checked={filtros.enableCtoCod}
                            onCheckedChange={(checked) => handleToggleChange('enableCtoCod', checked)}
                          />
                          <Label htmlFor="enable-cto-cod" className="text-sm">
                            Habilitar filtro por Centro
                          </Label>
                        </div>
                        <Input
                          name="cto_cod"
                          placeholder="Centro"
                          value={filtros.cto_cod}
                          onChange={handleChange}
                          disabled={!filtros.enableCtoCod}
                          className={`bg-white ${!filtros.enableCtoCod ? 'opacity-50' : ''}`}
                        />
                      </div>
                    </div>

                    {/* Filtro Actividad con Toggle */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                        <Activity className="h-4 w-4" />
                        <span>Filtro por Actividad</span>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="enable-act-cod"
                            checked={filtros.enableActCod}
                            onCheckedChange={(checked) => handleToggleChange('enableActCod', checked)}
                          />
                          <Label htmlFor="enable-act-cod" className="text-sm">
                            Habilitar filtro por Actividad
                          </Label>
                        </div>
                        <Input
                          name="act_cod"
                          placeholder="Actividad"
                          value={filtros.act_cod}
                          onChange={handleChange}
                          disabled={!filtros.enableActCod}
                          className={`bg-white ${!filtros.enableActCod ? 'opacity-50' : ''}`}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center pt-4 border-t">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2"
                    >
                      <Search className="h-4 w-4 mr-2" />
                      {loading ? "Consultando..." : "Consultar Saldo"}
                    </Button>
                  </div>
                </form>
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
                  Procesando {resultado.length} registros...
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="text-red-600 text-center">{error}</div>
            </CardContent>
          </Card>
        )}

        {/* Resultados */}
        {resultado.length > 0 && (
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-[#F7722F] to-[#00264D] text-white rounded-t-lg">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl flex items-center">
                  <Table className="h-5 w-5 mr-2" />
                  Consulta Saldo
                </CardTitle>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  {resultado.length} registros
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative overflow-x-auto" style={{ maxHeight: "70vh", overflowY: "auto" }}>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b-2 border-gray-200 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap">Sucursal</th>
                      <th className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap">Nombre Sucursal</th>
                      <th className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap">Cuenta</th>
                      <th className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap">Descripción Cuenta</th>
                      <th className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap">Mes</th>
                      <th className="px-4 py-3 font-semibold text-right text-gray-700 whitespace-nowrap">Crédito</th>
                      <th className="px-4 py-3 font-semibold text-right text-gray-700 whitespace-nowrap">Débito</th>
                      <th className="px-4 py-3 font-semibold text-right text-gray-700 whitespace-nowrap">Saldo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {resultado.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE).map((row, i) => (
                      <tr 
                        key={i} 
                        className={`hover:bg-blue-50/50 transition-colors ${
                          row.mes.startsWith('TOTAL') ? 'bg-yellow-50 font-semibold border-t-2 border-yellow-200' : ''
                        }`}
                      >
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap">{row.suc_cod}</td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap">{row.suc_nom}</td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap">{row.cta_cod}</td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap">{row.cta_nom}</td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap">{row.mes}</td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap text-right">
                          {new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2 }).format(row.credito)}
                        </td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap text-right">
                          {new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2 }).format(row.debito)}
                        </td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap text-right">
                          {new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2 }).format(row.saldo)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t bg-gray-50">
                <DataPagination
                  currentPage={page}
                  totalPages={Math.ceil(resultado.length / ROWS_PER_PAGE)}
                  recordsPerPage={ROWS_PER_PAGE}
                  totalRecords={resultado.length}
                  onPageChange={setPage}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default ConsultaSaldoPage