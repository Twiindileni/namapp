import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/contexts/AuthContext";
import AnimatedBackground from "@/components/layout/AnimatedBackground";
import BootRecovery from "@/components/system/BootRecovery";

/** Avoid serving a stale app shell that points at old JS after deploys. */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Purpose Technology — Namibia's Tech Hub",
  description: "Discover innovative technology solutions, apps, products, and services created by Namibian developers and entrepreneurs. Your one-stop hub for local tech excellence.",
  keywords: "Namibia, technology, apps, developers, Windhoek, Purpose Technology",
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased" style={{ background: '#03071e' }}>
        <BootRecovery />
        <AuthProvider>
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: 'rgba(7,18,46,0.95)',
                color: '#f0f4ff',
                border: '1px solid rgba(0,85,200,0.25)',
                backdropFilter: 'blur(16px)',
                borderRadius: '12px',
              },
              success: {
                iconTheme: { primary: '#009543', secondary: '#03071e' },
              },
              error: {
                iconTheme: { primary: '#D21034', secondary: '#03071e' },
              },
            }}
          />
          {children}
        </AuthProvider>
        <AnimatedBackground />
      </body>
    </html>
  );
}
