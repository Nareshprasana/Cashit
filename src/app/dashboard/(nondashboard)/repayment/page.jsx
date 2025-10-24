"use client";
import React, { useState } from "react";
import { useParams } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import dynamic from "next/dynamic";
import RepaymentTable from "../repayments/RepaymentTable";

// ✅ Load components client-side only
const RepaymentForm = dynamic(() => import("./RepaymentForm"), { ssr: false });
const AllCustomerTable = dynamic(() => import("@/components/AllCustomerTable"), { ssr: false });

const user = { name: "Admin", image: "/profile-user.png", isLoggedIn: true };

const RepaymentFormPage = () => {
  const { customerId } = useParams();
  
  // 1. Create state to hold the list of repayments
  const [repayments, setRepayments] = useState([]);

  // 2. Function to add a new repayment to the state
  const handleNewRepayment = (newRepayment) => {
    // Add the new repayment to the beginning of the array so it appears first
    setRepayments(prevRepayments => [newRepayment, ...prevRepayments]);
  };

  const handleFilterChange = ({ area, customerCode }) => {
    // Your existing filter logic
    console.log({ area, customerCode });
  };

  return (
    <SidebarProvider>
      <div>
        <div>
          {/* 3. Pass the update function to the form */}
          <RepaymentForm
            customerId={customerId}
            onRepaymentSaved={handleNewRepayment} // Use the new state updater
            onFilterChange={handleFilterChange}
          />
        </div>
        <div>
          {/* 4. Pass the current repayment state down to the table */}
          <RepaymentTable repayments={repayments} />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default RepaymentFormPage;