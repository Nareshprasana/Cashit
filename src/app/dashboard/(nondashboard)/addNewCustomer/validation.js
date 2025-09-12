import { z } from "zod";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ACCEPTED_DOC_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export const CustomerSchema = z.object({
  customerName: z
    .string()
    .min(3, { message: "Customer name must be at least 3 characters long" }),
  spouseName: z
    .string()
    .min(3, { message: "Spouse name must be at least 3 characters long" }),
  parentName: z
    .string()
    .min(3, { message: "Parent name must be at least 3 characters long" }),
  mobile: z
    .string()
    .regex(/^\d{10}$/, { message: "Mobile number must be exactly 10 digits" }),
  gender: z.enum(["Male", "Female"], { required_error: "Gender is required" }),
  dob: z
    .string()
    .min(1, { message: "Date of birth is required" })
    .refine((val) => !isNaN(new Date(val).getTime()), {
      message: "Enter a valid date",
    }),
  aadhar: z
    .string()
    .regex(/^\d{12}$/, { message: "Aadhar must be exactly 12 digits" }),
  guarantorName: z
    .string()
    .min(3, { message: "Guarantor name must be at least 3 characters" }),
  guarantorAadhar: z
    .string()
    .optional()
    .refine((val) => !val || /^\d{12}$/.test(val), {
      message: "Guarantor Aadhar must be exactly 12 digits",
    }),
  area: z
    .string()
    .min(3, { message: "Area name must be at least 3 characters" }),
  address: z
    .string()
    .min(5, { message: "Address must be at least 5 characters" }),
  customerCode: z.string().min(2, { message: "Customer code is required" }),

  // Photo (image)
  photo: z
    .any()
    .refine(
      (file) => !file || (file instanceof File && file.size <= MAX_FILE_SIZE),
      {
        message: "Photo must be less than 10MB",
      }
    )
    .refine(
      (file) => !file || ACCEPTED_IMAGE_TYPES.includes(file.type),
      {
        message: "Only JPG, PNG, or WebP images allowed",
      }
    )
    .optional(),

  // Document uploads (PDF/DOC/DOCX)
  aadharDocument: z
    .any()
    .refine((file) => file instanceof File && file.size <= MAX_FILE_SIZE, {
      message: "Aadhar Document must be less than 10MB",
    })
    .refine((file) => ACCEPTED_DOC_TYPES.includes(file.type), {
      message: "Only PDF or DOC files allowed for Aadhar Document",
    }),

  incomeProof: z
    .any()
    .refine((file) => file instanceof File && file.size <= MAX_FILE_SIZE, {
      message: "Income Proof must be less than 10MB",
    })
    .refine((file) => ACCEPTED_DOC_TYPES.includes(file.type), {
      message: "Only PDF or DOC files allowed for Income Proof",
    }),

  residenceProof: z
    .any()
    .refine((file) => file instanceof File && file.size <= MAX_FILE_SIZE, {
      message: "Residence Proof must be less than 10MB",
    })
    .refine((file) => ACCEPTED_DOC_TYPES.includes(file.type), {
      message: "Only PDF or DOC files allowed for Residence Proof",
    }),
});
