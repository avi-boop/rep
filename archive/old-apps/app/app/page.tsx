import Link from 'next/link'
import { ArrowRight, Wrench, DollarSign, Bell, BarChart3 } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Wrench className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">RepairHub</h1>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Open Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-4">
            Professional Mobile Repair Management
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Streamline your repair shop operations with smart pricing, automated
            notifications, and comprehensive tracking.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-16">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Built for Success
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
          >
            Get Started Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-600">
            © 2025 RepairHub. Built with Next.js, Prisma, and PostgreSQL.
          </p>
        </div>
      </footer>
    </div>
  )
}

const features = [
  {
    icon: <Wrench className="h-6 w-6 text-blue-600" />,
    title: 'Repair Tracking',
    description:
      'Track repairs through every stage with an intuitive Kanban board interface.',
  },
  {
    icon: <DollarSign className="h-6 w-6 text-blue-600" />,
    title: 'Smart Pricing',
    description:
      'AI-powered price estimation based on device model, year, and tier level.',
  },
  {
    icon: <Bell className="h-6 w-6 text-blue-600" />,
    title: 'Auto Notifications',
    description:
      'Send SMS and email updates automatically when repair status changes.',
  },
  {
    icon: <BarChart3 className="h-6 w-6 text-blue-600" />,
    title: 'Analytics',
    description:
      'Track revenue, popular repairs, and technician performance metrics.',
  },
]

const stats = [
  { value: '50+', label: 'Device Models Supported' },
  { value: '12+', label: 'Repair Types' },
  { value: '85%', label: 'Smart Pricing Accuracy' },
]
