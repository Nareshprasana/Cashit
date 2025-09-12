"use client";

import React from "react";
import AddUserForm from "./addUserForm";

export default function AddUserPage() {
  const user = {
    name: "Admin",
    image: "/profile-user.png",
    isLoggedIn: true,
  };

  return (
    <div className="p-6">
      <AddUserForm />
    </div>
  );
}
