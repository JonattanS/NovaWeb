
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CheckCheck, Search, Eye, EyeOff } from 'lucide-react';
import { schemaService } from '@/services/schemaService';

interface FieldSelectorProps {
  selectedFields: string[];
  onFieldsChange: (fields: string[]) => void;
}

export const FieldSelector = ({ selectedFields, onFieldsChange }: FieldSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const columns = schemaService.getTableColumns();

  const filteredColumns = columns.filter(column =>
    column.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    column.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFieldToggle = (fieldName: string) => {
    if (selectedFields.includes(fieldName)) {
      onFieldsChange(selectedFields.filter(field => field !== fieldName));
    } else {
      onFieldsChange([...selectedFields, fieldName]);
    }
  };

  const selectAll = () => {
    onFieldsChange(filteredColumns.map(col => col.name));
  };

  const clearAll = () => {
    onFieldsChange([]);
  };

  const getFieldTypeColor = (column: any) => {
    if (column.isNumeric) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    if (column.isDate) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Seleccionar Campos</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Elige los campos que deseas incluir en tu consulta
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={selectAll}>
            <CheckCheck className="h-4 w-4 mr-1" />
            Todos
          </Button>
          <Button variant="outline" size="sm" onClick={clearAll}>
            <EyeOff className="h-4 w-4 mr-1" />
            Ninguno
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Buscar campos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {selectedFields.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
            Campos seleccionados: {selectedFields.length}
          </p>
          <div className="flex flex-wrap gap-1 mt-2">
            {selectedFields.map(field => (
              <Badge key={field} variant="outline" className="text-xs">
                {field}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-3 max-h-96 overflow-y-auto">
        {filteredColumns.map((column) => (
          <Card key={column.name} className="p-3">
            <div className="flex items-center space-x-3">
              <Checkbox
                id={column.name}
                checked={selectedFields.includes(column.name)}
                onCheckedChange={() => handleFieldToggle(column.name)}
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <label
                    htmlFor={column.name}
                    className="font-medium cursor-pointer"
                  >
                    {column.name}
                  </label>
                  <Badge className={`text-xs ${getFieldTypeColor(column)}`}>
                    {column.type}
                  </Badge>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {column.description}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredColumns.length === 0 && (
        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
          No se encontraron campos que coincidan con "{searchTerm}"
        </div>
      )}
    </div>
  );
};
