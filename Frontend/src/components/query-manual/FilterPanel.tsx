
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Filter } from 'lucide-react';

interface FilterPanelProps {
  filters: {
    ter_nit: string;
    fecha_desde: string;
    fecha_hasta: string;
    clc_cod: string;
    min_valor: string;
    max_valor: string;
  };
  setFilters: (filters: any) => void;
  onApplyFilters: () => void;
}

export const FilterPanel = ({ filters, setFilters, onApplyFilters }: FilterPanelProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Filter className="h-5 w-5" />
          <span>Filtros Dinámicos</span>
        </CardTitle>
        <CardDescription>
          Configura filtros que se aplicarán automáticamente a tu consulta
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="ter_nit">NIT Tercero</Label>
            <Input
              id="ter_nit"
              value={filters.ter_nit}
              onChange={(e) => setFilters({...filters, ter_nit: e.target.value})}
              placeholder="aqui ingrese el nit a filtrar"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="clc_cod">Código Clase</Label>
            <Input
              id="clc_cod"
              value={filters.clc_cod}
              onChange={(e) => setFilters({...filters, clc_cod: e.target.value})}
              placeholder=""
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="fecha_desde">Fecha Desde</Label>
            <Input
              id="fecha_desde"
              type="date"
              value={filters.fecha_desde}
              onChange={(e) => setFilters({...filters, fecha_desde: e.target.value})}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="fecha_hasta">Fecha Hasta</Label>
            <Input
              id="fecha_hasta"
              type="date"
              value={filters.fecha_hasta}
              onChange={(e) => setFilters({...filters, fecha_hasta: e.target.value})}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="min_valor">Valor Mínimo</Label>
            <Input
              id="min_valor"
              type="number"
              value={filters.min_valor}
              onChange={(e) => setFilters({...filters, min_valor: e.target.value})}
              
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="max_valor">Valor Máximo</Label>
            <Input
              id="max_valor"
              type="number"
              value={filters.max_valor}
              onChange={(e) => setFilters({...filters, max_valor: e.target.value})}
              
            />
          </div>
        </div>
        
        <Button onClick={onApplyFilters} className="w-full">
          <Filter className="h-4 w-4 mr-2" />
          Aplicar Filtros al Query
        </Button>
      </CardContent>
    </Card>
  );
};
