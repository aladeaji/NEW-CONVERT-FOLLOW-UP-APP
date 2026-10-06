import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "New Convert Follow-up & Attendance",
    short_name: "Follow-up",
    description:
      "Every person is seen. Every person is assigned. Every person is followed up.",
    start_url: "/today",
    display: "standalone",
    background_color: "#1A2B4A",
    theme_color: "#1A2B4A",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
