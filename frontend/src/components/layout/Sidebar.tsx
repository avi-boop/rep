'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUIStore } from '@/lib/store'
import {
  LayoutDashboard,
  Wrench,
  Users,
  DollarSign,
  Package,
  Bell,
  BarChart3,
  Settings,
  X,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Repairs', href: '/dashboard/repairs', icon: Wrench },
  { name: 'Customers', href: '/dashboard/customers', icon: Users },
  { name: 'Pricing', href: '/dashboard/pricing', icon: DollarSign },
  { name: 'Inventory', href: '/dashboard/inventory', icon: Package },
  { name: 'Notifications', href: '/dashboard/notifications', icon: Bell },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { sidebarOpen, toggleSidebar } = useUIStore()

  if (!sidebarOpen) return null

  return (
    <>
      {/* Mobile overlay */}
      <div
        className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
        onClick={toggleSidebar}
      />

      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300">
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <Link href="/dashboard" className="text-2xl font-bold text-primary-600">
            RepairHub
          </Link>
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-primary-600' : 'text-gray-400'}`} />
                  {item.name}
                </Link>
              )
            })}
          </div>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            Version 1.0.0
          </div>
        </div>
      </div>
    </>
  )
}
