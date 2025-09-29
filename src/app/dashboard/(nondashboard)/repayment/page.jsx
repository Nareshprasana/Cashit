"use client";
import React from "react";
import { useParams } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import dynamic from "next/dynamic";
import RepaymentTable from "../repayments/RepaymentTable";

// ✅ Load components client-side only (avoid hydration mismatch)
const RepaymentForm = dynamic(() => import("./RepaymentForm"), {
  ssr: false,
});
const AllCustomerTable = dynamic(
  () => import("@/components/AllCustomerTable"),
  {
    ssr: false,
  }
);

const user = { name: "Admin", image: "/profile-user.png", isLoggedIn: true };

const RepaymentFormPage = () => {
  const { customerId } = useParams(); // get ID from URL

  const handleFilterChange = ({ area, customerCode }) => {
    setFilters({ area, customer: customerCode });
  };

  const handleRepaymentSaved = () => {
    console.log("Repayment saved");
    // Optionally trigger a data refresh for the table
  };

  return (
    <SidebarProvider>
      <div className="p-6">
        <div>
          {/* Pass customerId to the form */}
          <RepaymentForm
            customerId={customerId}
            onRepaymentSaved={handleRepaymentSaved}
            onFilterChange={handleFilterChange}
          />
        </div>
        <div>
          {/* <AllCustomerTable /> */}
          <RepaymentTable/>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default RepaymentFormPage;
