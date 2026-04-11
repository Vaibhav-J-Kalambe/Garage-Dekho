import "./globals.css";
import { Inter } from "next/font/google";
import BottomNav from "../components/BottomNav";
import Footer from "../components/Footer";
import { AuthProvider } from "../components/AuthProvider";
import { LocationProvider } from "../context/LocationContext";
import { ToastProvider } from "../context/ToastContext";
import Analytics from "../components/Analytics";
import NavigationProgress from "../components/NavigationProgress";
import { ThemeProvider } from "../components/ThemeProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  title: { default: "GarageDekho", template: "%s - GarageDekho" },
  description: "Find and book trusted car garages near you. Oil changes, repairs, tyres, and 24/7 SOS.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GarageDekho",
  },
  formatDetection: { telephone: false },
};

export const viewport = {
  themeColor: "#0056b7",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Anti-FOUC: apply dark class before first paint */}
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            var t = localStorage.getItem('gd_theme');
            var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (t === 'dark' || (!t && prefersDark)) {
              document.documentElement.classList.add('dark');
            }
          } catch(e) {}
        `}} />
      </head>
      <body
        className="bg-[#f9f9fe] dark:bg-[#111113] text-[#1a1c1f] dark:text-[#e4e2e6] font-sans antialiased"
        suppressHydrationWarning
      >
        <NavigationProgress />
        <Analytics />
        <ThemeProvider>
          <AuthProvider>
            <LocationProvider>
              <ToastProvider>
                {children}
                <Footer />
                <BottomNav />
              </ToastProvider>
            </LocationProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
