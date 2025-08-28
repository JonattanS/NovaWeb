import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import { Database, Settings, Eye, Code } from 'lucide-react';
import {
  schemaService,
  type QueryConfiguration,
  type QueryCondition
} from '@/services/schemaService';
import { FieldSelector } from './FieldSelector';
import { ConditionBuilder } from './ConditionBuilder';
import { OrderGroupBuilder } from './OrderGroupBuilder';
import { useUser } from '@/contexts/UserContext';

interface QueryBuilderProps {
  onQueryGenerated: (sql: string, config: QueryConfiguration) => void;
  initialConfig?: QueryConfiguration;
}

export const QueryBuilder = ({
  onQueryGenerated,
  initialConfig
}: QueryBuilderProps) => {
  const { user } = useUser();
  const isAdmin = user?.rolcod === 'adm';

  const [config, setConfig] = useState<QueryConfiguration>(
    initialConfig || {
      selectedFields: [],
      conditions: [],
      orderBy: [],
      groupBy: [],
      limit: undefined
    }
  );
  const [generatedSQL, setGeneratedSQL] = useState('');

  useEffect(() => {
    const sql = schemaService.generateSQL(config);
    setGeneratedSQL(sql);
    onQueryGenerated(sql, config);
  }, [config, onQueryGenerated]);

  const updateSelectedFields = (fields: string[]) => {
    setConfig(prev => ({ ...prev, selectedFields: fields }));
  };

  const addCondition = () => {
    const newCondition: QueryCondition = {
      id: `condition-${Date.now()}`,
      field: '',
      operator: '=',
      value: '',
      type: 'text'
    };
    setConfig(prev => ({
      ...prev,
      conditions: [...prev.conditions, newCondition]
    }));
  };

  const updateCondition = (id: string, updates: Partial<QueryCondition>) => {
    setConfig(prev => ({
      ...prev,
      conditions: prev.conditions.map(condition =>
        condition.id === id ? { ...condition, ...updates } : condition
      )
    }));
  };

  const removeCondition = (id: string) => {
    setConfig(prev => ({
      ...prev,
      conditions: prev.conditions.filter(condition => condition.id !== id)
    }));
  };

  const updateOrderBy = (fields: string[]) => {
    setConfig(prev => ({ ...prev, orderBy: fields }));
  };

  const updateGroupBy = (fields: string[]) => {
    setConfig(prev => ({ ...prev, groupBy: fields }));
  };

  const updateLimit = (limit?: number) => {
    setConfig(prev => ({ ...prev, limit }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Database className="h-5 w-5" />
          <span>Constructor Visual de Consultas</span>
        </CardTitle>
        <CardDescription>
          Construye tu consulta de manera visual sin escribir SQL
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="fields" className="space-y-4">
          <TabsList>
            <TabsTrigger value="fields">Campos</TabsTrigger>
            <TabsTrigger value="conditions">Condiciones</TabsTrigger>
            <TabsTrigger value="ordering">Ordenamiento</TabsTrigger>
            {isAdmin && <TabsTrigger value="sql">SQL Generado</TabsTrigger>}
          </TabsList>

          <TabsContent value="fields">
            <FieldSelector
              selectedFields={config.selectedFields}
              onFieldsChange={updateSelectedFields}
            />
          </TabsContent>

          <TabsContent value="conditions">
            <ConditionBuilder
              conditions={config.conditions}
              onAddCondition={addCondition}
              onUpdateCondition={updateCondition}
              onRemoveCondition={removeCondition}
              limit={config.limit}
              onUpdateLimit={updateLimit}
            />
          </TabsContent>

          <TabsContent value="ordering">
            <OrderGroupBuilder
              orderBy={config.orderBy}
              groupBy={config.groupBy}
              onOrderByChange={updateOrderBy}
              onGroupByChange={updateGroupBy}
              availableFields={
                config.selectedFields.length > 0
                  ? config.selectedFields
                  : schemaService.getTableColumns().map(col => col.name)
              }
            />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="sql">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Code className="h-4 w-4" />
                  <h3 className="font-semibold">SQL Generado</h3>
                  <Badge variant="outline">Solo Administrador</Badge>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                  <pre className="text-sm font-mono whitespace-pre-wrap">
                    {generatedSQL}
                  </pre>
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
};
