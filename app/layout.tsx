import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Event Follow-up System",
  description: "Meeting request follow-up messaging system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

