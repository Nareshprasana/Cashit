"use client";

import React from "react";
import NewLoanForm from "./NewLoanForm";

const NewloanPage = () => {
  // Remove the user object since it's not being used and causing image error
  return (
    <div className="p-6">
      <NewLoanForm />
    </div>
  );
};

export default NewloanPage;