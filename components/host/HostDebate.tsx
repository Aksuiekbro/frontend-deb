"use client"

import React, { useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"

import { api } from "@/lib/api"
import { toBackendDateTime } from "@/lib/datetime"
import { readResponseError } from "@/lib/http-error"
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
    <div className="db-panel cd-card" style={{ padding: 32 }}>
      <p className="cd-eyebrow">Start the Debate</p>
      <h1 id="host-debate-heading" className="cd-title">Create a Debate and Let the Discussion Begin</h1>
      <div className="cd-divider" />

      <form onSubmit={handleSubmit} noValidate aria-labelledby="host-debate-heading">
        <div className="db-field">
          <label htmlFor="debate-title">Debate Title</label>
          <input
            id="debate-title"
            type="text"
            placeholder="Enter a clear and engaging title for your debate"
            value={form.name ?? ""}
            onChange={e => update("name", e.target.value)}
            maxLength={TITLE_MAX_LENGTH}
            required
          />
        </div>

        <div className="db-field">
          <label htmlFor="debate-desc">Debate Description</label>
          <textarea
            id="debate-desc"
            placeholder="Provide context and key points to help participants understand the topic"
            value={form.description ?? ""}
            onChange={e => update("description", e.target.value)}
            maxLength={DESCRIPTION_MAX_LENGTH}
            required
          />
        </div>

        <div className="db-field">
          <label htmlFor="debate-image">Tournament Image</label>
          <input
            id="debate-image"
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

        <div className="db-field-row">
          <div className="db-field">
            <label htmlFor="start-date">Start Date</label>
            <input id="start-date" required type="date" value={form.startDate ?? ""} onChange={e => update("startDate", e.target.value)} />
          </div>
          <div className="db-field">
            <label htmlFor="end-date">End Date</label>
            <input id="end-date" required type="date" value={form.endDate ?? ""} onChange={e => update("endDate", e.target.value)} />
          </div>
        </div>
        <div className="db-field" style={{ maxWidth: 320 }}>
          <label htmlFor="reg-deadline">Registration Deadline</label>
          <input id="reg-deadline" required type="date" value={form.registrationDeadline ?? ""} onChange={e => update("registrationDeadline", e.target.value)} />
        </div>

        <div className="db-field-row">
          <div className="db-field">
            <label htmlFor="location">Location</label>
            <input
              id="location"
              type="text"
              placeholder="Enter the city or venue name"
              value={form.location ?? ""}
              onChange={e => update("location", e.target.value)}
              maxLength={LOCATION_MAX_LENGTH}
              required
            />
          </div>
          <div className="db-field">
            <label htmlFor="league">League</label>
            <select
              id="league"
              value={form.league ?? ""}
              onChange={e => update("league", e.target.value as TournamentLeague)}
              required
            >
              <option value="" disabled>Select the league</option>
              {leagueOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="db-field-row">
          <div className="db-field">
            <label htmlFor="team-limit">Team Limit</label>
            <input
              id="team-limit"
              type="number"
              min={2}
              placeholder="Maximum number of teams allowed"
              value={form.teamLimit ?? ""}
              onChange={e => update("teamLimit", e.target.value === "" ? undefined : Number(e.target.value))}
              required
            />
          </div>
          <div className="db-field">
            <label htmlFor="elim-format">Elimination Round Format</label>
            <select
              id="elim-format"
              value={form.teamEliminationFormat ?? ""}
              onChange={e => update("teamEliminationFormat", e.target.value as DebateFormat)}
              required
            >
              <option value="" disabled>Choose a format for knock-out rounds</option>
              {teamFormatOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="db-field-row">
          <div className="db-field">
            <label htmlFor="prelim-format">Preliminary Debate Format</label>
            <select
              id="prelim-format"
              value={form.preliminaryFormat ?? ""}
              onChange={e => update("preliminaryFormat", e.target.value as DebateFormat)}
              required
            >
              <option value="" disabled>Choose a format</option>
              {teamFormatOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="db-field">
            <label htmlFor="prelim-rounds">Number of Preliminary Rounds</label>
            <input
              id="prelim-rounds"
              type="number"
              min={1}
              placeholder="Enter total preliminary rounds"
              value={form.preliminaryRoundCount ?? ""}
              onChange={e => update("preliminaryRoundCount", e.target.value === "" ? undefined : Number(e.target.value))}
              required
            />
          </div>
        </div>

        <div className="db-field" style={{ maxWidth: 320 }}>
          <label htmlFor="elim-rounds">Number of Elimination Rounds</label>
          <input
            id="elim-rounds"
            type="number"
            min={1}
            placeholder="Enter total elimination rounds"
            value={form.eliminationRoundCount ?? ""}
            onChange={e => update("eliminationRoundCount", e.target.value === "" ? undefined : Number(e.target.value))}
            required
          />
        </div>

        <div className="db-field">
          <label className="db-checkbox-row" htmlFor="ld-enabled" style={{ marginBottom: 6 }}>
            <input
              id="ld-enabled"
              type="checkbox"
              checked={form.ldEnabled ?? true}
              onChange={e => update("ldEnabled", e.target.checked)}
            />
            Include LD (solo speaker) bracket
          </label>
          <p className="db-hint">
            Top speakers from preliminary rounds get their own 1v1 playoff alongside the team bracket.
          </p>
          {(form.ldEnabled ?? true) && (
            <div style={{ marginTop: 10, maxWidth: 320 }}>
              <label htmlFor="ld-bracket-size">LD bracket size</label>
              <select
                id="ld-bracket-size"
                value={form.ldRoundCount ?? 4}
                onChange={e => update("ldRoundCount", Number(e.target.value))}
              >
                <option value={4}>Top 16 speakers</option>
                <option value={5}>Top 32 speakers</option>
              </select>
            </div>
          )}
        </div>

        <div className="cd-form-actions">
          {submitError ? (
            <p className="db-field-error" role="alert" style={{ flex: 1, alignSelf: "center", margin: 0 }}>{submitError}</p>
          ) : null}
          <button type="button" className="db-btn db-btn-secondary" onClick={handleCancel} disabled={isSubmitting}>Cancel</button>
          <button type="submit" className="db-btn db-btn-primary" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  )
}
