'use client'

import { useState } from 'react'
import {
  Bell,
  Search,
  Settings,
  User,
  AlertTriangle,
  Sun,
  Moon,
} from 'lucide-react'

interface DashboardHeaderProps {
  selectedTimeframe: string
  onTimeframeChange: (timeframe: string) => void
}

export function DashboardHeader({
  selectedTimeframe,
  onTimeframeChange,
}: DashboardHeaderProps) {
  const [notificationCount] = useState(7)

  const [darkMode, setDarkMode] = useState(false)

  const timeframes = [
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
  ]

  const toggleTheme = () => {
    const newDarkMode = !darkMode

    setDarkMode(newDarkMode)

    if (newDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  return (
    <header className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 transition-colors duration-300">

      {/* ========================================================= */}
      {/* MAIN HEADER */}
      {/* ========================================================= */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="flex items-center justify-between h-20">

          {/* ===================================================== */}
          {/* LEFT SIDE - BRAND */}
          {/* ===================================================== */}

          <div className="flex items-center space-x-4">

            {/* Logo */}
            <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center shadow-sm">

              <svg
                className="w-7 h-7 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>

            </div>

            {/* Title */}
            <div>
              <p className="text-xs font-semibold tracking-widest text-gray-500 dark:text-gray-400 uppercase">
                Cloud Cost Intelligence
              </p>

              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Cost Optimization Platform
              </h1>
            </div>

          </div>

          {/* ===================================================== */}
          {/* RIGHT SIDE - THEME */}
          {/* ===================================================== */}

          <button
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            className="
              p-3
              rounded-lg
              border
              border-gray-200
              dark:border-gray-700
              bg-gray-50
              dark:bg-gray-900
              text-gray-600
              dark:text-gray-300
              hover:bg-gray-100
              dark:hover:bg-gray-800
              transition-all
              duration-200
            "
          >
            {darkMode ? (
              <Sun className="w-5 h-5 text-yellow-400" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

        </div>

      </div>

      {/* ========================================================= */}
      {/* DASHBOARD NAVIGATION */}
      {/* ========================================================= */}

      <div className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex items-center justify-between py-4">

            {/* =================================================== */}
            {/* LEFT - BRAND / STATUS */}
            {/* =================================================== */}

            <div className="flex items-center space-x-4">

              <div className="flex items-center space-x-3">

                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-950 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-primary-600 dark:text-primary-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 13l4-4 4 4 8-8"
                    />
                  </svg>
                </div>

                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    Cost Intelligence
                  </h2>

                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    StreamFlow Technologies
                  </p>
                </div>

              </div>

              {/* Live monitoring */}
              <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 bg-success-50 dark:bg-green-950/30 rounded-full border border-success-200 dark:border-green-900">

                <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse" />

                <span className="text-sm text-success-700 dark:text-green-400 font-medium">
                  Live Monitoring
                </span>

              </div>

            </div>

            {/* =================================================== */}
            {/* CENTER - TIMEFRAME */}
            {/* =================================================== */}

            <div className="hidden md:flex items-center space-x-3">

              <label
                htmlFor="timeframe"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Time Period:
              </label>

              <select
                id="timeframe"
                value={selectedTimeframe}
                onChange={(e) =>
                  onTimeframeChange(e.target.value)
                }
                className="
                  bg-white
                  dark:bg-gray-800
                  text-gray-900
                  dark:text-white
                  border
                  border-gray-300
                  dark:border-gray-700
                  rounded-md
                  px-3
                  py-2
                  text-sm
                  focus:outline-none
                  focus:ring-2
                  focus:ring-primary-500
                  transition-colors
                "
              >

                {timeframes.map((tf) => (
                  <option
                    key={tf.value}
                    value={tf.value}
                    className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    {tf.label}
                  </option>
                ))}

              </select>

            </div>

            {/* =================================================== */}
            {/* RIGHT - ACTIONS */}
            {/* =================================================== */}

            <div className="flex items-center space-x-2">

              {/* Search */}
              <button
                className="
                  p-2
                  rounded-lg
                  text-gray-500
                  dark:text-gray-400
                  hover:text-gray-900
                  dark:hover:text-white
                  hover:bg-gray-100
                  dark:hover:bg-gray-800
                  transition-colors
                "
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Notifications */}
              <button
                className="
                  relative
                  p-2
                  rounded-lg
                  text-gray-500
                  dark:text-gray-400
                  hover:text-gray-900
                  dark:hover:text-white
                  hover:bg-gray-100
                  dark:hover:bg-gray-800
                  transition-colors
                "
                aria-label="Notifications"
              >

                <Bell className="w-5 h-5" />

                {notificationCount > 0 && (
                  <span className="
                    absolute
                    -top-1
                    -right-1
                    w-5
                    h-5
                    bg-danger-500
                    text-white
                    text-xs
                    rounded-full
                    flex
                    items-center
                    justify-center
                  ">
                    {notificationCount > 9
                      ? '9+'
                      : notificationCount}
                  </span>
                )}

              </button>

              {/* Settings */}
              <button
                className="
                  p-2
                  rounded-lg
                  text-gray-500
                  dark:text-gray-400
                  hover:text-gray-900
                  dark:hover:text-white
                  hover:bg-gray-100
                  dark:hover:bg-gray-800
                  transition-colors
                "
                aria-label="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>

              {/* User */}
              <div className="hidden lg:flex items-center space-x-2 ml-2">

                <div className="
                  w-9
                  h-9
                  bg-gray-200
                  dark:bg-gray-700
                  rounded-full
                  flex
                  items-center
                  justify-center
                ">
                  <User className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </div>

                <div>

                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    John Doe
                  </p>

                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Cost Analyst
                  </p>

                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* ========================================================= */}
      {/* QUICK STATUS BAR */}
      {/* ========================================================= */}

      <div className="bg-gray-50 dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex items-center justify-between py-2">

            {/* Status */}
            <div className="flex items-center space-x-6 text-sm">

              {/* Systems */}
              <div className="flex items-center space-x-2">

                <div className="w-2 h-2 bg-success-500 rounded-full" />

                <span className="text-gray-600 dark:text-gray-400">
                  All systems operational
                </span>

              </div>

              {/* Alerts */}
              <div className="flex items-center space-x-2">

                <AlertTriangle className="w-4 h-4 text-warning-500" />

                <span className="text-gray-600 dark:text-gray-400">
                  2 budget alerts active
                </span>

              </div>

            </div>

            {/* Last updated */}
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Last updated: {new Date().toLocaleTimeString()}
            </div>

          </div>

        </div>

      </div>

    </header>
  )
}