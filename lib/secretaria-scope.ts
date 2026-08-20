/** Secretarias oficiais do sistema (valor armazenado em maiúsculas). */
export const SECRETARIAS = [
  "SEMGOV",
  "SEMPLAD",
  "SEMFAZ",
  "SEMEDUC",
  "SEMUSA",
  "SEMATHRAB",
  "SEMOSP",
  "SEMALP",
  "SEMAEV",
  "SEMCI",
  "SEMGAP",
  "SEMCTEL",
  "SEMSEG",
  "SEMTRANSP",
  "PROGEM",
  "LEONARDO",
] as const

export type SecretariaCodigo = (typeof SECRETARIAS)[number]

export function normalizarSecretaria(value?: string | null): string {
  return String(value || "").trim().toUpperCase()
}

export function isUsuarioSecretaria(user?: { secretaria?: string | null } | null): boolean {
  return Boolean(normalizarSecretaria(user?.secretaria))
}

export function getUserSecretaria(user?: { secretaria?: string | null } | null): string | null {
  const s = normalizarSecretaria(user?.secretaria)
  return s || null
}

/** Filtra itens que tenham campo secretaria. Sem secretaria no usuário, retorna tudo. */
export function scopeBySecretaria<T extends { secretaria?: string | null }>(
  items: T[],
  userSecretaria?: string | null,
): T[] {
  const s = normalizarSecretaria(userSecretaria)
  if (!s) return items
  return items.filter((item) => normalizarSecretaria(item.secretaria) === s)
}

/** Módulos liberados para login de secretaria. */
export const MODULOS_SECRETARIA = [
  "dashboard",
  "veiculos",
  "filtros",
  "tela",
  "trocaOleo",
] as const
