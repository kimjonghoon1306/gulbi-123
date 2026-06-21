/** @type {import('next').NextConfig} */
const nextConfig = {
  // 빌드마다 고유 ID — 옛 JS 청크 캐시를 무효화(온봇 등 클라이언트 컴포넌트 갱신 보장)
  generateBuildId: async () => `build-${Date.now()}`,
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
    },
  },
}

module.exports = nextConfig
