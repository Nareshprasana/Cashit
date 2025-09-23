"use client";

import React from "react";
import NewLoanForm from "./NewLoanForm"; // Adjust path if you move the form
import LoanTable from "../loan/LoanTable"

const NewloanPage = () => {
  const user = {
    name: "Admin",
    image: "/profile-user.png",
    isLoggedIn: true,
  };

  return (
    <div className="p-6">
      <NewLoanForm />
      <LoanTable loans={loans} loading={loading} />
    </div>
  );
};

export default NewloanPage;
