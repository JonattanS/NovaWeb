
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, X, ArrowUpDown, Group } from 'lucide-react';

interface OrderGroupBuilderProps {
  orderBy: string[];
  groupBy: string[];
  onOrderByChange: (fields: string[]) => void;
  onGroupByChange: (fields: string[]) => void;
  availableFields: string[];
}

export const OrderGroupBuilder = ({
  orderBy,
  groupBy,
  onOrderByChange,
  onGroupByChange,
  availableFields
}: OrderGroupBuilderProps) => {
  const addOrderBy = (field: string) => {
    if (!orderBy.includes(field)) {
      onOrderByChange([...orderBy, field]);
    }
  };

  const removeOrderBy = (field: string) => {
    onOrderByChange(orderBy.filter(f => f !== field));
  };

  const addGroupBy = (field: string) => {
    if (!groupBy.includes(field)) {
      onGroupByChange([...groupBy, field]);
    }
  };

  const removeGroupBy = (field: string) => {
    onGroupByChange(groupBy.filter(f => f !== field));
  };

  const availableForOrder = availableFields.filter(field => !orderBy.includes(field));
  const availableForGroup = availableFields.filter(field => !groupBy.includes(field));

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Ordenamiento y Agrupación</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Configura cómo se ordenarán y agruparán los resultados
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <ArrowUpDown className="h-4 w-4" />
              <Label className="font-medium">Ordenar por</Label>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {orderBy.map(field => (
                <Badge key={field} variant="outline" className="flex items-center space-x-1">
                  <span>{field}</span>
                  <button onClick={() => removeOrderBy(field)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>

            {availableForOrder.length > 0 && (
              <Select onValueChange={addOrderBy}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Agregar campo de ordenamiento" />
                </SelectTrigger>
                <SelectContent>
                  {availableForOrder.map(field => (
                    <SelectItem key={field} value={field}>
                      {field}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Group className="h-4 w-4" />
              <Label className="font-medium">Agrupar por</Label>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {groupBy.map(field => (
                <Badge key={field} variant="outline" className="flex items-center space-x-1">
                  <span>{field}</span>
                  <button onClick={() => removeGroupBy(field)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>

            {availableForGroup.length > 0 && (
              <Select onValueChange={addGroupBy}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Agregar campo de agrupación" />
                </SelectTrigger>
                <SelectContent>
                  {availableForGroup.map(field => (
                    <SelectItem key={field} value={field}>
                      {field}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
