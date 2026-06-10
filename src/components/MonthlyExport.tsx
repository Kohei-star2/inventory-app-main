'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10)
}

export default function MonthlyExport() {
  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const [startDate, setStartDate] = useState(toDateStr(firstOfMonth))
  const [endDate, setEndDate] = useState(toDateStr(now))
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleExport() {
    if (!startDate || !endDate || startDate > endDate) {
      alert('期間を正しく設定してください')
      return
    }
    setLoading(true)
    const start = new Date(startDate).toISOString()
    const end = new Date(new Date(endDate).getTime() + 86400000).toISOString()

    const [{ data: items }, { data: txData }] = await Promise.all([
      supabase
        .from('items')
        .select('id, no, name, sell_unit, sell_price')
        .not('sell_price', 'is', null)
        .order('no'),
      supabase
        .from('stock_transactions')
        .select('item_id, quantity, resident_name')
        .eq('type', 'out')
        .not('resident_name', 'is', null)
        .gte('transaction_date', start)
        .lt('transaction_date', end),
    ])

    if (!items || items.length === 0) {
      alert('販売品がありません')
      setLoading(false)
      return
    }

    // 利用者ごと・商品ごとの数量集計
    const salesMap: Record<string, Record<string, number>> = {}
    const residentSet = new Set<string>()
    for (const tx of txData ?? []) {
      if (!tx.resident_name) continue
      residentSet.add(tx.resident_name)
      if (!salesMap[tx.item_id]) salesMap[tx.item_id] = {}
      salesMap[tx.item_id][tx.resident_name] = (salesMap[tx.item_id][tx.resident_name] ?? 0) + tx.quantity
    }
    const residents = Array.from(residentSet)

    const month = new Date(startDate).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })
    const rows: (string | number)[][] = []

    // 1行目：タイトル
    rows.push([`衛生材料等の販売価格一覧（${month}）`])
    // 2行目：ヘッダー
    rows.push(['名称', '売却単位', '販売価格', ...residents])
    // 商品行
    for (const item of items) {
      rows.push([
        item.name,
        item.sell_unit ?? '',
        `¥${(item.sell_price ?? 0).toLocaleString()}`,
        ...residents.map(r => salesMap[item.id]?.[r] ?? ''),
      ])
    }
    // 合計行
    rows.push([
      '', '', '合計',
      ...residents.map(r =>
        items.reduce((sum, item) => sum + (salesMap[item.id]?.[r] ?? 0) * (item.sell_price ?? 0), 0)
      ),
    ])

    const csv = '\uFEFF' + rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `販売価格一覧_${startDate}_${endDate}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setLoading(false)
  }

  return (
    <div className="rounded-xl p-4 space-y-3" style={{ background: '#fff', border: '1px solid #e8e6e3' }}>
      <h3 className="text-sm font-semibold" style={{ color: '#1e3a5f' }}>レポート CSV出力</h3>
      <div className="flex gap-2 items-center flex-wrap">
        <input
          type="date"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
          className="rounded-lg px-3 py-2 text-sm border-0 outline-none"
          style={{ background: '#f9f8f6', color: '#2a2a2a' }}
        />
        <span className="text-sm" style={{ color: '#6b6b6b' }}>〜</span>
        <input
          type="date"
          value={endDate}
          onChange={e => setEndDate(e.target.value)}
          className="rounded-lg px-3 py-2 text-sm border-0 outline-none"
          style={{ background: '#f9f8f6', color: '#2a2a2a' }}
        />
        <button
          onClick={handleExport}
          disabled={loading}
          className="flex-1 py-2 rounded-lg text-sm font-bold transition-opacity disabled:opacity-50"
          style={{ background: '#1e3a5f', color: '#fff', minWidth: '140px' }}>
          {loading ? '準備中...' : '⬇ CSVダウンロード'}
        </button>
      </div>
      <p className="text-xs" style={{ color: '#9b9b9b' }}>
        品名・売却単位・販売価格・利用者別数量・合計を含みます
      </p>
    </div>
  )
}
