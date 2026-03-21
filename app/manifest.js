export default function manifest() {
  return {
    name: "GarageDekho",
    short_name: "GarageDekho",
    description: "Hyperlocal automotive service marketplace — find & book garages near you",
    start_url: "/",
    display: "standalone",
    background_color: "#F8FAFC",
    theme_color: "#0056D2",
    orientation: "portrait",
    categories: ["automotive", "lifestyle", "utilities"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
    ],
    shortcuts: [
      {
        name: "Find Garage",
        short_name: "Near Me",
        description: "Find garages on the map",
        url: "/near-me",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "SOS Help",
        short_name: "SOS",
        description: "Emergency roadside assistance",
        url: "/sos",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
