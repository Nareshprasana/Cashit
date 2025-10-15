// app/layout.js
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./Providers";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Inter({ variable: "--font-geist-sans", subsets: ["latin"], display: "swap" });
const geistMono = Roboto_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap" });

export const metadata = { title: "CashIt" };

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
