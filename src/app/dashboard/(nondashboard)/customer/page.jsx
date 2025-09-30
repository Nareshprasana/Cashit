// /customer/page.jsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AllCustomerTable } from "@/components/AllCustomerTable.jsx";

export default function CustomerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = (e) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      router.push("/dashboard/addNewCustomer");
    }, 600);
  };

  return (
    <div>
      <AllCustomerTable />
    </div>
  );
}
