"use client";

import React, { useState, useEffect } from "react";
import NewLoanForm from "./NewLoanForm";
import LoanTable from "../loan/LoanTable"; // Adjust path as needed

const NewloanPage = () => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch loans data
  useEffect(() => {
    const fetchLoans = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/loans");
        if (response.ok) {
          const data = await response.json();
          setLoans(data);
        } else {
          console.error("Failed to fetch loans");
        }
      } catch (error) {
        console.error("Error fetching loans:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLoans();
  }, []);

  const user = {
    name: "Admin",
    image: "/profile-user.png",
    isLoggedIn: true,
  };

  return (
    <div className="p-6 space-y-8">
      <NewLoanForm />
      <LoanTable loans={loans} loading={loading} />
    </div>
  );
};

export default NewloanPage;