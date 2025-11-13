import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Repair Dashboard - Mobile Repair Shop Management",
  description: "Comprehensive dashboard for managing mobile device repairs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
