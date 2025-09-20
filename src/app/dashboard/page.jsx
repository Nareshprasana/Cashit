"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ChartLineMultiple } from "@/components/chart-line-multiple.jsx";
import { SectionCards } from "@/components/section-cards";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CustomerTable from "@/components/customers/CustomerTable";

const DemodashboardPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [data, setData] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingButton, setLoadingButton] = useState(null);

  // Redirect unauthenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch dashboard data (ADMIN only)
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

  const handleNavigate = (type, path) => {
    setLoadingButton(type);
    setTimeout(() => {
      router.push(path);
    }, 600);
  };

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

                {/* Desktop Buttons */}
                <div className="hidden sm:flex gap-3 justify-end">
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavigate("customer", "/dashboard/addNewCustomer");
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
                      handleNavigate("loan", "/dashboard/newloanform");
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
                      handleNavigate("users", "/dashboard/addUser");
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

                {/* Mobile Dropdown */}
                <div className="sm:hidden">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">+ Actions</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() =>
                          handleNavigate("customer", "/dashboard/addNewCustomer")
                        }
                      >
                        + Add Customer
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          handleNavigate("loan", "/dashboard/newloanform")
                        }
                      >
                        + Add Loan
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          handleNavigate("users", "/dashboard/addUser")
                        }
                      >
                        + Add Users
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
                // Replace AllCustomerTable with CustomerTable
                <CustomerTable />
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

export default DemoDashboardPage;