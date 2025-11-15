export const dynamic = 'force-dynamic'
// Force dynamic rendering for database access
export const dynamic = 'force-dynamic'


'use client'

import { useState } from 'react'
import { AddPricingModal } from '@/components/pricing/AddPricingModal'
import { EditPricingModal } from '@/components/pricing/EditPricingModal'

export default function TestModalPage() {
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  // Test data
  const testBrands = [{ id: 1, name: 'Apple' }]
  const testRepairTypes = [
    { id: 1, name: 'Front Screen' },
    { id: 2, name: 'Back Panel' },
    { id: 3, name: 'Battery' }
  ]
  const testPricing = {
    id: 1,
    deviceModelId: 1,
    repairTypeId: 1,
    partTypeId: 4,
    price: 150,
    cost: 80,
    isEstimated: false,
    confidenceScore: 1.0,
    notes: 'Test pricing',
    deviceModel: {
      id: 1,
      name: 'iPhone 13 Pro',
      brand: { id: 1, name: 'Apple' }
    },
    repairType: {
      id: 1,
      name: 'Front Screen'
    },
    partType: {
      id: 4,
      name: 'Standard',
      qualityLevel: 2
    },
    priceHistory: []
  }

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-3xl font-bold">Modal Test Page</h1>

      <div className="flex gap-4">
        <button
          onClick={() => {
            console.log('Opening Add Modal...')
            setShowAddModal(true)
          }}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          Test Add Pricing Modal
        </button>

        <button
          onClick={() => {
            console.log('Opening Edit Modal...')
            setShowEditModal(true)
          }}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
        >
          Test Edit Pricing Modal
        </button>
      </div>

      <div className="mt-4 p-4 bg-gray-100 rounded">
        <p>Add Modal Open: <strong>{showAddModal ? 'YES' : 'NO'}</strong></p>
        <p>Edit Modal Open: <strong>{showEditModal ? 'YES' : 'NO'}</strong></p>
      </div>

      {/* Add Pricing Modal */}
      <AddPricingModal
        isOpen={showAddModal}
        onClose={() => {
          console.log('Closing Add Modal...')
          setShowAddModal(false)
        }}
        onSuccess={() => {
          console.log('Add Success!')
          alert('Pricing added successfully!')
          setShowAddModal(false)
        }}
        brands={testBrands}
        repairTypes={testRepairTypes}
        partTypes={[
          { id: 1, name: 'Standard', qualityLevel: 2 },
          { id: 2, name: 'Original (OEM)', qualityLevel: 5 }
        ]}
      />

      {/* Edit Pricing Modal */}
      <EditPricingModal
        isOpen={showEditModal}
        onClose={() => {
          console.log('Closing Edit Modal...')
          setShowEditModal(false)
        }}
        onSuccess={() => {
          console.log('Edit Success!')
          alert('Pricing updated successfully!')
          setShowEditModal(false)
        }}
        pricing={showEditModal ? testPricing : null}
      />
    </div>
  )
}
