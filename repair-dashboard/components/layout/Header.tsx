'use client'

import { Bell, User } from 'lucide-react'

export function Header() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 shadow-sm">
      <div className="flex items-center">
        <h2 className="text-2xl font-semibold text-gray-900">
          Welcome Back
        </h2>
      </div>
      <div className="flex items-center gap-4">
        <button className="relative rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500">
          <Bell className="h-6 w-6" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500"></span>
        </button>
        <button className="flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 hover:bg-gray-200">
          <User className="h-5 w-5" />
          <span className="text-sm font-medium">Admin</span>
        </button>
      </div>
    </header>
  )
}
