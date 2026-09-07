"use client"

import { useLayoutEffect, useRef, useState } from "react"
import useSWR from "swr"

import { useCurrentUser } from "@/hooks/use-api"
import { api } from "@/lib/api"
import { readResponseError } from "@/lib/http-error"
import type { Pageable, PageResult } from "@/types/page"
import type { SimpleTournamentResponse, TournamentGetParams } from "@/types/tournament/tournament"

export function useMyTournamentPages(
  params: TournamentGetParams | undefined,
  pageable: Omit<Pageable, "page">,
  loadAll = false,
) {
  const { user, isLoading: userLoading } = useCurrentUser()
  const scope = JSON.stringify([user?.id ?? null, params, pageable, loadAll])
  const currentScopeRef = useRef(scope)
  const mountedRef = useRef(true)
  useLayoutEffect(() => {
    currentScopeRef.current = scope
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [scope])
  const [pagination, setPagination] = useState({ scope, pageCount: 1 })
  const pageCount = pagination.scope === scope ? pagination.pageCount : 1
  const { data, error, isValidating, mutate } = useSWR(
    user?.id ? ["my-tournaments", user.id, params, pageable, "pages", pageCount, loadAll] : null,
    async () => {
      const assertCurrentScope = () => {
        if (!mountedRef.current || currentScopeRef.current !== scope) {
          throw new DOMException("Membership request superseded", "AbortError")
        }
      }
      const byId = new Map<number, SimpleTournamentResponse>()
      let page = 0
      let totalPages = 1
      let totalElements = 0

      // Refresh the visible window together so deleted or reordered entries
      // cannot leave stale pages attached to a newly refreshed first page.
      while (page < totalPages && (loadAll || page < pageCount)) {
        assertCurrentScope()
        const response = await api.getMyTournaments(params, { ...pageable, page })
        assertCurrentScope()
        if (!response.ok) {
          throw new Error(await readResponseError(response, { fallback: `API Error: ${response.status}` }))
        }
        const result = await response.json() as PageResult<SimpleTournamentResponse>
        assertCurrentScope()
        result.content.forEach((tournament) => byId.set(tournament.id, tournament))
        totalPages = Math.max(1, result.totalPages)
        totalElements = result.totalElements
        page += 1
      }

      return {
        scope,
        pagesLoaded: page,
        tournaments: { content: [...byId.values()], totalPages, totalElements },
      }
    },
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
      shouldRetryOnError: (requestError) => requestError.name !== "AbortError",
    },
  )

  // Keeping previous data must never reveal a prior account's memberships or
  // a different filter's results while the next request is in flight.
  const currentData = user?.id && data?.scope === scope ? data : undefined
  const hasMore = Boolean(currentData && currentData.pagesLoaded < currentData.tournaments.totalPages)

  return {
    tournaments: currentData?.tournaments,
    error,
    isLoading: userLoading || (Boolean(user?.id) && !currentData && !error),
    isLoadingMore: Boolean(currentData && isValidating),
    hasMore: !loadAll && hasMore,
    loadMore: () => {
      if (hasMore && !isValidating) setPagination({ scope, pageCount: pageCount + 1 })
    },
    mutate,
  }
}
