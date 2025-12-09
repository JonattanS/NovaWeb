import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertCircle, CheckCircle, RefreshCw, Download } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { BACKEND_URL } from '../config'
import { useUser } from '@/contexts/UserContext'

interface AuditLog {
  id: number
  logTip: string
  logPro: string
  usuario: string
  usuario_nombre: string
  empresa: string
  logFec: string
  logDet: string | null
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  pages: number
}

export function AuditLogViewer() {
  const { user } = useUser()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filtros
  const [filterType, setFilterType] = useState<string>('')
  const [filterUser, setFilterUser] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)

  // Cargar logs
  const fetchLogs = async (page = 1) => {
    if (!user?.token) return

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      })

      if (filterType) params.append('logTip', filterType)
      if (filterUser) params.append('adm_usrId', filterUser)
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      if (user.adm_ciaid) params.append('adm_ciaid', user.adm_ciaid.toString())

      const response = await fetch(`${BACKEND_URL}/api/audit-logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
      })

      if (!response.ok) throw new Error('Error al cargar logs')

      const data = await response.json()
      setLogs(data.data || [])
      setPagination(data.pagination)
      setCurrentPage(page)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs(1)
  }, [user?.token])

  // Aplicar filtros
  const handleApplyFilters = () => {
    fetchLogs(1)
  }

  // Limpiar filtros
  const handleClearFilters = () => {
    setFilterType('')
    setFilterUser('')
    setStartDate('')
    setEndDate('')
    setCurrentPage(1)
    fetchLogs(1)
  }

  // Exportar a CSV
  const handleExportCSV = () => {
    if (logs.length === 0) return

    const headers = ['ID', 'Tipo', 'Proceso', 'Usuario', 'Nombre', 'Empresa', 'Fecha', 'Detalles']
    const rows = logs.map((log) => [
      log.id,
      log.logTip,
      log.logPro,
      log.usuario,
      log.usuario_nombre,
      log.empresa,
      new Date(log.logFec).toLocaleString(),
      log.logDet || '',
    ])

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Logs de Auditoría</h1>
        <p className="text-gray-600 mt-2">Registro de intentos de login y eventos del sistema</p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Tipo de Log */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Evento
              </label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="LOGIN_EXITOSO">Login Exitoso</SelectItem>
                  <SelectItem value="LOGIN_FALLIDO">Login Fallido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Fecha inicio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Inicio
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            {/* Fecha fin */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Fin
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            {/* Acciones */}
            <div className="flex items-end gap-2">
              <Button
                onClick={handleApplyFilters}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                Filtrar
              </Button>
              <Button
                onClick={handleClearFilters}
                variant="outline"
                className="flex-1"
              >
                Limpiar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert className="bg-red-50 border-red-200 text-red-700">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Tabla de Logs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Eventos Registrados</CardTitle>
            <CardDescription>
              Total: {pagination.total} registros
            </CardDescription>
          </div>
          <Button
            onClick={handleExportCSV}
            variant="outline"
            size="sm"
            disabled={logs.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay registros que mostrar
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Fecha/Hora</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Tipo</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Usuario</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Empresa</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Detalles</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {logs.map((log) => {
                    const details = log.logDet ? JSON.parse(log.logDet) : {}
                    return (
                      <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-900">
                          {new Date(log.logFec).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          {log.logTip === 'LOGIN_EXITOSO' ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100 flex items-center gap-1 w-fit">
                              <CheckCircle className="h-3 w-3" />
                              Exitoso
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800 hover:bg-red-100 flex items-center gap-1 w-fit">
                              <AlertCircle className="h-3 w-3" />
                              Fallido
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium text-gray-900">{log.usuario}</div>
                            <div className="text-xs text-gray-500">{log.usuario_nombre}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{log.empresa}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {details.razon || details.tipo || 'N/A'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paginación */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            Página {pagination.page} de {pagination.pages}
          </span>
          <div className="flex gap-2">
            <Button
              onClick={() => fetchLogs(pagination.page - 1)}
              disabled={pagination.page === 1 || loading}
              variant="outline"
            >
              Anterior
            </Button>
            <Button
              onClick={() => fetchLogs(pagination.page + 1)}
              disabled={pagination.page === pagination.pages || loading}
              variant="outline"
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
