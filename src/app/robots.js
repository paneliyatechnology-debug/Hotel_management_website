export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://myownpms.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/features",
          "/pricing",
          "/about",
          "/contact",
          "/register-hotel",
          "/privacy",
          "/terms",
        ],
        disallow: [
          "/app/",
          "/admin/",
          "/receptionist/",
          "/login",
          "/forgot-password",
          "/api/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
