'use client'

import { useState } from 'react'
import { Search, Mail, Phone, User } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Customer {
  id: number
  firstName: string
  lastName: string
  email: string | null
  phone: string
  createdAt: Date
  _count: {
    repairOrders: number
  }
}

interface Props {
  customers: Customer[]
}

export function CustomerList({ customers }: Props) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredCustomers = customers.filter(c =>
    `${c.firstName} ${c.lastName} ${c.phone} ${c.email || ''}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  )

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Search */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search customers by name, phone, or email..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Customer List */}
      <div className="divide-y divide-gray-200">
        {filteredCustomers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <User className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>No customers found</p>
          </div>
        ) : (
          filteredCustomers.map(customer => (
            <div key={customer.id} className="p-4 hover:bg-gray-50 cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {customer.firstName} {customer.lastName}
                  </h3>
                  <div className="mt-1 space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{customer.phone}</span>
                    </div>
                    {customer.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span>{customer.email}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {customer._count.repairOrders} repair{customer._count.repairOrders !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Since {formatDate(customer.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
