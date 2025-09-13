"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CustomerSchema } from "./validation";
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

  // ⏳ Cooldown & click-limit state
  const [isCooldown, setIsCooldown] = useState(false);
  const [hasClicked, setHasClicked] = useState(false);

  // reset click lock whenever step changes
  useEffect(() => {
    setHasClicked(false);
  }, [step]);

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

  const nextStep = () => {
    if (isCooldown || hasClicked) return; // 🚫 block spam clicks
    setHasClicked(true);
    setIsCooldown(true);

    const { photo, aadharDocument, incomeProof, residenceProof, ...formData } =
      form;

    const result = CustomerSchema.omit({
      photo: true,
      aadharDocument: true,
      incomeProof: true,
      residenceProof: true,
    }).safeParse(formData);

    if (!result.success) {
      setErrors(result.error?.errors || []);
    } else {
      setErrors([]);
      setStep(2);
    }

    // reset cooldown after 2s
    setTimeout(() => setIsCooldown(false), 2000);
  };

  const handleSubmit = async () => {
    if (isCooldown || hasClicked) return; // 🚫 block spam clicks
    setHasClicked(true);
    setIsCooldown(true);

    const result = CustomerSchema.safeParse(form);
    if (!result.success) {
      setErrors(result.error?.errors || []);
      setStep(1);
      setIsCooldown(false);
      setHasClicked(false);
      return;
    }

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
        setErrors([]);
      } else {
        alert("❌ Error submitting form");
      }
    } catch (err) {
      console.error("❌ Submission failed:", err);
      alert("❌ Something went wrong.");
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setIsCooldown(false), 2000); // release cooldown after 2s
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
          <motion.div key="step1">
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
              <button
                type="submit"
                disabled={isCooldown || isSubmitting}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
              >
                Next
              </button>
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
              <button
                type="submit"
                disabled={isCooldown || isSubmitting}
                className="mt-4 px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Submit"}
              </button>
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
