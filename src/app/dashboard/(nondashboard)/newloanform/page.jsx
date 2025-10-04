/* -----------------------------------------------------------------
   src/app/dashboard/(nondashboard)/newloanform/page.jsx
----------------------------------------------------------------- */
"use client";

import React, { useEffect, useState } from "react";
import NewLoanForm from "./NewLoanForm";
import LoanTable from "../loan/LoanTable";   // adjust if needed
import { AllCustomerTable } from "@/components/AllCustomerTable.jsx";

export default function NewloanPage() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ---- selected customer (store the whole object) ---- */
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  /* ---- fetch all loans (unchanged) ---- */
  useEffect(() => {
    const fetchLoans = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/loans");
        if (res.ok) setLoans(await res.json());
        else console.error("Failed to fetch loans");
      } catch (e) {
        console.error("Error fetching loans:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchLoans();
  }, []);

  return (
    <div className="p-6 space-y-8">
      {/* New‑loan form tells us which customer was chosen */}
      <NewLoanForm onCustomerSelect={setSelectedCustomer} />

      {/* Pass **customerCode** (or the fallback `code`) to the table */}
      <AllCustomerTable 
        loans={loans}
        loading={loading}
        selectedCustomerCode={
          selectedCustomer?.customerCode || selectedCustomer?.code
        }
      />

    </div>
  );
}
