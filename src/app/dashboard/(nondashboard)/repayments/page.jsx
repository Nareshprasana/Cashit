"use client";

import React from "react";
import RepaymentTable from "../repayments/RepaymentTable";

const user = { name: "Admin", image: "/profile-user.png", isLoggedIn: true };

const RepaymentsPage = () => {
  return (
    <div className="p-6">
      <RepaymentTable />
    </div>
  );
};

export default RepaymentsPage;
