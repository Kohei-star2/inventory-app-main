'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Person, PersonKind } from '@/types'

export type People = { staff: Person[]; residents: Person[] }

// 一覧画面では QuickAction が品目ごとに描画されるため、
// モジュールレベルでキャッシュして取得リクエストを1回にまとめる。
let cache: People | null = null
let inflight: Promise<People> | null = null
const subscribers = new Set<(people: People) => void>()

async function load(): Promise<People> {
  const supabase = createClient()
  try {
    const [staffRes, residentsRes] = await Promise.all([
      supabase.from('staff').select('*').order('sort_order').order('created_at'),
      supabase.from('residents').select('*').order('sort_order').order('created_at'),
    ])
    return {
      staff: (staffRes.data ?? []) as Person[],
      residents: (residentsRes.data ?? []) as Person[],
    }
  } catch {
    // 通信エラー時も読み込み中のまま固まらないよう空リストで解決する
    return { staff: [], residents: [] }
  }
}

export function fetchPeople(): Promise<People> {
  if (cache) return Promise.resolve(cache)
  if (!inflight) {
    inflight = load()
      .then(people => {
        cache = people
        return people
      })
      .finally(() => {
        inflight = null
      })
  }
  return inflight
}

/** 名簿を編集したあとに呼び出して、各画面のプルダウンを最新化する。 */
export async function refreshPeople(): Promise<People> {
  cache = null
  inflight = null
  const people = await fetchPeople()
  subscribers.forEach(fn => fn(people))
  return people
}

export function usePeople() {
  const [people, setPeople] = useState<People>(cache ?? { staff: [], residents: [] })
  const [loading, setLoading] = useState(!cache)

  useEffect(() => {
    let alive = true
    fetchPeople().then(result => {
      if (!alive) return
      setPeople(result)
      setLoading(false)
    })

    const onChange = (result: People) => {
      if (alive) setPeople(result)
    }
    subscribers.add(onChange)
    return () => {
      alive = false
      subscribers.delete(onChange)
    }
  }, [])

  return { ...people, loading }
}

/** 名前は変更できたが、過去履歴の更新に失敗したことを表す。 */
export class HistoryUpdateError extends Error {
  constructor() {
    super('history update failed')
    this.name = 'HistoryUpdateError'
  }
}

/**
 * 名前を変更したとき、過去の入出庫履歴に記録された名前も合わせて更新する。
 * stock_transactions は名前を文字列で保持しているため、
 * これを行わないと月次レポートで旧名・新名が別人として集計されてしまう。
 */
export async function renamePerson(kind: PersonKind, id: string, oldName: string, newName: string) {
  const supabase = createClient()
  const { error } = await supabase.from(kind).update({ name: newName }).eq('id', id)
  if (error) throw error

  if (oldName && oldName !== newName) {
    const column = kind === 'staff' ? 'staff_name' : 'resident_name'
    const { error: historyError } = await supabase
      .from('stock_transactions')
      .update({ [column]: newName })
      .eq(column, oldName)
    if (historyError) throw new HistoryUpdateError()
  }
}
