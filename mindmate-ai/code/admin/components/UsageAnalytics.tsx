// Usage Analytics Component

'use client';

import { useState, useMemo } from 'react';
import { UsageMetrics, ChartDataPoint } from '@/types';
import { formatDate, formatNumber, calculatePercentageChange } from '@/lib/utils';
import { Card, CardHeader, StatCard } from './ui/Card';
import { Select } from './ui/Select';

interface UsageAnalyticsProps {
  metrics: UsageMetrics[];
}

type ChartType = 'line' | 'bar' | 'area';
type MetricType = 'activeUsers' | 'newUsers' | 'sessions' | 'messages' | 'avgSessionDuration' | 'crisisAlerts';

export function UsageAnalytics({ metrics }: UsageAnalyticsProps) {
  const [chartType, setChartType] = useState<ChartType>('line');
  const [selectedMetrics, setSelectedMetrics] = useState<MetricType[]>(['activeUsers', 'sessions']);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');

  // Calculate summary stats
  const stats = useMemo(() => {
    const current = metrics[metrics.length - 1];
    const previous = metrics[metrics.length - 2];
    
    return {
      totalActiveUsers: current.activeUsers,
      activeUsersChange: calculatePercentageChange(current.activeUsers, previous.activeUsers),
      totalSessions: metrics.reduce((sum, m) => sum + m.sessions, 0),
      avgSessionsPerDay: Math.round(metrics.reduce((sum, m) => sum + m.sessions, 0) / metrics.length),
      totalMessages: metrics.reduce((sum, m) => sum + m.messages, 0),
      avgSessionDuration: Math.round(metrics.reduce((sum, m) => sum + m.avgSessionDuration, 0) / metrics.length),
      totalCrisisAlerts: metrics.reduce((sum, m) => sum + m.crisisAlerts, 0)
    };
  }, [metrics]);

  // Prepare chart data
  const chartData: ChartDataPoint[] = useMemo(() => {
    return metrics.map(m => ({
      label: new Date(m.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      value: m.activeUsers,
      secondaryValue: m.sessions
    }));
  }, [metrics]);

  const metricLabels: Record<MetricType, string> = {
    activeUsers: 'Active Users',
    newUsers: 'New Users',
    sessions: 'Sessions',
    messages: 'Messages',
    avgSessionDuration: 'Avg Duration (min)',
    crisisAlerts: 'Crisis Alerts'
  };

  const metricColors: Record<MetricType, string> = {
    activeUsers: '#3B82F6',
    newUsers: '#10B981',
    sessions: '#8B5CF6',
    messages: '#F59E0B',
    avgSessionDuration: '#EC4899',
    crisisAlerts: '#EF4444'
  };

  // Simple SVG Chart Component
  const SimpleChart = ({ data, metrics }: { data: UsageMetrics[]; metrics: MetricType[] }) => {
    const width = 800;
    const height = 300;
    const padding = { top: 20, right: 30, bottom: 40, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Find max value for scaling
    const allValues = data.flatMap(d => metrics.map(m => d[m]));
    const maxValue = Math.max(...allValues) * 1.1;
    const minValue = 0;

    // Generate points for each metric
    const generatePoints = (metric: MetricType) => {
      return data.map((d, i) => {
        const x = padding.left + (i / (data.length - 1)) * chartWidth;
        const y = padding.top + chartHeight - ((d[metric] - minValue) / (maxValue - minValue)) * chartHeight;
        return { x, y, value: d[metric] };
      });
    };

    // Generate path for line chart
    const generatePath = (points: { x: number; y: number }[]) => {
      return points.reduce((path, point, i) => {
        if (i === 0) return `M ${point.x} ${point.y}`;
        return `${path} L ${point.x} ${point.y}`;
      }, '');
    };

    // Generate area path
    const generateAreaPath = (points: { x: number; y: number }[]) => {
      const linePath = generatePath(points);
      const lastPoint = points[points.length - 1];
      const firstPoint = points[0];
      return `${linePath} L ${lastPoint.x} ${padding.top + chartHeight} L ${firstPoint.x} ${padding.top + chartHeight} Z`;
    };

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        {/* Grid lines */}
        {[0, 1, 2, 3, 4].map(i => {
          const y = padding.top + (i / 4) * chartHeight;
          const value = Math.round(maxValue - (i / 4) * maxValue);
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#E5E7EB"
                strokeDasharray="4"
              />
              <text x={padding.left - 10} y={y + 4} textAnchor="end" fontSize="12" fill="#6B7280">
                {formatNumber(value)}
              </text>
            </g>
          );
        })}

        {/* X-axis labels */}
        {data.map((d, i) => {
          const x = padding.left + (i / (data.length - 1)) * chartWidth;
          return (
            <text
              key={i}
              x={x}
              y={height - 10}
              textAnchor="middle"
              fontSize="12"
              fill="#6B7280"
            >
              {new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' })}
            </text>
          );
        })}

        {/* Chart content */}
        {metrics.map(metric => {
          const points = generatePoints(metric);
          const color = metricColors[metric];

          if (chartType === 'area') {
            return (
              <g key={metric}>
                <path
                  d={generateAreaPath(points)}
                  fill={color}
                  fillOpacity="0.2"
                />
                <path
                  d={generatePath(points)}
                  fill="none"
                  stroke={color}
                  strokeWidth="2"
                />
              </g>
            );
          }

          if (chartType === 'bar') {
            const barWidth = chartWidth / data.length / metrics.length * 0.8;
            return points.map((point, i) => (
              <rect
                key={`${metric}-${i}`}
                x={point.x - barWidth / 2 + metrics.indexOf(metric) * barWidth}
                y={point.y}
                width={barWidth}
                height={padding.top + chartHeight - point.y}
                fill={color}
                rx="2"
              />
            ));
          }

          // Line chart
          return (
            <g key={metric}>
              <path
                d={generatePath(points)}
                fill="none"
                stroke={color}
                strokeWidth="2"
              />
              {points.map((point, i) => (
                <circle
                  key={i}
                  cx={point.x}
                  cy={point.y}
                  r="4"
                  fill={color}
                />
              ))}
            </g>
          );
        })}
      </svg>
    );
  };

  // Mini sparkline component
  const Sparkline = ({ data, color }: { data: number[]; color: string }) => {
    const width = 120;
    const height = 40;
    const max = Math.max(...data) * 1.1;
    const min = Math.min(...data) * 0.9;
    
    const points = data.map((v, i) => ({
      x: (i / (data.length - 1)) * width,
      y: height - ((v - min) / (max - min)) * height
    }));

    const path = points.reduce((p, point, i) => {
      if (i === 0) return `M ${point.x} ${point.y}`;
      return `${p} L ${point.x} ${point.y}`;
    }, '');

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-24 h-10">
        <path d={path} fill="none" stroke={color} strokeWidth="2" />
        <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="3" fill={color} />
      </svg>
    );
  };

  const chartTypeOptions = [
    { value: 'line', label: 'Line Chart' },
    { value: 'bar', label: 'Bar Chart' },
    { value: 'area', label: 'Area Chart' }
  ];

  const timeRangeOptions = [
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Users Today"
          value={formatNumber(stats.totalActiveUsers)}
          change={stats.activeUsersChange}
          changeLabel="vs yesterday"
          trend={stats.activeUsersChange >= 0 ? 'up' : 'down'}
          icon={
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
        <StatCard
          title="Total Sessions"
          value={formatNumber(stats.totalSessions)}
          icon={
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          }
        />
        <StatCard
          title="Total Messages"
          value={formatNumber(stats.totalMessages)}
          icon={
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          }
        />
        <StatCard
          title="Avg Session Duration"
          value={`${stats.avgSessionDuration}m`}
          icon={
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Main Chart */}
      <Card>
        <CardHeader
          title="Usage Analytics"
          subtitle="Track key metrics over time"
          action={
            <div className="flex items-center gap-2">
              <Select
                value={chartType}
                onChange={(e) => setChartType(e.target.value as ChartType)}
                options={chartTypeOptions}
              />
              <Select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as typeof timeRange)}
                options={timeRangeOptions}
              />
            </div>
          }
        />

        {/* Metric Toggles */}
        <div className="flex flex-wrap gap-2 mb-4">
          {(Object.keys(metricLabels) as MetricType[]).map(metric => (
            <button
              key={metric}
              onClick={() => {
                setSelectedMetrics(prev =>
                  prev.includes(metric)
                    ? prev.filter(m => m !== metric)
                    : [...prev, metric]
                );
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedMetrics.includes(metric)
                  ? 'bg-gray-100 text-gray-900'
                  : 'bg-transparent text-gray-500 hover:bg-gray-50'
              }`}
            >
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: metricColors[metric] }}
              />
              {metricLabels[metric]}
            </button>
          ))}
        </div>

        {/* Chart */}
        <div className="bg-white rounded-lg">
          <SimpleChart data={metrics} metrics={selectedMetrics} />
        </div>
      </Card>

      {/* Detailed Metrics Table */}
      <Card>
        <CardHeader
          title="Daily Breakdown"
          subtitle="Detailed metrics by day"
        />

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active Users</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">New Users</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sessions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Messages</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Crisis Alerts</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[...metrics].reverse().map((day, index) => (
                <tr key={day.date} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatDate(day.date, { month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center gap-2">
                      {formatNumber(day.activeUsers)}
                      {index < metrics.length - 1 && (
                        <Sparkline
                          data={metrics.slice(0, metrics.length - index).map(m => m.activeUsers)}
                          color={metricColors.activeUsers}
                        />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatNumber(day.newUsers)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatNumber(day.sessions)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatNumber(day.messages)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {day.avgSessionDuration}m
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {day.crisisAlerts > 0 ? (
                      <span className="text-red-600 font-medium">{day.crisisAlerts}</span>
                    ) : (
                      <span className="text-gray-400">0</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
