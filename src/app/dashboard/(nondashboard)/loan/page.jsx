"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AllCustomerTable from "@/components/AllCustomerTable";
import LoanTable from "./LoanTable";

const user = { name: "Admin", image: "/profile-user.png", isLoggedIn: true };

const LoanPage = () => {
  const [loans, setLoans] = useState([]);

  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = (e) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      router.push("/dashboard/newloanform");
    }, 600);
  };

  useEffect(() => {
    const fetchLoans = async () => {
      const res = await fetch("/api/loans");
      const data = await res.json();

      setLoans(data.filter((loan) => loan.status === "ACTIVE"));
    };
    fetchLoans();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 px-5">
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
      {/* <AllCustomerTable loans={loans} /> */}
      <LoanTable loans={loans} loading={loading} />
    </div>
  );
};

export default LoanPage;
