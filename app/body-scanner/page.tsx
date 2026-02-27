import { Navbar } from "@/components/navbar"
import { BodyScanner } from "@/components/body-scanner"
import { Footer } from "@/components/footer"

export default function BodyScannerPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <BodyScanner />
      </main>
      <Footer />
    </div>
  )
}
