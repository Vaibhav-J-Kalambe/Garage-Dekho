import "./globals.css";
import { Inter } from "next/font/google";
import BottomNav from "../components/BottomNav";
import { AuthProvider } from "../components/AuthProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  title: "GarageDekho",
  description: "Hyperlocal automotive service marketplace",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body
        className="bg-slate-50 text-slate-900 font-sans antialiased"
        suppressHydrationWarning
      >
        <AuthProvider>
          {children}
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}
