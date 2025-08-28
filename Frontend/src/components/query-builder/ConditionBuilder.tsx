
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, Filter, Hash } from 'lucide-react';
import { schemaService, type QueryCondition } from '@/services/schemaService';

interface ConditionBuilderProps {
  conditions: QueryCondition[];
  onAddCondition: () => void;
  onUpdateCondition: (id: string, updates: Partial<QueryCondition>) => void;
  onRemoveCondition: (id: string) => void;
  limit?: number;
  onUpdateLimit: (limit?: number) => void;
}

export const ConditionBuilder = ({
  conditions,
  onAddCondition,
  onUpdateCondition,
  onRemoveCondition,
  limit,
  onUpdateLimit
}: ConditionBuilderProps) => {
  const columns = schemaService.getTableColumns();

  const handleFieldChange = (conditionId: string, fieldName: string) => {
    const columnType = schemaService.getColumnType(fieldName);
    onUpdateCondition(conditionId, {
      field: fieldName,
      type: columnType,
      operator: '=',
      value: ''
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Condiciones de Filtrado</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Agrega condiciones WHERE para filtrar los resultados
          </p>
        </div>
        <Button onClick={onAddCondition} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Agregar Condición
        </Button>
      </div>

      {conditions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Filter className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-400">
              Sin condiciones
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
              Agrega condiciones para filtrar los resultados de tu consulta
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {conditions.map((condition, index) => (
            <Card key={condition.id}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  {index > 0 && (
                    <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Y
                    </div>
                  )}
                  
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <Label className="text-xs text-slate-500">Campo</Label>
                      <Select
                        value={condition.field}
                        onValueChange={(value) => handleFieldChange(condition.id, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar campo" />
                        </SelectTrigger>
                        <SelectContent>
                          {columns.map(column => (
                            <SelectItem key={column.name} value={column.name}>
                              {column.name} - {column.description}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs text-slate-500">Operador</Label>
                      <Select
                        value={condition.operator}
                        onValueChange={(value) => onUpdateCondition(condition.id, { operator: value })}
                        disabled={!condition.field}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Operador" />
                        </SelectTrigger>
                        <SelectContent>
                          {condition.field && schemaService.getOperatorsForColumn(condition.field).map(op => (
                            <SelectItem key={op.value} value={op.value}>
                              {op.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs text-slate-500">Valor</Label>
                      <Input
                        type={condition.type === 'number' ? 'number' : condition.type === 'date' ? 'date' : 'text'}
                        value={condition.value}
                        onChange={(e) => onUpdateCondition(condition.id, { value: e.target.value })}
                        placeholder={
                          condition.operator === 'BETWEEN' ? 'valor1,valor2' :
                          condition.operator === 'IN' ? 'valor1,valor2,valor3' :
                          'Valor de comparación'
                        }
                        disabled={!condition.field}
                      />
                    </div>

                    <div className="flex items-end">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onRemoveCondition(condition.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <Hash className="h-4 w-4 text-slate-500" />
            <div className="flex-1">
              <Label htmlFor="limit" className="text-sm font-medium">
                Límite de Resultados (opcional)
              </Label>
              <Input
                id="limit"
                type="number"
                value={limit || ''}
                onChange={(e) => onUpdateLimit(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Ej: 100"
                className="mt-1"
                min="1"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
