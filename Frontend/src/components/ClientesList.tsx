
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockClientes } from '@/data/mockData';
import { formatCurrency } from '@/utils/formatters';
import { Cliente, FilterOptions } from '@/types';
import { Search, Download, Filter, ArrowUpDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ClientesList() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: '',
    sortBy: 'ter_raz',
    sortOrder: 'asc',
  });

  const filteredClientes = mockClientes
    .filter((cliente) => {
      const matchesSearch = cliente.ter_raz.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                           cliente.ter_nit.includes(filters.searchTerm);
      const matchesMinSaldo = !filters.minSaldo || cliente.tot_val >= filters.minSaldo;
      const matchesMaxSaldo = !filters.maxSaldo || cliente.tot_val <= filters.maxSaldo;
      
      return matchesSearch && matchesMinSaldo && matchesMaxSaldo;
    })
    .sort((a, b) => {
      const aValue = a[filters.sortBy];
      const bValue = b[filters.sortBy];
      const multiplier = filters.sortOrder === 'asc' ? 1 : -1;
      
      if (typeof aValue === 'string') {
        return aValue.localeCompare(bValue as string) * multiplier;
      }
      return ((aValue as number) - (bValue as number)) * multiplier;
    });

  const totalSaldo = filteredClientes.reduce((sum, cliente) => sum + cliente.tot_val, 0);

  const handleClienteClick = (cliente: Cliente) => {
    navigate(`/clientes/${cliente.ter_nit}`);
  };

  const handleExport = () => {
    // Implementar lógica de exportación
    const csvContent = [
      ['NIT', 'Razón Social', 'Saldo Total'].join(','),
      ...filteredClientes.map(cliente => 
        [cliente.ter_nit, cliente.ter_raz, cliente.tot_val].join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clientes-cuentas-por-cobrar.csv';
    a.click();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
        <p className="text-muted-foreground">
          Listado de clientes con saldos pendientes por cobrar
        </p>
      </div>

      {/* Filtros y búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros y Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por NIT o razón social..."
                value={filters.searchTerm}
                onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                className="pl-10"
              />
            </div>
            
            <Select
              value={filters.sortBy}
              onValueChange={(value: FilterOptions['sortBy']) => 
                setFilters(prev => ({ ...prev, sortBy: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ter_raz">Razón Social</SelectItem>
                <SelectItem value="ter_nit">NIT</SelectItem>
                <SelectItem value="tot_val">Saldo</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.sortOrder}
              onValueChange={(value: FilterOptions['sortOrder']) => 
                setFilters(prev => ({ ...prev, sortOrder: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Orden" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Ascendente</SelectItem>
                <SelectItem value="desc">Descendente</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleExport} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resumen */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Clientes Filtrados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredClientes.length}</div>
            <p className="text-xs text-muted-foreground">de {mockClientes.length} total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Saldo Total Filtrado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSaldo)}</div>
            <p className="text-xs text-muted-foreground">suma de saldos mostrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Saldo Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredClientes.length > 0 
                ? formatCurrency(totalSaldo / filteredClientes.length)
                : formatCurrency(0)
              }
            </div>
            <p className="text-xs text-muted-foreground">por cliente filtrado</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de clientes */}
      <Card>
        <CardHeader>
          <CardTitle>Listado de Clientes</CardTitle>
          <CardDescription>
            Haz clic en un cliente para ver el detalle de sus documentos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer hover:bg-muted/50">
                  <div className="flex items-center gap-2">
                    NIT
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/50">
                  <div className="flex items-center gap-2">
                    Razón Social
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="text-right cursor-pointer hover:bg-muted/50">
                  <div className="flex items-center justify-end gap-2">
                    Saldo Total
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="text-center">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClientes.map((cliente) => (
                <TableRow 
                  key={cliente.ter_nit}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleClienteClick(cliente)}
                >
                  <TableCell className="font-medium">{cliente.ter_nit}</TableCell>
                  <TableCell>{cliente.ter_raz}</TableCell>
                  <TableCell className="text-right font-mono">
                    <span className={cliente.tot_val > 50000000 ? 'text-red-600 font-medium' : 'text-green-600'}>
                      {formatCurrency(cliente.tot_val)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={cliente.tot_val > 50000000 ? 'destructive' : 'secondary'}>
                      {cliente.tot_val > 50000000 ? 'Alto' : 'Normal'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
