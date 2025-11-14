'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Wrench, DollarSign, Users, BarChart3, Settings, Smartphone } from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Repairs', href: '/dashboard/repairs', icon: Wrench },
  { name: 'Pricing', href: '/dashboard/pricing', icon: DollarSign },
  { name: 'Customers', href: '/dashboard/customers', icon: Users },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col bg-gradient-to-b from-secondary-900 via-secondary-800 to-secondary-900 shadow-xl">
      {/* Logo/Brand Section */}
      <div className="flex h-20 items-center justify-center border-b border-secondary-700/50 bg-gradient-to-r from-primary-600 to-primary-700">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-white/10 p-2 backdrop-blur-sm">
            <Smartphone className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">RepairHub</h1>
            <p className="text-xs text-primary-100">Management System</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-6">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                group flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl smooth-transition
                ${isActive
                  ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-500/30 scale-105'
                  : 'text-secondary-300 hover:bg-secondary-700/50 hover:text-white hover:scale-102'
                }
              `}
            >
              <item.icon
                className={`
                  h-5 w-5 flex-shrink-0 smooth-transition
                  ${isActive ? 'text-white' : 'text-secondary-400 group-hover:text-white'}
                `}
                aria-hidden="true"
              />
              <span className={isActive ? 'font-semibold' : ''}>{item.name}</span>
              {isActive && (
                <div className="ml-auto h-2 w-2 rounded-full bg-white animate-pulse"></div>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-secondary-700/50 p-4">
        <div className="rounded-xl bg-secondary-700/30 p-4 backdrop-blur-sm">
          <p className="text-xs font-medium text-secondary-300">System Status</p>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-success-400 animate-pulse"></div>
            <span className="text-xs text-secondary-400">All systems operational</span>
          </div>
        </div>
      </div>
    </div>
  )
}
