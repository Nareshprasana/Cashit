"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ChartLineMultiple } from "@/components/chart-line-multiple.jsx";
import { AllCustomerTable } from "@/components/AllCustomerTable.jsx";
import { SectionCards } from "@/components/section-cards";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const DemodashboardPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [data, setData] = useState([]);
  const [loadingData, setLoadingData] = useState(true); // for dashboard API
  const [loadingButton, setLoadingButton] = useState(null); // "customer" | "loan" | null

  // Redirect unauthenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch data only if ADMIN
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "ADMIN") {
      const fetchDashboardData = async () => {
        try {
          setLoadingData(true);
          const response = await fetch("/api/dashboard");
          if (!response.ok) throw new Error("Failed to fetch");
          const result = await response.json();
          setData(result);
        } catch (error) {
          console.error("Error fetching dashboard data:", error);
        } finally {
          setLoadingData(false);
        }
      };
      fetchDashboardData();
    } else if (status === "authenticated") {
      setLoadingData(false);
    }
  }, [status, session]);

  // 🔹 Show spinner while checking auth
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
      </div>
    );
  }

  if (status === "authenticated") {
    if (session.user.role === "AGENT") {
      return (
        <div className="flex flex-col w-full">
          <div className="flex flex-col gap-4 py-6 px-4">
            <h1 className="text-xl font-semibold">
              Welcome Agent {session.user.name}
            </h1>
            <p className="text-gray-600">
              You have limited access. You can only view repayments and
              dashboard.
            </p>

            <SectionCards />
            <div className="px-2 lg:px-6 w-full">
              <ChartLineMultiple />
            </div>
          </div>
        </div>
      );
    }

    if (session.user.role === "ADMIN") {
      return (
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-3 md:py-2">
              {/* Header with Buttons */}
              <div className="flex items-center justify-between mb-4 px-5">
                <h1 className="text-2xl font-bold pl-2">Admin Dashboard</h1>
                <div className="flex gap-3 justify-end">
                  {/* Add Customer Button */}
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      setLoadingButton("customer");
                      setTimeout(() => {
                        router.push("/dashboard/addNewCustomer");
                      }, 600);
                    }}
                    disabled={loadingButton === "customer"}
                  >
                    {loadingButton === "customer" ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      "+ Add Customer"
                    )}
                  </Button>

                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      setLoadingButton("loan");
                      setTimeout(() => {
                        router.push("/dashboard/newloanform");
                      }, 600);
                    }}
                    disabled={loadingButton === "loan"}
                  >
                    {loadingButton === "loan" ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      "+ Add Loan"
                    )}
                  </Button>

                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      setLoadingButton("users");
                      setTimeout(() => {
                        router.push("/dashboard/addUser");
                      }, 600);
                    }}
                    disabled={loadingButton === "users"}
                  >
                    {loadingButton === "users" ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      "+ Add Users"
                    )}
                  </Button>
                </div>
              </div>

              {/* Dashboard Content */}
              <SectionCards />
              <div className="px-4 lg:px-6">
                <ChartLineMultiple />
              </div>

              {loadingData ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-10 w-10 animate-spin text-green-500" />
                </div>
              ) : (
                <AllCustomerTable />
              )}
            </div>
          </div>
        </div>
      );
    }
  }

  // 🔹 Unauthorized fallback
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Unauthorized</h1>
      <p className="text-gray-600">
        Your role could not be verified. Check console for session data.
      </p>
    </div>
  );
};

export default DemodashboardPage;
