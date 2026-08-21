'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { fetchPeople, refreshPeople, renamePerson, HistoryUpdateError } from '@/lib/people'
import { Person, PersonKind } from '@/types'

const TABS: { kind: PersonKind; label: string; unit: string }[] = [
  { kind: 'residents', label: '利用者', unit: '利用者' },
  { kind: 'staff', label: 'スタッフ', unit: 'スタッフ' },
]

export default function PeoplePage() {
  const [kind, setKind] = useState<PersonKind>('residents')
  const [people, setPeople] = useState<{ staff: Person[]; residents: Person[] }>({ staff: [], residents: [] })
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const tab = TABS.find(t => t.kind === kind)!
  const list = people[kind]

  useEffect(() => {
    fetchPeople().then(result => {
      setPeople(result)
      setLoading(false)
    })
  }, [])

  async function reload() {
    setPeople(await refreshPeople())
  }

  function startEdit(person: Person) {
    setError('')
    setEditingId(person.id)
    setEditingName(person.name)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditingName('')
    setError('')
  }

  async function handleAdd() {
    const name = newName.trim()
    if (!name || busy) return
    if (list.some(p => p.name === name)) {
      setError(`「${name}」はすでに登録されています`)
      return
    }
    setBusy(true)
    setError('')
    const maxOrder = list.reduce((max, p) => Math.max(max, p.sort_order), 0)
    const { error: insertError } = await supabase.from(kind).insert({ name, sort_order: maxOrder + 1 })
    if (insertError) {
      setError('追加できませんでした。時間をおいて再度お試しください。')
    } else {
      setNewName('')
      await reload()
    }
    setBusy(false)
  }

  async function handleSave(person: Person) {
    const name = editingName.trim()
    if (!name || busy) return
    if (name === person.name) {
      cancelEdit()
      return
    }
    if (list.some(p => p.id !== person.id && p.name === name)) {
      setError(`「${name}」はすでに登録されています`)
      return
    }
    setBusy(true)
    setError('')
    try {
      await renamePerson(kind, person.id, person.name, name)
      cancelEdit()
      await reload()
    } catch (e) {
      if (e instanceof HistoryUpdateError) {
        cancelEdit()
        await reload()
        setError('名前は変更しましたが、過去の履歴の名前を更新できませんでした。レポートの集計にご注意ください。')
      } else {
        setError('保存できませんでした。時間をおいて再度お試しください。')
      }
    }
    setBusy(false)
  }

  async function handleDelete(person: Person) {
    if (busy) return
    if (!confirm(`「${person.name}」を${tab.unit}一覧から削除しますか？\n※過去の入出庫履歴やレポートはそのまま残ります。`)) return
    setBusy(true)
    setError('')
    const { error: deleteError } = await supabase.from(kind).delete().eq('id', person.id)
    if (deleteError) {
      setError('削除できませんでした。時間をおいて再度お試しください。')
    } else {
      await reload()
    }
    setBusy(false)
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

  return (
    <div>
      <h2 className="text-base font-semibold mb-4" style={{ color: '#1e3a5f' }}>名簿管理</h2>

      {/* 利用者 / スタッフ 切り替え */}
      <div className="flex gap-2 mb-4">
        {TABS.map(t => (
          <button key={t.kind} onClick={() => { setKind(t.kind); cancelEdit(); setNewName('') }}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors"
            style={{
              background: kind === t.kind ? '#1e3a5f' : '#fff',
              color: kind === t.kind ? '#fff' : '#6b6b6b',
              border: '1px solid ' + (kind === t.kind ? '#1e3a5f' : '#e8e6e3'),
            }}>
            {t.label}（{people[t.kind].length}）
          </button>
        ))}
      </div>

      {/* 追加 */}
      <div className="rounded-2xl p-4 mb-3" style={{ background: '#fff', border: '1px solid #e8e6e3' }}>
        <label className="block text-xs font-medium mb-2" style={{ color: '#6b6b6b' }}>
          {tab.unit}を追加
        </label>
        <div className="flex gap-2">
          <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
            placeholder="例：山田 太郎" style={inputStyle} />
          <button onClick={handleAdd} disabled={busy || !newName.trim()}
            className="px-5 rounded-xl text-sm font-medium whitespace-nowrap transition-opacity disabled:opacity-40"
            style={{ background: '#1e3a5f', color: '#fff' }}>
            追加
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl px-4 py-3 mb-3 text-sm"
          style={{ background: '#fdf1ec', border: '1px solid #e8b89a', color: '#b5644a' }}>
          {error}
        </div>
      )}

      {/* 一覧 */}
      <div className="space-y-2">
        {list.map(person => (
          <div key={person.id}
            style={{ background: '#fff', border: '1px solid #e8e6e3', borderRadius: '14px', padding: '12px 14px' }}>
            {editingId === person.id ? (
              <div className="space-y-2">
                <input type="text" value={editingName} onChange={e => setEditingName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSave(person) }}
                  autoFocus style={inputStyle} />
                <div className="flex gap-2">
                  <button onClick={() => handleSave(person)} disabled={busy || !editingName.trim()}
                    className="flex-1 py-2 rounded-lg text-xs font-bold transition-opacity disabled:opacity-40"
                    style={{ background: '#1e3a5f', color: '#fff' }}>
                    {busy ? '保存中...' : '保存'}
                  </button>
                  <button onClick={cancelEdit} disabled={busy}
                    className="px-4 py-2 rounded-lg text-xs font-medium"
                    style={{ background: '#f0eeec', color: '#6b6b6b' }}>
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="flex-1 text-sm font-medium truncate" style={{ color: '#2a2a2a' }}>
                  {person.name}
                </span>
                <button onClick={() => startEdit(person)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{ background: '#f0eeec', color: '#2a2a2a' }}>
                  編集
                </button>
                <button onClick={() => handleDelete(person)} disabled={busy}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity disabled:opacity-40"
                  style={{ background: '#fdf1ec', color: '#b5644a' }}>
                  削除
                </button>
              </div>
            )}
          </div>
        ))}
        {list.length === 0 && (
          <p className="text-center py-10 text-sm" style={{ color: '#6b6b6b' }}>
            {tab.unit}が登録されていません
          </p>
        )}
      </div>

      <p className="mt-5 text-xs leading-relaxed" style={{ color: '#9b9b9b' }}>
        名前を変更すると、過去の入出庫履歴・月次レポートに記録された名前も新しい名前に更新されます。
      </p>
    </div>
  )
}
