"use client"

import type React from "react"
import { useState } from "react"
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
  FileText,
  Calendar,
  Building,
  CreditCard,
  Users,
  Hash,
  CheckCircle,
} from "lucide-react"
import { useNavigate } from "react-router-dom"

export const mencod = '011804';

const getColumnDescription = (key: string): string => {
  const col = schemaService.getTableColumns().find((c) => c.name === key)
  return col?.description || key
}

type Filtros = {
  suc_cod: string
  clc_cod: string
  doc_num_ini: string
  doc_num_fin: string
  anx_cod_ini: string
  anx_cod_fin: string
  ter_nit_ini: string
  ter_nit_fin: string
  doc_num_ref_ini: string
  doc_num_ref_fin: string
  doc_fec_ref_ini: string
  doc_fec_ref_fin: string
  cta_cod_ini: string
  cta_cod_fin: string
  anf_cod_ini: string
  anf_cod_fin: string
  doc_est_ini: string
  doc_est_fin: string
  fecha_ini: string
  fecha_fin: string
}

const HojaDeVidaAnexoPage = () => {
  const navigate = useNavigate()
  const [filtros, setFiltros] = useState<Filtros>({
    suc_cod: "",
    clc_cod: "",
    doc_num_ini: "",
    doc_num_fin: "",
    anx_cod_ini: "",
    anx_cod_fin: "",
    ter_nit_ini: "",
    ter_nit_fin: "",
    doc_num_ref_ini: "",
    doc_num_ref_fin: "",
    doc_fec_ref_ini: "",
    doc_fec_ref_fin: "",
    cta_cod_ini: "",
    cta_cod_fin: "",
    anf_cod_ini: "",
    anf_cod_fin: "",
    doc_est_ini: "",
    doc_est_fin: "",
    fecha_ini: "",
    fecha_fin: "",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    setError("");
    setPage(1);

    try {
      // Consultar con_his para obtener la hoja de vida del anexo
      const filtrosConsulta = {
        fuente: 'con_his',
        suc_cod: filtros.suc_cod,
        clc_cod: filtros.clc_cod,
        doc_num_ini: filtros.doc_num_ini,
        doc_num_fin: filtros.doc_num_fin,
        anx_cod_ini: filtros.anx_cod_ini,
        anx_cod_fin: filtros.anx_cod_fin,
        ter_nit_ini: filtros.ter_nit_ini,
        ter_nit_fin: filtros.ter_nit_fin,
        doc_num_ref_ini: filtros.doc_num_ref_ini,
        doc_num_ref_fin: filtros.doc_num_ref_fin,
        doc_fec_ref_ini: filtros.doc_fec_ref_ini,
        doc_fec_ref_fin: filtros.doc_fec_ref_fin,
        cta_cod_ini: filtros.cta_cod_ini,
        cta_cod_fin: filtros.cta_cod_fin,
        anf_cod_ini: filtros.anf_cod_ini,
        anf_cod_fin: filtros.anf_cod_fin,
        doc_est_ini: filtros.doc_est_ini,
        doc_est_fin: filtros.doc_est_fin,
        fecha_ini: filtros.fecha_ini,
        fecha_fin: filtros.fecha_fin,
      };
      
      const response = await databaseService.consultaDocumentos(filtrosConsulta);
      console.log("Datos hoja de vida anexo:", response);
      
      // Procesar y filtrar datos relevantes para anexos
      const datosProcessados = procesarHojaDeVidaAnexo(response || []);
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

  // Función para procesar los datos de la hoja de vida del anexo
  const procesarHojaDeVidaAnexo = (datos: any[]) => {
    console.log("Procesando hoja de vida anexo:", datos);
    
    // Filtrar solo registros que tengan anexo (anx_cod o anf_cod)
    const datosAnexo = datos.filter(item => 
      item.anx_cod || item.anf_cod
    );
    
    // Mapear los datos con la información relevante
    const resultado = datosAnexo.map(item => ({
      suc_cod: item.suc_cod || '',
      suc_nom: item.suc_nom || '',
      clc_cod: item.clc_cod || '',
      clc_nom: item.clc_nom || '',
      doc_num: item.doc_num || '',
      doc_fec: item.doc_fec || '',
      doc_num_ref: item.doc_num_ref || '',
      doc_fec_ref: item.doc_fec_ref || '',
      ter_nit: item.ter_nit || '',
      ter_raz: item.ter_raz || '',
      cta_cod: item.cta_cod || '',
      cta_nom: item.cta_nom || '',
      anx_cod: item.anx_cod || '',
      anx_nom: item.anx_nom || '',
      anf_cod: item.anf_cod || '',
      anf_nom: item.anf_nom || '',
      mov_val: parseFloat(item.mov_val || 0),
      mov_det: item.mov_det || '',
      doc_est: item.doc_est || '',
      est_nom: item.est_nom || '',
      doc_obs: item.doc_obs || '',
      usr_cod: item.usr_cod || '',
      usr_nom: item.usr_nom || '',
      usr_fec: item.usr_fec || '',
      usr_hor: item.usr_hor || '',
      anf_vcto: item.anf_vcto || '',
      anf_tip: item.anf_tip || '',
      anf_cla: item.anf_cla || '',
      mov_cons: item.mov_cons || ''
    }));
    
    // Ordenar por sucursal, clase, documento y consecutivo de movimiento
    resultado.sort((a, b) => {
      if (a.suc_cod !== b.suc_cod) return a.suc_cod.localeCompare(b.suc_cod);
      if (a.clc_cod !== b.clc_cod) return a.clc_cod.localeCompare(b.clc_cod);
      if (a.doc_num !== b.doc_num) return a.doc_num.localeCompare(b.doc_num);
      return (a.mov_cons || '').toString().localeCompare((b.mov_cons || '').toString());
    });
    
    console.log("Resultado procesado:", resultado);
    return resultado;
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    Object.values(filtros).forEach(value => {
      if (value && value.toString().trim()) count++;
    });
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
              <FileText className="h-6 w-6 mr-2 text-blue-600" />
              Hoja de Vida Anexo
            </h1>
          </div>

          {resultado.length > 0 && (
            <div className="flex gap-2">
              <ExcelExporter
                data={resultado}
                filename={`hoja_vida_anexo_CSV_${new Date().toISOString().split("T")[0]}`}
                sheetName="Hoja de Vida Anexo"
                format="csv"
                onProgressChange={(progress) => setExportProgress(progress)}
                onGeneratingChange={(generating) => setIsExporting(generating)}
                getColumnDescription={getColumnDescription}
              />
              <ExcelExporter
                data={resultado}
                filename={`hoja_vida_anexo_${new Date().toISOString().split("T")[0]}`}
                sheetName="Hoja de Vida Anexo"
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
                          name="clc_cod"
                          placeholder="Clase"
                          value={filtros.clc_cod}
                          onChange={handleChange}
                          className="bg-white"
                        />
                      </div>
                    </div>

                    {/* Rango de Documentos */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                        <span>Rango de Documentos</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                          name="doc_num_ini"
                          placeholder="Documento Inicial"
                          value={filtros.doc_num_ini}
                          onChange={handleChange}
                          className="bg-white"
                        />
                        <Input
                          name="doc_num_fin"
                          placeholder="Documento Final"
                          value={filtros.doc_num_fin}
                          onChange={handleChange}
                          className="bg-white"
                        />
                      </div>
                    </div>

                    {/* Rango de Anexos */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                        <span>Rango de Anexos</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                          name="anx_cod_ini"
                          placeholder="Anexo Inicial"
                          value={filtros.anx_cod_ini}
                          onChange={handleChange}
                          className="bg-white"
                        />
                        <Input
                          name="anx_cod_fin"
                          placeholder="Anexo Final"
                          value={filtros.anx_cod_fin}
                          onChange={handleChange}
                          className="bg-white"
                        />
                      </div>
                    </div>

                    {/* Rango de NITs */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                        <span>Rango de NITs</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                          name="ter_nit_ini"
                          placeholder="NIT Inicial"
                          value={filtros.ter_nit_ini}
                          onChange={handleChange}
                          className="bg-white"
                        />
                        <Input
                          name="ter_nit_fin"
                          placeholder="NIT Final"
                          value={filtros.ter_nit_fin}
                          onChange={handleChange}
                          className="bg-white"
                        />
                      </div>
                    </div>

                    {/* Documento Referencia */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                        <span>Doc. Num. Ref</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                          name="doc_num_ref_ini"
                          placeholder="Doc. Ref. Inicial"
                          value={filtros.doc_num_ref_ini}
                          onChange={handleChange}
                          className="bg-white"
                        />
                        <Input
                          name="doc_num_ref_fin"
                          placeholder="Doc. Ref. Final"
                          value={filtros.doc_num_ref_fin}
                          onChange={handleChange}
                          className="bg-white"
                        />
                      </div>
                    </div>

                    {/* Fecha Referencia */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                        <span>Fecha Ref.</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                          type="date"
                          name="doc_fec_ref_ini"
                          placeholder="Fecha Ref. Inicial"
                          value={filtros.doc_fec_ref_ini}
                          onChange={handleChange}
                          className="bg-white"
                        />
                        <Input
                          type="date"
                          name="doc_fec_ref_fin"
                          placeholder="Fecha Ref. Final"
                          value={filtros.doc_fec_ref_fin}
                          onChange={handleChange}
                          className="bg-white"
                        />
                      </div>
                    </div>

                    {/* Rango de Cuentas */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                        <span>Rango de Cuentas</span>
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

                    {/* Anexos Financieros */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                        <span>Anexos Financieros</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                          name="anf_cod_ini"
                          placeholder="Anexo Financiero Inicial"
                          value={filtros.anf_cod_ini}
                          onChange={handleChange}
                          className="bg-white"
                        />
                        <Input
                          name="anf_cod_fin"
                          placeholder="Anexo Financiero Final"
                          value={filtros.anf_cod_fin}
                          onChange={handleChange}
                          className="bg-white"
                        />
                      </div>
                    </div>

                    {/* Estado */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                        <span>Estado</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                          name="doc_est_ini"
                          placeholder="Estado Inicial"
                          value={filtros.doc_est_ini}
                          onChange={handleChange}
                          className="bg-white"
                        />
                        <Input
                          name="doc_est_fin"
                          placeholder="Estado Final"
                          value={filtros.doc_est_fin}
                          onChange={handleChange}
                          className="bg-white"
                        />
                      </div>
                    </div>

                    {/* Fecha Documento */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                        <span>Fecha Documento</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                          type="date"
                          name="fecha_ini"
                          placeholder="Fecha Inicial"
                          value={filtros.fecha_ini}
                          onChange={handleChange}
                          className="bg-white"
                        />
                        <Input
                          type="date"
                          name="fecha_fin"
                          placeholder="Fecha Final"
                          value={filtros.fecha_fin}
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
                  <FileText className="h-5 w-5 mr-2" />
                  Hoja de Vida Anexo
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
                      <th className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap">Clase</th>
                      <th className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap">Documento</th>
                      <th className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap">Fecha</th>
                      <th className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap">NIT</th>
                      <th className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap">Tercero</th>
                      <th className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap">Cuenta</th>
                      <th className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap">Anexo</th>
                      <th className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap">Anx. Financiero</th>
                      <th className="px-4 py-3 font-semibold text-right text-gray-700 whitespace-nowrap">Valor</th>
                      <th className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap">Estado</th>
                      <th className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap">Observaciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {resultado.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE).map((row, i) => (
                      <tr key={i} className="hover:bg-blue-50/50 transition-colors">
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap">{row.suc_cod}</td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap">{row.clc_cod}</td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap">{row.doc_num}</td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap">{row.doc_fec}</td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap">{row.ter_nit}</td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap">{row.ter_raz}</td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap">{row.cta_cod}</td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap">{row.anx_cod}</td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap">{row.anf_cod}</td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap text-right">
                          {new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2 }).format(row.mov_val)}
                        </td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap">{row.doc_est}</td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap">{row.doc_obs}</td>
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

export default HojaDeVidaAnexoPage