
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Filter, X, Settings } from 'lucide-react';
import { schemaService } from '@/services/schemaService';

interface FilterConfig {
  columnName: string;
  enabled: boolean;
}

interface FilterValue {
  columnName: string;
  value: any;
  operator?: string;
  secondValue?: any; // Para rangos
}

interface DynamicFilterPanelProps {
  filterConfig: FilterConfig[];
  onFiltersApply: (filters: FilterValue[]) => void;
  appliedFilters: FilterValue[];
  setAppliedFilters: (filters: FilterValue[]) => void;
  onConfigureFilters: () => void;
}

export const DynamicFilterPanel = ({ 
  filterConfig, 
  onFiltersApply, 
  appliedFilters, 
  setAppliedFilters,
  onConfigureFilters
}: DynamicFilterPanelProps) => {
  const columns = schemaService.getTableColumns();
  
  // Solo mostrar columnas que están explícitamente habilitadas en filterConfig
  const enabledColumns = filterConfig
    .filter(f => f.enabled)
    .map(f => columns.find(col => col.name === f.columnName))
    .filter(Boolean);

  console.log('DynamicFilterPanel - filterConfig recibido:', filterConfig);
  console.log('DynamicFilterPanel - enabledColumns calculadas:', enabledColumns);

  const updateFilter = (columnName: string, updates: Partial<FilterValue>) => {
    const existingFilterIndex = appliedFilters.findIndex(f => f.columnName === columnName);
    
    if (existingFilterIndex >= 0) {
      const updatedFilters = [...appliedFilters];
      updatedFilters[existingFilterIndex] = { ...updatedFilters[existingFilterIndex], ...updates };
      setAppliedFilters(updatedFilters);
    } else {
      setAppliedFilters([...appliedFilters, { columnName, value: '', ...updates }]);
    }
  };

  const removeFilter = (columnName: string) => {
    setAppliedFilters(appliedFilters.filter(f => f.columnName !== columnName));
  };

  const getFilterValue = (columnName: string, key: string = 'value') => {
    const filter = appliedFilters.find(f => f.columnName === columnName);
    return filter ? filter[key as keyof FilterValue] || '' : '';
  };

  const renderFilterInput = (column: any) => {
    const filterValue = getFilterValue(column.name);
    const operator = getFilterValue(column.name, 'operator') || '=';
    
    if (column.type === 'boolean') {
      return (
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={filterValue === true}
            onCheckedChange={(checked) => 
              updateFilter(column.name, { value: checked, operator: '=' })
            }
          />
          <Label className="text-sm">Sí</Label>
        </div>
      );
    }

    if (column.isDate) {
      return (
        <div className="space-y-2">
          <Select 
            value={operator} 
            onValueChange={(value) => updateFilter(column.name, { operator: value })}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="=">Fecha exacta</SelectItem>
              <SelectItem value=">=">Desde</SelectItem>
              <SelectItem value="<=">Hasta</SelectItem>
              <SelectItem value="BETWEEN">Rango</SelectItem>
            </SelectContent>
          </Select>
          
          <Input
            type="date"
            value={filterValue}
            onChange={(e) => updateFilter(column.name, { value: e.target.value })}
            className="h-8"
          />
          
          {operator === 'BETWEEN' && (
            <Input
              type="date"
              value={getFilterValue(column.name, 'secondValue')}
              onChange={(e) => updateFilter(column.name, { secondValue: e.target.value })}
              placeholder="Fecha hasta"
              className="h-8"
            />
          )}
        </div>
      );
    }

    if (column.isNumeric) {
      return (
        <div className="space-y-2">
          <Select 
            value={operator} 
            onValueChange={(value) => updateFilter(column.name, { operator: value })}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="=">Igual a</SelectItem>
              <SelectItem value=">">Mayor que</SelectItem>
              <SelectItem value=">=">Mayor o igual</SelectItem>
              <SelectItem value="<">Menor que</SelectItem>
              <SelectItem value="<=">Menor o igual</SelectItem>
              <SelectItem value="BETWEEN">Entre</SelectItem>
            </SelectContent>
          </Select>
          
          <Input
            type="number"
            value={filterValue}
            onChange={(e) => updateFilter(column.name, { value: e.target.value })}
            placeholder="Valor"
            className="h-8"
          />
          
          {operator === 'BETWEEN' && (
            <Input
              type="number"
              value={getFilterValue(column.name, 'secondValue')}
              onChange={(e) => updateFilter(column.name, { secondValue: e.target.value })}
              placeholder="Valor hasta"
              className="h-8"
            />
          )}
        </div>
      );
    }

    // Campo de texto
    return (
      <div className="space-y-2">
        <Select 
          value={operator} 
          onValueChange={(value) => updateFilter(column.name, { operator: value })}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="=">Exacto</SelectItem>
            <SelectItem value="LIKE">Contiene</SelectItem>
            <SelectItem value="STARTS_WITH">Empieza con</SelectItem>
            <SelectItem value="ENDS_WITH">Termina con</SelectItem>
          </SelectContent>
        </Select>
        
        <Input
          value={filterValue}
          onChange={(e) => updateFilter(column.name, { value: e.target.value })}
          placeholder={`Filtrar por ${column.description.toLowerCase()}`}
          className="h-8"
        />
      </div>
    );
  };

  const hasActiveFilters = appliedFilters.some(f => 
    f.value !== '' && f.value !== null && f.value !== undefined
  );

  // Si no hay filtros configurados, mostrar mensaje de configuración
  if (!filterConfig || filterConfig.length === 0 || enabledColumns.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Filter className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-400">
            Sin Filtros Configurados
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-500 mt-2 mb-4">
            Este módulo no tiene filtros dinámicos configurados. Configura los filtros que quieres que estén disponibles.
          </p>
          <Button onClick={onConfigureFilters}>
            <Filter className="h-4 w-4 mr-2" />
            Configurar Filtros
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <CardTitle>Filtros Dinámicos</CardTitle>
            <Badge variant="outline">{enabledColumns.length} filtros</Badge>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onConfigureFilters}
          >
            <Settings className="h-4 w-4 mr-2" />
            Configurar
          </Button>
        </div>
        <CardDescription>
          Filtra los resultados usando los filtros configurados para este módulo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {enabledColumns.map((column) => (
            <div key={column.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">{column.description}</Label>
                {getFilterValue(column.name) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFilter(column.name)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <div className="text-xs text-slate-500 mb-2">
                <code>{column.name}</code> • {column.type}
              </div>
              {renderFilterInput(column)}
            </div>
          ))}
        </div>
        
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            {hasActiveFilters && `${appliedFilters.filter(f => f.value).length} filtros activos`}
          </div>
          <div className="space-x-2">
            {hasActiveFilters && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setAppliedFilters([])}
              >
                Limpiar Filtros
              </Button>
            )}
            <Button onClick={() => onFiltersApply(appliedFilters)} size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Aplicar Filtros
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
