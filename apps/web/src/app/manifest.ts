import type { MetadataRoute } from "next";

// Served at /manifest.webmanifest by Next's App Router.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "My COD — Marketplace COD Warga Lokal",
    short_name: "My COD",
    description:
      "Jual beli barang bekas COD dengan warga sekitar. Cari berdasarkan jarak terdekat.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0D0F12",
    theme_color: "#0D0F12",
    lang: "id",
    dir: "ltr",
    categories: ["shopping", "lifestyle"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-192-maskable.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Jual Barang", short_name: "Jual", url: "/post" },
      { name: "Cari Barang", short_name: "Cari", url: "/search" },
      { name: "Chat", short_name: "Chat", url: "/chat" },
    ],
  };
}
