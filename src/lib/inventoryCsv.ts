import type { Item } from '@/types'

// 棚卸し表（印刷用）CSV。実数・金額・差異・確認・備考は手書き用の空欄
export function buildInventoryCsv(items: Item[], date: string) {
  const rows: (string | number)[][] = [
    [`棚卸し表（${date}）`],
    ['No', '品名', '保管場所', '購入単位', 'システム在庫', '単価（円）', '実数', '金額（円）', '差異', '確認', '備考'],
    ...items.map(item => [
      item.no,
      item.name,
      item.storage_location ?? '',
      item.purchase_unit ?? '',
      item.current_stock,
      item.purchase_price ?? '',
      '', '', '', '', '',
    ]),
  ]
  return '﻿' + rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n')
}
