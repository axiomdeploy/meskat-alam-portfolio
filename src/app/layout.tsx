import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter, Doto } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

// dot-matrix face (Nothing-style dot type) — used for the small captions
// that sit on the portrait overlay
const doto = Doto({
  variable: "--font-dot",
  subsets: ["latin"],
  weight: "variable",
  axes: ["ROND"],
});

export const metadata: Metadata = {
  title: "Meskat Alam",
  description:
    "Meskat Alam builds browser-native experiences that feel alive — physics, canvas craft and interfaces with soul.",
  keywords: ["Meskat Alam", "Developer", "Creative Developer", "Three.js", "Canvas API", "Portfolio"],
  authors: [{ name: "Meskat Alam" }],
  openGraph: {
    title: "Meskat Alam",
    description: "Browser-native experiences that feel alive.",
    siteName: "Meskat Alam",
    type: "website",
  },
  // stops Dark Reader from injecting attributes before hydration and
  // tripping React's hydration check
  other: {
    "darkreader-lock": "1",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#08060a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${spaceGrotesk.variable} ${inter.variable} ${doto.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
