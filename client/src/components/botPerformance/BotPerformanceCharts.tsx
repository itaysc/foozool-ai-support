import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Chip,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface ChartDataPoint {
  date: string;
  processed: number;
  autoResolved: number;
  escalated: number;
  successRate: number;
  avgTime: number;
  satisfaction: number;
  savings: number;
}

interface ActionBreakdown {
  refunds: { count: number; successRate: number };
  coupons: { count: number; successRate: number };
  autoReplies: { count: number; successRate: number };
  escalations: { count: number; successRate: number };
  autoResolves: { count: number; successRate: number };
}

interface BotPerformanceChartsProps {
  chartData: ChartDataPoint[];
  actionBreakdown: ActionBreakdown;
  isLoading?: boolean;
  period?: string;
}

const BotPerformanceCharts: React.FC<BotPerformanceChartsProps> = ({
  chartData = [],
  actionBreakdown,
  isLoading,
  period = '30 days'
}) => {
  const [selectedChart, setSelectedChart] = useState<string>('volume');
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar'>('area');

  const chartOptions = [
    { value: 'volume', label: 'Ticket Volume', color: '#1976d2' },
    { value: 'performance', label: 'Success Rate', color: '#2e7d32' },
    { value: 'timing', label: 'Response Time', color: '#ed6c02' },
    { value: 'satisfaction', label: 'Satisfaction', color: '#9c27b0' },
    { value: 'savings', label: 'Cost Savings', color: '#d32f2f' }
  ];

  const actionColors = {
    refunds: '#f44336',
    coupons: '#ff9800',
    autoReplies: '#2196f3',
    escalations: '#9c27b0',
    autoResolves: '#4caf50'
  };

  // Transform action breakdown data for pie chart
  const actionData = Object.entries(actionBreakdown || {}).map(([action, data]) => ({
    name: action.charAt(0).toUpperCase() + action.slice(1).replace(/([A-Z])/g, ' $1'),
    value: data.count,
    successRate: data.successRate,
    color: actionColors[action as keyof typeof actionColors]
  }));

  const formatYAxis = (value: number, dataKey: string) => {
    switch (dataKey) {
      case 'successRate':
        return `${value}%`;
      case 'avgTime':
        return `${(value / 1000).toFixed(1)}s`;
      case 'satisfaction':
        return `${value.toFixed(1)}`;
      case 'savings':
        return `$${value}`;
      default:
        return value.toString();
    }
  };

  const getChartConfig = () => {
    switch (selectedChart) {
      case 'volume':
        return {
          title: 'Ticket Volume Trends',
          lines: [
            { dataKey: 'processed', stroke: '#1976d2', name: 'Processed' },
            { dataKey: 'autoResolved', stroke: '#4caf50', name: 'Auto-Resolved' },
            { dataKey: 'escalated', stroke: '#f44336', name: 'Escalated' }
          ],
          yAxisFormatter: (value: number) => value.toString()
        };
      case 'performance':
        return {
          title: 'Success Rate Over Time',
          lines: [
            { dataKey: 'successRate', stroke: '#2e7d32', name: 'Success Rate' }
          ],
          yAxisFormatter: (value: number) => `${value}%`
        };
      case 'timing':
        return {
          title: 'Response Time Performance',
          lines: [
            { dataKey: 'avgTime', stroke: '#ed6c02', name: 'Avg Response Time' }
          ],
          yAxisFormatter: (value: number) => `${(value / 1000).toFixed(1)}s`
        };
      case 'satisfaction':
        return {
          title: 'Customer Satisfaction Trends',
          lines: [
            { dataKey: 'satisfaction', stroke: '#9c27b0', name: 'Satisfaction Score' }
          ],
          yAxisFormatter: (value: number) => `${value.toFixed(1)}/5`
        };
      case 'savings':
        return {
          title: 'Daily Cost Savings',
          lines: [
            { dataKey: 'savings', stroke: '#d32f2f', name: 'Cost Savings' }
          ],
          yAxisFormatter: (value: number) => `$${value}`
        };
      default:
        return {
          title: 'Performance & Insights',
          lines: [],
          yAxisFormatter: (value: number) => value.toString()
        };
    }
  };

  const renderChart = () => {
    const config = getChartConfig();
    const ChartComponent = chartType === 'line' ? LineChart : chartType === 'area' ? AreaChart : BarChart;

    if (chartType === 'bar') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" stroke="#666" fontSize={12} />
            <YAxis tickFormatter={config.yAxisFormatter} stroke="#666" fontSize={12} />
            <Tooltip 
              formatter={(value: number, name: string) => [
                config.yAxisFormatter(value), 
                name
              ]}
              labelStyle={{ color: '#333' }}
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '4px' }}
            />
            <Legend />
            {config.lines.map((line) => (
              <Bar
                key={line.dataKey}
                dataKey={line.dataKey}
                fill={line.stroke}
                name={line.name}
                radius={[2, 2, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'area') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" stroke="#666" fontSize={12} />
            <YAxis tickFormatter={config.yAxisFormatter} stroke="#666" fontSize={12} />
            <Tooltip 
              formatter={(value: number, name: string) => [
                config.yAxisFormatter(value), 
                name
              ]}
              labelStyle={{ color: '#333' }}
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '4px' }}
            />
            <Legend />
            {config.lines.map((line, index) => (
              <Area
                key={line.dataKey}
                type="monotone"
                dataKey={line.dataKey}
                stroke={line.stroke}
                fill={line.stroke}
                fillOpacity={0.3}
                name={line.name}
                stackId={config.lines.length > 1 ? "1" : undefined}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" stroke="#666" fontSize={12} />
          <YAxis tickFormatter={config.yAxisFormatter} stroke="#666" fontSize={12} />
          <Tooltip 
            formatter={(value: number, name: string) => [
              config.yAxisFormatter(value), 
              name
            ]}
            labelStyle={{ color: '#333' }}
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '4px' }}
          />
          <Legend />
          {config.lines.map((line) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              stroke={line.stroke}
              strokeWidth={2}
              name={line.name}
              dot={{ fill: line.stroke, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: line.stroke, strokeWidth: 2 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  };

  if (isLoading) {
    return (
      <Box display="flex" gap={3} flexWrap="wrap">
        <Box flex="1 1 60%" minWidth="300px">
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
              <CircularProgress />
            </CardContent>
          </Card>
        </Box>
        <Box flex="1 1 35%" minWidth="250px">
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
              <CircularProgress />
            </CardContent>
          </Card>
        </Box>
      </Box>
    );
  }

  const config = getChartConfig();

  return (
    <Box display="flex" gap={3} flexWrap="wrap">
      {/* Main Performance Chart */}
      <Box flex="1 1 60%" minWidth="300px">
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6" fontWeight="bold">
                {config.title}
              </Typography>
              <Chip label={period} size="small" variant="outlined" />
            </Box>

            {/* Chart Type and Metric Selectors */}
            <Box display="flex" gap={2} mb={3} flexWrap="wrap">
              <ToggleButtonGroup
                value={selectedChart}
                exclusive
                onChange={(_, value) => value && setSelectedChart(value)}
                size="small"
              >
                {chartOptions.map((option) => (
                  <ToggleButton key={option.value} value={option.value}>
                    {option.label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>

              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Chart Type</InputLabel>
                <Select
                  value={chartType}
                  onChange={(e) => setChartType(e.target.value as 'line' | 'area' | 'bar')}
                  label="Chart Type"
                >
                  <MenuItem value="line">Line</MenuItem>
                  <MenuItem value="area">Area</MenuItem>
                  <MenuItem value="bar">Bar</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {chartData.length > 0 ? (
              renderChart()
            ) : (
              <Box textAlign="center" py={4}>
                <Typography color="text.secondary">
                  No chart data available for the selected period
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Action Breakdown Pie Chart */}
      <Box flex="1 1 35%" minWidth="250px">
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Action Breakdown
            </Typography>
            
            {actionData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={actionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {actionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name: string, props: any) => [
                        `${value} actions (${props.payload.successRate}% success)`,
                        name
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <Box mt={2}>
                  {actionData.map((action, index) => (
                    <Box key={index} display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box 
                          width={12} 
                          height={12} 
                          bgcolor={action.color} 
                          borderRadius="50%" 
                        />
                        <Typography variant="body2">{action.name}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {action.value} ({action.successRate}%)
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </>
            ) : (
              <Box textAlign="center" py={4}>
                <Typography color="text.secondary">
                  No action data available
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default BotPerformanceCharts;