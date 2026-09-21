import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Gratitude Circles",
    short_name: "Gratitude",
    description: "Notice the good, together.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    related_applications: [
      {
        platform: "play",
        id: "net.iskind.gratitude",
        url: "https://play.google.com/store/apps/details?id=net.iskind.gratitude",
      },
    ],
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/icons/gratitude-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/gratitude-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
