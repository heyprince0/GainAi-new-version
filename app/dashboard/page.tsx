import { Navbar } from "@/components/navbar"
import { Dashboard } from "@/components/dashboard"
import { Footer } from "@/components/footer"

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Dashboard />
      </main>
      <Footer />
    </div>
  )
}
