"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  User,
  Phone,
  Calendar,
  IdCard,
  Home,
  FileText,
  MapPin,
  Image as ImageIcon,
  Upload,
  Loader2,
} from "lucide-react";

const StepTwoPreview = ({ form, setStep, isSubmitting }) => {
  // Helper to render a field label from camelCase
  const labelize = (key) =>
    key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());

  // Safe preview for file objects
  const getObjectUrl = (file) => {
    try {
      if (file instanceof Blob) {
        return URL.createObjectURL(file);
      }
      return null;
    } catch {
      return null;
    }
  };

  const photoUrl = form?.photo ? getObjectUrl(form.photo) : null;

  // Field → Icon mapping
  const fieldIcons = {
    customerName: <User size={16} className="text-blue-600" />,
    spouseName: <User size={16} className="text-blue-600" />,
    parentName: <User size={16} className="text-blue-600" />,
    mobile: <Phone size={16} className="text-blue-600" />,
    dob: <Calendar size={16} className="text-blue-600" />,
    aadhar: <IdCard size={16} className="text-blue-600" />,
    guarantorName: <User size={16} className="text-blue-600" />,
    guarantorAadhar: <IdCard size={16} className="text-blue-600" />,
    area: <Home size={16} className="text-blue-600" />,
    customerCode: <FileText size={16} className="text-blue-600" />,
    gender: <User size={16} className="text-blue-600" />,
    address: <MapPin size={16} className="text-blue-600" />,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Preview Customer Details</h3>
        <button
          onClick={() => setStep(1)}
          className="text-sm text-blue-600 underline"
        >
          Edit All
        </button>
      </div>

      {/* Preview Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          "customerName",
          "spouseName",
          "parentName",
          "mobile",
          "dob",
          "aadhar",
          "guarantorName",
          "guarantorAadhar",
          "area",
          "customerCode",
          "gender",
          "address",
        ].map((key) => (
          <div
            key={key}
            className="bg-white p-4 rounded-md border flex items-start gap-3 shadow-sm"
          >
            <div className="flex-shrink-0">{fieldIcons[key]}</div>
            <div>
              <p className="text-xs text-gray-500">{labelize(key)}</p>
              <p className="text-sm font-medium text-gray-800">
                {form?.[key] || "-"}
              </p>
            </div>
          </div>
        ))}

        {/* Photo */}
        {photoUrl && (
          <div className="bg-white p-4 rounded-md border shadow-sm">
            <div className="flex items-center gap-2">
              <ImageIcon size={16} className="text-blue-600" />
              <strong className="text-sm">Photo</strong>
            </div>
            <Image
              src={photoUrl}
              width={100}
              height={100}
              alt="Customer Photo"
              className="rounded mt-2 border"
            />
          </div>
        )}

        {/* Documents */}
        {[
          { key: "aadharDocument", label: "Aadhar Document" },
          { key: "incomeProof", label: "Income Proof Document" },
          { key: "residenceProof", label: "Residence Proof Document" },
        ].map(
          ({ key, label }) =>
            form?.[key] && (
              <div
                key={key}
                className="bg-white p-4 rounded-md border shadow-sm flex items-center gap-2"
              >
                <Upload size={16} className="text-blue-600" />
                <div>
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="text-sm text-blue-700 mt-1">
                    📄 {form[key]?.name}
                  </p>
                </div>
              </div>
            )
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button
          variant="secondary"
          type="button"
          onClick={() => setStep(1)}
          className="rounded"
        >
          Back
        </Button>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="rounded flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit"
          )}
        </Button>
      </div>
    </div>
  );
};

export default StepTwoPreview;
