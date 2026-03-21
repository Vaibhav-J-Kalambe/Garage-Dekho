import { getGarageById } from "../../../lib/garages";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const garage = await getGarageById(id).catch(() => null);

  if (!garage) {
    return {
      title: "Garage Not Found — GarageDekho",
    };
  }

  const title = `${garage.name} — Book Auto Service | GarageDekho`;
  const description = `${garage.speciality} · ${garage.address}. Rated ${garage.rating}★ by ${garage.reviews} customers. Book online in seconds.`;
  const image = garage.image || "https://garagedekho.in/og-default.jpg";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://garagedekho.in/garage/${id}`,
      siteName: "GarageDekho",
      images: [{ url: image, width: 1200, height: 630, alt: garage.name }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default function GarageLayout({ children }) {
  return children;
}
