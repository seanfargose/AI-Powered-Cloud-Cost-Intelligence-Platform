'use client'

import { useState } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  BarChart3,
} from 'lucide-react'
import { formatCurrency } from '@/lib/mockData'

interface CostTrendsChartProps {
  data?: Array<{
    date: string
    actual: number
    predicted: number
    budget: number
  }>
  timeframe: string
}

export function CostTrendsChart({
  data = [],
  timeframe,
}: CostTrendsChartProps) {

  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null)

  /* ============================================================
     SAFETY CHECK
     ============================================================ */

  if (!data || data.length === 0) {
    return (
      <div className="card">

        {/* Header */}
        <div className="card-header">

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Cost Trends
            </h3>

            <p className="text-sm text-gray-600 dark:text-gray-400">
              Daily spending patterns and predictions
            </p>
          </div>

          <BarChart3 className="w-5 h-5 text-gray-400 dark:text-gray-500" />

        </div>

        {/* Empty state */}
        <div className="
          flex
          flex-col
          items-center
          justify-center
          min-h-[300px]
          bg-gray-50
          dark:bg-gray-950
          rounded-lg
          border
          border-gray-200
          dark:border-gray-800
        ">

          <BarChart3 className="w-12 h-12 text-gray-300 dark:text-gray-700 mb-4" />

          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            No cost trend data available
          </h4>

          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
            Cost trend information will appear here once data is available.
          </p>

        </div>

      </div>
    )
  }

  /* ============================================================
     CHART DIMENSIONS
     ============================================================ */

  const chartWidth = 800
  const chartHeight = 300

  const padding = {
    top: 20,
    right: 20,
    bottom: 40,
    left: 70,
  }

  const innerWidth =
    chartWidth - padding.left - padding.right

  const innerHeight =
    chartHeight - padding.top - padding.bottom

  /* ============================================================
     VALUE RANGE
     ============================================================ */

  const allValues = data.flatMap((d) => [
    Number(d.actual) || 0,
    Number(d.predicted) || 0,
    Number(d.budget) || 0,
  ])

  const rawMin = Math.min(...allValues)
  const rawMax = Math.max(...allValues)

  const range = rawMax - rawMin

  const minValue =
    range === 0
      ? Math.max(rawMin * 0.9, 0)
      : rawMin - range * 0.05

  const maxValue =
    range === 0
      ? rawMax * 1.1 || 1
      : rawMax + range * 0.05

  /* ============================================================
     SCALE FUNCTIONS
     ============================================================ */

  const xScale = (index: number) => {

    if (data.length === 1) {
      return innerWidth / 2
    }

    return (
      (index / (data.length - 1)) *
      innerWidth
    )
  }

  const yScale = (value: number) => {

    if (maxValue === minValue) {
      return innerHeight / 2
    }

    return (
      innerHeight -
      ((value - minValue) /
        (maxValue - minValue)) *
        innerHeight
    )
  }

  /* ============================================================
     PATH GENERATOR
     ============================================================ */

  const generatePath = (values: number[]) => {

    return values
      .map((value, index) => {

        const x = xScale(index)
        const y = yScale(value)

        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`

      })
      .join(' ')
  }

  /* ============================================================
     CHART PATHS
     ============================================================ */

  const actualPath = generatePath(
    data.map((d) => Number(d.actual) || 0)
  )

  const predictedPath = generatePath(
    data.map((d) => Number(d.predicted) || 0)
  )

  const budgetPath = generatePath(
    data.map((d) => Number(d.budget) || 0)
  )

  /* ============================================================
     TREND
     ============================================================ */

  const firstValue =
    Number(data[0]?.actual) || 0

  const lastValue =
    Number(data[data.length - 1]?.actual) || 0

  const trendPercentage =
    firstValue !== 0
      ? ((lastValue - firstValue) / firstValue) * 100
      : 0

  const isIncreasing = trendPercentage > 0

  /* ============================================================
     DATE FORMAT
     ============================================================ */

  const formatDate = (dateString: string) => {

    const date = new Date(dateString)

    if (Number.isNaN(date.getTime())) {
      return dateString
    }

    return date.toLocaleDateString(
      'en-US',
      {
        month: 'short',
        day: 'numeric',
      }
    )
  }

  /* ============================================================
     X AXIS LABELS
     ============================================================ */

  const labelInterval =
    Math.max(1, Math.ceil(data.length / 6))

  const xAxisPoints = data.filter(
    (_, index) =>
      index % labelInterval === 0
  )

  /* ============================================================
     SUMMARY VALUES
     ============================================================ */

  const averageDaily =
    data.reduce(
      (sum, d) =>
        sum + (Number(d.actual) || 0),
      0
    ) / data.length

  const peakDay =
    Math.max(
      ...data.map(
        (d) => Number(d.actual) || 0
      )
    )

  const lowestDay =
    Math.min(
      ...data.map(
        (d) => Number(d.actual) || 0
      )
    )

  return (
    <div className="card">

      {/* ========================================================
          HEADER
      ======================================================== */}

      <div className="card-header">

        <div>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Cost Trends
          </h3>

          <p className="text-sm text-gray-600 dark:text-gray-400">
            Daily spending patterns and predictions
          </p>

        </div>

        {/* Trend */}
        <div
          className={`
            flex
            items-center
            space-x-2
            px-3
            py-1
            rounded-full
            ${
              isIncreasing
                ? 'bg-danger-50 dark:bg-danger-950/40 text-danger-700 dark:text-danger-400'
                : 'bg-success-50 dark:bg-success-950/40 text-success-700 dark:text-success-400'
            }
          `}
        >

          {isIncreasing ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}

          <span className="text-sm font-medium">
            {isIncreasing ? '+' : ''}
            {trendPercentage.toFixed(1)}%
          </span>

        </div>

      </div>

      {/* ========================================================
          CONTROLS
      ======================================================== */}

      <div className="flex items-center justify-between mb-6">

        {/* Legend */}

        <div className="flex items-center space-x-4 text-sm">

          <div className="flex items-center space-x-2">

            <div className="w-3 h-3 bg-primary-600 rounded-full" />

            <span className="text-gray-700 dark:text-gray-300">
              Actual
            </span>

          </div>

          <div className="flex items-center space-x-2">

            <div className="w-3 h-3 bg-warning-500 rounded-full" />

            <span className="text-gray-700 dark:text-gray-300">
              Predicted
            </span>

          </div>

          <div className="flex items-center space-x-2">

            <div className="w-3 h-3 bg-gray-400 rounded-full" />

            <span className="text-gray-700 dark:text-gray-300">
              Budget
            </span>

          </div>

        </div>

        {/* Buttons */}

        <div className="flex items-center space-x-2">

          <button className="btn btn-secondary text-xs">

            <Calendar className="w-4 h-4 mr-1" />

            Export

          </button>

          <button className="btn btn-secondary text-xs">

            <BarChart3 className="w-4 h-4 mr-1" />

            Details

          </button>

        </div>

      </div>

      {/* ========================================================
          CHART
      ======================================================== */}

      <div className="
        relative
        bg-gray-50
        dark:bg-gray-950
        rounded-lg
        p-4
        overflow-x-auto
        border
        border-gray-200
        dark:border-gray-800
      ">

        <svg
          width={chartWidth}
          height={chartHeight}
          className="overflow-visible"
        >

          {/* Grid */}

          <defs>

            <pattern
              id="cost-chart-grid"
              width="40"
              height="30"
              patternUnits="userSpaceOnUse"
            >

              <path
                d="M 40 0 L 0 0 0 30"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                className="text-gray-200 dark:text-gray-800"
              />

            </pattern>

          </defs>

          <rect
            width={innerWidth}
            height={innerHeight}
            x={padding.left}
            y={padding.top}
            fill="url(#cost-chart-grid)"
          />

          {/* Chart group */}

          <g
            transform={`translate(${padding.left}, ${padding.top})`}
          >

            {/* Budget */}

            <path
              d={budgetPath}
              fill="none"
              stroke="#9ca3af"
              strokeWidth="2"
              strokeDasharray="5,5"
              opacity="0.8"
            />

            {/* Predicted */}

            <path
              d={predictedPath}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2"
              opacity="0.85"
            />

            {/* Actual */}

            <path
              d={actualPath}
              fill="none"
              stroke="#2563eb"
              strokeWidth="3"
            />

            {/* Points */}

            {data.map((point, index) => (

              <g key={`${point.date}-${index}`}>

                <circle
                  cx={xScale(index)}
                  cy={yScale(
                    Number(point.actual) || 0
                  )}
                  r="4"
                  fill="#2563eb"
                  className="cursor-pointer"
                  onMouseEnter={() =>
                    setHoveredPoint(index)
                  }
                  onMouseLeave={() =>
                    setHoveredPoint(null)
                  }
                />

                {/* Tooltip */}

                {hoveredPoint === index && (

                  <g>

                    <rect
                      x={xScale(index) - 60}
                      y={
                        yScale(
                          Number(point.actual) || 0
                        ) - 55
                      }
                      width="120"
                      height="45"
                      fill="white"
                      stroke="#e5e7eb"
                      rx="5"
                      className="dark:fill-gray-800 dark:stroke-gray-700"
                    />

                    <text
                      x={xScale(index)}
                      y={
                        yScale(
                          Number(point.actual) || 0
                        ) - 38
                      }
                      textAnchor="middle"
                      className="text-xs font-medium fill-gray-900 dark:fill-white"
                    >
                      {formatDate(point.date)}
                    </text>

                    <text
                      x={xScale(index)}
                      y={
                        yScale(
                          Number(point.actual) || 0
                        ) - 22
                      }
                      textAnchor="middle"
                      className="text-xs fill-gray-600 dark:fill-gray-300"
                    >
                      {formatCurrency(
                        Number(point.actual) || 0
                      )}
                    </text>

                  </g>

                )}

              </g>

            ))}

          </g>

          {/* ====================================================
              Y AXIS
          ==================================================== */}

          <g>

            {[0, 0.25, 0.5, 0.75, 1].map(
              (ratio) => {

                const value =
                  minValue +
                  (maxValue - minValue) *
                    ratio

                const y =
                  padding.top +
                  innerHeight -
                  ratio * innerHeight

                return (

                  <text
                    key={ratio}
                    x={padding.left - 10}
                    y={y + 4}
                    textAnchor="end"
                    className="text-xs fill-gray-600 dark:fill-gray-400"
                  >
                    {formatCurrency(value)}
                  </text>

                )
              }
            )}

          </g>

          {/* ====================================================
              X AXIS
          ==================================================== */}

          <g>

            {xAxisPoints.map(
              (point) => {

                const originalIndex =
                  data.findIndex(
                    (d) => d.date === point.date
                  )

                const x =
                  padding.left +
                  xScale(originalIndex)

                return (

                  <text
                    key={`${point.date}-${originalIndex}`}
                    x={x}
                    y={chartHeight - 10}
                    textAnchor="middle"
                    className="text-xs fill-gray-600 dark:fill-gray-400"
                  >
                    {formatDate(point.date)}
                  </text>

                )
              }
            )}

          </g>

        </svg>

      </div>

      {/* ========================================================
          SUMMARY
      ======================================================== */}

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">

        {/* Average */}

        <div className="
          p-3
          bg-gray-50
          dark:bg-gray-950
          rounded-lg
          border
          border-gray-200
          dark:border-gray-800
        ">

          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {formatCurrency(averageDaily)}
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            Average Daily
          </div>

        </div>

        {/* Peak */}

        <div className="
          p-3
          bg-gray-50
          dark:bg-gray-950
          rounded-lg
          border
          border-gray-200
          dark:border-gray-800
        ">

          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {formatCurrency(peakDay)}
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            Peak Day
          </div>

        </div>

        {/* Lowest */}

        <div className="
          p-3
          bg-gray-50
          dark:bg-gray-950
          rounded-lg
          border
          border-gray-200
          dark:border-gray-800
        ">

          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {formatCurrency(lowestDay)}
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            Lowest Day
          </div>

        </div>

      </div>

    </div>
  )
}