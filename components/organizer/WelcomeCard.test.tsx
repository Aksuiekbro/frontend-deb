/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import WelcomeCard from './WelcomeCard'

describe('WelcomeCard', () => {
  it('links "My Profile" to the given user\'s profile', () => {
    render(<WelcomeCard userId={42} />)

    const link = screen.getByRole('link', { name: /my profile/i })
    expect(link).toHaveAttribute('href', '/profile/42')
  })

  it('falls back to the /profile index (never /profile/0) when no user id is known', () => {
    render(<WelcomeCard />)

    const link = screen.getByRole('link', { name: /my profile/i })
    expect(link).toHaveAttribute('href', '/profile')
  })
})
