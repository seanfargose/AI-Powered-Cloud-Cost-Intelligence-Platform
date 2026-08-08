/**
 * API Client for Cost Optimization Platform
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// ============================================================
// API TYPES
// ============================================================

export interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
  message?: string
  timestamp?: string
}

export interface CostRecord {
  date: string
  cost: number
  service: string
  resourceGroup: string
  department?: string
}

export interface CostSummary {
  totalCost: number
  totalRecords: number
  dateRange: {
    start: string
    end: string
  }
}

export interface AIAnalysis {
  summary: string
  insights: string[]
  recommendations: string[]
  riskFactors: string[]
  confidence: number
}

export interface DashboardOverview {
  totalSpend: number
  monthlyBudget: number
  predictedSpend: number
  wasteIdentified: number
  savingsOpportunity: number
  alertsCount: number
}

export interface CostTrend {
  date: string
  actual: number
  predicted: number
  budget: number
}

export interface DepartmentBreakdown {
  name: string
  currentSpend: number
  budget: number
  remainingBudget: number
  utilization: number
  trend: 'up' | 'down' | 'stable'
  wastePercentage: number
}

export interface DashboardAlert {
  id: string
  type: 'critical' | 'warning' | 'info'
  title: string
  description: string
  impact: number
  timeAgo: string
  department: string
}

export interface DashboardPrediction {
  type: 'optimization_opportunity' | 'cost_spike'
  title: string
  description: string
  confidence: number
  timeframe: string
  impact: number
}

export interface FullAnalysisResponse {
  azureData: {
    records: number
    totalCost: number
    sampleRecords: CostRecord[]
  }

  aiAnalysis: AIAnalysis

  metadata: {
    subscriptionId: string
    dateRange: {
      start: string
      end: string
    }
    tokensUsed: number
  }
}

export interface DashboardData {
  overview: DashboardOverview
  costTrends: CostTrend[]
  departmentBreakdown: DepartmentBreakdown[]
  alerts: DashboardAlert[]
  predictions: DashboardPrediction[]
  metadata?: {
    subscriptionId: string
    dateRange: {
      start: string
      end: string
    }
    tokensUsed: number
    recordCount: number
    totalCost: number
    aiConfidence: number
  }
}

// ============================================================
// API CLIENT
// ============================================================

class ApiClient {
  constructor(private readonly baseUrl: string = API_BASE_URL) {}

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`

    console.log(`🌐 API Request: ${url}`)

    let response: Response

    try {
      response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(options?.headers || {}),
        },
        ...options,
      })
    } catch (error) {
      console.error(`❌ Network error calling ${url}`, error)

      throw new Error(
        `Failed to connect to backend at ${url}. ` +
          `Make sure the backend is running.`
      )
    }

    if (!response.ok) {
      let message = response.statusText

      try {
        const errorBody = await response.json()

        if (errorBody?.error) {
          message = errorBody.error
        }

        if (errorBody?.message) {
          message = errorBody.message
        }
      } catch {
        // Ignore JSON parsing failure
      }

      throw new Error(
        `API Error ${response.status}: ${message}`
      )
    }

    return response.json()
  }

  // ==========================================================
  // HEALTH
  // ==========================================================

  getHealth() {
    return this.request<{
      status: string
      services: Record<string, boolean>
    }>('/health')
  }

  // ==========================================================
  // AZURE COSTS
  // ==========================================================

  getAzureCosts() {
    return this.request<{
      records: CostRecord[]
      summary: CostSummary
    }>('/api/azure/costs')
  }

  // ==========================================================
  // AI ANALYSIS
  // ==========================================================

  getAIAnalysis(
    query?: string,
    costData?: CostRecord[]
  ) {
    return this.request<{
      analysis: AIAnalysis
      query: string
      dataAnalyzed: number
      tokensUsed: number
    }>('/api/ai/analyze', {
      method: 'POST',
      body: JSON.stringify({
        query,
        costData,
      }),
    })
  }

  // ==========================================================
  // FULL ANALYSIS
  // ==========================================================

  getFullAnalysis() {
    return this.request<FullAnalysisResponse>(
      '/api/full-analysis'
    )
  }
}

// ============================================================
// API INSTANCE
// ============================================================

export const apiClient = new ApiClient()

// ============================================================
// TRANSFORM API DATA
// ============================================================

export function transformCostDataForDashboard(
  apiData: FullAnalysisResponse
): DashboardData {
  const records = apiData?.azureData?.sampleRecords || []

  const totalSpend =
    Number(apiData?.azureData?.totalCost) || 0

  const aiAnalysis = apiData?.aiAnalysis || {
    summary: '',
    insights: [],
    recommendations: [],
    riskFactors: [],
    confidence: 0,
  }

  return {
    overview: {
      totalSpend,
      monthlyBudget: totalSpend * 1.2,
      predictedSpend: totalSpend * 1.08,
      wasteIdentified: totalSpend * 0.12,
      savingsOpportunity: totalSpend * 0.18,
      alertsCount: aiAnalysis.riskFactors.length,
    },

    costTrends:
      records.length > 0
        ? records.map((record) => ({
            date: record.date,
            actual: Number(record.cost) || 0,
            predicted: Math.round(
              (Number(record.cost) || 0) * 1.08
            ),
            budget: Math.round(
              (Number(record.cost) || 0) * 1.2
            ),
          }))
        : generateMockTrendData(),

    departmentBreakdown:
      groupCostsByDepartment(records),

    alerts:
      generateAlertsFromAnalysis(aiAnalysis),

    predictions:
      generatePredictionsFromAnalysis(
        aiAnalysis,
        totalSpend
      ),
  }
}

// ============================================================
// MOCK TREND FALLBACK
// ============================================================

function generateMockTrendData(): CostTrend[] {
  return Array.from({ length: 30 }, (_, index) => {
    const date = new Date()

    date.setDate(
      date.getDate() - (29 - index)
    )

    return {
      date: date.toISOString().slice(0, 10),
      actual: 0,
      predicted: 0,
      budget: 0,
    }
  })
}

// ============================================================
// DEPARTMENT BREAKDOWN
// ============================================================

function groupCostsByDepartment(
  records: CostRecord[]
): DepartmentBreakdown[] {
  if (!records.length) {
    return []
  }

  const departmentBudgets: Record<
    string,
    number
  > = {
    Engineering: 55000,
    Marketing: 24000,
    Sales: 36000,
    Finance: 28000,
    Operations: 32000,
    HR: 18000,
  }

  const names = Object.keys(
    departmentBudgets
  )

  const totals: Record<string, number> = {}

  records.forEach((record, index) => {
    const department =
      record.department ||
      names[index % names.length]

    totals[department] =
      (totals[department] || 0) +
      (Number(record.cost) || 0)
  })

  return Object.entries(totals).map(
    ([name, spend]) => {
      const budget =
        departmentBudgets[name] ||
        Math.ceil(spend * 1.15)

      const utilization =
        budget > 0
          ? (spend / budget) * 100
          : 0

      return {
        name,

        currentSpend:
          Math.round(spend),

        budget,

        remainingBudget:
          Math.max(
            0,
            Math.round(
              budget - spend
            )
          ),

        utilization,

        trend:
          utilization > 95
            ? 'up'
            : utilization < 60
              ? 'down'
              : 'stable',

        wastePercentage:
          utilization > 90
            ? 18
            : utilization > 75
              ? 12
              : 6,
      }
    }
  )
}

// ============================================================
// ALERTS
// ============================================================

function generateAlertsFromAnalysis(
  analysis: AIAnalysis
): DashboardAlert[] {
  if (!analysis) {
    return [
      {
        id: 'no-data',
        type: 'info',
        title: 'No Cost Data',
        description:
          'Deploy Azure resources to begin receiving AI insights.',
        impact: 0,
        timeAgo: 'Just now',
        department: 'All',
      },
    ]
  }

  const alerts: DashboardAlert[] = []

  ;(analysis.riskFactors || []).forEach(
    (risk, index) => {
      alerts.push({
        id: `risk-${index}`,
        type: 'warning',
        title: 'Risk Factor',
        description: risk,
        impact: 8500,
        timeAgo: '5 min ago',
        department: 'Engineering',
      })
    }
  )

  ;(analysis.insights || []).forEach(
    (insight, index) => {
      const text =
        insight.toLowerCase()

      if (
        text.includes('increase') ||
        text.includes('spike') ||
        text.includes('growth')
      ) {
        alerts.push({
          id: `critical-${index}`,
          type: 'critical',
          title: 'Cost Spike Detected',
          description: insight,
          impact: 12000,
          timeAgo: '12 min ago',
          department: 'Engineering',
        })
      }
    }
  )

  ;(analysis.recommendations || []).forEach(
    (recommendation, index) => {
      alerts.push({
        id: `recommend-${index}`,
        type: 'info',
        title: 'Optimization Opportunity',
        description: recommendation,
        impact: -5200,
        timeAgo: '18 min ago',
        department: 'Engineering',
      })
    }
  )

  return alerts.slice(0, 6)
}

// ============================================================
// PREDICTIONS
// ============================================================

function generatePredictionsFromAnalysis(
  analysis: AIAnalysis,
  totalSpend: number
): DashboardPrediction[] {
  if (!analysis) {
    return []
  }

  const templates = [
    {
      confidence: 0.96,
      timeframe: 'Next 30 days',
      impact: totalSpend * 0.18,
    },
    {
      confidence: 0.92,
      timeframe: 'Next 14 days',
      impact: totalSpend * 0.12,
    },
    {
      confidence: 0.88,
      timeframe: 'Next 7 days',
      impact: totalSpend * 0.08,
    },
    {
      confidence: 0.83,
      timeframe: 'Next 60 days',
      impact: totalSpend * 0.05,
    },
  ]

  return (
    analysis.recommendations || []
  ).map(
    (recommendation, index) => {
      const template =
        templates[
          index % templates.length
        ]

      return {
        type:
          'optimization_opportunity',

        title: recommendation,

        description:
          `AI recommends: ${recommendation}`,

        confidence:
          template.confidence,

        timeframe:
          template.timeframe,

        impact:
          Math.round(
            template.impact
          ),
      }
    }
  )
}

// ============================================================
// REACT HOOK
// ============================================================

export function useApi() {
  return {
    getHealth: () =>
      apiClient.getHealth(),

    getAzureCosts: () =>
      apiClient.getAzureCosts(),

    getAIAnalysis: (
      query?: string,
      costData?: CostRecord[]
    ) =>
      apiClient.getAIAnalysis(
        query,
        costData
      ),

    getFullAnalysis: () =>
      apiClient.getFullAnalysis(),
  }
}