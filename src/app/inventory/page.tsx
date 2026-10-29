'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Item } from '@/types'

export default function InventoryPage() {
  const [items, setItems] = useState<Item[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.from('items').select('*').order('no').then(({ data }) => {
      if (data) {
        setItems(data)
        const init: Record<string, number> = {}
        data.forEach(i => { init[i.id] = i.current_stock })
        setCounts(init)
      }
      setLoading(false)
    })
  }, [])

  async function handleSave() {
    setSaving(true)
    const now = new Date().toISOString()
    await supabase.from('inventory_records').insert(
      items.map(item => ({
        item_id: item.id,
        counted_stock: counts[item.id] ?? item.current_stock,
        system_stock: item.current_stock,
        diff: (counts[item.id] ?? item.current_stock) - item.current_stock,
        counted_at: now,
      }))
    )
    for (const item of items) {
      const counted = counts[item.id] ?? item.current_stock
      if (counted !== item.current_stock) {
        await supabase.from('items').update({ current_stock: counted }).eq('id', item.id)
      }
    }
    setSaving(false)
    setDone(true)
  }

  function handleExportCsv() {
    const today = new Date().toLocaleDateString('sv-SE')
    const rows: (string | number)[][] = [
      [`棚卸し表（${today}）`],
      ['No', '品名', '保管場所', '購入単位', 'システム在庫', '実数', '差異', '確認', '備考'],
      ...items.map(item => [
        item.no,
        item.name,
        item.storage_location ?? '',
        item.purchase_unit ?? '',
        item.current_stock,
        '', '', '', '',
      ]),
    ]
    const csv = '\uFEFF' + rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `棚卸し表_${today}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <div className="py-20 text-center text-sm" style={{ color: '#6b6b6b' }}>読み込み中...</div>

  if (done) return (
    <div className="text-center py-20">
      <div className="text-5xl mb-4">✓</div>
      <p className="font-semibold" style={{ color: '#3d6b47' }}>棚卸しを記録しました</p>
      <a href="/" className="mt-4 inline-block text-sm underline" style={{ color: '#2d5a8e' }}>一覧へ戻る</a>
    </div>
  )

  const diffItems = items.filter(i => (counts[i.id] ?? i.current_stock) !== i.current_stock)

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-base font-semibold" style={{ color: '#1e3a5f' }}>棚卸し</h2>
        <button onClick={handleExportCsv}
          className="px-3 py-1.5 rounded-lg text-xs font-bold"
          style={{ background: '#f0eeec', color: '#1e3a5f' }}>
          ⬇ 印刷用CSV
        </button>
      </div>
      <p className="text-xs mb-4" style={{ color: '#6b6b6b' }}>実際の在庫数を確認し、数値を修正してください。</p>

      <div className="space-y-2 mb-5">
        {items.map(item => {
          const counted = counts[item.id] ?? item.current_stock
          const diff = counted - item.current_stock
          return (
            <div key={item.id} className="rounded-xl p-4"
              style={{ background: '#fff', border: '1px solid ' + (diff !== 0 ? '#e8b89a' : '#e8e6e3') }}>
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: '#2a2a2a' }}>{item.name}</div>
                  <div className="text-xs" style={{ color: '#6b6b6b' }}>システム: {item.current_stock}個</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setCounts(c => ({ ...c, [item.id]: Math.max(0, (c[item.id] ?? item.current_stock) - 1) }))}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold"
                    style={{ background: '#f0eeec', color: '#2a2a2a' }}>−</button>
                  <input type="number" min={0} value={counted}
                    onChange={e => setCounts(c => ({ ...c, [item.id]: Math.max(0, parseInt(e.target.value) || 0) }))}
                    className="w-14 text-center text-lg font-bold rounded-lg py-1 border-0 outline-none"
                    style={{ background: '#f9f8f6', color: '#1e3a5f' }}
                  />
                  <button onClick={() => setCounts(c => ({ ...c, [item.id]: (c[item.id] ?? item.current_stock) + 1 }))}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold"
                    style={{ background: '#f0eeec', color: '#2a2a2a' }}>＋</button>
                  {diff !== 0 && (
                    <span className="text-sm font-bold w-10 text-right" style={{ color: diff > 0 ? '#2d5a8e' : '#b5644a' }}>
                      {diff > 0 ? '+' : ''}{diff}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {diffItems.length > 0 && (
        <div className="rounded-xl p-3 mb-4 text-sm" style={{ background: '#fdf1ec', color: '#8a4a32' }}>
          {diffItems.length}品目に差異があります。保存すると在庫数が実数に更新されます。
        </div>
      )}

      <button onClick={handleSave} disabled={saving}
        className="w-full py-4 rounded-xl text-sm font-bold transition-opacity disabled:opacity-40"
        style={{ background: '#1e3a5f', color: '#fff' }}>
        {saving ? '保存中...' : '棚卸しを保存する'}
      </button>
    </div>
  )
}
