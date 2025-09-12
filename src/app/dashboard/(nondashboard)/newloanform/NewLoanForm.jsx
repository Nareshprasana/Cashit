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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NewLoanForm = () => {
  const [areas, setAreas] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({
    area: "",
    customerId: "",
    amount: "",
    rate: "",
    tenure: "",
    loanDate: new Date().toISOString().split("T")[0],
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documentFile, setDocumentFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Fetch all areas
  useEffect(() => {
    fetch("/api/customers/by-area")
      .then((res) => res.json())
      .then((data) => {
        setAreas(Array.isArray(data) ? data : []);
      })
      .catch(() => toast.error("Failed to fetch areas"));
  }, []);

  // Fetch customers for the selected area
  useEffect(() => {
    if (form.area) {
      fetch(`/api/customers/by-area/${form.area}`)
        .then((res) => res.json())
        .then((data) => {
          setCustomers(Array.isArray(data) ? data : data.customers ?? []);
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
      // Check file size (max 5MB)
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
      const formData = new FormData();
      Object.keys(form).forEach((key) => {
        formData.append(key, form[key]);
      });

      if (documentFile) {
        formData.append("document", documentFile);
      }

      const res = await fetch("/api/loans", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        toast.success("Loan successfully submitted! ✅");
        setForm({
          area: "",
          customerId: "",
          amount: "",
          rate: "",
          tenure: "",
          loanDate: new Date().toISOString().split("T")[0],
        });
        setDocumentFile(null);
        setPreviewUrl(null);
        setCustomers([]);
      } else if (res.status === 409) {
        const errorData = await res.json();
        toast.error(errorData.error);
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Server error submitting loan. ⚠️");
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
        <div className="p-1  rounded-t-xl">
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

            <form onSubmit={handleSubmit} className="p-8">
              <div className="space-y-8">
                {/* Customer Details */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-6 pb-2 border-b border-gray-100 flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    Customer Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Area Selection */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="area"
                        className="text-sm font-medium text-gray-700"
                      >
                        Area <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Select
                          value={form.area}
                          onValueChange={(value) =>
                            handleSelectChange("area", value)
                          }
                        >
                          <SelectTrigger className="w-full h-11 pl-9">
                            <SelectValue placeholder="Select an area" />
                          </SelectTrigger>
                          <SelectContent>
                            {areas.map((area) => (
                              <SelectItem key={area.id} value={area.id}>
                                {area.areaName || area.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {errors.area && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.area}
                        </p>
                      )}
                    </div>

                    {/* Customer Selection */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="customerId"
                        className="text-sm font-medium text-gray-700"
                      >
                        Customer <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Select
                          value={form.customerId}
                          onValueChange={(value) =>
                            handleSelectChange("customerId", value)
                          }
                          disabled={!form.area}
                        >
                          <SelectTrigger className="w-full h-11 pl-9">
                            <SelectValue
                              placeholder={
                                form.area
                                  ? "Select a customer"
                                  : "First select an area"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {customers.map((customer) => (
                              <SelectItem key={customer.id} value={customer.id}>
                                {customer.customerCode} - {customer.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
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
                      <Label
                        htmlFor="amount"
                        className="text-sm font-medium text-gray-700"
                      >
                        Loan Amount <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="amount"
                          name="amount"
                          type="number"
                          value={form.amount}
                          onChange={handleChange}
                          placeholder="0.00"
                          className="w-full pl-9 h-11"
                        />
                      </div>
                      {errors.amount && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.amount}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="rate"
                        className="text-sm font-medium text-gray-700"
                      >
                        Interest Rate (%){" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Percent className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="rate"
                          name="rate"
                          type="number"
                          step="0.01"
                          value={form.rate}
                          onChange={handleChange}
                          placeholder="0.00"
                          className="w-full pl-9 h-11"
                        />
                      </div>
                      {errors.rate && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.rate}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="tenure"
                        className="text-sm font-medium text-gray-700"
                      >
                        Tenure (months) <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="tenure"
                        name="tenure"
                        type="number"
                        value={form.tenure}
                        onChange={handleChange}
                        placeholder="Enter loan tenure"
                        className="w-full h-11"
                      />
                      {errors.tenure && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.tenure}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="loanDate"
                        className="text-sm font-medium text-gray-700"
                      >
                        Loan Date
                      </Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="loanDate"
                          type="date"
                          name="loanDate"
                          value={form.loanDate}
                          onChange={handleChange}
                          className="w-full pl-9 h-11"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Document Upload */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-6 pb-2 border-b border-gray-100 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Document Attachment
                  </h3>

                  {!documentFile ? (
                    <label
                      htmlFor="file-upload"
                      className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all duration-200"
                    >
                      <div className="p-3 rounded-full bg-blue-100 mb-4">
                        <Upload className="h-6 w-6 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700 mb-1">
                        Upload supporting document
                      </span>
                      <span className="text-xs text-gray-500">
                        Supports JPG, PNG, PDF (Max 5MB)
                      </span>
                      <Input
                        id="file-upload"
                        type="file"
                        accept="image/*,.pdf"
                        capture="environment"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  ) : (
                    <div className="flex flex-col items-center">
                      {previewUrl ? (
                        <div className="relative mb-4">
                          <img
                            src={previewUrl}
                            alt="Document preview"
                            className="w-48 h-48 object-contain rounded-lg border"
                          />
                          <button
                            type="button"
                            onClick={removeFile}
                            className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center w-48 h-48 bg-gray-100 rounded-lg border mb-4 relative">
                          <FileText className="h-12 w-12 text-gray-400" />
                          <button
                            type="button"
                            onClick={removeFile}
                            className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                      <p className="text-sm text-gray-700 flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-md">
                        <FileText className="h-4 w-4" />
                        {documentFile.name}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row justify-end gap-4 pt-4 border-t border-gray-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setForm({
                        area: "",
                        customerId: "",
                        amount: "",
                        rate: "",
                        tenure: "",
                        loanDate: new Date().toISOString().split("T")[0],
                      });
                      setDocumentFile(null);
                      setPreviewUrl(null);
                    }}
                    className="h-11 font-medium"
                  >
                    Clear Form
                  </Button>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                  >
                    {isSubmitting && (
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    )}
                    {isSubmitting ? "Processing..." : "Submit Application"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default NewLoanForm;
