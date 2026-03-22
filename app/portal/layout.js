import { PortalAuthProvider } from "../../context/PortalAuthContext";
import PortalNav from "../../components/portal/PortalNav";

export const metadata = {
  title: { default: "GarageDekho Partner", template: "%s — GD Partner" },
  description: "Garage management portal for GarageDekho partners",
};

export default function PortalLayout({ children }) {
  return (
    <PortalAuthProvider>
      <div className="min-h-screen bg-slate-100 font-sans">
        {children}
        <PortalNav />
      </div>
    </PortalAuthProvider>
  );
}
