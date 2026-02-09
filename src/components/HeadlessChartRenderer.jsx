import React, { forwardRef } from 'react';
import {
  PieChart, Pie, Cell,
  BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

/**
 * HeadlessChartRenderer - Renders charts off-screen for image capture
 * This component renders charts invisibly in the DOM so html2canvas can convert them to images
 */
const HeadlessChartRenderer = forwardRef(({ type, data, title, width = 600, height = 400 }, ref) => {
  const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

  const renderChart = () => {
    switch (type) {
      case 'pie':
        return (
          <PieChart width={width} height={height}>
            <Pie
              data={data}
              cx={width / 2}
              cy={height / 2}
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={Math.min(width, height) / 3}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  stroke="none"
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        );

      case 'bar':
        return (
          <BarChart
            width={width}
            height={height}
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis
              dataKey="category"
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="amount" fill="#2563EB" radius={[4, 4, 0, 0]} />
          </BarChart>
        );

      case 'line':
        return (
          <LineChart
            width={width}
            height={height}
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="amount"
              stroke="#2563EB"
              strokeWidth={2}
              dot={{ fill: '#2563EB', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        );

      case 'budget':
        return (
          <BarChart
            width={width}
            height={height}
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis
              dataKey="category"
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="budget" fill="#10B981" radius={[4, 4, 0, 0]} name="Budget" />
            <Bar dataKey="actual" fill="#EF4444" radius={[4, 4, 0, 0]} name="Actual" />
          </BarChart>
        );

      default:
        return null;
    }
  };

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        left: '0',
        top: '0',
        zIndex: -1000,
        opacity: 0,
        pointerEvents: 'none',
        backgroundColor: '#ffffff',
        padding: '20px'
      }}
    >
      {title && (
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          marginBottom: '16px',
          color: '#1F2937',
          textAlign: 'center'
        }}>
          {title}
        </h3>
      )}
      {renderChart()}
    </div>
  );
});

HeadlessChartRenderer.displayName = 'HeadlessChartRenderer';

export default HeadlessChartRenderer;
