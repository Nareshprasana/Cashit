import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const { email, otp, newPassword } = await request.json();

    if (!email || !otp || !newPassword) {
      return new Response(JSON.stringify({ error: "All fields are required." }), {
        status: 400,
      });
    }

    // 1. Check OTP
    const otpRecord = await prisma.otp.findUnique({ where: { email } });
    if (!otpRecord || otpRecord.code !== otp || new Date() > otpRecord.expiresAt) {
      return new Response(JSON.stringify({ error: "Invalid or expired OTP." }), {
        status: 400,
      });
    }

    // 2. Ensure user exists
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return new Response(JSON.stringify({ error: "User not found." }), { status: 404 });
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 4. Update password
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    // 5. Optionally delete OTP record
    await prisma.otp.delete({ where: { email } });

    return new Response(JSON.stringify({ message: "Password reset successful." }), {
      status: 200,
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return new Response(JSON.stringify({ error: error.message || "Server error." }), {
      status: 500,
    });
  }
}
