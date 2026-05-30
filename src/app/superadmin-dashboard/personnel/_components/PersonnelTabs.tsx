'use client'

interface PersonnelTabsProps {
  activeTab: 'staff' | 'dentists'
  onTabChange: (tab: 'staff' | 'dentists') => void
}

export default function PersonnelTabs({ activeTab, onTabChange }: PersonnelTabsProps) {
  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        <button
          onClick={() => onTabChange('staff')}
          className={`
            whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
            ${activeTab === 'staff'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }
          `}
        >
          Clinic Staff
        </button>
        <button
          onClick={() => onTabChange('dentists')}
          className={`
            whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
            ${activeTab === 'dentists'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }
          `}
        >
          Dentists
        </button>
      </nav>
    </div>
  )
}