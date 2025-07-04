import { BackgroundBeams } from "@/components/ui/background-beams"
import { ProductDemo } from "@/components/product-demo"
import { FeaturesSection } from "@/components/features-section"
import { NeonPulse } from "@/components/ui/neon-pulse"
import { TextGenerateEffect } from "@/components/ui/text-generate-effect"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col px-4 sm:px-8 md:px-16 lg:px-24 pt-12 pb-6 md:py-24 text-soft-white overflow-hidden">
      <div className="absolute inset-0 bg-background">
        <div className="absolute inset-0 bg-dot-foreground/10" />
      </div>
      <BackgroundBeams />
      <NeonPulse />
      <div className="z-10 w-full flex flex-col items-center">
        <h1 className="text-4xl sm:text-4xl md:text-6xl font-bold text-center mb-6 md:mb-8 max-w-[95%] sm:max-w-5xl leading-tight tracking-tight">
          <TextGenerateEffect words="Welcome    to      Reelevate" />
        </h1>
        <p className="text-xl sm:text-xl md:text-2xl text-center mb-10 md:mb-12 max-w-[90%] sm:max-w-full leading-relaxed font-light">
          Empowering Stories with Seamless Automation.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-10 md:mb-12">
          <Link href="/chat" passHref>
            <Button variant="outline" size="lg">
              Get started
            </Button>
          </Link>
          <Link href="/reel" passHref>
            <Button className="bg-white text-black" variant="outline" size="lg">
              Generate Reel
            </Button>
          </Link>
        </div>
        <ProductDemo />
        <FeaturesSection />
        <h1 className="mt-8 md:mt-12 text-sm opacity-75">© {new Date().getFullYear()} Reelevate Inc. All rights reserved.</h1>
      </div>
    </main>
  )
}