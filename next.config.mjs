/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {

    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    }

    config.module.rules.push({
      test: /\.wasm$/,
      type: "webassembly/async",
    })


    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      }
    }

    return config
  },
  
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
        ],
      },
    ]
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // typescript: {
  //   ignoreBuildErrors: true,
  // },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
