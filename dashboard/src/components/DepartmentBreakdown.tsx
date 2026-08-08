'use client'

import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react'

import { formatCurrency } from '@/lib/mockData'

interface Department {
  name: string
  currentSpend: number
  budget: number
  trend: 'up' | 'down' | 'stable'
  wastePercentage: number
}

interface DepartmentBreakdownProps {
  departments?: Department[]
}

export function DepartmentBreakdown({
  departments = [],
}: DepartmentBreakdownProps) {

  /* ============================================================
     SAFETY
     ============================================================ */

  if (!departments || departments.length === 0) {
    return (
      <div className="card">

        {/* Header */}
        <div className="card-header">

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Department Breakdown
            </h3>

            <p className="text-sm text-gray-600 dark:text-gray-400">
              Spending analysis by team and department
            </p>
          </div>

        </div>

        {/* Empty state */}
        <div
          className="
            flex
            flex-col
            items-center
            justify-center
            min-h-[220px]
            bg-gray-50
            dark:bg-gray-950
            rounded-lg
            border
            border-gray-200
            dark:border-gray-800
          "
        >

          <div
            className="
              w-12
              h-12
              rounded-full
              bg-gray-100
              dark:bg-gray-900
              flex
              items-center
              justify-center
              mb-4
            "
          >
            <AlertTriangle className="w-6 h-6 text-gray-400" />
          </div>

          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            No department data available
          </h4>

          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
            Department spending information will appear here once data is available.
          </p>

        </div>

      </div>
    )
  }

  /* ============================================================
     SORT DEPARTMENTS
     ============================================================ */

  const sortedDepartments = [...departments].sort(
    (a, b) => b.currentSpend - a.currentSpend
  )

  /* ============================================================
     TOTALS
     ============================================================ */

  const totalSpend = departments.reduce(
    (sum, dept) => sum + (Number(dept.currentSpend) || 0),
    0
  )

  const totalBudget = departments.reduce(
    (sum, dept) => sum + (Number(dept.budget) || 0),
    0
  )

  const overBudgetCount = departments.filter(
    (dept) => dept.currentSpend > dept.budget
  ).length

  /* ============================================================
     TREND ICON
     ============================================================ */

  const getTrendIcon = (
    trend: Department['trend']
  ) => {

    switch (trend) {

      case 'up':
        return (
          <TrendingUp className="w-4 h-4 text-danger-600 dark:text-danger-400" />
        )

      case 'down':
        return (
          <TrendingDown className="w-4 h-4 text-success-600 dark:text-success-400" />
        )

      case 'stable':
        return (
          <Minus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        )

      default:
        return null
    }
  }

  /* ============================================================
     BUDGET STATUS
     ============================================================ */

  const getBudgetStatus = (
    currentSpend: number,
    budget: number
  ) => {

    if (budget <= 0) {

      return {
        color:
          'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900',

        icon: (
          <AlertTriangle className="w-4 h-4" />
        ),

        text: 'No budget',
      }
    }

    const percentage =
      (currentSpend / budget) * 100

    if (percentage > 100) {

      return {
        color:
          'text-danger-600 bg-danger-50 dark:text-danger-400 dark:bg-danger-950/40',

        icon: (
          <AlertTriangle className="w-4 h-4" />
        ),

        text: `${(percentage - 100).toFixed(1)}% over`,
      }
    }

    if (percentage > 90) {

      return {
        color:
          'text-warning-600 bg-warning-50 dark:text-warning-400 dark:bg-warning-950/40',

        icon: (
          <AlertTriangle className="w-4 h-4" />
        ),

        text: `${percentage.toFixed(1)}% used`,
      }
    }

    return {
      color:
        'text-success-600 bg-success-50 dark:text-success-400 dark:bg-success-950/40',

      icon: (
        <CheckCircle className="w-4 h-4" />
      ),

      text: `${percentage.toFixed(1)}% used`,
    }
  }

  /* ============================================================
     WASTE COLOR
     ============================================================ */

  const getWasteColor = (
    wastePercentage: number
  ) => {

    if (wastePercentage > 30) {
      return 'text-danger-600 dark:text-danger-400'
    }

    if (wastePercentage > 20) {
      return 'text-warning-600 dark:text-warning-400'
    }

    return 'text-success-600 dark:text-success-400'
  }

  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <div className="card">

      {/* ========================================================
          HEADER
      ======================================================== */}

      <div className="card-header">

        <div>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Department Breakdown
          </h3>

          <p className="text-sm text-gray-600 dark:text-gray-400">
            Spending analysis by team and department
          </p>

        </div>

        {/* Summary */}

        <div className="flex items-center space-x-4 text-sm">

          <div className="flex items-center space-x-2">

            <div className="w-3 h-3 bg-success-500 rounded-full" />

            <span className="text-gray-600 dark:text-gray-400">
              {departments.length - overBudgetCount} on budget
            </span>

          </div>

          {overBudgetCount > 0 && (

            <div className="flex items-center space-x-2">

              <div className="w-3 h-3 bg-danger-500 rounded-full" />

              <span className="text-gray-600 dark:text-gray-400">
                {overBudgetCount} over budget
              </span>

            </div>

          )}

        </div>

      </div>

      {/* ========================================================
          DEPARTMENT LIST
      ======================================================== */}

      <div className="space-y-4">

        {sortedDepartments.map(
          (department, index) => {

            const budgetStatus =
              getBudgetStatus(
                department.currentSpend,
                department.budget
              )

            const spendPercentage =
              totalSpend > 0
                ? (department.currentSpend / totalSpend) * 100
                : 0

            const budgetUtilization =
              department.budget > 0
                ? (department.currentSpend /
                    department.budget) *
                  100
                : 0

            return (

              <div
                key={department.name}
                className="
                  p-4
                  border
                  border-gray-200
                  dark:border-gray-800
                  rounded-lg
                  bg-white
                  dark:bg-gray-900
                  hover:shadow-sm
                  transition-shadow
                  animate-fade-in
                "
                style={{
                  animationDelay:
                    `${index * 100}ms`,
                }}
              >

                {/* ==================================================
                    DEPARTMENT HEADER
                ================================================== */}

                <div className="flex items-center justify-between mb-3">

                  <div className="flex items-center space-x-3">

                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {department.name}
                    </h4>

                    <div
                      className={`
                        flex
                        items-center
                        space-x-1
                        px-2
                        py-1
                        rounded-full
                        text-xs
                        ${budgetStatus.color}
                      `}
                    >

                      {budgetStatus.icon}

                      <span>
                        {budgetStatus.text}
                      </span>

                    </div>

                  </div>

                  <div className="flex items-center space-x-2">

                    {getTrendIcon(
                      department.trend
                    )}

                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {spendPercentage.toFixed(1)}% of total
                    </span>

                  </div>

                </div>

                {/* ==================================================
                    SPENDING DETAILS
                ================================================== */}

                <div className="
                  grid
                  grid-cols-1
                  md:grid-cols-4
                  gap-4
                  mb-3
                ">

                  {/* Current Spend */}

                  <div>

                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Current Spend
                    </div>

                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(
                        department.currentSpend
                      )}
                    </div>

                  </div>

                  {/* Budget */}

                  <div>

                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Budget
                    </div>

                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(
                        department.budget
                      )}
                    </div>

                  </div>

                  {/* Remaining */}

                  <div>

                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Remaining
                    </div>

                    <div
                      className={`
                        text-lg
                        font-semibold
                        ${
                          department.budget -
                            department.currentSpend >=
                          0
                            ? 'text-success-600 dark:text-success-400'
                            : 'text-danger-600 dark:text-danger-400'
                        }
                      `}
                    >

                      {formatCurrency(
                        department.budget -
                          department.currentSpend
                      )}

                    </div>

                  </div>

                  {/* Waste */}

                  <div>

                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Waste Identified
                    </div>

                    <div
                      className={`
                        text-lg
                        font-semibold
                        ${getWasteColor(
                          department.wastePercentage
                        )}
                      `}
                    >
                      {department.wastePercentage}%
                    </div>

                  </div>

                </div>

                {/* ==================================================
                    BUDGET BAR
                ================================================== */}

                <div className="mb-2">

                  <div className="flex items-center justify-between text-sm mb-1">

                    <span className="text-gray-600 dark:text-gray-400">
                      Budget Utilization
                    </span>

                    <span className="font-medium text-gray-900 dark:text-gray-200">
                      {budgetUtilization.toFixed(1)}%
                    </span>

                  </div>

                  <div className="
                    w-full
                    bg-gray-200
                    dark:bg-gray-800
                    rounded-full
                    h-2
                  ">

                    <div
                      className={`
                        h-2
                        rounded-full
                        transition-all
                        duration-500
                        ${
                          budgetUtilization > 100
                            ? 'bg-danger-500'
                            : budgetUtilization > 90
                            ? 'bg-warning-500'
                            : 'bg-success-500'
                        }
                      `}
                      style={{
                        width: `${Math.min(
                          budgetUtilization,
                          100
                        )}%`,
                      }}
                    />

                  </div>

                  {budgetUtilization > 100 && (

                    <div className="text-xs text-danger-600 dark:text-danger-400 mt-1">

                      Over budget by{' '}

                      {formatCurrency(
                        department.currentSpend -
                          department.budget
                      )}

                    </div>

                  )}

                </div>

                {/* ==================================================
                    ACTIONS
                ================================================== */}

                <div className="
                  flex
                  items-center
                  justify-between
                  pt-2
                  border-t
                  border-gray-100
                  dark:border-gray-800
                ">

                  <div className="flex space-x-2">

                    <button className="
                      text-xs
                      text-primary-600
                      dark:text-primary-400
                      hover:text-primary-700
                      dark:hover:text-primary-300
                      font-medium
                    ">
                      View Details
                    </button>

                    <button className="
                      text-xs
                      text-primary-600
                      dark:text-primary-400
                      hover:text-primary-700
                      dark:hover:text-primary-300
                      font-medium
                    ">
                      Optimize
                    </button>

                  </div>

                  {department.wastePercentage > 25 && (

                    <div className="
                      text-xs
                      text-warning-600
                      dark:text-warning-400
                      font-medium
                    ">
                      High waste detected - Review recommended
                    </div>

                  )}

                </div>

              </div>

            )
          }
        )}

      </div>

      {/* ========================================================
          SUMMARY FOOTER
      ======================================================== */}

      <div className="
        mt-6
        pt-4
        border-t
        border-gray-200
        dark:border-gray-800
      ">

        <div className="
          grid
          grid-cols-1
          md:grid-cols-3
          gap-4
          text-center
        ">

          {/* Total Spend */}

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
              {formatCurrency(totalSpend)}
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Spend
            </div>

          </div>

          {/* Total Budget */}

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
              {formatCurrency(totalBudget)}
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Budget
            </div>

          </div>

          {/* Utilization */}

          <div className="
            p-3
            bg-gray-50
            dark:bg-gray-950
            rounded-lg
            border
            border-gray-200
            dark:border-gray-800
          ">

            <div
              className={`
                text-lg
                font-semibold
                ${
                  totalSpend <= totalBudget
                    ? 'text-success-600 dark:text-success-400'
                    : 'text-danger-600 dark:text-danger-400'
                }
              `}
            >

              {totalBudget > 0
                ? (
                    (totalSpend /
                      totalBudget) *
                    100
                  ).toFixed(1)
                : '0.0'}
              %

            </div>

            <div className="text-sm text-gray-600 dark:text-gray-400">
              Budget Utilization
            </div>

          </div>

        </div>

      </div>

    </div>
  )
}