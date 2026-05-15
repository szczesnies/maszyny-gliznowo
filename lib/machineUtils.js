export function formatPrice(value) {
  if (!value) return '-'
  return `${value} zĹ‚`
}

export function priceNumber(value) {
  const number = Number(String(value || '').replace(',', '.').replace(/[^0-9.-]/g, ''))
  return Number.isFinite(number) ? number : 0
}

export function priceLabel(value) {
  return value ? `${String(value)} zĹ‚` : '-'
}

export function normalizeText(value) {
  return String(value || '').toLowerCase().trim()
}

export function quickEditHistoryDetails(machine, updates) {
  const changes = [
    ['Nazwa', machine.name, updates.name],
    ['Indeks', machine.index_number, updates.index_number],
    ['Cena zakupu', machine.purchase_price, updates.purchase_price],
    ['VAT', machine.vat_price, updates.vat_price],
    ['Cena', machine.gross_price, updates.gross_price],
  ]
    .filter(([, before, after]) => String(before || '') !== String(after || ''))
    .map(([label, before, after]) => {
    const isPrice = ['Cena zakupu', 'VAT', 'Cena'].includes(label)
    const oldValue = isPrice ? priceLabel(before) : before || '-'
    const newValue = isPrice ? priceLabel(after) : after || '-'
      return `${label} zmieniono z ${oldValue} na ${newValue}.`
    })

  if (String(machine.note || '') !== String(updates.note || '')) changes.push('Notatka zostaĹ‚a zaktualizowana.')
  return changes.length > 0 ? changes.join('\n') : 'Zapisano bez zmian w cenach i notatce.'
}


