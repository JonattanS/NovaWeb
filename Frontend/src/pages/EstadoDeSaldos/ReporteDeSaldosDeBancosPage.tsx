"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
  Landmark,
  Calendar,
  Building,
  CreditCard,
} from "lucide-react"
import { useNavigate } from "react-router-dom"

export const mencod = '011612';

const getColumnDescription = (key: string): string => {
  const col = schemaService.getTableColumns().find((c) => c.name === key)
  return col?.description || key
}

type Filtros = {
  suc_cod: string
  cta_cod_ini: string
  cta_cod_fin: string
  doc_fec: string
}

const ReporteDeSaldosDeBancosPage = () => {
  const navigate = useNavigate()
  const [filtros, setFiltros] = useState<Filtros>({
    suc_cod: "",
    cta_cod_ini: "",
    cta_cod_fin: "",
    doc_fec: new Date().toISOString().split('T')[0], // Fecha actual por defecto
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    setError("");
    setPage(1);

    try {
      // Consultar con_sal para obtener saldos iniciales (busca por con_ssuc)
      const filtrosSal = {
        fuente: 'con_sal',
        suc_cod: filtros.suc_cod,
        cta_cod_ini: filtros.cta_cod_ini,
        cta_cod_fin: filtros.cta_cod_fin,
      };
      
      const responseSal = await databaseService.consultaDocumentos(filtrosSal);
      console.log("Datos con_sal:", responseSal);
      
      // Consultar con_his para obtener movimientos del mes (busca por bco_cod)
      const fechaCorte = new Date(filtros.doc_fec);
      const fechaIni = new Date(fechaCorte.getFullYear(), fechaCorte.getMonth(), 1);
      
      const filtrosHis = {
        fuente: 'con_his',
        suc_cod: filtros.suc_cod,
        bco_cod_ini: filtros.cta_cod_ini, // Usar bco_cod en lugar de cta_cod
        bco_cod_fin: filtros.cta_cod_fin,
        fecha_ini: fechaIni.toISOString().split('T')[0],
        fecha_fin: filtros.doc_fec,
      };
      
      const responseHis = await databaseService.consultaDocumentos(filtrosHis);
      console.log("Datos con_his:", responseHis);
      
      // Procesar datos combinando con_sal y con_his
      const datosProcessados = procesarLibroBancos(responseSal || [], responseHis || [], filtros.doc_fec);
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

  // Función para procesar los datos del libro de bancos
  const procesarLibroBancos = (datosSal: any[], datosHis: any[], fechaCorte: string) => {
    console.log("Procesando libro de bancos:", { datosSal, datosHis, fechaCorte });
    
    const año = fechaCorte ? new Date(fechaCorte).getFullYear() : new Date().getFullYear();
    const mesCorte = fechaCorte ? new Date(fechaCorte).getMonth() + 1 : 12;
    
    console.log("Parámetros de corte:", { año, mesCorte, fechaCorte });
    
    // Agrupar saldos de con_sal por cuenta (busca con_ssuc)
    console.log("=== INICIANDO PROCESAMIENTO CON_SAL ===");
    console.log("Total registros con_sal recibidos:", datosSal.length);
    console.log("Filtros aplicados:", { cta_cod_ini: filtros.cta_cod_ini, cta_cod_fin: filtros.cta_cod_fin, año });
    
    const saldosAgrupados = datosSal.reduce((acc, item, index) => {
      console.log(`\n--- Procesando item ${index + 1}/${datosSal.length} ---`);
      console.log("Item completo:", item);
      
      // Verificar sal_tip para saldos de con_ssuc (equivalente a CON_SSUC)
      const salTip = item.sal_tip;
      const esSaldoSsuc = salTip === 'ssuc' || salTip === 'con_ssuc';
      
      console.log("Verificación sal_tip:", { salTip, esSaldoSsuc, cor_ano: item.cor_ano, año, añoCoincide: item.cor_ano === año });
      
      if (!esSaldoSsuc) {
        console.log("❌ FILTRADO: sal_tip no es ssuc/con_ssuc");
        return acc;
      }
      
      if (item.cor_ano !== año) {
        console.log("❌ FILTRADO: año no coincide");
        return acc;
      }
      
      // Filtrar solo cuentas que estén en el rango especificado
      const ctaCod = item.cta_cod || '';
      console.log("Verificando cuenta:", { ctaCod, cta_cod_ini: filtros.cta_cod_ini, cta_cod_fin: filtros.cta_cod_fin });
      
      let esCtaBanco = false;
      
      // Verificar si la cuenta está en el rango
      if (filtros.cta_cod_ini && filtros.cta_cod_fin) {
        // Comparación numérica para rangos de cuentas
        const ctaNum = parseInt(ctaCod.replace(/\D/g, '')) || 0;
        const iniNum = parseInt(filtros.cta_cod_ini.replace(/\D/g, '')) || 0;
        const finNum = parseInt(filtros.cta_cod_fin.replace(/\D/g, '')) || 0;
        
        esCtaBanco = ctaNum >= iniNum && ctaNum <= finNum;
        console.log("Comparación numérica:", { ctaNum, iniNum, finNum, esCtaBanco });
        
        // También verificar comparación de strings como fallback
        const esCtaBancoStr = ctaCod >= filtros.cta_cod_ini && ctaCod <= filtros.cta_cod_fin;
        console.log("Comparación string:", { ctaCod, esCtaBancoStr });
        
        // Usar cualquiera de las dos comparaciones
        esCtaBanco = esCtaBanco || esCtaBancoStr;
      } else if (filtros.cta_cod_ini) {
        esCtaBanco = ctaCod.startsWith(filtros.cta_cod_ini);
        console.log("Verificación startsWith ini:", { ctaCod, filtros_ini: filtros.cta_cod_ini, esCtaBanco });
      } else if (filtros.cta_cod_fin) {
        esCtaBanco = ctaCod.startsWith(filtros.cta_cod_fin);
        console.log("Verificación startsWith fin:", { ctaCod, filtros_fin: filtros.cta_cod_fin, esCtaBanco });
      } else {
        esCtaBanco = true; // Si no hay filtros, incluir todas
        console.log("Sin filtros de cuenta, incluir todas");
      }
      
      if (!esCtaBanco) {
        console.log("❌ FILTRADO: cuenta no está en el rango especificado");
        return acc;
      }
      
      console.log("✅ CUENTA ACEPTADA:", ctaCod);
      
      const key = ctaCod;
      if (!acc[key]) {
        acc[key] = {
          cta_cod: ctaCod,
          bco_des: item.cta_nom || '', // Descripción del banco
          saldo_inicial: 0,
          movimientos_anteriores: 0,
          debitos_mes: 0,
          creditos_mes: 0
        };
      }
      
      // Acumular saldo inicial (sal_ini)
      const salIni = parseFloat(item.sal_ini || 0);
      acc[key].saldo_inicial += salIni;
      
      // Acumular movimientos hasta el mes anterior al corte
      const salDeb = parseFloat(item.sal_deb || 0);
      const salCrd = parseFloat(item.sal_crd || 0);
      
      // Calcular movimientos hasta el mes anterior
      if (item.cor_mes && item.cor_mes < mesCorte) {
        acc[key].movimientos_anteriores += salDeb + salCrd;
      } else {
        // Si no hay cor_mes, usar proporción hasta el mes anterior
        const proporcion = Math.max(0, (mesCorte - 1) / 12);
        acc[key].movimientos_anteriores += (salDeb + salCrd) * proporcion;
      }
      
      console.log("Acumulando saldos banco:", { key, salIni, salDeb, salCrd });
      
      return acc;
    }, {});
    
    // Procesar movimientos de con_his del mes actual (busca por bco_cod)
    console.log("\n=== INICIANDO PROCESAMIENTO CON_HIS ===");
    console.log("Total registros con_his recibidos:", datosHis.length);
    
    datosHis.forEach((item, index) => {
      console.log(`\n--- Procesando movimiento ${index + 1}/${datosHis.length} ---`);
      console.log("Item con_his:", { clc_cod: item.clc_cod, doc_num: item.doc_num, mov_val: item.mov_val, bco_cod: item.bco_cod, bco_nom: item.bco_nom });
      if (item.clc_cod && item.doc_num > 0 && item.mov_val !== undefined && item.bco_cod) {
        // Filtrar documentos válidos
        if (item.clc_cod === 'SAL') return; // Excluir saldos iniciales
        
        const key = item.bco_cod; // Usar bco_cod como clave
        
        // Crear entrada si no existe
        if (!saldosAgrupados[key]) {
          saldosAgrupados[key] = {
            cta_cod: item.bco_cod,
            bco_des: item.bco_nom || '',
            saldo_inicial: 0,
            movimientos_anteriores: 0,
            debitos_mes: 0,
            creditos_mes: 0
          };
        }
        
        // Acumular movimientos del mes actual usando mov_val
        // Positivos = débitos, Negativos = créditos
        const movVal = parseFloat(item.mov_val || 0);
        if (movVal > 0) {
          saldosAgrupados[key].debitos_mes += movVal;
        } else if (movVal < 0) {
          saldosAgrupados[key].creditos_mes += Math.abs(movVal);
        }
      }
    });
    
    // Convertir a array y calcular saldos
    const resultado = Object.values(saldosAgrupados).map((grupo: any) => {
      // Saldo anterior = saldo inicial + movimientos anteriores - movimientos del mes
      const saldoAnterior = grupo.saldo_inicial + grupo.movimientos_anteriores - (grupo.debitos_mes + grupo.creditos_mes);
      // Saldo actual = saldo inicial + todos los movimientos
      const saldoActual = grupo.saldo_inicial + grupo.movimientos_anteriores;
      
      return {
        cta_cod: grupo.cta_cod,
        bco_des: grupo.bco_des,
        saldo_anterior: saldoAnterior,
        debitos_mes: grupo.debitos_mes,
        creditos_mes: grupo.creditos_mes,
        saldo: saldoActual
      };
    }).filter(item => 
      // Solo incluir si hay saldos o movimientos
      item.saldo_anterior !== 0 || item.debitos_mes !== 0 || item.creditos_mes !== 0 || item.saldo !== 0
    );
    
    // Ordenar por código de cuenta
    resultado.sort((a, b) => a.cta_cod.localeCompare(b.cta_cod));
    
    console.log("\n=== RESUMEN FINAL ===");
    console.log("Total cuentas agrupadas:", Object.keys(saldosAgrupados).length);
    console.log("Cuentas agrupadas:", Object.keys(saldosAgrupados));
    console.log("Total registros en resultado final:", resultado.length);
    console.log("Resultado procesado:", resultado);
    return resultado;
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filtros.suc_cod.trim()) count++;
    if (filtros.cta_cod_ini.trim()) count++;
    if (filtros.cta_cod_fin.trim()) count++;
    if (filtros.doc_fec.trim()) count++;
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
              <Landmark className="h-6 w-6 mr-2 text-blue-600" />
              Reporte de Saldos de Bancos
            </h1>
          </div>

          {resultado.length > 0 && (
            <div className="flex gap-2">
              <ExcelExporter
                data={resultado}
                filename={`reporte_saldos_bancos_CSV_${new Date().toISOString().split("T")[0]}`}
                sheetName="Reporte de Saldos de Bancos"
                format="csv"
                onProgressChange={(progress) => setExportProgress(progress)}
                onGeneratingChange={(generating) => setIsExporting(generating)}
                getColumnDescription={getColumnDescription}
              />
              <ExcelExporter
                data={resultado}
                filename={`reporte_saldos_bancos_${new Date().toISOString().split("T")[0]}`}
                sheetName="Reporte de Saldos de Bancos"
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
                    {/* Información General */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                        <span>Información General</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                      </div>
                    </div>

                    {/* Rango de Cuentas */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                        <span>Rango de Cuentas Bancarias</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                          name="cta_cod_ini"
                          placeholder="Cuenta Inicial"
                          value={filtros.cta_cod_ini}
                          onChange={handleChange}
                          className="bg-white"
                        />
                        <Input
                          name="cta_cod_fin"
                          placeholder="Cuenta Final"
                          value={filtros.cta_cod_fin}
                          onChange={handleChange}
                          className="bg-white"
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
                      {loading ? "Consultando..." : "Generar Reporte"}
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
                  <Landmark className="h-5 w-5 mr-2" />
                  Reporte de Saldos de Bancos
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
                      <th className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap">Cuenta Contable</th>
                      <th className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap">Descripción</th>
                      <th className="px-4 py-3 font-semibold text-right text-gray-700 whitespace-nowrap">Saldo Anterior</th>
                      <th className="px-4 py-3 font-semibold text-right text-gray-700 whitespace-nowrap">Débitos Mes</th>
                      <th className="px-4 py-3 font-semibold text-right text-gray-700 whitespace-nowrap">Créditos Mes</th>
                      <th className="px-4 py-3 font-semibold text-right text-gray-700 whitespace-nowrap">Saldo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {resultado.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE).map((row, i) => (
                      <tr key={i} className="hover:bg-blue-50/50 transition-colors">
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap">{row.cta_cod}</td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap">{row.bco_des}</td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap text-right">
                          {new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2 }).format(row.saldo_anterior)}
                        </td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap text-right">
                          {new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2 }).format(row.debitos_mes)}
                        </td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap text-right">
                          {new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2 }).format(row.creditos_mes)}
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

export default ReporteDeSaldosDeBancosPage