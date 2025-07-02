import path from 'path'

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    rules: {
      "**/*.svg": {
        as: "*.js",
        loaders: ["@svgr/webpack"],
      },
    },
  },
  webpack: (config, { isServer }) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      topLevelAwait: true,
    }

    config.module.rules.push({
      test: /\.wasm$/,
      type: "asset/resource",
    })

    config.module.rules.push({
      test: /\.svg$/,
      exclude: path.resolve(process.cwd(), 'app/icon0.svg'),
      use: ["@svgr/webpack"],
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
        source: "/:path*",
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