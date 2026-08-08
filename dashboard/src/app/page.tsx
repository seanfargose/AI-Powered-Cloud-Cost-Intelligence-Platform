'use client'

import { useState, useEffect } from 'react'
import { DashboardHeader } from '@/components/DashboardHeader'
import { MetricsOverview } from '@/components/MetricsOverview'
import { CostTrendsChart } from '@/components/CostTrendsChart'
import { AlertsPanel } from '@/components/AlertsPanel'
import { DepartmentBreakdown } from '@/components/DepartmentBreakdown'
import { InteractiveQuery } from '@/components/InteractiveQuery'
import { PredictiveInsights } from '@/components/PredictiveInsights'
import { useApi, transformCostDataForDashboard } from '@/lib/api'

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d')
  const [dataSource, setDataSource] = useState<
    'loading' | 'azure' | 'mock'
  >('loading')
  const [error, setError] = useState<string | null>(null)

  const api = useApi()

  useEffect(() => {
    const loadRealData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        console.log('🔄 Loading real Azure cost data...')

        const healthCheck = await api.getHealth()
        console.log('✅ Backend health:', healthCheck.data)

        const fullAnalysis = await api.getFullAnalysis()
        console.log('📊 Full analysis received:', fullAnalysis.data)

        if (fullAnalysis.success) {
          const transformedData =
            transformCostDataForDashboard(fullAnalysis.data)

          transformedData.metadata = {
            subscriptionId: fullAnalysis.data.metadata.subscriptionId,
            dateRange: fullAnalysis.data.metadata.dateRange,
            tokensUsed: fullAnalysis.data.metadata.tokensUsed,
            recordCount: fullAnalysis.data.azureData.records,
            totalCost: fullAnalysis.data.azureData.totalCost,
            aiConfidence: fullAnalysis.data.aiAnalysis.confidence,
          }

          setDashboardData(transformedData)
          setDataSource('azure')

          console.log('✅ Real Azure data loaded successfully!')
        } else {
          throw new Error(
            fullAnalysis.error || 'Failed to load data'
          )
        }
      } catch (err) {
        console.error('Backend connection failed:', err)

        setError(
          err instanceof Error
            ? err.message
            : 'Unable to communicate with backend.'
        )

        setDataSource('loading')
      } finally {
        setIsLoading(false)
      }
    }

    loadRealData()
  }, [selectedTimeframe])

  /*
   * LOADING STATE
   */
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white transition-colors duration-200">
        <div className="text-center">


          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto my-6" />

          <h2 className="text-xl font-semibold">
            Loading Cost Intelligence
          </h2>

          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Connecting to your Azure subscription...
          </p>
        </div>
      </div>
    )
  }

  /*
   * BACKEND ERROR
   */
  if (!dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white transition-colors duration-200">
        <div className="text-center max-w-md px-6">

          <div className="flex justify-end mb-8">
          </div>

          <h2 className="text-xl font-semibold">
            Backend unavailable
          </h2>

          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Could not load dashboard data.
          </p>

          {error && (
            <p className="text-red-500 dark:text-red-400 mt-3 text-sm">
              {error}
            </p>
          )}

          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary mt-6"
          >
            Retry
          </button>

        </div>
      </div>
    )
  }

  /*
   * MAIN DASHBOARD
   */
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-gray-100 transition-colors duration-200">



      {/* DATA SOURCE */}
      <div
        className={`px-4 py-2 text-sm ${
          dataSource === 'azure'
            ? 'bg-green-100 text-green-800 border-b border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-900'
            : dataSource === 'mock'
              ? 'bg-yellow-100 text-yellow-800 border-b border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-900'
              : 'bg-blue-100 text-blue-800 border-b border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900'
        }`}
      >

        <div className="max-w-7xl mx-auto flex items-center justify-between">

          <div className="flex items-center space-x-2">

            {dataSource === 'azure' && (
              <>
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full" />

                <span>
                  Live Azure Data - Subscription:{' '}
                  {dashboardData.metadata?.subscriptionId?.slice(-8)}
                </span>

                <span className="text-xs">
                  (
                  {dashboardData.metadata?.recordCount} records, $
                  {dashboardData.metadata?.totalCost?.toFixed(2)} total)
                </span>
              </>
            )}

            {dataSource === 'mock' && (
              <>
                <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full" />

                <span>Mock Data Mode</span>

                {error && (
                  <span className="text-xs">
                    - {error}
                  </span>
                )}
              </>
            )}

          </div>

          {dashboardData.metadata?.aiConfidence !== undefined && (
            <span className="text-xs">
              AI Confidence:{' '}
              {(dashboardData.metadata.aiConfidence * 100).toFixed(0)}%
            </span>
          )}

        </div>

      </div>

      {/* HEADER */}
      <DashboardHeader
        selectedTimeframe={selectedTimeframe}
        onTimeframeChange={setSelectedTimeframe}
      />

      {/* MAIN */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* METRICS */}
        <div className="mb-8">
          <MetricsOverview
            metrics={dashboardData.overview}
            timeframe={selectedTimeframe}
          />
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">

          {/* LEFT */}
          <div className="lg:col-span-2 space-y-8">

            <CostTrendsChart
              data={dashboardData.costTrends || []}
              timeframe={selectedTimeframe}
            />

            <DepartmentBreakdown
              departments={dashboardData.departmentBreakdown || []}
            />

            <InteractiveQuery />

          </div>

          {/* RIGHT */}
          <div className="space-y-8">

            <AlertsPanel
              alerts={dashboardData.alerts || []}
            />

            <PredictiveInsights
              predictions={dashboardData.predictions || []}
            />

          </div>

        </div>

        {/* AZURE STATUS */}
        {dataSource === 'azure' && dashboardData.metadata && (
          <div className="mt-8 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-800 p-6 transition-colors duration-200">

            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Azure Integration Status
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">

              <div>
                <span className="text-gray-500 dark:text-gray-400">
                  Subscription:
                </span>

                <p className="font-mono text-xs text-gray-900 dark:text-gray-200">
                  {dashboardData.metadata.subscriptionId}
                </p>
              </div>

              <div>
                <span className="text-gray-500 dark:text-gray-400">
                  Date Range:
                </span>

                <p className="text-gray-900 dark:text-gray-200">
                  {dashboardData.metadata.dateRange?.start} to{' '}
                  {dashboardData.metadata.dateRange?.end}
                </p>
              </div>

              <div>
                <span className="text-gray-500 dark:text-gray-400">
                  AI Tokens Used:
                </span>

                <p className="text-gray-900 dark:text-gray-200">
                  {dashboardData.metadata.tokensUsed} (~$0.0001)
                </p>
              </div>

              <div>
                <span className="text-gray-500 dark:text-gray-400">
                  Last Updated:
                </span>

                <p className="text-gray-900 dark:text-gray-200">
                  {new Date().toLocaleTimeString()}
                </p>
              </div>

            </div>

          </div>
        )}

      </main>

    </div>
  )
}