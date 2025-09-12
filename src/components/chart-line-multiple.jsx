"use client";
import { useEffect, useState } from "react";
import { TrendingUp, Loader2 } from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Button } from "@/components/ui/button";

export const description = "A multiple line chart";

// Chart colors and labels
const chartConfig = {
  customers: { label: "Customers", color: "#F59E0B" },
  loans: { label: "Loans", color: "#3B82F6" },
  repayments: { label: "Repayments", color: "#10B981" },
};

export function ChartLineMultiple() {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("6m"); // default

  useEffect(() => {
    async function fetchChartData() {
      try {
        setLoading(true);
        const res = await fetch(`/api/loans/chart-data?range=${range}`);
        const data = await res.json();
        setChartData(data);
      } catch (error) {
        console.error("Failed to fetch chart data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchChartData();
  }, [range]); // re-fetch whenever range changes

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Report Overview</CardTitle>
            <CardDescription>
              Summary of customers, loans and repayments
            </CardDescription>
          </div>
          {/* Filter buttons */}
          <div className="flex gap-2">
            {["3m", "6m", "1y"].map((r) => (
              <Button
                key={r}
                variant={range === r ? "default" : "outline"}
                size="sm"
                onClick={() => setRange(r)}
              >
                {r.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-[300px]">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <LineChart data={chartData} margin={{ left: 12, right: 12 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value.slice(0, 3)}
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Line
                dataKey="customers"
                type="monotone"
                stroke={chartConfig.customers.color}
                strokeWidth={2}
                dot={false}
              />
              <Line
                dataKey="loans"
                type="monotone"
                stroke={chartConfig.loans.color}
                strokeWidth={2}
                dot={false}
              />
              <Line
                dataKey="repayments"
                type="monotone"
                stroke={chartConfig.repayments.color}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>

      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="text-muted-foreground flex items-center gap-2 leading-none">
              Showing {range.toUpperCase()} data
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
