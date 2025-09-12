"use client";

import React from "react";
import NewLoanForm from "./NewLoanForm"; // Adjust path if you move the form
import AllCustomerTable from "@/components/AllCustomerTable"; // Adjust path if you move the table

const NewloanPage = () => {
  const user = {
    name: "Admin",
    image: "/profile-user.png",
    isLoggedIn: true,
  };

  return (
    <div className="p-6">
      <NewLoanForm />
      <AllCustomerTable />
    </div>
  );
};

export default NewloanPage;
