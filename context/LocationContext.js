"use client";

import { createContext, useContext, useState, useEffect } from "react";

const LocationContext = createContext(null);

export function LocationProvider({ children }) {
  const [location, setLocationState] = useState(null);
  // { area: "Kurla", city: "Mumbai", lat: 19.07, lng: 72.88 }

  useEffect(() => {
    try {
      const saved = localStorage.getItem("gd_location");
      if (saved) setLocationState(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  function setLocation(loc) {
    setLocationState(loc);
    try {
      if (loc) localStorage.setItem("gd_location", JSON.stringify(loc));
      else localStorage.removeItem("gd_location");
    } catch { /* ignore */ }
  }

  return (
    <LocationContext.Provider value={{ location, setLocation }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  return useContext(LocationContext);
}
