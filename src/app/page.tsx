'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Item } from '@/types'
import QuickAction from '@/components/QuickAction'
import Link from 'next/link'

const CATEGORY_LABELS: Record<string, string> = {
  facility: '施設備品',
  sellable: '販売品',
  aroma: 'アロマ',
  diaper: 'おむつ',
}

type SortKey = 'no' | 'name' | 'stock'

export default function HomePage() {
  const [items, setItems] = useState<Item[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string>('all')
  const [sortKey, setSortKey] = useState<SortKey>('no')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    supabase.from('items').select('*').order('no').then(({ data }) => {
      if (data) setItems(data)
      setLoading(false)
    })
  }, [])

  const filtered = items
    .filter(item => {
      const matchSearch = item.name.toLowerCase().includes(search.toLowerCase())
      const matchCat = category === 'all' || item.category === category
      return matchSearch && matchCat
    })
    .sort((a, b) => {
      if (sortKey === 'name') return a.name.localeCompare(b.name, 'ja')
      if (sortKey === 'stock') return a.current_stock - b.current_stock
      return a.no - b.no
    })

  const lowStock = items.filter(i => i.min_stock != null && i.current_stock <= i.min_stock)

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-sm" style={{ color: '#6b6b6b' }}>読み込み中...</div>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* 在庫不足アラート */}
      {lowStock.length > 0 && (
        <div className="rounded-xl p-4" style={{ background: '#fdf1ec', border: '1px solid #e8b89a' }}>
          <div className="text-sm font-semibold mb-2" style={{ color: '#b5644a' }}>
            在庫の補充をご確認ください（{lowStock.length}品目）
          </div>
          <div className="space-y-1">
            {lowStock.map(i => (
              <div key={i.id} className="flex justify-between text-sm" style={{ color: '#8a4a32' }}>
                <span>{i.name}</span>
                <span className="font-medium">残 {i.current_stock}個</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 検索・フィルター */}
      <div className="space-y-2">
        <input
          type="text"
          placeholder="品目を検索..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-4 py-3 rounded-xl text-sm outline-none"
          style={{ background: '#fff', border: '1px solid #e8e6e3', color: '#2a2a2a' }}
        />
        <div className="flex gap-2 overflow-x-auto pb-1">
          {['all', 'facility', 'sellable', 'aroma', 'diaper'].map(cat => (
            <button key={cat}
              onClick={() => setCategory(cat)}
              className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-colors"
              style={{
                background: category === cat ? '#1e3a5f' : '#fff',
                color: category === cat ? '#fff' : '#6b6b6b',
                border: '1px solid ' + (category === cat ? '#1e3a5f' : '#e8e6e3'),
              }}>
              {cat === 'all' ? 'すべて' : CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {([
            { key: 'no', label: 'No順' },
            { key: 'name', label: '名前順' },
            { key: 'stock', label: '在庫数順' },
          ] as { key: SortKey; label: string }[]).map(opt => (
            <button key={opt.key}
              onClick={() => setSortKey(opt.key)}
              className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors"
              style={{
                background: sortKey === opt.key ? '#4a7c59' : '#fff',
                color: sortKey === opt.key ? '#fff' : '#6b6b6b',
                border: '1px solid ' + (sortKey === opt.key ? '#4a7c59' : '#e8e6e3'),
              }}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 品目リスト */}
      <div className="space-y-2">
        {filtered.map(item => {
          const isLow = item.min_stock != null && item.current_stock <= item.min_stock
          return (
            <div key={item.id} className="rounded-xl p-4"
              style={{ background: '#fff', border: '1px solid ' + (isLow ? '#e8b89a' : '#e8e6e3') }}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 pr-3">
                  <div className="font-medium text-sm leading-snug" style={{ color: '#2a2a2a' }}>{item.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: '#6b6b6b' }}>
                    {item.storage_location && <span>{item.storage_location}</span>}
                    {item.vendor && <span className="ml-2">{item.vendor}</span>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="flex items-baseline gap-1 justify-end">
                    <div className="text-2xl font-bold leading-tight"
                      style={{ color: isLow ? '#b5644a' : '#1e3a5f' }}>
                      {item.current_stock}
                    </div>
                    <div className="text-xs" style={{ color: '#6b6b6b' }}>個</div>
                  </div>
                  {item.items_per_box && (
                    <div className="text-xs" style={{ color: '#9b9b9b' }}>
                      ≈{Math.floor(item.current_stock / item.items_per_box)}箱
                    </div>
                  )}
                </div>
              </div>
              <QuickAction item={item} onDone={updated =>
                setItems(prev => prev.map(i => i.id === updated.id ? updated : i))
              } />
            </div>
          )
        })}
      </div>

      {/* 品目追加ボタン */}
      <Link href="/items/new"
        className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-medium"
        style={{ border: '1.5px dashed #bbb', color: '#6b6b6b' }}>
        ＋ 品目を追加する
      </Link>
    </div>
  )
}
