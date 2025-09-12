// In-memory OTP store (should NOT be used in production)
export const otpStore = {};

export function storeOtp(email, otp) {
  otpStore[email] = {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000, // expires in 5 min
  };
}

export function verifyOtp(email, otp) {
  const entry = otpStore[email];
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) return false;
  return entry.otp === otp;
}
