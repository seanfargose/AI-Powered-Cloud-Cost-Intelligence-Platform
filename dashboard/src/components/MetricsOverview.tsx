'use client'

import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  DollarSign,
  Target,
  Zap,
} from 'lucide-react'

import { formatCurrency, formatPercentage } from '@/lib/mockData'

interface MetricsOverviewProps {
  metrics?: {
    totalSpend?: number
    monthlyBudget?: number
    predictedSpend?: number
    wasteIdentified?: number
    savingsOpportunity?: number
    alertsCount?: number
  }
  timeframe: string
}

export function MetricsOverview({
  metrics,
  timeframe,
}: MetricsOverviewProps) {

  // Safe defaults in case Azure/API data is not available yet
  const totalSpend = metrics?.totalSpend ?? 0
  const monthlyBudget = metrics?.monthlyBudget ?? 0
  const predictedSpend = metrics?.predictedSpend ?? 0
  const wasteIdentified = metrics?.wasteIdentified ?? 0
  const savingsOpportunity = metrics?.savingsOpportunity ?? 0
  const alertsCount = metrics?.alertsCount ?? 0

  // Prevent division by zero
  const budgetUtilization =
    monthlyBudget > 0
      ? (totalSpend / monthlyBudget) * 100
      : 0

  const wastePercentage =
    totalSpend > 0
      ? (wasteIdentified / totalSpend) * 100
      : 0

  const savingsPercentage =
    totalSpend > 0
      ? (savingsOpportunity / totalSpend) * 100
      : 0

  const budgetOverrun = predictedSpend - monthlyBudget
  const isOverBudget = budgetOverrun > 0

  const metricCards = [
    {
      title: 'Current Spend',
      value: formatCurrency(totalSpend),
      subtitle: `${budgetUtilization.toFixed(1)}% of monthly budget`,
      icon: DollarSign,
      trend: isOverBudget ? 'up' : 'stable',
      trendValue: isOverBudget
        ? `+${formatPercentage(
            monthlyBudget > 0
              ? (budgetOverrun / monthlyBudget) * 100
              : 0
          )}`
        : 'On track',
      color: isOverBudget
        ? 'danger'
        : budgetUtilization > 80
        ? 'warning'
        : 'success',
    },

    {
      title: 'Predicted Month-End',
      value: formatCurrency(predictedSpend),
      subtitle: `vs ${formatCurrency(monthlyBudget)} budget`,
      icon: Target,
      trend: isOverBudget ? 'up' : 'down',
      trendValue: isOverBudget
        ? `Over by ${formatCurrency(budgetOverrun)}`
        : 'Under budget',
      color: isOverBudget ? 'danger' : 'success',
    },

    {
      title: 'Waste Identified',
      value: formatCurrency(wasteIdentified),
      subtitle: `${wastePercentage.toFixed(1)}% of total spend`,
      icon: AlertTriangle,
      trend: 'up',
      trendValue: `${wastePercentage.toFixed(1)}% waste ratio`,
      color:
        wastePercentage > 30
          ? 'danger'
          : wastePercentage > 20
          ? 'warning'
          : 'success',
    },

    {
      title: 'Savings Opportunity',
      value: formatCurrency(savingsOpportunity),
      subtitle: `${savingsPercentage.toFixed(1)}% potential savings`,
      icon: Zap,
      trend: 'down',
      trendValue: `${savingsPercentage.toFixed(1)}% recoverable`,
      color: 'success',
    },
  ]

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'success':
        return {
          bg: 'bg-success-50 dark:bg-green-950/30',
          icon: 'text-success-600 dark:text-green-400',
          text: 'text-success-600 dark:text-green-400',
          border: 'border-success-200 dark:border-green-800',
        }

      case 'warning':
        return {
          bg: 'bg-warning-50 dark:bg-yellow-950/30',
          icon: 'text-warning-600 dark:text-yellow-400',
          text: 'text-warning-600 dark:text-yellow-400',
          border: 'border-warning-200 dark:border-yellow-800',
        }

      case 'danger':
        return {
          bg: 'bg-danger-50 dark:bg-red-950/30',
          icon: 'text-danger-600 dark:text-red-400',
          text: 'text-danger-600 dark:text-red-400',
          border: 'border-danger-200 dark:border-red-800',
        }

      default:
        return {
          bg: 'bg-gray-50 dark:bg-gray-800',
          icon: 'text-gray-600 dark:text-gray-300',
          text: 'text-gray-600 dark:text-gray-300',
          border: 'border-gray-200 dark:border-gray-700',
        }
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4" />

      case 'down':
        return <TrendingDown className="w-4 h-4" />

      default:
        return (
          <div className="w-4 h-4 rounded-full bg-gray-400 dark:bg-gray-500" />
        )
    }
  }

  const timeframeText =
    timeframe === '24h'
      ? 'the last 24 hours'
      : timeframe === '7d'
      ? 'the last 7 days'
      : timeframe === '30d'
      ? 'the last 30 days'
      : 'the last 90 days'

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">

        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Cost Intelligence Overview
          </h2>

          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Real-time insights for {timeframeText}
          </p>
        </div>

        {/* Alerts */}
        <div className="flex items-center space-x-2">

          {alertsCount > 0 && (
            <div className="flex items-center space-x-2 px-3 py-1 bg-warning-50 dark:bg-yellow-950/30 rounded-full border border-warning-200 dark:border-yellow-800">

              <AlertTriangle className="w-4 h-4 text-warning-600 dark:text-yellow-400" />

              <span className="text-sm font-medium text-warning-700 dark:text-yellow-400">
                {alertsCount} active alerts
              </span>

            </div>
          )}

        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        {metricCards.map((metric, index) => {

          const colors = getColorClasses(metric.color)
          const Icon = metric.icon

          return (
            <div
              key={metric.title}
              className={`
                metric-card
                border-l-4
                ${colors.border}
                ${colors.bg}
                animate-fade-in
                dark:bg-gray-900
              `}
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >

              {/* Header */}
              <div className="flex items-center justify-between mb-3">

                <div
                  className={`
                    p-2
                    rounded-lg
                    ${colors.bg}
                    border
                    ${colors.border}
                  `}
                >
                  <Icon
                    className={`w-5 h-5 ${colors.icon}`}
                  />
                </div>

                <div
                  className={`flex items-center space-x-1 ${colors.text}`}
                >
                  {getTrendIcon(metric.trend)}
                </div>

              </div>

              {/* Main value */}
              <div className="mb-2">

                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {metric.value}
                </div>

                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {metric.subtitle}
                </div>

              </div>

              {/* Trend */}
              <div className={`text-sm font-medium ${colors.text}`}>
                {metric.trendValue}
              </div>

            </div>
          )
        })}

      </div>

      {/* Key Insights */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">

        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Key Insights
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Cost reduction */}
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">

            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {savingsPercentage.toFixed(1)}%
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-400">
              Potential cost reduction
            </div>

          </div>

          {/* Waste days */}
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">

            <div className="text-2xl font-bold text-gray-900 dark:text-white">

              {totalSpend > 0
                ? Math.round(
                    wasteIdentified / (totalSpend / 30)
                  )
                : 0}{' '}
              days

            </div>

            <div className="text-sm text-gray-600 dark:text-gray-400">
              Worth of waste identified
            </div>

          </div>

          {/* Annual savings */}
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">

            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              ${Math.round(
                (savingsOpportunity * 12) / 1000
              )}
              k
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-400">
              Annual savings potential
            </div>

          </div>

        </div>

      </div>

    </div>
  )
}