// /customer/page.jsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AllCustomerTable } from "@/components/AllCustomerTable.jsx";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

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
      <div className="flex items-center justify-between mb-4 px-5">

        {/* Add Customer Button (shadcn) */}
        <Button
          onClick={handleClick}
          disabled={loading}
          className="bg-[#002a6a] hover:shadow-lg text-white"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            "+ Add Customer"
          )}
        </Button>
      </div>

      <AllCustomerTable />
    </div>
  );
}
