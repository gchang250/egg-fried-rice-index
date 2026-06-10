import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfkit"],
  // Ensure the vendored Geist .ttf files are traced into the report-download
  // serverless function (they're read at request time via fs.readFileSync).
  outputFileTracingIncludes: {
    "/api/reports/*/download": ["./lib/report-fonts/**"],
  },
};

export default nextConfig;
