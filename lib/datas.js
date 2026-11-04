const FUSO = 'America/Sao_Paulo'

// Data no formato AAAA-MM-DD no horário de Brasília (offset em dias)
export function dataBR(offsetDias = 0) {
  const d = new Date(Date.now() + offsetDias * 86400000)
  return new Intl.DateTimeFormat('en-CA', { timeZone: FUSO }).format(d)
}

// "domingo, 9 de novembro"
export function dataExtenso(iso) {
  const [a, m, d] = iso.split('-').map(Number)
  const data = new Date(Date.UTC(a, m - 1, d, 12))
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(data)
}

export function quandoRelativo(iso) {
  if (iso === dataBR(0)) return 'Hoje'
  if (iso === dataBR(1)) return 'Amanhã'
  return null
}
