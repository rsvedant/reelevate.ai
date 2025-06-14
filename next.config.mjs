/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable WebAssembly support
  webpack: (config, { isServer }) => {
    // Add WebAssembly support
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    }

    // Add support for .wasm files
    config.module.rules.push({
      test: /\.wasm$/,
      type: "webassembly/async",
    })

    // Ensure proper handling of WebLLM workers
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
  
  // Add headers for WebAssembly and SharedArrayBuffer support
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
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
