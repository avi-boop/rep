'use client'

import { LayoutGrid, Table2 } from 'lucide-react'

interface ViewModeToggleProps {
  mode: 'interactive' | 'matrix'
  onChange: (mode: 'interactive' | 'matrix') => void
}

export function ViewModeToggle({ mode, onChange }: ViewModeToggleProps) {
  return (
    <div className="inline-flex bg-gray-100 rounded-lg p-1">
      <button
        onClick={() => onChange('interactive')}
        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
          mode === 'interactive'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <LayoutGrid className="w-4 h-4" />
        <span>Interactive</span>
      </button>

      <button
        onClick={() => onChange('matrix')}
        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
          mode === 'matrix'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <Table2 className="w-4 h-4" />
        <span>Matrix</span>
      </button>
    </div>
  )
}
