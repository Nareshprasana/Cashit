"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Mail, KeyRound, Lock } from "lucide-react"; // 👈 icons

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState(1); // 1 = Send OTP, 2 = Verify OTP, 3 = Reset Password
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [showOtp, setShowOtp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const sendOtp = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");

      setMessage("✅ OTP sent to your email.");
      setStep(2);
    } catch (err) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid OTP");

      setMessage("✅ OTP verified. Please enter your new password.");
      setStep(3);
    } catch (err) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset password");

      setMessage("✅ Password reset successfully. Redirecting...");
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <Card className="w-full max-w-md border shadow-lg rounded-2xl bg-white">
        <CardHeader>
          <CardTitle className="text-xl text-center">
            {step === 1
              ? "Send OTP"
              : step === 2
              ? "Verify OTP"
              : "Reset Password"}
          </CardTitle>

          {/* Step Progress Indicator */}
          <div className="flex justify-between items-center text-sm mt-4">
            <div className={`flex-1 text-center ${step >= 1 ? "font-bold text-blue-600" : "text-gray-400"}`}>
              1. Email
            </div>
            <div className="flex-1">
              <div className={`border-t ${step >= 2 ? "border-blue-600" : "border-gray-300"}`}></div>
            </div>
            <div className={`flex-1 text-center ${step >= 2 ? "font-bold text-blue-600" : "text-gray-400"}`}>
              2. OTP
            </div>
            <div className="flex-1">
              <div className={`border-t ${step >= 3 ? "border-blue-600" : "border-gray-300"}`}></div>
            </div>
            <div className={`flex-1 text-center ${step === 3 ? "font-bold text-blue-600" : "text-gray-400"}`}>
              3. Reset
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {/* Email Input */}
            <div className="relative">
              <label className="block text-sm font-medium mb-1">Email Address</label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={step !== 1}
                className="pr-10"
              />
              <Mail className="absolute right-3 top-9 h-4 w-4 text-gray-400" />
            </div>

            {/* OTP Input */}
            {step >= 2 && (
              <div className="relative">
                <label className="block text-sm font-medium mb-1">Enter OTP</label>
                <Input
                  type={showOtp ? "text" : "password"}
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  className="pr-10"
                />
                {showOtp ? (
                  <EyeOff
                    className="absolute right-3 top-9 h-4 w-4 cursor-pointer text-gray-500"
                    onClick={() => setShowOtp(false)}
                  />
                ) : (
                  <Eye
                    className="absolute right-3 top-9 h-4 w-4 cursor-pointer text-gray-500"
                    onClick={() => setShowOtp(true)}
                  />
                )}
              </div>
            )}

            {/* New Password Input */}
            {step === 3 && (
              <div className="relative">
                <label className="block text-sm font-medium mb-1">New Password</label>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                {showPassword ? (
                  <EyeOff
                    className="absolute right-3 top-9 h-4 w-4 cursor-pointer text-gray-500"
                    onClick={() => setShowPassword(false)}
                  />
                ) : (
                  <Eye
                    className="absolute right-3 top-9 h-4 w-4 cursor-pointer text-gray-500"
                    onClick={() => setShowPassword(true)}
                  />
                )}
              </div>
            )}

            {/* Buttons */}
            {step === 1 && (
              <Button onClick={sendOtp} className="w-full" disabled={loading}>
                {loading ? "Sending OTP..." : "Send OTP"}
              </Button>
            )}
            {step === 2 && (
              <Button onClick={verifyOtp} className="w-full" disabled={loading}>
                {loading ? "Verifying..." : "Verify OTP"}
              </Button>
            )}
            {step === 3 && (
              <Button onClick={resetPassword} className="w-full" disabled={loading}>
                {loading ? "Resetting..." : "Reset Password"}
              </Button>
            )}

            {/* Feedback Messages */}
            {message && (
              <div
                className={`p-2 rounded-md text-sm text-center ${
                  message.startsWith("✅")
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {message}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
