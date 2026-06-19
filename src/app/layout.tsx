import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Velvet Lens",
  description: "Token analysis into strategy previews.",
  icons: {
    icon: "/brand/velvet-lens.png",
    apple: "/brand/velvet-lens.png",
  },
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
