/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import NewsPage from './page'
import { useNews } from '../../hooks/use-api'

// Header does its own data fetching; it's not under test here.
jest.mock('../../components/Header', () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock('../../hooks/use-api', () => ({
  __esModule: true,
  useNews: jest.fn(),
}))

const mockUseNews = useNews as jest.Mock

beforeEach(() => {
  mockUseNews.mockReturnValue({
    news: { content: [], totalElements: 0, totalPages: 0 },
    isLoading: false,
    error: undefined,
    mutate: jest.fn(),
  })
})

afterEach(() => {
  jest.clearAllMocks()
})

describe('NewsPage', () => {
  it('requests news sorted by timestamp (a real field), not the invalid createdAt', () => {
    render(<NewsPage />)

    expect(mockUseNews).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({ sort: ['timestamp,desc'] }),
    )
  })

  it('renders backend-shaped news tags and links each card to the news detail route', () => {
    mockUseNews.mockReturnValue({
      news: {
        content: [
          {
            id: 42,
            title: 'Registration update',
            content: 'Registration closes tonight.',
            tags: [{ name: 'important' }],
            timestamp: '2026-06-19T10:00:00',
            thumbnailUrl: { id: 1, url: '/news.png' },
            images: [],
            user: { id: 1, username: 'admin' },
            author: {},
          },
        ],
        totalElements: 1,
        totalPages: 1,
      },
      isLoading: false,
      error: undefined,
      mutate: jest.fn(),
    })

    render(<NewsPage />)

    expect(screen.getByText('important')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Registration update/i })).toHaveAttribute('href', '/news/42')
  })
})
