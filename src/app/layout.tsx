import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Alternative Reddit",
  description: "A client-side alternative Reddit reader mockup."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
