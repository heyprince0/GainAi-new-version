import { Navbar } from "@/components/navbar"
import { FoodScanner } from "@/components/food-scanner"
import { Footer } from "@/components/footer"

export default function FoodScannerPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <FoodScanner />
      </main>
      <Footer />
    </div>
  )
}
