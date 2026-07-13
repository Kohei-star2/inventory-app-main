'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Item } from '@/types'

const RESIDENTS = [
  '土谷 妃', '松岡 文子', '田中 数人', '田島 寛治',
  '安田 幸子', '齋藤 勢津子', '安永 和子', '犬束 紀行',
]

type ExtractedRow = {
  rawName: string
  matchedItemId: string
  quantity: number
}

type Step = 'upload' | 'review' | 'done'

function currentYearMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function ImportPage() {
  const [step, setStep] = useState<Step>('upload')
  const [resident, setResident] = useState('')
  const [month, setMonth] = useState(currentYearMonth())
  const [rows, setRows] = useState<ExtractedRow[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [saving, setSaving] = useState(false)
  const [savedCount, setSavedCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    supabase.from('items').select('*').order('no').then(({ data }) => {
      if (data) setItems(data as Item[])
    })
  }, [])

  function updateRow(index: number, field: keyof ExtractedRow, value: string | number) {
    setRows(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r))
  }

  function removeRow(index: number) {
    setRows(prev => prev.filter((_, i) => i !== index))
  }

  function addRow() {
    setRows(prev => [...prev, { rawName: '', matchedItemId: '', quantity: 1 }])
  }

  function handleStart() {
    if (!resident) return
    setRows([{ rawName: '', matchedItemId: '', quantity: 1 }])
    setStep('review')
  }

  async function handleSave() {
    const validRows = rows.filter(r => r.matchedItemId && r.quantity > 0)
    if (validRows.length === 0) return
    setSaving(true)

    const [y, m] = month.split('-').map(Number)
    const lastDay = new Date(y, m, 0)
    const transactionDate = lastDay.toISOString()
    const note = `月次取込: ${y}年${m}月分`

    for (const row of validRows) {
      const item = items.find(it => it.id === row.matchedItemId)
      if (!item) continue
      const newStock = Math.max(0, item.current_stock - row.quantity)
      await supabase.from('stock_transactions').insert({
        item_id: item.id,
        type: 'out',
        quantity: row.quantity,
        resident_name: resident,
        note,
        transaction_date: transactionDate,
      })
      await supabase.from('items').update({ current_stock: newStock }).eq('id', item.id)
      setItems(prev => prev.map(it => it.id === item.id ? { ...it, current_stock: newStock } : it))
    }

    setSavedCount(validRows.length)
    setStep('done')
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold" style={{ color: '#1e3a5f' }}>月次使用量を取り込む</h1>

      {/* STEP 1: 利用者・月選択 */}
      {step === 'upload' && (
        <div className="space-y-4">
          <div className="rounded-2xl p-4 space-y-3" style={{ background: '#fff' }}>
            <p className="text-sm font-semibold" style={{ color: '#1e3a5f' }}>利用者</p>
            <select
              value={resident}
              onChange={e => setResident(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-base border-0 outline-none"
              style={{ background: '#f5f4f2', color: resident ? '#2a2a2a' : '#9b9b9b' }}>
              <option value="">利用者を選択してください</option>
              {RESIDENTS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div className="rounded-2xl p-4 space-y-3" style={{ background: '#fff' }}>
            <p className="text-sm font-semibold" style={{ color: '#1e3a5f' }}>対象月</p>
            <input
              type="month"
              value={month}
              onChange={e => setMonth(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-base border-0 outline-none"
              style={{ background: '#f5f4f2' }} />
          </div>

          <button
            onClick={handleStart}
            disabled={!resident}
            className="w-full py-4 rounded-2xl text-base font-bold transition-opacity disabled:opacity-40"
            style={{ background: '#1e3a5f', color: '#fff' }}>
            入力へ進む
          </button>
        </div>
      )}

      {/* STEP 2: 手動入力 */}
      {step === 'review' && (
        <div className="space-y-4">
          <div className="rounded-2xl p-4" style={{ background: '#fff' }}>
            <p className="text-sm font-semibold mb-1" style={{ color: '#1e3a5f' }}>
              {resident}　{month.replace('-', '年')}月分
            </p>
          </div>

          <div className="space-y-2">
            {rows.map((row, i) => (
              <div key={i} className="rounded-2xl p-4 space-y-2" style={{ background: '#fff' }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium" style={{ color: '#6b6b6b' }}>品目 {i + 1}</span>
                  <button onClick={() => removeRow(i)}
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: '#fdf0ed', color: '#b5644a' }}>削除</button>
                </div>
                <select
                  value={row.matchedItemId}
                  onChange={e => updateRow(i, 'matchedItemId', e.target.value)}
                  className="w-full rounded-xl px-3 py-2 text-sm border-0 outline-none"
                  style={{ background: '#f5f4f2', color: row.matchedItemId ? '#2a2a2a' : '#b5644a' }}>
                  <option value="">品目を選択</option>
                  {items.map(it => (
                    <option key={it.id} value={it.id}>{it.name}</option>
                  ))}
                </select>
                <div className="flex items-center gap-3">
                  <button onClick={() => updateRow(i, 'quantity', Math.max(1, row.quantity - 1))}
                    className="w-9 h-9 rounded-full text-lg font-bold flex items-center justify-center"
                    style={{ background: '#f5f4f2', color: '#2a2a2a' }}>−</button>
                  <input
                    type="number"
                    min={1}
                    value={row.quantity}
                    onChange={e => updateRow(i, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 text-center text-lg font-bold rounded-xl py-1.5 border-0 outline-none"
                    style={{ background: '#f5f4f2' }} />
                  <button onClick={() => updateRow(i, 'quantity', row.quantity + 1)}
                    className="w-9 h-9 rounded-full text-lg font-bold flex items-center justify-center"
                    style={{ background: '#f5f4f2', color: '#2a2a2a' }}>＋</button>
                  <span className="text-sm" style={{ color: '#6b6b6b' }}>個</span>
                </div>
              </div>
            ))}
          </div>

          <button onClick={addRow}
            className="w-full py-3 rounded-2xl text-sm font-medium"
            style={{ background: '#fff', color: '#1e3a5f', border: '1.5px dashed #1e3a5f' }}>
            ＋ 追加
          </button>

          <div className="flex gap-3">
            <button onClick={() => setStep('upload')}
              className="flex-1 py-3.5 rounded-2xl text-sm font-medium"
              style={{ background: '#f5f4f2', color: '#6b6b6b' }}>
              戻る
            </button>
            <button
              onClick={handleSave}
              disabled={saving || rows.filter(r => r.matchedItemId && r.quantity > 0).length === 0}
              className="flex-[2] py-3.5 rounded-2xl text-base font-bold transition-opacity disabled:opacity-40"
              style={{ background: '#3d6b47', color: '#fff' }}>
              {saving ? '登録中...' : `${rows.filter(r => r.matchedItemId).length}件を登録する`}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: 完了 */}
      {step === 'done' && (
        <div className="space-y-4">
          <div className="rounded-2xl p-8 flex flex-col items-center gap-3" style={{ background: '#fff' }}>
            <span className="text-5xl">✅</span>
            <p className="text-lg font-bold" style={{ color: '#3d6b47' }}>登録完了</p>
            <p className="text-sm text-center" style={{ color: '#6b6b6b' }}>
              {resident}・{month.replace('-', '年')}月分<br />
              {savedCount}件の使用量を登録しました
            </p>
          </div>
          <button
            onClick={() => { setStep('upload'); setRows([]) }}
            className="w-full py-3.5 rounded-2xl text-sm font-medium"
            style={{ background: '#eef0f7', color: '#2d5a8e' }}>
            続けて別の利用者を取り込む
          </button>
          <a href="/"
            className="block w-full py-3.5 rounded-2xl text-sm font-medium text-center"
            style={{ background: '#f5f4f2', color: '#6b6b6b' }}>
            ホームへ戻る
          </a>
        </div>
      )}
    </div>
  )
}
