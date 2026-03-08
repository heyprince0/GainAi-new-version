import { Navbar } from "@/components/navbar"
import { Dashboard } from "@/components/dashboard"

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen flex-col pb-20">
      <Navbar />
      <main className="flex-1">
        <Dashboard />
      </main>
    </div>
  )
}
