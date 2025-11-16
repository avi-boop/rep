'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Wrench,
  DollarSign,
  Users,
  BarChart3,
  Settings,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Repairs', href: '/dashboard/repairs', icon: Wrench },
  { name: 'Pricing', href: '/dashboard/pricing', icon: DollarSign },
  { name: 'Customers', href: '/dashboard/customers', icon: Users },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar - Desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white border-r border-gray-200 px-6 py-4">
          <div className="flex h-16 shrink-0 items-center">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <Wrench className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">RepairHub</span>
            </Link>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={`
                            group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold
                            ${
                              isActive
                                ? 'bg-blue-50 text-blue-600'
                                : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                            }
                          `}
                        >
                          <item.icon className="h-6 w-6 shrink-0" />
                          {item.name}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="lg:hidden">
        <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-white px-4 py-4 shadow-sm sm:px-6 border-b border-gray-200">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1 text-sm font-semibold leading-6 text-gray-900">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <Wrench className="h-6 w-6 text-blue-600" />
              <span>RepairHub</span>
            </Link>
          </div>
        </div>

        {/* Mobile menu overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-gray-900/80"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Mobile menu panel */}
        <div
          className={`
            fixed inset-y-0 left-0 z-50 w-64 bg-white transform transition-transform duration-300 ease-in-out
            ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <Wrench className="h-6 w-6 text-blue-600" />
              <span className="text-lg font-bold">RepairHub</span>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="px-4 py-4">
            <ul role="list" className="space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`
                        flex gap-x-3 rounded-md p-2 text-sm font-semibold
                        ${
                          isActive
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                        }
                      `}
                    >
                      <item.icon className="h-6 w-6" />
                      {item.name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <main className="lg:pl-64">
        <div className="px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  )
}
