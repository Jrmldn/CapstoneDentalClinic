export type InventoryStatus = 'normal' | 'low_stock' | 'out_of_stock' | 'expiring_soon' | 'expired'

export interface InventoryCategory {
  id: number
  name: string
}

export interface InventoryItem {
  id: number
  name: string
  unit: string
  quantity: number
  alert_threshold: number
  category_id: number | null
  expiry_date: string | null
  updated_at: string
  inventory_categories?: InventoryCategory | null
}
