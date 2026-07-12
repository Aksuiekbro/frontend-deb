import AuthPageClient, { type AuthPageClientProps } from './AuthPageClient'

type AuthSearchParams = Promise<{
  mode?: string | string[] | undefined
}>

export type AuthPageProps = {
  searchParams: AuthSearchParams
}

function normalizeAuthMode(mode: string | string[] | undefined): AuthPageClientProps {
  const requestedMode = Array.isArray(mode) ? mode[0] : mode

  if (requestedMode === 'login') {
    return { initialMode: 'login', requestedMode: 'login' }
  }

  if (requestedMode === 'register') {
    return { initialMode: 'register', requestedMode: 'register' }
  }

  return { initialMode: 'register', requestedMode: null }
}

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const { mode } = await searchParams
  const normalizedMode: AuthPageClientProps = normalizeAuthMode(mode)

  return <AuthPageClient {...normalizedMode} />
}
