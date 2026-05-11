export type ItemCategory = 'facility' | 'sellable' | 'aroma' | 'diaper'

export interface Item {
  id: string
  no: number
  name: string
  category: ItemCategory
  purchase_unit: string | null
  purchase_price: number | null
  vendor: string | null
  storage_location: string | null
  current_stock: number
  min_stock: number | null
  sell_unit: string | null
  sell_price: number | null
  h_code: string | null
  items_per_box: number | null
  created_at: string
}

export interface StockTransaction {
  id: string
  item_id: string
  type: 'in' | 'out' | 'inventory'
  quantity: number
  note: string | null
  staff_name: string | null
  resident_name: string | null
  transaction_date: string
  created_at: string
  items?: Item
}

export interface InventoryRecord {
  id: string
  item_id: string
  counted_stock: number
  system_stock: number
  diff: number
  note: string | null
  counted_at: string
  created_at: string
  items?: Item
}
