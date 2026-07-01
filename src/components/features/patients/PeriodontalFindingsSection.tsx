'use client'

export interface PeriodontalFindingsInput {
  gingivitis: string[]
  periodontal_condition: string[]
  occlusion: string[]
  appliances: string[]
}

export type PeriodontalFindingsCategory = keyof PeriodontalFindingsInput

export const CATEGORY_TITLES: Record<PeriodontalFindingsCategory, string> = {
  gingivitis: 'Gingivitis',
  periodontal_condition: 'Periodontal Condition',
  occlusion: 'Occlusion',
  appliances: 'Appliances',
}

export const PERIODONTAL_FINDING_LABELS: Record<string, string> = {
  mild: 'Mild',
  moderate: 'Moderate',
  severe: 'Severe',
  localized: 'Localized',
  generalized: 'Generalized',
  chronic: 'Chronic',
  acute: 'Acute',
  class_1: 'Class 1',
  class_2: 'Class 2',
  class_3: 'Class 3',
  midline_deviation: 'Midline Deviation',
  midline_deviation_facial: 'Facial',
  midline_deviation_dental: 'Dental',
  crowding: 'Crowding',
  tmd: 'TMD',
  orthodontic: 'Orthodontic',
  stayplate: 'Stayplate',
  rpd: 'RPD',
  rpd_upper: 'Upper',
  rpd_lower: 'Lower',
  complete: 'Complete',
  complete_upper: 'Upper',
  complete_lower: 'Lower',
}

interface CheckboxOption {
  key: string
  children?: CheckboxOption[]
}

const CATEGORY_OPTIONS: Record<PeriodontalFindingsCategory, CheckboxOption[]> = {
  gingivitis: [
    { key: 'mild' },
    { key: 'moderate' },
    { key: 'severe' },
  ],
  periodontal_condition: [
    { key: 'localized' },
    { key: 'generalized' },
    { key: 'chronic' },
    { key: 'acute' },
  ],
  occlusion: [
    { key: 'class_1' },
    { key: 'class_2' },
    { key: 'class_3' },
    { key: 'midline_deviation', children: [{ key: 'midline_deviation_facial' }, { key: 'midline_deviation_dental' }] },
    { key: 'crowding' },
    { key: 'tmd' },
  ],
  appliances: [
    { key: 'orthodontic' },
    { key: 'stayplate' },
    { key: 'rpd', children: [{ key: 'rpd_upper' }, { key: 'rpd_lower' }] },
    { key: 'complete', children: [{ key: 'complete_upper' }, { key: 'complete_lower' }] },
  ],
}

interface PeriodontalFindingsSectionProps {
  value: PeriodontalFindingsInput
  onChange: (next: PeriodontalFindingsInput) => void
}

export default function PeriodontalFindingsSection({ value, onChange }: PeriodontalFindingsSectionProps) {
  const toggleKey = (category: PeriodontalFindingsCategory, key: string) => {
    const current = value[category]
    const next = current.includes(key) ? current.filter(k => k !== key) : [...current, key]
    onChange({ ...value, [category]: next })
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-2">
        {(Object.keys(CATEGORY_OPTIONS) as PeriodontalFindingsCategory[]).map(category => (
          <div key={category} className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">{CATEGORY_TITLES[category]}</span>
            {CATEGORY_OPTIONS[category].map(option => {
              const isChecked = value[category].includes(option.key)
              return (
                <div key={option.key} className="space-y-1">
                  <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleKey(category, option.key)}
                      className="w-3.5 h-3.5 border border-gray-300 rounded accent-blue-600"
                    />
                    {PERIODONTAL_FINDING_LABELS[option.key]}
                  </label>
                  {option.children && (
                    <div className="pl-5 space-y-1">
                      {option.children.map(child => (
                        <label
                          key={child.key}
                          className={`flex items-center gap-1.5 text-[11px] font-semibold ${isChecked ? 'text-slate-600 cursor-pointer' : 'text-slate-300 cursor-not-allowed'}`}
                        >
                          <input
                            type="checkbox"
                            checked={value[category].includes(child.key)}
                            disabled={!isChecked}
                            onChange={() => toggleKey(category, child.key)}
                            className="w-3.5 h-3.5 border border-gray-300 rounded accent-blue-600 disabled:opacity-50"
                          />
                          {PERIODONTAL_FINDING_LABELS[child.key]}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
