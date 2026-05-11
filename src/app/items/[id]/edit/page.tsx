'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'

export default function EditItemPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    name: '',
    category: 'facility',
    purchase_unit: '',
    purchase_price: '',
    vendor: '',
    storage_location: '',
    current_stock: '0',
    min_stock: '',
    sell_unit: '',
    sell_price: '',
    items_per_box: '',
  })

  useEffect(() => {
    supabase.from('items').select('*').eq('id', id).single().then(({ data }) => {
      if (data) {
        setForm({
          name: data.name,
          category: data.category,
          purchase_unit: data.purchase_unit ?? '',
          purchase_price: data.purchase_price != null ? String(data.purchase_price) : '',
          vendor: data.vendor ?? '',
          storage_location: data.storage_location ?? '',
          current_stock: String(data.current_stock),
          min_stock: data.min_stock != null ? String(data.min_stock) : '',
          sell_unit: data.sell_unit ?? '',
          sell_price: data.sell_price != null ? String(data.sell_price) : '',
          items_per_box: data.items_per_box != null ? String(data.items_per_box) : '',
        })
      }
      setLoading(false)
    })
  }, [id])

  const set = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)

    await supabase.from('items').update({
      name: form.name.trim(),
      category: form.category,
      purchase_unit: form.purchase_unit || null,
      purchase_price: form.purchase_price ? parseInt(form.purchase_price) : null,
      vendor: form.vendor || null,
      storage_location: form.storage_location || null,
      current_stock: parseInt(form.current_stock) || 0,
      min_stock: form.min_stock ? parseInt(form.min_stock) : null,
      sell_unit: form.sell_unit || null,
      sell_price: form.sell_price ? parseInt(form.sell_price) : null,
      items_per_box: form.items_per_box ? parseInt(form.items_per_box) : null,
    }).eq('id', id)

    router.push('/items')
  }

  async function handleDelete() {
    if (!confirm('この品目を削除しますか？過去の取引履歴も影響を受ける場合があります。')) return
    setDeleting(true)
    await supabase.from('items').delete().eq('id', id)
    router.push('/items')
  }

  if (loading) return <div className="py-20 text-center text-sm" style={{ color: '#6b6b6b' }}>読み込み中...</div>

  const inputStyle = {
    background: '#fff',
    border: '1px solid #e8e6e3',
    borderRadius: '10px',
    padding: '10px 14px',
    fontSize: '15px',
    color: '#2a2a2a',
    outline: 'none',
    width: '100%',
  }

  const labelStyle = {
    display: 'block',
    fontSize: '12px',
    fontWeight: '500' as const,
    color: '#6b6b6b',
    marginBottom: '6px',
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => router.back()} style={{ color: '#6b6b6b', fontSize: '20px' }}>←</button>
        <h2 className="text-base font-semibold" style={{ color: '#1e3a5f' }}>品目を編集</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 品目名 */}
        <div>
          <label style={labelStyle}>品目名 <span style={{ color: '#b5644a' }}>*</span></label>
          <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
            required style={inputStyle} />
        </div>

        {/* 種別 */}
        <div>
          <label style={labelStyle}>種別</label>
          <div className="flex gap-2">
            {[
              { value: 'facility', label: '施設備品' },
              { value: 'sellable', label: '販売品' },
              { value: 'aroma', label: 'アロマ' },
              { value: 'diaper', label: 'おむつ' },
            ].map(opt => (
              <button type="button" key={opt.value}
                onClick={() => set('category', opt.value)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors"
                style={{
                  background: form.category === opt.value ? '#1e3a5f' : '#fff',
                  color: form.category === opt.value ? '#fff' : '#6b6b6b',
                  border: '1px solid ' + (form.category === opt.value ? '#1e3a5f' : '#e8e6e3'),
                }}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 現在庫・最低在庫 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label style={labelStyle}>現在の在庫数（個）</label>
            <input type="number" min="0" value={form.current_stock}
              onChange={e => set('current_stock', e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>最低在庫数（個・アラート用）</label>
            <input type="number" min="0" value={form.min_stock}
              onChange={e => set('min_stock', e.target.value)}
              placeholder="未設定" style={inputStyle} />
          </div>
        </div>

        {/* 入数（箱管理） */}
        <div>
          <label style={labelStyle}>入数（1箱あたりの個数）</label>
          <input type="number" min="1" value={form.items_per_box}
            onChange={e => set('items_per_box', e.target.value)}
            placeholder="例：手袋は20（20個入り1箱）" style={inputStyle} />
          <div className="text-xs mt-1" style={{ color: '#9b9b9b' }}>
            設定すると入庫時に「箱数 → 個数」に自動換算されます
          </div>
        </div>

        {/* 仕入情報 */}
        <div className="rounded-xl p-4 space-y-3" style={{ background: '#f9f8f6' }}>
          <div className="text-xs font-semibold" style={{ color: '#6b6b6b' }}>仕入情報（任意）</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>購入単位</label>
              <input type="text" value={form.purchase_unit}
                onChange={e => set('purchase_unit', e.target.value)}
                placeholder="例：1箱" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>仕入単価（円）</label>
              <input type="number" min="0" value={form.purchase_price}
                onChange={e => set('purchase_price', e.target.value)}
                placeholder="0" style={inputStyle} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>仕入先</label>
              <input type="text" value={form.vendor}
                onChange={e => set('vendor', e.target.value)}
                placeholder="例：古野" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>保管場所</label>
              <input type="text" value={form.storage_location}
                onChange={e => set('storage_location', e.target.value)}
                placeholder="例：会社1F倉庫" style={inputStyle} />
            </div>
          </div>
        </div>

        {/* 販売情報（販売品のみ） */}
        {form.category === 'sellable' && (
          <div className="rounded-xl p-4 space-y-3" style={{ background: '#f9f8f6' }}>
            <div className="text-xs font-semibold" style={{ color: '#6b6b6b' }}>販売情報</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={labelStyle}>販売単位</label>
                <input type="text" value={form.sell_unit}
                  onChange={e => set('sell_unit', e.target.value)}
                  placeholder="例：1枚" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>販売単価（円）</label>
                <input type="number" min="0" value={form.sell_price}
                  onChange={e => set('sell_price', e.target.value)}
                  placeholder="0" style={inputStyle} />
              </div>
            </div>
          </div>
        )}

        <button type="submit" disabled={saving || !form.name.trim()}
          className="w-full py-4 rounded-xl text-sm font-bold transition-opacity disabled:opacity-40"
          style={{ background: '#1e3a5f', color: '#fff' }}>
          {saving ? '保存中...' : '変更を保存する'}
        </button>
      </form>

      {/* Delete */}
      <div className="mt-6 pt-5" style={{ borderTop: '1px solid #e8e6e3' }}>
        <button onClick={handleDelete} disabled={deleting}
          className="w-full py-3 rounded-xl text-sm font-medium transition-opacity disabled:opacity-40"
          style={{ background: '#fdf1ec', color: '#b5644a' }}>
          {deleting ? '削除中...' : 'この品目を削除する'}
        </button>
      </div>
    </div>
  )
}
