"use client";

import React, { useEffect, useState } from "react";
import { LoanSchema } from "./Validation";
import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Loader2,
  Upload,
  FileText,
  X,
  DollarSign,
  Percent,
  Calendar,
  MapPin,
  User,
  ClipboardList,
  ArrowLeft,
  Scan,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import QRScanner from "@/components/QRScanner";

// ✅ shadcn Command for searchable dropdown
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";

const NewLoanForm = () => {
  const [areas, setAreas] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({
    area: "",
    customerId: "",
    customerCode: "",
    amount: "",
    rate: "",
    tenure: "",
    loanDate: new Date().toISOString().split("T")[0],
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documentFile, setDocumentFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [customerDetails, setCustomerDetails] = useState(null);

  // ✅ Fetch areas
  useEffect(() => {
    fetch("/api/area")
      .then((res) => res.json())
      .then((data) => {
        setAreas(Array.isArray(data) ? data : []);
      })
      .catch(() => toast.error("Failed to fetch areas"));
  }, []);

  // ✅ Fetch customers for selected area
  useEffect(() => {
    if (form.area) {
      fetch(`/api/customers/by-area/${form.area}`)
        .then((res) => res.json())
        .then((data) => {
          const customersList = Array.isArray(data)
            ? data
            : Array.isArray(data.customers)
            ? data.customers
            : [];
          setCustomers(customersList);
        })
        .catch(() => {
          toast.error("Failed to fetch customers");
          setCustomers([]);
        });
    } else {
      setCustomers([]);
      setForm((prev) => ({ ...prev, customerId: "" }));
    }
  }, [form.area]);

  // ✅ Handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      setDocumentFile(file);
      if (file.type.startsWith("image/")) {
        setPreviewUrl(URL.createObjectURL(file));
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const removeFile = () => {
    setDocumentFile(null);
    setPreviewUrl(null);
  };

  // ✅ Submit loan
  const handleSubmit = async (e) => {
    e.preventDefault();

    const result = LoanSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors = {};
      result.error.errors.forEach((err) => {
        fieldErrors[err.path[0]] = err.message;
      });
      setErrors(fieldErrors);
      toast.error("Please fix the form errors before submitting.");
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const payload = {
        ...form,
        amount: Number(form.amount),
        rate: Number(form.rate),
        tenure: Number(form.tenure),
        documentUrl: documentFile ? documentFile.name : null,
      };

      const res = await fetch("/api/loans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Loan successfully submitted! ✅");
        setForm({
          area: "",
          customerId: "",
          customerCode: "",
          amount: "",
          rate: "",
          tenure: "",
          loanDate: new Date().toISOString().split("T")[0],
        });
        setDocumentFile(null);
        setPreviewUrl(null);
        setCustomers([]);
        setCustomerDetails(null);
      } else if (res.status === 409) {
        toast.error(data.error);
      } else {
        toast.error(data.error || "Server error submitting loan. ⚠️");
      }
    } catch {
      toast.error("Something went wrong during submission. 🌐");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-2 px-4 flex items-center justify-center">
      <motion.div
        className="w-full max-w-4xl bg-white rounded-xl shadow-sm border border-gray-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="p-1 rounded-t-xl">
          <div className="bg-white rounded-t-lg">
            {/* Header */}
            <div className="px-8 pt-8 pb-6 border-b border-gray-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ClipboardList className="h-6 w-6 text-blue-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">
                  New Loan Application
                </h1>
              </div>
              <p className="text-gray-600 text-sm">
                Complete all fields to create a new loan record
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              {/* ✅ QR Scanner */}
              <div className="mb-4">
                <Button
                  type="button"
                  variant={scanning ? "default" : "outline"}
                  onClick={() => setScanning((prev) => !prev)}
                  className="flex items-center gap-2 h-10"
                >
                  {scanning ? (
                    <ArrowLeft className="h-4 w-4" />
                  ) : (
                    <Scan className="h-4 w-4" />
                  )}
                  {scanning ? "Close Scanner" : "Scan Customer QR"}
                </Button>

                {scanning && (
                  <div className="mt-4 border rounded-lg overflow-hidden">
                    <QRScanner
                      onScan={async (code) => {
                        let customerCode = code;
                        try {
                          const url = new URL(code);
                          customerCode = url.pathname.split("/").pop();
                        } catch {}

                        // ✅ fetch like repayment form
                        const res = await fetch(
                          `/api/customers/code/${customerCode}`
                        );
                        if (!res.ok) {
                          toast.error("Customer not found or invalid QR.");
                          return;
                        }

                        const customerData = await res.json();

                        if (customerData) {
                          // fetch customers in same area
                          const customersRes = await fetch(
                            `/api/customers/by-area/${customerData.areaId}`
                          );
                          const customersForArea = await customersRes.json();

                          const list = Array.isArray(customersForArea)
                            ? customersForArea
                            : Array.isArray(customersForArea.customers)
                            ? customersForArea.customers
                            : [];

                          setCustomers(list);

                          setForm((prev) => ({
                            ...prev,
                            area: customerData.areaId || "",
                            customerCode: customerData.customerCode || "",
                            customerId: customerData.id || "",
                          }));

                          setCustomerDetails({
                            ...customerData,
                            ...(customerData?.loans?.[0] || {}),
                          });

                          toast.success(
                            `Customer ${customerData.customerCode} loaded successfully ✅`
                          );
                        } else {
                          toast.error("Unable to load customer details.");
                        }

                        setTimeout(() => {
                          setScanning(false);
                        }, 200);
                      }}
                      onError={(err) => toast.error(err)}
                    />
                  </div>
                )}
              </div>

              {/* Customer Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-6 pb-2 border-b border-gray-100 flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Customer Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* ✅ Area with search */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Area <span className="text-red-500">*</span>
                    </Label>
                    <Command>
                      <CommandInput placeholder="Search area..." />
                      <CommandList>
                        <CommandEmpty>No area found.</CommandEmpty>
                        <CommandGroup>
                          {areas.map((area) => (
                            <CommandItem
                              key={area.id}
                              onSelect={() =>
                                handleSelectChange("area", area.id)
                              }
                            >
                              {area.areaName || area.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                    {errors.area && (
                      <p className="text-red-500 text-xs mt-1">{errors.area}</p>
                    )}
                  </div>

                  {/* ✅ Customer with search */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Customer <span className="text-red-500">*</span>
                    </Label>
                    <Command>
                      <CommandInput
                        placeholder={
                          form.area ? "Search customer..." : "First select an area"
                        }
                        disabled={!form.area}
                      />
                      <CommandList>
                        <CommandEmpty>No customer found.</CommandEmpty>
                        <CommandGroup>
                          {customers.map((customer) => (
                            <CommandItem
                              key={customer.id}
                              onSelect={() =>
                                handleSelectChange("customerId", customer.id)
                              }
                            >
                              {customer.customerCode} - {customer.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                    {errors.customerId && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.customerId}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Loan Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-6 pb-2 border-b border-gray-100 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                  Loan Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Loan Amount *</Label>
                    <Input
                      id="amount"
                      name="amount"
                      type="number"
                      value={form.amount}
                      onChange={handleChange}
                      placeholder="0.00"
                      className="w-full h-11"
                    />
                    {errors.amount && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.amount}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Interest Rate (%) *</Label>
                    <Input
                      id="rate"
                      name="rate"
                      type="number"
                      value={form.rate}
                      onChange={handleChange}
                      placeholder="0.0"
                      className="w-full h-11"
                    />
                    {errors.rate && (
                      <p className="text-red-500 text-xs mt-1">{errors.rate}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Tenure (Months) *</Label>
                    <Input
                      id="tenure"
                      name="tenure"
                      type="number"
                      value={form.tenure}
                      onChange={handleChange}
                      placeholder="12"
                      className="w-full h-11"
                    />
                    {errors.tenure && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.tenure}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Loan Date *</Label>
                    <Input
                      type="date"
                      id="loanDate"
                      name="loanDate"
                      value={form.loanDate}
                      onChange={handleChange}
                      className="h-11"
                    />
                  </div>
                </div>
              </div>

              {/* Document Upload */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-6 pb-2 border-b border-gray-100 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Upload Document
                </h3>
                <div className="flex flex-col gap-4">
                  {previewUrl && (
                    <div className="relative w-48 h-48">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="object-cover w-full h-full rounded-lg"
                      />
                      <X
                        className="absolute top-1 right-1 h-6 w-6 cursor-pointer text-red-600"
                        onClick={removeFile}
                      />
                    </div>
                  )}
                  <div>
                    <input type="file" onChange={handleFileChange} />
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="pt-4 flex justify-end">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-11 px-6"
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  ) : null}
                  Submit Loan
                </Button>
              </div>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default NewLoanForm;
