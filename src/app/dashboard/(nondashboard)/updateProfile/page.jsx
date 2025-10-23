"use client"; // ✅ make this a Client Component

import React from "react";
import UpdateProfile from "./UpdateProfile";

export default function UpdateProfilePage() {
  const user = {
    name: "Admin",
    image: "/profile-user.png",
    isLoggedIn: true,
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Update Profile</h1>
      <UpdateProfile />
    </div>
  );
}
