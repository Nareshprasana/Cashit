"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
// client-side validation intentionally disabled per user request
import StepOneForm from "./components/StepOneForm";
import StepTwoPreview from "./components/StepTwoPreview";
import StepThreeSuccess from "./components/StepThreeSuccess";
import ProgressBar from "./components/ProgressBar";
import { Loader2 } from "lucide-react";

const AddNewCustomerForm = () => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    customerName: "",
    spouseName: "",
    parentName: "",
    mobile: "",
    gender: "",
    dob: "",
    aadhar: "",
    guarantorName: "",
    guarantorAadhar: "",
    area: "",
    address: "",
    customerCode: "",
    photo: null,
    aadharDocument: null,
    incomeProof: null,
    residenceProof: null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState([]);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [successCustomer, setSuccessCustomer] = useState(null);

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "mobile" || name === "aadhar") {
      const digits = value.replace(/\D/g, "");
      setForm((prev) => ({ ...prev, [name]: digits }));
      return;
    }

    if (files && files.length > 0) {
      const file = files[0];
      if (name === "photo" && file instanceof Blob) {
        try {
          const previewUrl = URL.createObjectURL(file);
          setPhotoPreview(previewUrl);
        } catch (err) {
          console.error("Error previewing image:", err);
          setPhotoPreview(null);
        }
      }
      setForm((prev) => ({ ...prev, [name]: file }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const nextStep = () => {
    // No client-side validation: allow progression to step 2 regardless of field values
    setErrors([]);
    setStep(2);
  };

  const handleSubmit = async () => {
    // No client-side validation — build FormData and submit
    setIsSubmitting(true);

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      // Skip null/undefined and empty strings so server doesn't receive blank mobile/aadhar etc.
      if (value === null || value === undefined) return;
      if (typeof value === 'string' && value.trim() === '') return;

      if (typeof File !== "undefined" && value instanceof File) {
        formData.append(key, value, value.name || "file");
        return;
      }

      if (typeof Blob !== "undefined" && value instanceof Blob) {
        formData.append(key, value);
        return;
      }

      if (typeof value === "object") {
        try {
          formData.append(key, JSON.stringify(value));
        } catch (err) {
          formData.append(key, String(value));
        }
        return;
      }

      formData.append(key, String(value));
    });

    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        // FIX: Extract the 'customer' object from the response JSON
        const responseData = await res.json();
        setSuccessCustomer(responseData.customer);
        setStep(3);
        setForm({
          customerName: "",
          spouseName: "",
          parentName: "",
          mobile: "",
          gender: "",
          dob: "",
          aadhar: "",
          guarantorName: "",
          guarantorAadhar: "",
          area: "",
          address: "",
          customerCode: "",
          photo: null,
          aadharDocument: null,
          incomeProof: null,
          residenceProof: null,
        });
        setPhotoPreview(null);
        setErrors([]);
      } else {
        alert("❌ Error submitting form");
      }
    } catch (err) {
      console.error("❌ Submission failed:", err);
      alert("❌ Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      className="max-w-4xl mx-auto bg-white shadow-xl rounded-xl px-6 pt-6 pb-12 space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <h2 className="text-xl font-bold text-gray-700">Step {step} of 3</h2>
      <ProgressBar step={step} />
      <h1 className="text-xl font-bold mb-4">Add New Customer</h1>
      <AnimatePresence mode="wait">
        {step === 1 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              nextStep();
            }}
          >
            <StepOneForm
              form={form}
              errors={errors}
              onChange={handleChange}
              photoPreview={photoPreview}
              setPhotoPreview={setPhotoPreview}
            />
          </form>
        )}
        {step === 2 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            <StepTwoPreview
              form={form}
              setStep={setStep}
              isSubmitting={isSubmitting}
            />
          </form>
        )}
        {step === 3 && (
          isSubmitting ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-10 w-10 animate-spin text-gray-500" />
            </div>
          ) : (
            <StepThreeSuccess setStep={setStep} customer={successCustomer} />
          )
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AddNewCustomerForm;
