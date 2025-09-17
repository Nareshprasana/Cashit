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
  User,
  ClipboardList,
  ArrowLeft,
  Scan,
  Calendar,
  MapPin,
  Percent,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import QRScanner from "@/components/QRScanner";

// ✅ shadcn combobox
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
  const [openArea, setOpenArea] = useState(false);
  const [openCustomer, setOpenCustomer] = useState(false);

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
    if (name === "area") {
      setOpenArea(false);
    } else if (name === "customerId") {
      setOpenCustomer(false);
    }
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4 flex items-center justify-center">
      <motion.div
        className="w-full max-w-4xl bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <ClipboardList className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">New Loan Application</h1>
              <p className="text-blue-100 text-sm mt-1">
                Complete all fields to create a new loan record
              </p>
            </div>
          </div>
        </div>

        <div className="p-1">
          <div className="bg-white rounded-lg">
            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              {/* ✅ QR Scanner Section */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                      <Scan className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold text-blue-800">
                        Quick Customer Scan
                      </h3>
                    </div>
                    <p className="text-sm text-blue-600 mb-2">
                      Scan a customer's QR code to automatically fill their
                      information
                    </p>
                    <Button
                      type="button"
                      variant={scanning ? "default" : "outline"}
                      onClick={() => setScanning((prev) => !prev)}
                      className="flex items-center gap-2 h-10 w-full sm:w-auto"
                    >
                      {scanning ? (
                        <ArrowLeft className="h-4 w-4" />
                      ) : (
                        <Scan className="h-4 w-4" />
                      )}
                      {scanning ? "Close Scanner" : "Scan Customer QR"}
                    </Button>

                    {scanning && (
                      <div className="mt-4 border-2 border-dashed border-blue-300 rounded-lg overflow-hidden">
                        <QRScanner
                          onScan={async (code) => {
                            let customerCode = code;
                            try {
                              const url = new URL(code);
                              customerCode = url.pathname.split("/").pop();
                            } catch {
                              // not a URL, keep as raw code
                            }

                            try {
                              const res = await fetch(
                                `/api/customers/by-code/${customerCode}`
                              );
                              if (!res.ok) {
                                toast.error(
                                  "Customer not found or invalid QR."
                                );
                                return;
                              }

                              const customerData = await res.json();
                              if (customerData) {
                                // load customers in same area
                                const customersRes = await fetch(
                                  `/api/customers/by-area/${customerData.areaId}`
                                );
                                const customersForArea =
                                  await customersRes.json();

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
                            } catch (err) {
                              toast.error("Error fetching customer details.");
                            } finally {
                              setTimeout(() => {
                                setScanning(false);
                              }, 200);
                            }
                          }}
                          onError={(err) => toast.error(err)}
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Customer Info */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">
                    Customer Information
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* ✅ Area Selector */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Area <span className="text-red-500">*</span>
                    </Label>
                    <Popover open={openArea} onOpenChange={setOpenArea}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openArea}
                          className="w-full justify-between h-11"
                        >
                          {form.area
                            ? areas.find((a) => a.id === form.area)?.areaName
                            : "Select area..."}
                          <MapPin className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
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
                      </PopoverContent>
                    </Popover>
                    {errors.area && (
                      <p className="text-red-500 text-xs mt-1">{errors.area}</p>
                    )}
                  </div>

                  {/* ✅ Customer Selector */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Customer <span className="text-red-500">*</span>
                    </Label>
                    <Popover open={openCustomer} onOpenChange={setOpenCustomer}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openCustomer}
                          className="w-full justify-between h-11"
                          disabled={!form.area}
                        >
                          {form.customerId
                            ? customers.find((c) => c.id === form.customerId)
                                ?.name
                            : form.area
                            ? "Select customer..."
                            : "First select an area"}
                          <User className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search customer..." />
                          <CommandList>
                            <CommandEmpty>No customer found.</CommandEmpty>
                            <CommandGroup>
                              {customers.map((customer) => (
                                <CommandItem
                                  key={customer.id}
                                  onSelect={() =>
                                    handleSelectChange(
                                      "customerId",
                                      customer.id
                                    )
                                  }
                                >
                                  {customer.customerCode} - {customer.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {errors.customerId && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.customerId}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Loan Details */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">
                    Loan Details
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Loan Amount <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="amount"
                        name="amount"
                        type="number"
                        value={form.amount}
                        onChange={handleChange}
                        placeholder="0.00"
                        className="w-full h-11 pl-10"
                      />
                    </div>
                    {errors.amount && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.amount}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Interest Rate (%) <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="rate"
                        name="rate"
                        type="number"
                        value={form.rate}
                        onChange={handleChange}
                        placeholder="0.0"
                        className="w-full h-11 pl-10"
                      />
                    </div>
                    {errors.rate && (
                      <p className="text-red-500 text-xs mt-1">{errors.rate}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Tenure (Months) <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="tenure"
                        name="tenure"
                        type="number"
                        value={form.tenure}
                        onChange={handleChange}
                        placeholder="12"
                        className="w-full h-11 pl-10"
                      />
                    </div>
                    {errors.tenure && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.tenure}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Loan Date <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="date"
                        id="loanDate"
                        name="loanDate"
                        value={form.loanDate}
                        onChange={handleChange}
                        className="h-11 pl-10"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Document Upload */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">
                    Upload Document
                  </h3>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      onChange={handleFileChange}
                      id="file-upload"
                      className="hidden"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer flex flex-col items-center justify-center gap-2"
                    >
                      <Upload className="h-10 w-10 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Drag and drop or click to upload
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, PDF up to 5MB
                        </p>
                      </div>
                      <Button variant="outline" className="mt-2">
                        Select File
                      </Button>
                    </label>
                  </div>

                  {previewUrl && (
                    <div className="mt-4">
                      <Label className="text-sm font-medium text-gray-700">
                        Preview
                      </Label>
                      <div className="relative mt-2 inline-block">
                        <div className="w-48 h-48 border rounded-lg overflow-hidden shadow-sm">
                          <img
                            src={previewUrl}
                            alt="Preview"
                            className="object-cover w-full h-full"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                          onClick={removeFile}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {documentFile && !previewUrl && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-gray-500" />
                        <span className="text-sm font-medium truncate max-w-xs">
                          {documentFile.name}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={removeFile}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit */}
              <div className="pt-6 border-t border-gray-200 flex justify-end">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-11 px-8 bg-blue-600 hover:bg-blue-700"
                  size="lg"
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
