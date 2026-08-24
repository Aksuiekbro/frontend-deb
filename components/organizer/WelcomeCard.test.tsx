/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import WelcomeCard from './WelcomeCard'
import { LocaleProvider } from '@/lib/i18n'

describe('WelcomeCard', () => {
  it('links "My Profile" to the given user\'s profile', () => {
    render(<WelcomeCard userId={42} />)

    const link = screen.getByRole('link', { name: /my profile/i })
    expect(link).toHaveAttribute('href', '/profile/42')
    expect(screen.getByRole('heading', { name: /welcome back, user/i })).toBeInTheDocument()
  })

  it('falls back to the /profile index (never /profile/0) when no user id is known', () => {
    render(<WelcomeCard />)

    const link = screen.getByRole('link', { name: /my profile/i })
    expect(link).toHaveAttribute('href', '/profile')
  })

  it('translates the personalized greeting and actions for Russian', async () => {
    window.localStorage.setItem('debetter-locale', 'ru')
    render(<LocaleProvider><WelcomeCard username="Aruzhan" /></LocaleProvider>)

    await waitFor(() => expect(screen.getByRole('heading', { name: 'С возвращением, Aruzhan!' })).toBeInTheDocument())
    expect(screen.getByRole('link', { name: 'Мой профиль' })).toBeInTheDocument()
  })
})
