import { z } from "zod";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ACCEPTED_DOC_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export const CustomerSchema = z.object({
  customerName: z.string().optional(),
  spouseName: z.string().optional(),
  parentName: z.string().optional(),
  mobile: z.string().optional(),
  gender: z.enum(["Male", "Female"]).optional(),
  dob: z.string().optional(),
  aadhar: z.string().optional(),
  guarantorName: z.string().optional(),
  guarantorAadhar: z
    .string()
    .optional()
    .refine((val) => !val || /^\d{12}$/.test(val), {
      message: "Guarantor Aadhar must be exactly 12 digits",
    }),
  area: z.string().optional(),
  address: z.string().optional(),
  customerCode: z.string().optional(),

  photo: z
    .any()
    .optional()
    .refine(
      (file) => !file || (file instanceof File && file.size <= MAX_FILE_SIZE),
      { message: "Photo must be less than 10MB" }
    )
    .refine(
      (file) => !file || ACCEPTED_IMAGE_TYPES.includes(file.type),
      { message: "Only JPG, PNG, or WebP images allowed" }
    ),

  aadharDocument: z
    .any()
    .optional()
    .refine(
      (file) => !file || (file instanceof File && file.size <= MAX_FILE_SIZE),
      { message: "Aadhar Document must be less than 10MB" }
    )
    .refine(
      (file) => !file || ACCEPTED_DOC_TYPES.includes(file.type),
      { message: "Only PDF or DOC files allowed for Aadhar Document" }
    ),

  incomeProof: z
    .any()
    .optional()
    .refine(
      (file) => !file || (file instanceof File && file.size <= MAX_FILE_SIZE),
      { message: "Income Proof must be less than 10MB" }
    )
    .refine(
      (file) => !file || ACCEPTED_DOC_TYPES.includes(file.type),
      { message: "Only PDF or DOC files allowed for Income Proof" }
    ),

  residenceProof: z
    .any()
    .optional()
    .refine(
      (file) => !file || (file instanceof File && file.size <= MAX_FILE_SIZE),
      { message: "Residence Proof must be less than 10MB" }
    )
    .refine(
      (file) => !file || ACCEPTED_DOC_TYPES.includes(file.type),
      { message: "Only PDF or DOC files allowed for Residence Proof" }
    ),
});
