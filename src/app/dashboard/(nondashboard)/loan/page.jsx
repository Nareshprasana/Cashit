"use client";

import React, { useEffect, useState } from "react";
import LoanTable from "./LoanTable"; // since you put it in same folder
import { AlertCircle } from "lucide-react";

const LoanPage = () => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLoans = async () => {
      try {
        const res = await fetch("/api/loans", { cache: "no-store" });
        const data = await res.json();

        if (Array.isArray(data)) {
          setLoans(data);
        } else {
          console.error("Unexpected response:", data);
        }
      } catch (error) {
        console.error("Error fetching loans:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLoans();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Loan Management</h1>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-500">
          <span className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></span>
          Loading loans...
        </div>
      ) : loans.length === 0 ? (
        <div className="flex items-center text-gray-500">
          <AlertCircle className="h-5 w-5 mr-2" />
          No loans found.
        </div>
      ) : (
        <LoanTable loans={loans} loading={loading} />
      )}
    </div>
  );
};

export default LoanPage;
