'use client'

interface Brand {
  id: number
  name: string
  _count?: {
    deviceModels: number
  }
}

interface Props {
  brands: Brand[]
  selectedBrandId: number | null
  onSelectBrand: (brandId: number) => void
}

const brandIcons: Record<string, string> = {
  'Apple': '🍎',
  'Samsung': '📱',
  'Google': '🔷',
  'OnePlus': '1️⃣',
  'Xiaomi': '📲',
  'Huawei': '🌐',
  'Motorola': '📞',
  'LG': '📺',
  'Sony': '🎮',
  'Nokia': '📟',
  'default': '🔧'
}

const brandColors: Record<string, string> = {
  'Apple': 'from-gray-700 to-gray-900',
  'Samsung': 'from-blue-600 to-blue-800',
  'Google': 'from-red-500 to-yellow-500',
  'OnePlus': 'from-red-600 to-red-800',
  'Xiaomi': 'from-orange-500 to-orange-700',
  'Huawei': 'from-red-700 to-red-900',
  'Motorola': 'from-blue-700 to-blue-900',
  'LG': 'from-purple-600 to-pink-600',
  'Sony': 'from-indigo-600 to-blue-600',
  'Nokia': 'from-blue-500 to-cyan-600',
  'default': 'from-gray-600 to-gray-800'
}

export function BrandGrid({ brands, selectedBrandId, onSelectBrand }: Props) {
  const getBrandIcon = (brandName: string) => {
    return brandIcons[brandName] || brandIcons.default
  }

  const getBrandColor = (brandName: string) => {
    return brandColors[brandName] || brandColors.default
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {brands.map((brand) => {
        const isSelected = brand.id === selectedBrandId
        const modelCount = brand._count?.deviceModels || 0

        return (
          <button
            key={brand.id}
            onClick={() => onSelectBrand(brand.id)}
            className={`
              relative p-6 rounded-xl transition-all duration-200
              ${isSelected
                ? 'ring-4 ring-blue-500 ring-offset-2 scale-105 shadow-xl'
                : 'hover:scale-105 hover:shadow-lg'
              }
              bg-gradient-to-br ${getBrandColor(brand.name)}
              text-white
            `}
          >
            {/* Brand Icon */}
            <div className="text-6xl mb-3 text-center">
              {getBrandIcon(brand.name)}
            </div>

            {/* Brand Name */}
            <h3 className="text-xl font-bold text-center mb-2">
              {brand.name}
            </h3>

            {/* Model Count Badge */}
            <div className="text-center">
              <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
                {modelCount} {modelCount === 1 ? 'model' : 'models'}
              </span>
            </div>

            {/* Selected Indicator */}
            {isSelected && (
              <div className="absolute top-3 right-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
