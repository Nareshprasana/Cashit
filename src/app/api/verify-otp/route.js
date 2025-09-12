import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function POST(req) {
  try {
    // Parse request body
    const body = await req.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return new Response(
        JSON.stringify({ error: "Email and OTP are required" }),
        { status: 400 }
      );
    }

    // Fetch OTP record for the email
    const record = await prisma.otp.findUnique({ where: { email } });

    if (!record) {
      return new Response(
        JSON.stringify({ error: "No OTP found for this email" }),
        { status: 400 }
      );
    }

    // Check OTP and expiration
    const now = new Date();
    if (record.code !== otp) {
      return new Response(
        JSON.stringify({ error: "Incorrect OTP" }),
        { status: 400 }
      );
    }

    if (now > record.expiresAt) {
      return new Response(
        JSON.stringify({ error: "OTP expired" }),
        { status: 400 }
      );
    }

    // ✅ OTP is valid
    return new Response(
      JSON.stringify({ message: "OTP verified successfully" }),
      { status: 200 }
    );
  } catch (err) {
    console.error("VERIFY OTP ERROR:", err);
    return new Response(
      JSON.stringify({ error: "Failed to verify OTP" }),
      { status: 500 }
    );
  }
}
