import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "DuoDebate — AI-Powered Debate Arena",
  description: "Sharpen your arguments. Outmaneuver an AI that adapts. Built for MUNners, law aspirants & anyone who argues for sport.",
  openGraph: {
    title: "DuoDebate — AI-Powered Debate Arena",
    description: "Sharpen your arguments. Outmaneuver an AI that adapts.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
