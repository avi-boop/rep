import Link from 'next/link'
import { ArrowRight, Wrench, DollarSign, Users, BarChart } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Repair Dashboard
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Comprehensive Mobile Repair Shop Management System
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg"
          >
            Open Dashboard
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <FeatureCard
            icon={<Wrench className="w-8 h-8" />}
            title="Repair Management"
            description="Track repairs from intake to completion with our intuitive Kanban board"
          />
          <FeatureCard
            icon={<DollarSign className="w-8 h-8" />}
            title="Smart Pricing"
            description="AI-powered price estimation for accurate quotes"
          />
          <FeatureCard
            icon={<Users className="w-8 h-8" />}
            title="Customer Management"
            description="Manage customer information and repair history"
          />
          <FeatureCard
            icon={<BarChart className="w-8 h-8" />}
            title="Analytics & Reports"
            description="Track revenue, popular repairs, and business metrics"
          />
        </div>

        <div className="mt-16 text-center">
          <div className="inline-block bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Features
            </h2>
            <ul className="text-left space-y-2 text-gray-700">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Repair order tracking and management
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Smart pricing algorithm with confidence scores
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Customer notifications (SMS & Email)
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Inventory and parts management
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Revenue and performance analytics
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Lightspeed POS integration
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function FeatureCard({ icon, title, description }: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="text-blue-600 mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  )
}
