"use client"

import type React from "react"
import { useState } from "react"
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
  const [isFiltersOpen, setIsFiltersOpen] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const ROWS_PER_PAGE = 100;

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
    
    // Validar que se ingrese una cuenta específica
    if (!filtros.cta_cod.trim()) {
      setError("Debe ingresar una cuenta específica para consultar");
      return;
    }
    
    setLoading(true);
    setError("");
    setPage(1);

    try {
      const año = new Date(filtros.doc_fec).getFullYear();
      const mesCorte = new Date(filtros.doc_fec).getMonth() + 1;
      const diaCorte = new Date(filtros.doc_fec).getDate();
      
      // Consultar con_sal para saldo inicial
      const filtrosSal = {
        fuente: 'con_sal',
        suc_cod: filtros.suc_cod,
        cta_cod: filtros.cta_cod,
        ...(filtros.enableTerNit && filtros.ter_nit ? { ter_nit: filtros.ter_nit } : {}),
        ...(filtros.enableCtoCod && filtros.cto_cod ? { cto_cod: filtros.cto_cod } : {}),
        ...(filtros.enableActCod && filtros.act_cod ? { act_cod: filtros.act_cod } : {}),
      };
      
      // Consultar con_his para movimientos del año
      const fechaIni = `${año}-01-01`;
      const fechaFin = filtros.doc_fec;
      
      const filtrosHis = {
        fuente: 'con_his',
        suc_cod: filtros.suc_cod,
        cta_cod: filtros.cta_cod,
        fecha_ini: fechaIni,
        fecha_fin: fechaFin,
        ...(filtros.enableTerNit && filtros.ter_nit ? { ter_nit: filtros.ter_nit } : {}),
        ...(filtros.enableCtoCod && filtros.cto_cod ? { cto_cod: filtros.cto_cod } : {}),
        ...(filtros.enableActCod && filtros.act_cod ? { act_cod: filtros.act_cod } : {}),
      };

      const [responseSal, responseHis] = await Promise.all([
        databaseService.consultaDocumentos(filtrosSal),
        databaseService.consultaDocumentos(filtrosHis)
      ]);
      
      // Procesar datos combinando con_sal y con_his
      const datosProcessados = procesarEstadoSaldos(responseSal || [], responseHis || [], filtros.doc_fec);
      setResultado(datosProcessados);
    } catch (err: any) {
      console.error("Error en consulta:", err);
      setError(err.message || "Error al consultar los datos");
      setResultado([]);
    } finally {
      setLoading(false);
    }
  };

  // Función para procesar los datos combinando con_sal y con_his
  const procesarEstadoSaldos = (datosSal: any[], datosHis: any[], fechaCorte: string) => {
    
    const año = new Date(fechaCorte).getFullYear();
    const mesCorte = new Date(fechaCorte).getMonth() + 1;
    const fechaLimite = new Date(fechaCorte);
    fechaLimite.setDate(fechaLimite.getDate() + 1); // Día siguiente
    
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    // Obtener saldo inicial de con_sal para la cuenta específica
    let saldoInicial = 0;
    let suc_cod = filtros.suc_cod || '';
    let suc_nom = '';
    let cta_cod = filtros.cta_cod;
    let cta_nom = '';
    
    if (datosSal && datosSal.length > 0) {
      // Tomar SOLO el primer registro de la cuenta específica
      const primerRegistro = datosSal.find(item => 
        item.cta_cod === filtros.cta_cod && item.cor_ano === año
      );
      
      if (primerRegistro) {
        saldoInicial = parseFloat(primerRegistro.sal_ini || 0);
        suc_cod = primerRegistro.suc_cod || suc_cod;
        suc_nom = primerRegistro.suc_nom || '';
        cta_nom = primerRegistro.cta_nom || '';
      }
    }
    
    // Procesar movimientos de con_his agrupados por mes para la cuenta específica
    const movimientosPorMes = new Array(13).fill(0).map(() => ({ debito: 0, credito: 0 }));
    
    if (datosHis && datosHis.length > 0) {
      // Filtrar solo los movimientos de la cuenta específica (usando año de doc_fec)
      const movimientosCuenta = datosHis.filter(item => 
        item.cta_cod === filtros.cta_cod && 
        item.doc_fec && 
        new Date(item.doc_fec).getFullYear() === año &&
        item.clc_cod !== 'SI'
      );
      
      movimientosCuenta.forEach((item) => {
        const fechaDoc = new Date(item.doc_fec);
        const mesDoc = fechaDoc.getMonth() + 1;
        const diaDoc = fechaDoc.getDate();
        
        // Solo incluir si la fecha es menor al día siguiente
        if (fechaDoc < fechaLimite) {
          const movVal = parseFloat(item.mov_val || 0);
          
          if (mesDoc >= 1 && mesDoc <= 12) {
            if (movVal > 0) {
              movimientosPorMes[mesDoc].debito += movVal;
            } else if (movVal < 0) {
              movimientosPorMes[mesDoc].credito += movVal; // Mantener el valor negativo
            }
          }
        }
      });
    }
    
    // Crear resultado
    const resultado = [];
    let saldoAcumulado = saldoInicial;
    let totalDebito = 0;
    let totalCredito = 0;
    
    // Fila inicial
    resultado.push({
      suc_cod: suc_cod,
      suc_nom: suc_nom,
      cta_cod: cta_cod,
      cta_nom: cta_nom,
      mes: 'Inicial',
      credito: 0,
      debito: 0,
      saldo: saldoInicial
    });
    
    // Filas mensuales hasta el mes de corte
    for (let i = 1; i <= mesCorte; i++) {
      const debito = movimientosPorMes[i].debito;
      const credito = movimientosPorMes[i].credito;
      
      // El saldo se calcula: saldo anterior + débitos - créditos
      saldoAcumulado = saldoAcumulado + debito - credito;
      
      resultado.push({
        suc_cod: suc_cod,
        suc_nom: suc_nom,
        cta_cod: cta_cod,
        cta_nom: cta_nom,
        mes: meses[i - 1],
        credito: credito,
        debito: debito,
        saldo: saldoAcumulado
      });
      
      totalDebito += debito;
      totalCredito += credito;
    }
    
    // Fila total
    resultado.push({
      suc_cod: suc_cod,
      suc_nom: suc_nom,
      cta_cod: cta_cod,
      cta_nom: cta_nom,
      mes: `TOTAL ${año}`,
      credito: totalCredito,
      debito: totalDebito,
      saldo: saldoInicial + totalDebito - totalCredito
    });
    
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
                        <span className="text-red-500 text-xs">(Cuenta es obligatoria)</span>
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
                          placeholder="Cuenta (Requerida)"
                          value={filtros.cta_cod}
                          onChange={handleChange}
                          className="bg-white"
                          required
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