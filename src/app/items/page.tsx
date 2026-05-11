'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Item } from '@/types'

const categoryLabel: Record<string, string> = {
  facility: '施設備品',
  sellable: '販売品',
  aroma: 'アロマ',
  diaper: 'おむつ',
}

const categoryColor: Record<string, string> = {
  facility: '#2d5a8e',
  sellable: '#3d6b47',
  aroma: '#7a4a8e',
  diaper: '#8e5a2d',
}

type SortKey = 'no' | 'name' | 'stock'

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [sortKey, setSortKey] = useState<SortKey>('no')
  const supabase = createClient()

  useEffect(() => {
    supabase.from('items').select('*').order('no').then(({ data }) => {
      if (data) setItems(data)
      setLoading(false)
    })
  }, [])

  const filtered = items
    .filter(item => {
      const matchCat = category === 'all' || item.category === category
      const matchSearch = item.name.toLowerCase().includes(search.toLowerCase())
      return matchCat && matchSearch
    })
    .sort((a, b) => {
      if (sortKey === 'name') return a.name.localeCompare(b.name, 'ja')
      if (sortKey === 'stock') return a.current_stock - b.current_stock
      return a.no - b.no
    })

  if (loading) return <div className="py-20 text-center text-sm" style={{ color: '#6b6b6b' }}>読み込み中...</div>

  const cardStyle = {
    background: '#fff',
    border: '1px solid #e8e6e3',
    borderRadius: '14px',
    padding: '14px 16px',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold" style={{ color: '#1e3a5f' }}>品目管理</h2>
        <Link href="/items/new"
          className="px-4 py-2 rounded-xl text-sm font-medium"
          style={{ background: '#1e3a5f', color: '#fff' }}>
          ＋ 追加
        </Link>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="品目名で検索..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full mb-3 px-4 py-2.5 rounded-xl text-sm"
        style={{ background: '#fff', border: '1px solid #e8e6e3', color: '#2a2a2a', outline: 'none' }}
      />

      {/* Category filter */}
      <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
        {[
          { value: 'all', label: 'すべて' },
          { value: 'facility', label: '施設備品' },
          { value: 'sellable', label: '販売品' },
          { value: 'aroma', label: 'アロマ' },
          { value: 'diaper', label: 'おむつ' },
        ].map(opt => (
          <button key={opt.value} onClick={() => setCategory(opt.value)}
            className="px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors"
            style={{
              background: category === opt.value ? '#1e3a5f' : '#fff',
              color: category === opt.value ? '#fff' : '#6b6b6b',
              border: '1px solid ' + (category === opt.value ? '#1e3a5f' : '#e8e6e3'),
            }}>
            {opt.label}
          </button>
        ))}
      </div>

      {/* Sort */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {([
          { key: 'no', label: 'No順' },
          { key: 'name', label: '名前順' },
          { key: 'stock', label: '在庫数順' },
        ] as { key: SortKey; label: string }[]).map(opt => (
          <button key={opt.key} onClick={() => setSortKey(opt.key)}
            className="px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors"
            style={{
              background: sortKey === opt.key ? '#4a7c59' : '#fff',
              color: sortKey === opt.key ? '#fff' : '#6b6b6b',
              border: '1px solid ' + (sortKey === opt.key ? '#4a7c59' : '#e8e6e3'),
            }}>
            {opt.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map(item => (
          <div key={item.id} style={cardStyle}>
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: categoryColor[item.category] + '18', color: categoryColor[item.category] }}>
                    {categoryLabel[item.category]}
                  </span>
                  <span className="text-xs" style={{ color: '#aaa' }}>No.{item.no}</span>
                </div>
                <div className="text-sm font-medium truncate" style={{ color: '#2a2a2a' }}>{item.name}</div>
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1.5 text-xs" style={{ color: '#6b6b6b' }}>
                  <span>在庫 <b style={{ color: '#1e3a5f' }}>{item.current_stock}</b>
                    {item.purchase_unit ? ` ${item.purchase_unit}` : ''}
                  </span>
                  {item.purchase_price != null && (
                    <span>仕入 <b>¥{item.purchase_price.toLocaleString()}</b></span>
                  )}
                  {item.sell_price != null && (
                    <span>販売 <b style={{ color: '#3d6b47' }}>¥{item.sell_price.toLocaleString()}</b></span>
                  )}
                  {item.vendor && <span>{item.vendor}</span>}
                </div>
              </div>
              <Link href={`/items/${item.id}/edit`}
                className="px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: '#f0eeec', color: '#2a2a2a', whiteSpace: 'nowrap' }}>
                編集
              </Link>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-center py-10 text-sm" style={{ color: '#6b6b6b' }}>
            該当する品目がありません
          </p>
        )}
      </div>
    </div>
  )
}
