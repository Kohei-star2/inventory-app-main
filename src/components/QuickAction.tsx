'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Item } from '@/types'

const RESIDENTS = [
  '土谷 妃', '松岡 文子', '田中 数人', '田島 寛治',
  '安田 幸子', '齋藤 勢津子', '安永 和子', '犬束 紀行', '業務利用',
]

const STAFF = [
  '山下亮', '山下敦子', '角田', '内田', '武内', '樋口', '舩津', '中尾', '野田', '三原',
]

interface Props {
  item: Item
  onDone: (updatedItem: Item) => void
}

export default function QuickAction({ item, onDone }: Props) {
  const [mode, setMode] = useState<'in' | 'out' | null>(null)
  const [boxes, setBoxes] = useState(1)
  const [quantity, setQuantity] = useState(1)
  const [residentName, setResidentName] = useState('')
  const [staffName, setStaffName] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const perBox = item.items_per_box ?? 1
  const inQty = boxes * perBox

  function reset() {
    setMode(null)
    setBoxes(1)
    setQuantity(1)
    setResidentName('')
    setStaffName('')
  }

  async function handleSubmit() {
    if (!mode) return
    setLoading(true)
    const qty = mode === 'in' ? inQty : quantity
    const newStock = mode === 'in'
      ? item.current_stock + qty
      : Math.max(0, item.current_stock - qty)

    await supabase.from('stock_transactions').insert({
      item_id: item.id,
      type: mode,
      quantity: qty,
      resident_name: mode === 'out' && residentName ? residentName : null,
      staff_name: staffName || null,
      transaction_date: new Date().toISOString(),
    })
    await supabase.from('items').update({ current_stock: newStock }).eq('id', item.id)

    onDone({ ...item, current_stock: newStock })
    reset()
    setLoading(false)
  }

  return (
    <div>
      {!mode && (
        <div className="flex gap-2">
          <button onClick={() => setMode('out')}
            className="flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ background: '#eef4ee', color: '#3d6b47' }}>
            使用 −
          </button>
          <button onClick={() => setMode('in')}
            className="flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ background: '#eef0f7', color: '#2d5a8e' }}>
            入庫 ＋
          </button>
        </div>
      )}

      {mode === 'out' && (
        <div className="rounded-xl p-3 mt-1 space-y-3" style={{ background: '#eef4ee' }}>
          <div className="flex items-center">
            <span className="text-sm font-medium" style={{ color: '#3d6b47' }}>使用数量（個）</span>
            <button onClick={reset} className="ml-auto text-xs px-2 py-0.5 rounded"
              style={{ color: '#6b6b6b', background: '#e8e6e3' }}>取消</button>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
              className="w-10 h-10 rounded-full text-xl font-bold flex items-center justify-center"
              style={{ background: '#fff', color: '#2a2a2a' }}>−</button>
            <input type="number" min={1} value={quantity}
              onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-16 text-center text-xl font-bold rounded-lg py-1.5 border-0 outline-none"
              style={{ background: '#fff' }} />
            <button onClick={() => setQuantity(q => q + 1)}
              className="w-10 h-10 rounded-full text-xl font-bold flex items-center justify-center"
              style={{ background: '#fff', color: '#2a2a2a' }}>＋</button>
            <span className="text-sm" style={{ color: '#3d6b47' }}>個</span>
          </div>
          <select
            value={residentName}
            onChange={e => setResidentName(e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-sm border-0 outline-none"
            style={{ background: '#fff', color: residentName ? '#2a2a2a' : '#9b9b9b' }}>
            <option value="">利用者を選択</option>
            {RESIDENTS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select
            value={staffName}
            onChange={e => setStaffName(e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-sm border-0 outline-none"
            style={{ background: '#fff', color: staffName ? '#2a2a2a' : '#9b9b9b' }}>
            <option value="">職員を選択</option>
            {STAFF.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={handleSubmit} disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-bold transition-opacity disabled:opacity-50"
            style={{ background: '#3d6b47', color: '#fff' }}>
            {loading ? '...' : '登録'}
          </button>
        </div>
      )}

      {mode === 'in' && (
        <div className="rounded-xl p-3 mt-1 space-y-2" style={{ background: '#eef0f7' }}>
          <div className="flex items-center mb-1">
            <span className="text-sm font-medium" style={{ color: '#2d5a8e' }}>入庫数量</span>
            <button onClick={reset} className="ml-auto text-xs px-2 py-0.5 rounded"
              style={{ color: '#6b6b6b', background: '#e8e6e3' }}>取消</button>
          </div>

          {/* 1箱ボタン（items_per_box設定済みの場合） */}
          {item.items_per_box ? (
            <>
              <button
                onClick={async () => {
                  setLoading(true)
                  const qty = item.items_per_box!
                  const newStock = item.current_stock + qty
                  await supabase.from('stock_transactions').insert({
                    item_id: item.id, type: 'in', quantity: qty,
                    transaction_date: new Date().toISOString(),
                  })
                  await supabase.from('items').update({ current_stock: newStock }).eq('id', item.id)
                  onDone({ ...item, current_stock: newStock })
                  reset()
                  setLoading(false)
                }}
                disabled={loading}
                className="w-full py-3 rounded-lg text-sm font-bold transition-opacity disabled:opacity-50"
                style={{ background: '#2d5a8e', color: '#fff' }}>
                {loading ? '...' : `1箱まるごと入庫（${item.items_per_box}個）`}
              </button>
              <div className="text-xs text-center" style={{ color: '#9b9b9b' }}>複数箱の場合 ↓</div>
              <div className="flex items-center gap-2">
                <input type="number" min={1} value={boxes}
                  onChange={e => setBoxes(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 text-center text-lg font-bold rounded-lg py-1.5 border-0 outline-none"
                  style={{ background: '#fff' }} />
                <span className="text-sm" style={{ color: '#2d5a8e' }}>箱 = {inQty}個</span>
                <button onClick={handleSubmit} disabled={loading}
                  className="flex-1 py-2 rounded-lg text-sm font-bold transition-opacity disabled:opacity-50"
                  style={{ background: '#2d5a8e', color: '#fff' }}>
                  {loading ? '...' : '登録'}
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <button onClick={() => setBoxes(b => Math.max(1, b - 1))}
                className="w-10 h-10 rounded-full text-xl font-bold flex items-center justify-center"
                style={{ background: '#fff', color: '#2a2a2a' }}>−</button>
              <input type="number" min={1} value={boxes}
                onChange={e => setBoxes(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 text-center text-xl font-bold rounded-lg py-1.5 border-0 outline-none"
                style={{ background: '#fff' }} />
              <button onClick={() => setBoxes(b => b + 1)}
                className="w-10 h-10 rounded-full text-xl font-bold flex items-center justify-center"
                style={{ background: '#fff', color: '#2a2a2a' }}>＋</button>
              <span className="text-sm" style={{ color: '#2d5a8e' }}>個</span>
              <button onClick={handleSubmit} disabled={loading}
                className="flex-1 py-2 rounded-lg text-sm font-bold transition-opacity disabled:opacity-50"
                style={{ background: '#2d5a8e', color: '#fff' }}>
                {loading ? '...' : '登録'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
