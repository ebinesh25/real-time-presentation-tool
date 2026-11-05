/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@matbee/libreoffice-converter'],
  outputFileTracingIncludes: {
    '/api/presentations/upload': [
      './node_modules/@matbee/libreoffice-converter/wasm/*',
      './node_modules/@matbee/libreoffice-converter/dist/*.cjs',
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
