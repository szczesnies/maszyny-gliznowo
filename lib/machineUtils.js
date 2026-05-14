export function formatPrice(value) {
  if (!value) return '-'
  return `${value} zł`
}

export function priceNumber(value) {
  const number = Number(String(value || '').replace(',', '.').replace(/[^0-9.-]/g, ''))
  return Number.isFinite(number) ? number : 0
}

export function priceLabel(value) {
  return value ? `${String(value)} zł` : '-'
}

export function normalizeText(value) {
  return String(value || '').toLowerCase().trim()
}

export function quickEditHistoryDetails(machine, updates) {
  const changes = [
    ['Nazwa', machine.name, updates.name],
    ['Indeks', machine.index_number, updates.index_number],
    ['Cena kupna', machine.purchase_price, updates.purchase_price],
    ['Cena netto', machine.vat_price, updates.vat_price],
    ['Cena brutto', machine.gross_price, updates.gross_price],
  ]
    .filter(([, before, after]) => String(before || '') !== String(after || ''))
    .map(([label, before, after]) => {
      const oldValue = label.startsWith('Cena') ? priceLabel(before) : before || '-'
      const newValue = label.startsWith('Cena') ? priceLabel(after) : after || '-'
      return `${label} zmieniono z ${oldValue} na ${newValue}.`
    })

  if (String(machine.note || '') !== String(updates.note || '')) changes.push('Notatka została zaktualizowana.')
  return changes.length > 0 ? changes.join('\n') : 'Zapisano bez zmian w cenach i notatce.'
}

