import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/contexts/AuthContext";
import AnimatedBackground from "@/components/layout/AnimatedBackground";
import BootRecovery from "@/components/system/BootRecovery";

export const metadata: Metadata = {
  title: "Purpose Technology",
  description: "Discover and download great mobile applications",
  icons: {
    icon: "/purpose_logo.png",
    apple: "/purpose_logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <BootRecovery />
        <AuthProvider>
          <Toaster position="top-center" />
          {children}
        </AuthProvider>
        <AnimatedBackground />
      </body>
    </html>
  );
}
