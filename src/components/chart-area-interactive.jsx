"use client"

import * as React from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ChartTooltip } from "@/components/ui/chart"

export const description = "Reports bar chart with API"

export function ChartAreaInteractive() {
  const [reportData, setReportData] = React.useState([
    { name: "Customers", value: 0 },
    { name: "Active Loans", value: 0 },
    { name: "Pending Repayments", value: 0 },
  ])

  // 🔥 Fetch report summary data (customers, loans, repayments)
  React.useEffect(() => {
    async function fetchReports() {
      try {
        const [customersRes, loansRes, repaymentsRes] = await Promise.all([
          fetch("/api/customers"),
          fetch("/api/loans"),
          fetch("/api/repayments"),
        ])

        const customers = await customersRes.json()
        const loans = await loansRes.json()
        const repayments = await repaymentsRes.json()

        setReportData([
          { name: "Customers", value: customers.total || 0 },
          { name: "Active Loans", value: loans.active || 0 },
          { name: "Pending Repayments", value: repayments.pending || 0 },
        ])
      } catch (error) {
        console.error("Error fetching reports:", error)
      }
    }
    fetchReports()
  }, [])

  return (
    <div className="grid grid-cols-1 gap-6">
      {/* Bar Chart (Reports) */}
      <Card>
        <CardHeader>
          <CardTitle>Reports Overview</CardTitle>
          <CardDescription>Summary of customers, loans and repayments</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={reportData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <ChartTooltip />
              <Bar dataKey="value" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
