import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SidebarProvider } from "@/components/ui/sidebar";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "ACKERS WELDON Dashboard",
  description: "ACKERS WELDON's Research & Development Platform",
  icons: {
    icon: "/ackers-weldon-logo-small.svg",
    shortcut: "/ackers-weldon-logo-small.svg",
    apple: "/ackers-weldon-logo-small.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SidebarProvider defaultOpen={true}>
          {children}
        </SidebarProvider>
      </body>
    </html>
  );
}
