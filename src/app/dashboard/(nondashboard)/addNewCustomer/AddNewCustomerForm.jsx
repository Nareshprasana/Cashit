"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  const [photoPreview, setPhotoPreview] = useState(null);
  const [successCustomer, setSuccessCustomer] = useState(null);
  const [alertMessage, setAlertMessage] = useState("");

  // safe preview cleanup
  useEffect(() => {
    return () => {
      if (photoPreview) {
        try {
          URL.revokeObjectURL(photoPreview);
        } catch (e) {
          console.warn("Preview revoke failed", e);
        }
      }
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

  // 🚀 Always go to next step (no validation)
  const nextStep = () => {
    setAlertMessage("");
    setStep(2);
  };

  const handleSubmit = async () => {
    setAlertMessage("");
    setIsSubmitting(true);

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        if (value instanceof File || value instanceof Blob) {
          formData.append(key, value);
        } else {
          formData.append(key, String(value));
        }
      }
    });

    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const responseData = await res.json();
        if (responseData?.customer) {
          setSuccessCustomer(responseData.customer);
          setStep(3);
        }
        // reset form
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
      } else {
        setAlertMessage("❌ Error submitting form. Please try again.");
      }
    } catch (err) {
      console.error("❌ Submission failed:", err);
      setAlertMessage("❌ Something went wrong. Please try again later.");
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

      {alertMessage && (
        <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
          {alertMessage}
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                nextStep();
              }}
            >
              <StepOneForm
                form={form}
                onChange={handleChange}
                photoPreview={photoPreview}
                setPhotoPreview={setPhotoPreview}
              />
            </form>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2">
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
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="step3">
            {isSubmitting ? (
              <div className="flex justify-center items-center h-48">
                <Loader2 className="h-10 w-10 animate-spin text-gray-500" />
              </div>
            ) : (
              successCustomer && (
                <StepThreeSuccess setStep={setStep} customer={successCustomer} />
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AddNewCustomerForm;
