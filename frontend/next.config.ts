import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // ESLint 에러가 있어도 프로덕션 빌드를 막지 않음
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
