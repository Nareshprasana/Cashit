"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
export default function UpdateProfile() {
  const { data: session, status } = useSession();
  const [form, setForm] = useState({
    id: "",
    name: "",
    email: "",
    password: "",
    role: "",
  });
  const [loading, setLoading] = useState(false);
  // :small_blue_diamond: Fetch logged-in user's profile
  const fetchProfile = async () => {
    if (!session?.user?.email) return;
    try {
      const res = await fetch(`/api/users?email=${session.user.email}`);
      const data = await res.json();
      if (res.ok && data.user) {
        setForm({
          id: data.user.id,
          name: data.user.name || "",
          email: data.user.email || "",
          password: "",
          role: data.user.role || "",
        });
      } else {
        toast.error(data.error || "Failed to load profile");
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      toast.error("Something went wrong while fetching profile.");
    }
  };
  useEffect(() => {
    if (status === "authenticated") fetchProfile();
  }, [status]);
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  // :small_blue_diamond: Update user profile
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      toast.success(":white_tick: Profile updated successfully!");
      setForm((prev) => ({ ...prev, password: "" }));
    } catch (err) {
      toast.error(err.message || ":x: Update failed");
    } finally {
      setLoading(false);
    }
  };
  // :small_blue_diamond: Loading / unauthenticated states
  if (status === "loading")
    return <p className="text-center py-10">Loading...</p>;
  if (status === "unauthenticated")
    return (
      <p className="text-center py-10">
        You must be logged in to update profile.
      </p>
    );
  return (
    <div className="flex justify-center items-center py-10">
      <Card className="w-full max-w-lg shadow-md rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Update Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Enter name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter email"
                value={form.email}
                disabled
              />
            </div>
            <div>
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter new password"
                value={form.password}
                onChange={handleChange}
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave blank if you don’t want to change your password
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Updating..." : "Update Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}