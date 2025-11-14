'use client'

import { Bell, User, Search, Menu } from 'lucide-react'

export function Header() {
  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-gray-200/80 bg-white/80 backdrop-blur-md px-6 shadow-sm">
      <div className="flex items-center gap-6">
        <button className="lg:hidden rounded-lg p-2 text-gray-600 hover:bg-gray-100 smooth-transition">
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Welcome Back
          </h2>
          <p className="text-xs text-gray-500">{currentTime}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Search Bar */}
        <div className="hidden md:flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2 smooth-transition focus-within:bg-white focus-within:ring-2 focus-within:ring-primary-500 focus-within:shadow-sm">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search repairs..."
            className="bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400 w-48"
          />
        </div>

        {/* Notifications */}
        <button className="relative rounded-xl p-2.5 text-gray-600 hover:bg-gray-100 smooth-transition group">
          <Bell className="h-5 w-5 group-hover:text-primary-600 smooth-transition" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 animate-pulse shadow-lg shadow-red-500/50"></span>
        </button>

        {/* User Profile */}
        <button className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 px-4 py-2 shadow-md hover:shadow-lg smooth-transition hover:scale-105">
          <div className="rounded-full bg-white/20 p-1.5 backdrop-blur-sm">
            <User className="h-4 w-4 text-white" />
          </div>
          <div className="hidden md:block text-left">
            <span className="block text-xs font-medium text-white">Admin</span>
            <span className="block text-xs text-primary-100">Super User</span>
          </div>
        </button>
      </div>
    </header>
  )
}
