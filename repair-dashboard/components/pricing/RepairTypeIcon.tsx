import { Smartphone, Battery, Camera, Wrench, Zap, SquareStack, Layers } from 'lucide-react'

interface RepairTypeIconProps {
  repairType: string
  className?: string
  size?: number
}

export function RepairTypeIcon({ repairType, className = '', size = 20 }: RepairTypeIconProps) {
  const iconClass = `${className}`

  const getIcon = () => {
    const type = repairType.toLowerCase()

    // Front Screen / Screen / Display (all same)
    if (type.includes('front') || type.includes('screen') || type.includes('display') || type === 'lcd' || type === 'oled') {
      return (
        <div className={`${iconClass} text-red-600 bg-red-50 p-2 rounded-lg`} title="Screen Repair">
          <Smartphone size={size} className="relative">
            {/* Crack effect overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg width={size} height={size} viewBox="0 0 24 24" className="absolute">
                <path d="M3 8 L8 3 M12 2 L15 8 M18 3 L21 9" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.5"/>
              </svg>
            </div>
          </Smartphone>
        </div>
      )
    }

    // Battery / Power (all same)
    if (type.includes('battery') || type.includes('power') || type.includes('batt')) {
      return (
        <div className={`${iconClass} text-green-600 bg-green-50 p-2 rounded-lg`} title="Battery Replacement">
          <Battery size={size} />
        </div>
      )
    }

    // Camera / Lens (all same)
    if (type.includes('camera') || type.includes('lens') || type.includes('cam')) {
      return (
        <div className={`${iconClass} text-blue-600 bg-blue-50 p-2 rounded-lg`} title="Camera Repair">
          <Camera size={size} />
        </div>
      )
    }

    // Back / Back Glass / Back Panel (all same)
    if (type.includes('back') && (type.includes('panel') || type.includes('glass'))) {
      return (
        <div className={`${iconClass} text-purple-600 bg-purple-50 p-2 rounded-lg`} title="Back Panel Repair">
          <Layers size={size} />
        </div>
      )
    }

    // Charging Port / Lightning / USB-C (all same)
    if (type.includes('charging') || type.includes('port') || type.includes('lightning') || type.includes('usb')) {
      return (
        <div className={`${iconClass} text-yellow-600 bg-yellow-50 p-2 rounded-lg`} title="Charging Port">
          <Zap size={size} />
        </div>
      )
    }

    // Default for "Others" or unknown types
    return (
      <div className={`${iconClass} text-gray-600 bg-gray-50 p-2 rounded-lg`} title="Other Repair">
        <Wrench size={size} />
      </div>
    )
  }

  return getIcon()
}
