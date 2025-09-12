// app/page.js
import { redirect } from "next/navigation";

export default function Home() {
  // Automatically send users to /login
  redirect("/login");
}
