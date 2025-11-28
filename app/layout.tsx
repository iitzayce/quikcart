import type { Metadata } from "next";
import { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "QuikCart - Instacart Shopping Made Easy",
  description: "Transform your shopping list into an Instacart cart with image, text, or voice input",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

