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
  FileText,
  Upload,
  Image as ImageIcon,
  ChevronsUpDown,
  Check,
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

const StepOneForm = ({
  form,
  errors = [], // ✅ default empty array
  onChange,
  photoPreview,
  setPhotoPreview,
}) => {
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

  // Auto-generate customer code when area changes
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
  }, [form.area, areas]);

  // ✅ Safe error lookup
  const getError = (name) =>
    (errors || []).find((e) => e?.path?.[0] === name)?.message;

  // icon mapping for inputs
  const fieldIcons = {
    customerName: <User size={18} />,
    spouseName: <User size={18} />,
    parentName: <User size={18} />,
    mobile: <Phone size={18} />,
    dob: <Calendar size={18} />,
    aadhar: <IdCard size={18} />,
    guarantorName: <User size={18} />,
    guarantorAadhar: <IdCard size={18} />,
    customerCode: <FileText size={18} />,
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          ["Customer Name", "customerName"],
          ["Spouse Name", "spouseName"],
          ["Parent Name", "parentName"],
          ["Mobile", "mobile", { maxLength: 10, inputMode: "numeric" }],
          ["DOB", "dob", { type: "date" }],
          ["Aadhar Number", "aadhar", { maxLength: 12, inputMode: "numeric" }],
          ["Guarantor Name", "guarantorName"],
          ["Guarantor Aadhar", "guarantorAadhar"],
          ["Customer Code", "customerCode", { readOnly: true }],
        ].map(([label, name, props = {}]) => (
          <div key={name} className="space-y-1">
            <label
              htmlFor={name}
              className="block text-sm font-medium text-gray-700"
            >
              {label}
            </label>
            <div className="relative">
              <input
                id={name}
                name={name}
                value={form[name]}
                onChange={onChange}
                type={props.type || "text"}
                inputMode={props.inputMode}
                maxLength={props.maxLength}
                readOnly={props.readOnly}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-600 focus:outline-none"
              />
              <span className="absolute inset-y-0 left-2 flex items-center text-gray-400">
                {fieldIcons[name]}
              </span>
            </div>
            {getError(name) && (
              <p className="text-xs text-red-500">* {getError(name)}</p>
            )}
          </div>
        ))}

        {/* Gender */}
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Gender
          </label>
          <div className="flex gap-6">
            {["Male", "Female"].map((g) => (
              <label key={g} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="gender"
                  value={g}
                  checked={form.gender === g}
                  onChange={onChange}
                />
                <User size={16} className="text-gray-500" /> {g}
              </label>
            ))}
          </div>
          {getError("gender") && (
            <p className="text-xs text-red-500">* {getError("gender")}</p>
          )}
        </div>
      </div>

      {/* Area Dropdown with Search */}
      <div className="space-y-1">
        <label
          htmlFor="area"
          className="block text-sm font-medium text-gray-700"
        >
          Area
        </label>
        <div className="flex gap-2 w-[450px]">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between"
              >
                <span className="flex items-center gap-2">
                  <Home size={16} className="text-gray-400" />
                  {form.area
                    ? areas.find((a) => a.id === form.area)?.areaName
                    : "Select Area"}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
              <Command>
                <CommandInput placeholder="Search area..." />
                <CommandList>
                  <CommandEmpty>No area found.</CommandEmpty>
                  <CommandGroup>
                    {areas.map((area) => (
                      <CommandItem
                        key={area.id}
                        value={area.areaName}
                        onSelect={() => {
                          onChange({
                            target: { name: "area", value: area.id },
                          });
                          setOpen(false);
                        }}
                      >
                        <Home className="mr-2 h-4 w-4" />
                        {area.areaName}
                        {form.area === area.id && (
                          <Check className="ml-auto h-4 w-4 text-blue-600" />
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Add Area button */}
          <AddArea
            onAreaCreated={(newArea) => {
              setAreas((prev) => [...prev, newArea]);
              onChange({ target: { name: "area", value: newArea.id } });
            }}
          />
        </div>
        {getError("area") && (
          <p className="text-xs text-red-500">* {getError("area")}</p>
        )}
      </div>

      {/* Address */}
      <div>
        <label
          htmlFor="address"
          className="block mb-1 text-sm font-medium text-gray-700"
        >
          Address
        </label>
        <textarea
          id="address"
          name="address"
          value={form.address}
          onChange={onChange}
          rows="3"
          className={`w-full px-3 py-2 border ${
            getError("address") ? "border-red-500" : "border-gray-300"
          } rounded-md shadow-sm focus:border-blue-600 focus:outline-none resize-none`}
        ></textarea>
        {getError("address") && (
          <p className="text-sm text-red-500 mt-1">* {getError("address")}</p>
        )}
      </div>

      {/* Uploads */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Photo Upload */}
        <div
          className="border-2 border-dashed p-6 rounded-md text-center hover:border-blue-500"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith("image/")) {
              onChange({ target: { name: "photo", files: [file] } });
              setPhotoPreview(URL.createObjectURL(file));
            }
          }}
        >
          <label className="text-sm font-medium mb-2 block">Upload Photo</label>
          <label className="cursor-pointer inline-flex px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 gap-2 items-center">
            <ImageIcon size={18} /> Choose File
            <input
              type="file"
              name="photo"
              accept="image/*"
              onChange={onChange}
              className="hidden"
            />
          </label>
          {form.photo && (
            <div className="mt-3 relative">
              <Image
                src={photoPreview}
                alt="Preview"
                width={80}
                height={80}
                className="rounded"
              />
              <button
                type="button"
                onClick={() => {
                  setPhotoPreview(null);
                  onChange({ target: { name: "photo", files: [] } });
                }}
                className="absolute top-[-8px] right-[-8px] bg-white text-red-500 rounded-full w-5 h-5 shadow flex items-center justify-center"
              >
                <CircleX size={14} />
              </button>
            </div>
          )}
          {getError("photo") && (
            <p className="text-xs text-red-500 mt-2">* {getError("photo")}</p>
          )}
        </div>

        {/* Document Uploads */}
        {["aadharDocument", "incomeProof", "residenceProof"].map((docKey) => (
          <div
            key={docKey}
            className="border-2 border-dashed p-6 rounded-md text-center hover:border-blue-500"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) {
                onChange({ target: { name: docKey, value: file } });
              }
            }}
          >
            <label className="text-sm font-medium mb-2 block">
              <Upload size={16} className="inline-block mr-1" />
              {docKey === "aadharDocument"
                ? "Aadhar"
                : docKey === "incomeProof"
                ? "Income Proof"
                : "Residence Proof"}{" "}
              Document
            </label>
            <label className="cursor-pointer inline-flex px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 gap-2 items-center">
              <Upload size={18} /> Choose File
              <input
                type="file"
                name={docKey}
                accept=".pdf,.doc,.docx"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    onChange({ target: { name: docKey, value: file } });
                  }
                }}
                className="hidden"
              />
            </label>

            {form[docKey] && (
              <div className="mt-2 text-sm text-blue-700 flex items-center justify-center gap-2">
                📄 {form[docKey]?.name}
                <button
                  type="button"
                  onClick={() =>
                    onChange({ target: { name: docKey, value: null } })
                  }
                  className="text-red-600"
                >
                  <CircleX size={16} />
                </button>
              </div>
            )}

            {getError(docKey) && (
              <p className="text-xs text-red-500 mt-2">* {getError(docKey)}</p>
            )}
          </div>
        ))}
      </div>

      {/* Submit */}
      <div className="text-right">
        <button
          type="submit"
          disabled={
            !form.aadharDocument ||
            !form.incomeProof ||
            !form.residenceProof ||
            !form.photo
          }
          className={`px-6 py-2 rounded shadow flex items-center justify-center gap-2 ${
            form.aadharDocument &&
            form.incomeProof &&
            form.residenceProof &&
            form.photo
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-400 text-gray-200 cursor-not-allowed"
          }`}
        >
          Next Step →
        </button>
      </div>
    </div>
  );
};

export default StepOneForm;
