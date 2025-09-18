"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { AddArea } from "../../addArea/Addarea";
import {
  CircleX,
  User,
  Phone,
  Calendar,
  IdCard,
  Home,
  Upload,
  Image as ImageIcon,
  ChevronsUpDown,
  Check,
  MapPin,
  DollarSign,
  FileCheck,
  Camera,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const StepOneForm = ({ form, errors, onChange, photoPreview, setPhotoPreview }) => {
  const [areas, setAreas] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const res = await fetch("/api/area");
        const data = await res.json();
        setAreas(data);
      } catch (err) {
        console.error("Failed to fetch areas:", err);
      }
    };
    fetchAreas();
  }, []);

  // Auto-generate customer code
  useEffect(() => {
    const generateCustomerCode = async () => {
      const selectedArea = areas.find((a) => a.id === form.area);
      if (!selectedArea?.shortCode) return;

      try {
        const res = await fetch(
          `/api/generate-customer-code?areaShortCode=${selectedArea.shortCode}`
        );
        const data = await res.json();
        if (data?.generatedCode) {
          onChange({
            target: {
              name: "customerCode",
              value: data.generatedCode,
            },
          });
        }
      } catch (err) {
        console.error("Failed to generate customer code:", err);
      }
    };

    if (form.area && areas.length > 0) {
      generateCustomerCode();
    }
  }, [form.area, areas, onChange]);

  const getError = (name) =>
    errors.find((e) => e.path[0] === name)?.message;

  // Input field icons
  const fieldIcons = {
    customerName: <User size={18} className="text-gray-500" />,
    spouseName: <User size={18} className="text-gray-500" />,
    parentName: <User size={18} className="text-gray-500" />,
    mobile: <Phone size={18} className="text-gray-500" />,
    dob: <Calendar size={18} className="text-gray-500" />,
    aadhar: <IdCard size={18} className="text-gray-500" />,
    guarantorName: <User size={18} className="text-gray-500" />,
    guarantorAadhar: <IdCard size={18} className="text-gray-500" />,
  };

  const documentIcons = {
    aadharDocument: <IdCard size={20} className="text-blue-600" />,
    incomeProof: <DollarSign size={20} className="text-green-600" />,
    residenceProof: <MapPin size={20} className="text-purple-600" />,
  };

  return (
    <div className="space-y-8">
      {/* Personal Info */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Personal Information
        </h2>
        <p className="text-gray-600">
          Fill in the customer's personal details
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          ["Customer Name", "customerName", true],
          ["Spouse Name", "spouseName", false],
          ["Parent Name", "parentName", true],
          ["Mobile", "mobile", true, { maxLength: 10, inputMode: "numeric", type: "tel" }],
          ["DOB", "dob", true, { type: "date" }],
          ["Aadhar Number", "aadhar", true, { maxLength: 12, inputMode: "numeric" }],
          ["Guarantor Name", "guarantorName", true],
          ["Guarantor Aadhar", "guarantorAadhar", true,{ maxLength: 12, inputMode: "numeric" }],
          ["Customer Code", "customerCode", false, { readOnly: true }],
        ].map(([label, name, required, props = {}]) => (
          <div key={name} className="space-y-2">
            <label htmlFor={name} className="block text-sm font-medium text-gray-700">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {fieldIcons[name]}
              </div>
              <input
                id={name}
                name={name}
                value={form[name] || ""}
                onChange={onChange}
                type={props.type || "text"}
                inputMode={props.inputMode}
                maxLength={props.maxLength}
                readOnly={props.readOnly}
                className={cn(
                  "w-full pl-10 pr-3 py-2.5 border rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors",
                  getError(name)
                    ? "border-red-300 bg-red-50"
                    : "border-gray-300",
                  props.readOnly && "bg-gray-100 cursor-not-allowed"
                )}
                placeholder={`Enter ${label}`}
              />
            </div>
            {getError(name) && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle size={12} /> {getError(name)}
              </p>
            )}
          </div>
        ))}

        {/* Gender */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Gender <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-6">
            {["Male", "Female"].map((g) => (
              <label key={g} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value={g}
                  checked={form.gender === g}
                  onChange={onChange}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">{g}</span>
              </label>
            ))}
          </div>
          {getError("gender") && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <AlertCircle size={12} /> {getError("gender")}
            </p>
          )}
        </div>
      </div>

      {/* Address */}
      <div className="border-t pt-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Location Information
        </h2>
        {/* Area Dropdown */}
        {/* Area Dropdown */}
      <div className="space-y-1">
        <label
          htmlFor="area"
          className="block text-sm font-medium text-gray-700"
        >
          Area
        </label>
        <div className="flex gap-2">
          <select
            id="area"
            name="area"
            value={form.area}
            onChange={onChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-600 focus:outline-none"
          >
            <option value="">Select Area</option>
            {areas.map((area) => (
              <option key={area.id} value={String(area.id)}>
                {area.areaName}
              </option>
            ))}
          </select>
          <AddArea
            onAreaCreated={(newArea) => {
              const normalized = {
                id: String(newArea.id),
                areaName: newArea.areaName,
                shortCode: newArea.shortCode,
              };
              // 1. Add new area to dropdown options
              setAreas((prev) => [...prev, normalized]);
              // 2. Immediately set it as selected
              onChange({
                target: { name: "area", value: normalized.id },
              });
            }}
          />
        </div>
        {getError("area") && (
          <p className="text-xs text-red-500">* {getError("area")}</p>
        )}
      </div>

        <div className="space-y-2">
          <label htmlFor="address" className="block text-sm font-medium text-gray-700">
            Address <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute top-3 left-3 text-gray-400">
              <MapPin size={18} />
            </div>
            <textarea
              id="address"
              name="address"
              value={form.address || ""}
              onChange={onChange}
              rows={3}
              className={cn(
                "w-full pl-10 pr-3 py-2.5 border rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors resize-none",
                getError("address")
                  ? "border-red-300 bg-red-50"
                  : "border-gray-300"
              )}
              placeholder="Enter complete address"
            />
          </div>
          {getError("address") && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <AlertCircle size={12} /> {getError("address")}
            </p>
          )}
        </div>
      </div>

      {/* File Uploads */}
      <div className="border-t pt-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Document Uploads
        </h2>
        <p className="text-gray-600 text-sm mb-6">
          Upload required documents for verification
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Photo Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 block">
              Customer Photo <span className="text-red-500">*</span>
            </label>
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-5 text-center transition-colors",
                getError("photo")
                  ? "border-red-300 bg-red-50"
                  : "border-gray-300 hover:border-blue-400"
              )}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith("image/")) {
                  onChange({ target: { name: "photo", value: file } });
                  setPhotoPreview(URL.createObjectURL(file));
                }
              }}
            >
              {photoPreview ? (
                <div className="flex flex-col items-center">
                  <div className="relative mb-4">
                    <Image
                      src={photoPreview}
                      alt="Preview"
                      width={100}
                      height={100}
                      className="rounded-lg object-cover border"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoPreview(null);
                        onChange({ target: { name: "photo", value: null } });
                      }}
                      className="absolute -top-2 -right-2 bg-white text-red-500 rounded-full w-6 h-6 shadow-md flex items-center justify-center hover:bg-red-50 transition-colors"
                    >
                      <CircleX size={14} />
                    </button>
                  </div>
                  <p className="text-sm text-green-600 mb-2">
                    Photo uploaded successfully
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="bg-blue-100 p-3 rounded-full mb-3">
                    <Camera className="h-6 w-6 text-blue-600" />
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Drag & drop your photo here or click to browse
                  </p>
                </div>
              )}

              <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm">
                <ImageIcon size={16} className="mr-2" />
                {photoPreview ? "Change Photo" : "Choose Photo"}
                <input
                  type="file"
                  name="photo"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      onChange({ target: { name: "photo", value: file } });
                      setPhotoPreview(URL.createObjectURL(file));
                    }
                  }}
                  className="hidden"
                />
              </label>

              <p className="text-xs text-gray-500 mt-3">
                Supports: JPG, PNG (Max 5MB)
              </p>
            </div>
            {getError("photo") && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle size={12} /> {getError("photo")}
              </p>
            )}
          </div>

          {/* Document Uploads */}
          {["aadharDocument", "incomeProof", "residenceProof"].map((docKey) => (
            <div key={docKey} className="space-y-2">
              <label className="text-sm font-medium text-gray-700 block">
                {docKey === "aadharDocument"
                  ? "Aadhar Document"
                  : docKey === "incomeProof"
                  ? "Income Proof"
                  : "Residence Proof"}{" "}
                <span className="text-red-500">*</span>
              </label>
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-5 text-center transition-colors",
                  getError(docKey)
                    ? "border-red-300 bg-red-50"
                    : "border-gray-300 hover:border-blue-400"
                )}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) {
                    onChange({ target: { name: docKey, value: file } });
                  }
                }}
              >
                {form[docKey] ? (
                  <div className="flex flex-col items-center">
                    <div className="bg-blue-100 p-3 rounded-full mb-3">
                      <FileCheck className="h-6 w-6 text-blue-600" />
                    </div>
                    <p className="text-sm text-green-600 mb-2 truncate max-w-full">
                      {form[docKey]?.name}
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        onChange({ target: { name: docKey, value: null } })
                      }
                      className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1 transition-colors"
                    >
                      <CircleX size={14} /> Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="bg-gray-100 p-3 rounded-full mb-3">
                      {documentIcons[docKey]}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Drag & drop your file here or click to browse
                    </p>
                  </div>
                )}

                <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors text-sm">
                  <Upload size={16} className="mr-2" />
                  {form[docKey] ? "Change File" : "Choose File"}
                  <input
                    type="file"
                    name={docKey}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        onChange({ target: { name: docKey, value: file } });
                      }
                    }}
                    className="hidden"
                  />
                </label>

                <p className="text-xs text-gray-500 mt-3">
                  Supports: PDF, DOC, JPG (Max 10MB)
                </p>
              </div>
              {getError(docKey) && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle size={12} /> {getError(docKey)}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Submit */}
      <div className="border-t pt-6 flex justify-end">
        <button
          type="submit"
          disabled={
            !form.aadharDocument ||
            !form.incomeProof ||
            !form.residenceProof ||
            !form.photo
          }
          className={cn(
            "px-6 py-3 rounded-md shadow-sm flex items-center justify-center gap-2 font-medium transition-colors",
            form.aadharDocument &&
              form.incomeProof &&
              form.residenceProof &&
              form.photo
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-200 text-gray-500 cursor-not-allowed"
          )}
        >
          Next Step →
        </button>
      </div>
    </div>
  );
};

export default StepOneForm;
