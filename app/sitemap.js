import { getAllGarages } from "../lib/garages";

const BASE_URL = "https://garagedekho.com";

export default async function sitemap() {
  const garages = await getAllGarages().catch(() => []);

  const garageUrls = garages.map((g) => ({
    url: `${BASE_URL}/garage/${g.id}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    { url: BASE_URL,               lastModified: new Date(), changeFrequency: "daily",   priority: 1.0 },
    { url: `${BASE_URL}/near-me`,  lastModified: new Date(), changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE_URL}/bookings`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/profile`,  lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    ...garageUrls,
  ];
}
