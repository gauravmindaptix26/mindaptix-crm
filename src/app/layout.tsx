import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mindaptix CRM",
  description: "Mindaptix CRM login portal for managing company records and workflows.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
