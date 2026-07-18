"use client"

import React, { useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import { toBackendDateTime } from "@/lib/datetime"
import { readResponseError } from "@/lib/http-error"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DebateFormat,
  TournamentLeague,
  type TournamentRequest,
  type TournamentResponse,
} from "@/types/tournament/tournament"

type HostFormState = TournamentRequest

const TITLE_MAX_LENGTH = 50
const DESCRIPTION_MAX_LENGTH = 200
const LOCATION_MAX_LENGTH = 50
const TEAM_FORMATS = new Set<DebateFormat>([DebateFormat.APF, DebateFormat.BPF])

function createInitialForm(): HostFormState {
  return {
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    registrationDeadline: "",
    location: "",
    league: undefined,
    teamLimit: undefined,
    preliminaryFormat: undefined,
    teamEliminationFormat: undefined,
    preliminaryRoundCount: undefined,
    eliminationRoundCount: undefined,
    ldEnabled: true,
    ldRoundCount: 4,
  }
}

export default function HostDebate() {
  const router = useRouter()
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState<HostFormState>(createInitialForm)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const leagueOptions = useMemo(() => [
    { value: TournamentLeague.SCHOOL, label: "School" },
    { value: TournamentLeague.UNIVERSITY, label: "University" },
  ], [])

  const teamFormatOptions = useMemo(() => [
    { value: DebateFormat.APF, label: "APF" },
    { value: DebateFormat.BPF, label: "BPF" },
  ], [])

  function update<K extends keyof HostFormState>(key: K, value: HostFormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const name = form.name?.trim() ?? ""
    const description = form.description?.trim() ?? ""
    const location = form.location?.trim() ?? ""

    const requiredFields = [
      name,
      description,
      form.startDate,
      form.endDate,
      form.registrationDeadline,
      location,
      form.league,
      form.teamLimit,
      form.preliminaryFormat,
      form.teamEliminationFormat,
      form.preliminaryRoundCount,
      form.eliminationRoundCount,
    ]

    if (requiredFields.some((value) => value === undefined || value === "" || value === 0) || !imageFile) {
      setSubmitError("Please fill in all tournament details and upload an image.")
      return
    }

    if (
      !TEAM_FORMATS.has(form.preliminaryFormat as DebateFormat) ||
      !TEAM_FORMATS.has(form.teamEliminationFormat as DebateFormat)
    ) {
      setSubmitError("Team stages support APF or BPF only. Use the LD option below to add a solo bracket.")
      return
    }

    if (
      Number(form.preliminaryRoundCount) < 1 ||
      Number(form.eliminationRoundCount) < 1
    ) {
      setSubmitError("A tournament must have at least one preliminary round and one elimination round.")
      return
    }

    const lengthErrors = []
    if (name.length > TITLE_MAX_LENGTH) {
      lengthErrors.push(`Title must be ${TITLE_MAX_LENGTH} characters or fewer.`)
    }
    if (description.length > DESCRIPTION_MAX_LENGTH) {
      lengthErrors.push(`Description must be ${DESCRIPTION_MAX_LENGTH} characters or fewer.`)
    }
    if (location.length > LOCATION_MAX_LENGTH) {
      lengthErrors.push(`Location must be ${LOCATION_MAX_LENGTH} characters or fewer.`)
    }
    if (lengthErrors.length > 0) {
      setSubmitError(lengthErrors.join(" "))
      return
    }

    const startDate = toBackendDateTime(form.startDate)
    const endDate = toBackendDateTime(form.endDate)
    const registrationDeadline = toBackendDateTime(form.registrationDeadline)

    if (!startDate || !endDate || !registrationDeadline) {
      setSubmitError("Please enter valid dates.")
      return
    }

    if (new Date(registrationDeadline) > new Date(startDate)) {
      setSubmitError("Registration deadline must be before the tournament starts.")
      return
    }

    if (new Date(endDate) < new Date(startDate)) {
      setSubmitError("End date must be after the start date.")
      return
    }

    const payload: TournamentRequest = {
      name,
      description,
      startDate,
      endDate,
      registrationDeadline,
      location,
      league: form.league,
      teamLimit: form.teamLimit,
      preliminaryFormat: form.preliminaryFormat,
      teamEliminationFormat: form.teamEliminationFormat,
      preliminaryRoundCount: form.preliminaryRoundCount,
      eliminationRoundCount: form.eliminationRoundCount,
      ldEnabled: form.ldEnabled ?? true,
      ...(form.ldEnabled ?? true ? { ldRoundCount: form.ldRoundCount ?? 4 } : {}),
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const response = await api.createTournament(payload, imageFile)
      if (!response.ok) {
        throw new Error(await readResponseError(response, {
          fallback: "Failed to create tournament. Please try again.",
          unauthorized: "Please sign in as an organizer before creating a tournament.",
          badRequest: "Please check the tournament details and try again.",
          payloadTooLarge: "The selected image is too large.",
          serverError: "Server error. Please try again later.",
        }))
      }

      const createdTournament = await response.json().catch(() => null) as TournamentResponse | null
      if (createdTournament?.id) {
        router.push(`/tournament/${createdTournament.id}`)
        return
      }

      router.push("/my-tournaments")
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to create tournament. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleCancel() {
    setForm(createInitialForm())
    setImageFile(null)
    setSubmitError(null)
    if (imageInputRef.current) imageInputRef.current.value = ""
  }

  return (
    <section aria-labelledby="host-debate-heading" className="bg-white rounded-[10px] p-6 md:p-8 shadow-sm">
      <div className="mb-6">
        <p className="text-[#0D1321] text-[20px]">Start the Debate</p>
        <h1 id="host-debate-heading" className="text-[#0D1321] text-[32px] md:text-[40px] font-semibold leading-tight">
          Create a Debate and
          <br />
          Let the Discussion Begin
        </h1>
        <div className="h-px bg-[#0D1321]/20 mt-4" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 md:col-span-2">
            <label className="text-[#0D1321] text-[16px]">Debate Title:</label>
            <Input
              placeholder="Enter a clear and engaging title for your debate"
              value={form.name ?? ""}
              onChange={e => update("name", e.target.value)}
              maxLength={TITLE_MAX_LENGTH}
              required
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-[#0D1321] text-[16px]">Debate Description:</label>
            <Textarea
              placeholder="Provide context and key points to help participants understand the topic"
              value={form.description ?? ""}
              onChange={e => update("description", e.target.value)}
              className="min-h-[96px]"
              maxLength={DESCRIPTION_MAX_LENGTH}
              required
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-[#0D1321] text-[16px]">Tournament Image:</label>
            <Input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              required
              onChange={e => {
                setImageFile(e.target.files?.[0] ?? null)
                setSubmitError(null)
              }}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[#0D1321] text-[16px]">Start Date</label>
            <Input required type="date" value={form.startDate ?? ""} onChange={e => update("startDate", e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-[#0D1321] text-[16px]">End Date</label>
            <Input required type="date" value={form.endDate ?? ""} onChange={e => update("endDate", e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-[#0D1321] text-[16px]">Registration Deadline</label>
            <div className="max-w-[320px]"><Input required type="date" value={form.registrationDeadline ?? ""} onChange={e => update("registrationDeadline", e.target.value)} /></div>
          </div>

          <div className="space-y-2">
            <label className="text-[#0D1321] text-[16px]">Location:</label>
            <Input
              placeholder="Enter the city or venue name"
              value={form.location ?? ""}
              onChange={e => update("location", e.target.value)}
              maxLength={LOCATION_MAX_LENGTH}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[#0D1321] text-[16px]">League:</label>
            <Select value={form.league} onValueChange={(v) => update("league", v as TournamentLeague)}>
              <SelectTrigger>
                <SelectValue placeholder="Select the league" />
              </SelectTrigger>
              <SelectContent>
                {leagueOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-[#0D1321] text-[16px]">Team Limit</label>
            <Input
              type="number"
              min={2}
              placeholder="Maximum number of teams allowed"
              value={form.teamLimit ?? ""}
              onChange={e => update("teamLimit", e.target.value === "" ? undefined : Number(e.target.value))}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[#0D1321] text-[16px]">Elimination Round Format</label>
            <Select value={form.teamEliminationFormat} onValueChange={v => update("teamEliminationFormat", v as DebateFormat)}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a format for knock-out rounds" />
              </SelectTrigger>
              <SelectContent>
                {teamFormatOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-[#0D1321] text-[16px]">Preliminary Debate Format</label>
            <Select value={form.preliminaryFormat} onValueChange={v => update("preliminaryFormat", v as DebateFormat)}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a format" />
              </SelectTrigger>
              <SelectContent>
                {teamFormatOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-[#0D1321] text-[16px]">Number of Preliminary Rounds</label>
            <Input
              type="number"
              min={1}
              placeholder="Enter total preliminary rounds"
              value={form.preliminaryRoundCount ?? ""}
              onChange={e => update("preliminaryRoundCount", e.target.value === "" ? undefined : Number(e.target.value))}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[#0D1321] text-[16px]">Number of Elimination Rounds</label>
            <Input
              type="number"
              min={1}
              placeholder="Enter total elimination rounds"
              value={form.eliminationRoundCount ?? ""}
              onChange={e => update("eliminationRoundCount", e.target.value === "" ? undefined : Number(e.target.value))}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-3 text-[#0D1321] text-[16px]">
              <input
                type="checkbox"
                checked={form.ldEnabled ?? true}
                onChange={e => update("ldEnabled", e.target.checked)}
                className="h-4 w-4 accent-[#0D1321]"
              />
              Include LD (solo speaker) bracket
            </label>
            <p className="text-[14px] text-[#9a8c98]">
              Top speakers from preliminary rounds get their own 1v1 playoff alongside the team bracket.
            </p>
            {(form.ldEnabled ?? true) && (
              <div className="space-y-2">
                <label className="text-[#0D1321] text-[16px]" htmlFor="ld-bracket-size">LD bracket size</label>
                <select
                  id="ld-bracket-size"
                  value={form.ldRoundCount ?? 4}
                  onChange={e => update("ldRoundCount", Number(e.target.value))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value={4}>Top 16 speakers</option>
                  <option value={5}>Top 32 speakers</option>
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-end">
          {submitError ? (
            <p className="text-sm text-red-600 sm:mr-auto" role="alert">{submitError}</p>
          ) : null}
          <Button type="button" variant="outline" className="px-[40px] py-[18px]" onClick={handleCancel} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" className="bg-[#0D1321] hover:bg-[#0D1321]/90 px-[40px] py-[18px]" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Submit"}
          </Button>
        </div>
      </form>
    </section>
  )
}
