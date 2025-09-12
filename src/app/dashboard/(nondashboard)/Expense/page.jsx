"use client";
import React from "react";
import ExpenseForm from "./ExpenseForm";

const user = { name: "Admin", image: "/profile-user.png", isLoggedIn: true };

const ExpensePage = () => {
  return (
    <div className="p-6">
      <ExpenseForm />
    </div>
  );
};

export default ExpensePage;
