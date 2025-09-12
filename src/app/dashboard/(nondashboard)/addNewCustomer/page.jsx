"use client";

import React from "react";
import AddNewCustomerForm from "./AddNewCustomerForm";

const AddCustomerPage = () => {
  const user = {
    name: "Admin",
    image: "/profile-user.png",
    isLoggedIn: true,
  };
  return (
    <div className="p-6">
      <AddNewCustomerForm />
    </div>
  );
};

export default AddCustomerPage;
