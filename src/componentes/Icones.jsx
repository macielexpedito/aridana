const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export function Lupa({ tamanho = 16 }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" {...base}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}

export function Usuario({ tamanho = 20 }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" {...base}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  )
}

export function Coracao({ tamanho = 20, cheio = false }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" {...base} fill={cheio ? 'currentColor' : 'none'}>
      <path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.800-8 11-8 11Z" />
    </svg>
  )
}

export function Sacola({ tamanho = 24 }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" {...base}>
      <path d="M5 8h14l-1 12H6L5 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  )
}

export function Caminhao({ tamanho = 40 }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" {...base}>
      <path d="M2 6h11v10H2z" />
      <path d="M13 9h4l3 3v4h-7" />
      <circle cx="6.500" cy="17.500" r="1.800" />
      <circle cx="16.500" cy="17.500" r="1.800" />
    </svg>
  )
}

export function Escudo({ tamanho = 40 }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" {...base}>
      <path d="M12 3 5 6v6c0 4.500 3 7.500 7 9 4-1.500 7-4.500 7-9V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

export function Fone({ tamanho = 40 }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" {...base}>
      <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
      <rect x="3" y="13" width="4" height="6" rx="1.500" />
      <rect x="17" y="13" width="4" height="6" rx="1.500" />
      <path d="M19 19c0 1.500-2 2-5 2" />
    </svg>
  )
}

export function Troca({ tamanho = 40 }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" {...base}>
      <path d="M4 8h14l-3-3" />
      <path d="M20 16H6l3 3" />
    </svg>
  )
}

export function Seta({ tamanho = 16 }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" {...base}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  )
}
