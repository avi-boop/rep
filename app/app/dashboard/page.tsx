import Link from 'next/link'
import {
  Wrench,
  Clock,
  CheckCircle,
  DollarSign,
  TrendingUp,
  Plus,
} from 'lucide-react'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back! Here's what's happening today.
          </p>
        </div>
        <Link
          href="/dashboard/repairs/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="h-5 w-5 mr-2" />
          New Repair
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white rounded-lg shadow-sm p-6 border border-gray-200"
          >
            <div className="flex items-center">
              <div className={`${stat.bgColor} p-3 rounded-lg`}>
                {stat.icon}
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
            {stat.change && (
              <div className="mt-4 flex items-center text-sm">
                <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                <span className="text-green-600 font-medium">{stat.change}</span>
                <span className="text-gray-600 ml-2">from last week</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              href={action.href}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
            >
              <div className="bg-blue-50 p-2 rounded-lg">
                {action.icon}
              </div>
              <span className="ml-3 text-sm font-medium text-gray-900">
                {action.name}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Repairs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Repairs
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentRepairs.map((repair) => (
                <div
                  key={repair.id}
                  className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {repair.device}
                    </p>
                    <p className="text-sm text-gray-600">{repair.customer}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${repair.statusColor}`}
                    >
                      {repair.status}
                    </span>
                    <p className="text-xs text-gray-600 mt-1">{repair.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link
              href="/dashboard/repairs"
              className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium mt-4"
            >
              View all repairs →
            </Link>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Pending Approvals
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {pendingApprovals.map((approval) => (
                <div
                  key={approval.id}
                  className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {approval.device}
                    </p>
                    <p className="text-sm text-gray-600">{approval.customer}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      ${approval.amount}
                    </p>
                    <button className="text-xs text-blue-600 hover:text-blue-700 font-medium mt-1">
                      Review →
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {pendingApprovals.length === 0 && (
              <p className="text-center text-gray-600 py-8">
                No pending approvals
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const stats = [
  {
    name: 'Active Repairs',
    value: '12',
    icon: <Wrench className="h-6 w-6 text-blue-600" />,
    bgColor: 'bg-blue-100',
    change: '+8%',
  },
  {
    name: 'Pending',
    value: '5',
    icon: <Clock className="h-6 w-6 text-yellow-600" />,
    bgColor: 'bg-yellow-100',
  },
  {
    name: 'Completed Today',
    value: '8',
    icon: <CheckCircle className="h-6 w-6 text-green-600" />,
    bgColor: 'bg-green-100',
    change: '+12%',
  },
  {
    name: 'Revenue (Week)',
    value: '$8,940',
    icon: <DollarSign className="h-6 w-6 text-purple-600" />,
    bgColor: 'bg-purple-100',
    change: '+15%',
  },
]

const quickActions = [
  {
    name: 'New Repair',
    href: '/dashboard/repairs/new',
    icon: <Plus className="h-5 w-5 text-blue-600" />,
  },
  {
    name: 'Search Customer',
    href: '/dashboard/customers',
    icon: <Wrench className="h-5 w-5 text-blue-600" />,
  },
  {
    name: 'Price Matrix',
    href: '/dashboard/pricing',
    icon: <DollarSign className="h-5 w-5 text-blue-600" />,
  },
  {
    name: 'View Reports',
    href: '/dashboard/analytics',
    icon: <TrendingUp className="h-5 w-5 text-blue-600" />,
  },
]

const recentRepairs = [
  {
    id: 1,
    device: 'iPhone 15 Pro Max',
    customer: 'John Doe',
    status: 'In Progress',
    statusColor: 'bg-blue-100 text-blue-800',
    time: '2 hours ago',
  },
  {
    id: 2,
    device: 'Samsung Galaxy S24',
    customer: 'Jane Smith',
    status: 'Testing',
    statusColor: 'bg-purple-100 text-purple-800',
    time: '4 hours ago',
  },
  {
    id: 3,
    device: 'iPhone 13',
    customer: 'Bob Johnson',
    status: 'Ready',
    statusColor: 'bg-green-100 text-green-800',
    time: '5 hours ago',
  },
]

const pendingApprovals = [
  {
    id: 1,
    device: 'iPhone 14 Pro',
    customer: 'Alice Brown',
    amount: '329',
  },
  {
    id: 2,
    device: 'iPad Pro 12.9"',
    customer: 'Charlie Wilson',
    amount: '449',
  },
]
