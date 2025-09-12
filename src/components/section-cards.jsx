"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { FaRupeeSign, FaCalendarAlt } from "react-icons/fa";
import { MdAssignment } from "react-icons/md";

export function SectionCards() {
  const [stats, setStats] = useState({
    loanValueMonthly: 0,
    loanCountMonthly: 0,
    receivedAmountMonthly: 0,
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        setIsLoading(true);
        const res = await fetch("/api/dashboard/stats");
        if (!res.ok) throw new Error("Failed to fetch stats");
        const data = await res.json();

        setStats({
          loanValueMonthly: data.loanValueMonthly ?? 0,
          loanCountMonthly: data.loanCountMonthly ?? 0,
          receivedAmountMonthly: data.receivedAmountMonthly ?? 0,
        });
      } catch (err) {
        console.error("Failed to fetch stats", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, []);

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(value);

  return (
    <div className="mb-3">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3 lg:px-6">
        {/* Card 1: Loan Value */}
        <Card className="border-l-4 border-blue-500 shadow-sm">
          <CardHeader className="flex justify-between items-center">
            <div>
              <CardDescription className="text-blue-600 text-sm">
                LOAN VALUE (MONTHLY)
              </CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums">
                {isLoading ? "..." : formatCurrency(stats.loanValueMonthly)}
              </CardTitle>
            </div>
            <FaRupeeSign className="text-4xl text-gray-300" />
          </CardHeader>
        </Card>

        {/* Card 2: Loan Count */}
        <Card className="border-l-4 border-green-500 shadow-sm">
          <CardHeader className="flex justify-between items-center">
            <div>
              <CardDescription className="text-green-600 text-sm">
                LOAN COUNT (MONTHLY)
              </CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums">
                {isLoading ? "..." : stats.loanCountMonthly}
              </CardTitle>
            </div>
            <FaCalendarAlt className="text-4xl text-gray-300" />
          </CardHeader>
        </Card>

        {/* Card 3: Received Amount */}
        <Card className="border-l-4 border-cyan-500 shadow-sm">
          <CardHeader className="flex justify-between items-center">
            <div>
              <CardDescription className="text-cyan-600 text-sm">
                RECEIVED AMOUNT (MONTHLY)
              </CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums">
                {isLoading
                  ? "..."
                  : formatCurrency(stats.receivedAmountMonthly)}
              </CardTitle>
            </div>
            <MdAssignment className="text-4xl text-gray-300" />
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
