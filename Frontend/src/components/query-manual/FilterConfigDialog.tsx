
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Filter, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { schemaService } from '@/services/schemaService';

interface FilterConfig {
  columnName: string;
  enabled: boolean;
}

interface FilterConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFilters: FilterConfig[];
  onFiltersChange: (filters: FilterConfig[]) => void;
}

export const FilterConfigDialog = ({ 
  isOpen, 
  onClose, 
  selectedFilters, 
  onFiltersChange 
}: FilterConfigDialogProps) => {
  const [localFilters, setLocalFilters] = useState<FilterConfig[]>([]);
  const columns = schemaService.getTableColumns();

  useEffect(() => {
    // Inicializar filtros con todas las columnas disponibles
    const initialFilters = columns.map(col => {
      const existingFilter = selectedFilters.find(f => f.columnName === col.name);
      return {
        columnName: col.name,
        enabled: existingFilter?.enabled || false
      };
    });
    setLocalFilters(initialFilters);
  }, [selectedFilters, columns, isOpen]);

  const handleFilterToggle = (columnName: string, enabled: boolean) => {
    setLocalFilters(prev => 
      prev.map(filter => 
        filter.columnName === columnName 
          ? { ...filter, enabled }
          : filter
      )
    );
  };

  const handleSave = () => {
    console.log('Guardando filtros:', localFilters);
    onFiltersChange(localFilters);
    onClose();
  };

  const handleCancel = () => {
    // Restaurar estado original
    const originalFilters = columns.map(col => {
      const existingFilter = selectedFilters.find(f => f.columnName === col.name);
      return {
        columnName: col.name,
        enabled: existingFilter?.enabled || false
      };
    });
    setLocalFilters(originalFilters);
    onClose();
  };

  const getTypeIcon = (column: any) => {
    if (column.isDate) return '📅';
    if (column.isNumeric) return '🔢';
    if (column.type === 'boolean') return '☑️';
    return '📝';
  };

  const getTypeBadge = (column: any) => {
    if (column.isDate) return 'Fecha';
    if (column.isNumeric) return 'Número';
    if (column.type === 'boolean') return 'Booleano';
    return 'Texto';
  };

  const enabledCount = localFilters.filter(f => f.enabled).length;

  return (
    <TooltipProvider>
      <Dialog open={isOpen} onOpenChange={handleCancel}>
        <DialogContent className="max-w-4xl h-[85vh] max-h-[85vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Configurar Filtros Dinámicos</span>
            </DialogTitle>
            <DialogDescription>
              Selecciona las columnas que quieres usar como filtros en este módulo. 
              Una vez guardado el módulo, solo estos filtros estarán disponibles.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 flex flex-col min-h-0 space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex-shrink-0">
              <div>
                <h3 className="font-medium text-blue-900 dark:text-blue-100">
                  Filtros seleccionados: {enabledCount} de {columns.length}
                </h3>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  Los filtros se aplicarán en tiempo real sin modificar la consulta SQL
                </p>
              </div>
            </div>

            <div className="flex-1 min-h-0">
              <ScrollArea className="h-full border rounded-lg p-4">
                <div className="space-y-3">
                  {columns.map((column) => {
                    const filter = localFilters.find(f => f.columnName === column.name);
                    const isEnabled = filter?.enabled || false;
                    
                    return (
                      <div 
                        key={column.name}
                        className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <Checkbox
                          checked={isEnabled}
                          onCheckedChange={(checked) => 
                            handleFilterToggle(column.name, checked as boolean)
                          }
                        />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{getTypeIcon(column)}</span>
                            <h4 className="font-medium truncate">{column.description}</h4>
                            <Badge variant="outline" className="shrink-0">
                              {getTypeBadge(column)}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center space-x-2 mt-1">
                            <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                              {column.name}
                            </code>
                            <span className="text-xs text-slate-500">
                              {column.type}
                            </span>
                            
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="h-3 w-3 text-slate-400" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">
                                  Campo técnico: {column.name}<br/>
                                  Tipo: {column.type}<br/>
                                  {column.isNumeric && "Filtros: =, >, <, >=, <=, entre"}<br/>
                                  {column.isDate && "Filtros: fecha exacta, rango de fechas"}<br/>
                                  {column.isText && "Filtros: contiene, exacto, empieza con"}<br/>
                                  {column.type === 'boolean' && "Filtros: sí/no"}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            {/* Botones de acción - Siempre visibles */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
              <Button 
                variant="outline" 
                onClick={handleCancel}
                className="px-6"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSave}
                className="px-6"
                size="default"
              >
                <Filter className="h-4 w-4 mr-2" />
                Guardar Filtros ({enabledCount})
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};
