import "./globals.css";
import { Inter } from "next/font/google";
import BottomNav from "../components/BottomNav";
import { AuthProvider } from "../components/AuthProvider";
import { LocationProvider } from "../context/LocationContext";
import { ToastProvider } from "../context/ToastContext";
import Analytics from "../components/Analytics";
import NavigationProgress from "../components/NavigationProgress";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  title: { default: "GarageDekho", template: "%s — GarageDekho" },
  description: "Hyperlocal automotive service marketplace — find & book garages near you",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "GarageDekho",
  },
  formatDetection: { telephone: false },
};

export const viewport = {
  themeColor: "#0056D2",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body
        className="bg-slate-50 text-slate-900 font-sans antialiased"
        suppressHydrationWarning
      >
        <NavigationProgress />
        <Analytics />
        <AuthProvider>
          <LocationProvider>
            <ToastProvider>
              {children}
              <BottomNav />
            </ToastProvider>
          </LocationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
