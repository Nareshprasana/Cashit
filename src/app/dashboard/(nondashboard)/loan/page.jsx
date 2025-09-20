"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  DollarSign,
  Calendar,
  AlertCircle,
} from "lucide-react";

const LoanPage = () => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleClick = (e) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      router.push("/dashboard/newloanform");
    }, 600);
  };

  useEffect(() => {
    const fetchLoans = async () => {
      try {
        const res = await fetch("/api/loans", { cache: "no-store" });
        const data = await res.json();

        if (Array.isArray(data)) {
          // ✅ Only keep active loans
          setLoans(data.filter((loan) => loan.status === "ACTIVE"));
        } else {
          console.error("Unexpected response:", data);
        }
      } catch (err) {
        console.error("Error fetching loans:", err);
      }
    };
    fetchLoans();
  }, []);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Active Loan List</h1>

        <button
          onClick={handleClick}
          disabled={loading}
          className={`flex cursor-pointer items-center justify-center gap-2 px-4 py-2 rounded-md font-medium text-white transition-all duration-300
            ${loading ? "opacity-80 cursor-not-allowed" : "hover:shadow-2xl"}
          `}
          style={{ backgroundColor: "#002a6a" }}
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          ) : (
            "+ Add loan"
          )}
        </button>
      </div>

      {loans.length === 0 ? (
        <div className="flex items-center text-gray-500">
          <AlertCircle className="h-5 w-5 mr-2" />
          No active loans found.
        </div>
      ) : (
        <div className="overflow-x-auto border rounded-md">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-3">Loan Amount</th>
                <th className="p-3">Pending Amount</th>
                <th className="p-3">Loan Date</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => (
                <tr key={loan.id} className="border-t">
                  <td className="p-3 font-medium">
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1 text-gray-500" />
                      ₹{Number(loan.loanAmount || 0).toLocaleString()}
                    </div>
                  </td>
                  <td className="p-3">
                    ₹{Number(loan.pendingAmount || 0).toLocaleString()}
                  </td>
                  <td className="p-3 flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    {loan.loanDate
                      ? new Date(loan.loanDate).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="p-3 font-semibold">
                    {loan.status === "ACTIVE" ? (
                      <span className="text-green-600">ACTIVE</span>
                    ) : (
                      <span className="text-gray-500">CLOSED</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LoanPage;
