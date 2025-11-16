'use client'

import { useRouter } from 'next/navigation'
import { useAuthStore, useUIStore } from '@/lib/store'
import { Menu, LogOut, User } from 'lucide-react'

export default function Header() {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const { toggleSidebar } = useUIStore()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-6">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md hover:bg-gray-100 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-primary-600" />
            </div>
            <div className="text-sm">
              <div className="font-medium text-gray-900">{user?.username}</div>
              <div className="text-gray-500 text-xs capitalize">{user?.role}</div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
    </header>
  )
}
