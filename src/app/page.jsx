// app/page.js
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth"; // adjust path if different

export default async function Home() {
  // Get the user's session (server-side)
  const session = await getServerSession(authOptions);

  // Redirect based on login status
  if (session) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
