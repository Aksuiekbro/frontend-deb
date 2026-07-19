"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export type ActionFeedbackStatus = "idle" | "pending" | "success"

export type ActionFeedbackCallback<Args extends unknown[] = []> = (
  ...args: Args
) => Promise<boolean | void>

export interface ActionFeedbackState<Args extends unknown[] = []> {
  status: ActionFeedbackStatus
  isPending: boolean
  isSuccess: boolean
  run: (...args: Args) => Promise<boolean>
}

const SUCCESS_DURATION_MS = 1500

export function useActionFeedback<Args extends unknown[] = []>(
  callback: ActionFeedbackCallback<Args>,
): ActionFeedbackState<Args> {
  const [status, setStatus] = useState<ActionFeedbackStatus>("idle")
  const callbackRef = useRef(callback)
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingRef = useRef(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  const clearSuccessTimer = useCallback(() => {
    if (successTimerRef.current !== null) {
      clearTimeout(successTimerRef.current)
      successTimerRef.current = null
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true

    return () => {
      mountedRef.current = false
      clearSuccessTimer()
    }
  }, [clearSuccessTimer])

  const run = useCallback(async (...args: Args) => {
    if (!mountedRef.current || pendingRef.current) return false

    pendingRef.current = true
    clearSuccessTimer()
    setStatus("pending")

    try {
      const result = await callbackRef.current(...args)

      if (result === false) {
        if (mountedRef.current) setStatus("idle")
        return false
      }

      if (mountedRef.current) {
        setStatus("success")
        successTimerRef.current = setTimeout(() => {
          successTimerRef.current = null
          if (mountedRef.current) setStatus("idle")
        }, SUCCESS_DURATION_MS)
      }

      return true
    } catch {
      if (mountedRef.current) setStatus("idle")
      return false
    } finally {
      pendingRef.current = false
    }
  }, [clearSuccessTimer])

  return {
    status,
    isPending: status === "pending",
    isSuccess: status === "success",
    run,
  }
}
