import path from "path"
import { fileURLToPath } from "url"
import withPWAInit from "next-pwa"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const isDev = process.env.NODE_ENV !== "production"

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: isDev,
  fallbacks: {
    document: "/offline.html",
  },
})

/** @type {import('next').NextConfig} */
const nextConfig = withPWA({
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Especificar o diretório raiz do projeto para evitar avisos sobre múltiplos lockfiles
  outputFileTracingRoot: path.join(__dirname),
  // Configuração do Turbopack para compatibilidade com Next.js 16
  turbopack: {},
})

export default nextConfig
