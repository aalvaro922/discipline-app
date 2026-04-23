'use client'

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, CartesianGrid,
} from 'recharts'
import type { DaySummary } from '@/lib/types'

interface CompletionChartProps {
  data: DaySummary[]
  type?: 'bar' | 'line'
}

export function CompletionChart({ data, type = 'bar' }: CompletionChartProps) {
  const formatted = data.map(d => ({
    ...d,
    label: new Date(d.date + 'T12:00:00').toLocaleDateString('es', { weekday: 'narrow', day: 'numeric' }),
  }))

  const tooltipStyle = {
    backgroundColor: '#111111',
    border: '1px solid #272727',
    borderRadius: 8,
    color: '#f5f5f5',
    fontSize: 12,
  }

  if (type === 'line') {
    return (
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={formatted} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1c1c1c" />
          <XAxis dataKey="label" tick={{ fill: '#616161', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#616161', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} unit="%" />
          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, 'Cumplimiento']} />
          <Line type="monotone" dataKey="percentage" stroke="#ffffff" strokeWidth={2} dot={{ fill: '#ffffff', r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={formatted} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
        <XAxis dataKey="label" tick={{ fill: '#616161', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#616161', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} unit="%" />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, 'Cumplimiento']} />
        <Bar dataKey="percentage" radius={[3, 3, 0, 0]}>
          {formatted.map((entry, i) => (
            <Cell key={i} fill={entry.isPerfect ? '#ffffff' : entry.percentage > 0 ? '#3a3a3a' : '#1c1c1c'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
