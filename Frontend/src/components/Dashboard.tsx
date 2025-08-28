
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { mockClientes, mockTopClientes, mockDocumentosPorClase, mockEvolucionMensual } from '@/data/mockData';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { Users, FileText, TrendingUp, DollarSign } from 'lucide-react';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export function Dashboard() {
  const totalSaldo = mockClientes.reduce((sum, cliente) => sum + cliente.tot_val, 0);
  const totalClientes = mockClientes.length;
  const documentosPendientes = mockDocumentosPorClase.reduce((sum, doc) => sum + doc.count, 0);
  const promedioSaldo = totalSaldo / totalClientes;

  const statsCards = [
    {
      title: 'Saldo Total por Cobrar',
      value: formatCurrency(totalSaldo),
      description: 'Total pendiente de cobro',
      icon: DollarSign,
      trend: '+12.5%',
    },
    {
      title: 'Total Clientes',
      value: formatNumber(totalClientes),
      description: 'Clientes activos',
      icon: Users,
      trend: '+2.1%',
    },
    {
      title: 'Documentos Pendientes',
      value: formatNumber(documentosPendientes),
      description: 'Facturas sin cobrar',
      icon: FileText,
      trend: '-3.2%',
    },
    {
      title: 'Saldo Promedio',
      value: formatCurrency(promedioSaldo),
      description: 'Por cliente',
      icon: TrendingUp,
      trend: '+8.7%',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Resumen general de cuentas por cobrar
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className={stat.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}>
                  {stat.trend}
                </span>{' '}
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Top 5 Clientes */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Top 5 Clientes</CardTitle>
            <CardDescription>
              Clientes con mayor saldo por cobrar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockTopClientes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="ter_raz" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis 
                  tickFormatter={(value) => formatCurrency(value)}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Saldo']}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Bar dataKey="tot_val" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribución por Clase de Documento */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Distribución por Clase</CardTitle>
            <CardDescription>
              Documentos por tipo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={mockDocumentosPorClase}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ clc_cod, percent }) => `${clc_cod} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {mockDocumentosPorClase.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Evolución Mensual */}
      <Card>
        <CardHeader>
          <CardTitle>Evolución Mensual del Saldo</CardTitle>
          <CardDescription>
            Tendencia de saldos por cobrar en los últimos 6 meses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mockEvolucionMensual}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Saldo']}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Line 
                type="monotone" 
                dataKey="saldo" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
