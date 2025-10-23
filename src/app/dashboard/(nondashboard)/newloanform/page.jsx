/* -----------------------------------------------------------------
   src/app/dashboard/(nondashboard)/newloanform/page.jsx
----------------------------------------------------------------- */
"use client";

import React, { useEffect, useState } from "react";
import NewLoanForm from "./NewLoanForm";
import LoanTable from "../loan/LoanTable";

export default function NewloanPage() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Fetch all loans
  const fetchLoans = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/loans");
      if (res.ok) {
        const loansData = await res.json();
        setLoans(Array.isArray(loansData) ? loansData : []);
      } else {
        console.error("Failed to fetch loans");
        setLoans([]);
      }
    } catch (e) {
      console.error("Error fetching loans:", e);
      setLoans([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchLoans();
  }, []);

  // Handle new loan creation
  const handleLoanCreated = (newLoan) => {
    if (!newLoan || !newLoan.id) {
      console.error("Invalid loan data received:", newLoan);
      return;
    }

    // Add the new loan to the existing loans array
    setLoans(prevLoans => {
      // Check if loan already exists to avoid duplicates
      const exists = prevLoans.some(loan => loan.id === newLoan.id);
      if (exists) {
        return prevLoans.map(loan => loan.id === newLoan.id ? newLoan : loan);
      }
      return [newLoan, ...prevLoans];
    });
    
    toast.success("New loan added to the table!");
  };

  // Handle loan updates
  const handleLoanUpdate = (updatedLoan) => {
    if (!updatedLoan || !updatedLoan.id) {
      console.error("Invalid loan data for update:", updatedLoan);
      return;
    }

    setLoans(prevLoans => 
      prevLoans.map(loan => 
        loan.id === updatedLoan.id ? { ...loan, ...updatedLoan } : loan
      )
    );
    
    toast.success("Loan updated successfully!");
  };

  // Handle loan deletion
  const handleLoanDelete = (deletedLoanId) => {
    setLoans(prevLoans => 
      prevLoans.filter(loan => loan.id !== deletedLoanId)
    );
    
    toast.success("Loan deleted successfully!");
  };

  // Handle loan creation from LoanTable
  const handleLoanCreate = (newLoan) => {
    handleLoanCreated(newLoan);
  };

  return (
    <div className="p-6 space-y-8">
      {/* Pass the callback to NewLoanForm */}
      <NewLoanForm 
        onCustomerSelect={setSelectedCustomer}
        onLoanCreated={handleLoanCreated}
      />

      {/* Pass the state management functions to LoanTable */}
      <LoanTable 
        loans={loans}
        loading={loading}
        selectedCustomerCode={selectedCustomer?.customerCode || selectedCustomer?.code}
        onLoanUpdate={handleLoanUpdate}
        onLoanDelete={handleLoanDelete}
        onLoanCreate={handleLoanCreate}
      />
    </div>
  );
}