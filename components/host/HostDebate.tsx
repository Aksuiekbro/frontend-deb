"use client"

import React, { useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DebateFormat, TournamentLeague, type TournamentRequest } from "@/types/tournament/tournament"

type HostFormState = TournamentRequest & {
  proposition?: string
  opposition?: string
  category?: string
}

export default function HostDebate() {
  const [form, setForm] = useState<HostFormState>({
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
    proposition: "",
    opposition: "",
    category: "",
  })

  const leagueOptions = useMemo(() => [
    { value: TournamentLeague.SCHOOL, label: "School" },
    { value: TournamentLeague.UNIVERSITY, label: "University" },
  ], [])

  const formatOptions = useMemo(() => [
    { value: DebateFormat.APF, label: "APF" },
    { value: DebateFormat.BPF, label: "BPF" },
    { value: DebateFormat.KP, label: "KP" },
    { value: DebateFormat.LD, label: "LD" },
  ], [])

  function update<K extends keyof HostFormState>(key: K, value: HostFormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // For now, just log. Backend hookup can be added later via api.createTournament
    // Requires an image File; we keep UI-focused per request
    console.log("Host Debate submission", form)
    alert("Debate draft captured in console. Backend submission can be wired next.")
  }

  function handleCancel() {
    setForm({
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
      proposition: "",
      opposition: "",
      category: "",
    })
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
          <div className="space-y-2">
            <label className="text-[#0D1321] text-[16px]">Debate Title:</label>
            <Input
              placeholder="Enter a clear and engaging title for your debate"
              value={form.name ?? ""}
              onChange={e => update("name", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[#0D1321] text-[16px]">Category:</label>
            <Select value={form.category} onValueChange={v => update("category", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select the main theme of your debate" />
              </SelectTrigger>
              <SelectContent>
                {[
                  "Politics",
                  "Education",
                  "Technology",
                  "Ethics",
                  "Economics",
                ].map(opt => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-[#0D1321] text-[16px]">Debate Description:</label>
            <Textarea
              placeholder="Provide context and key points to help participants understand the topic"
              value={form.description ?? ""}
              onChange={e => update("description", e.target.value)}
              className="min-h-[96px]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[#0D1321] text-[16px]">Proposition Side(For):</label>
            <Input
              placeholder="Write the statement supporting the motion"
              value={form.proposition ?? ""}
              onChange={e => update("proposition", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[#0D1321] text-[16px]">Opposition Side(Against):</label>
            <Input
              placeholder="Write the statement opposing the motion"
              value={form.opposition ?? ""}
              onChange={e => update("opposition", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[#0D1321] text-[16px]">Start Date</label>
            <Input type="date" value={form.startDate ?? ""} onChange={e => update("startDate", e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-[#0D1321] text-[16px]">End Date</label>
            <Input type="date" value={form.endDate ?? ""} onChange={e => update("endDate", e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-[#0D1321] text-[16px]">Registration Deadline</label>
            <div className="max-w-[320px]"><Input type="date" value={form.registrationDeadline ?? ""} onChange={e => update("registrationDeadline", e.target.value)} /></div>
          </div>

          <div className="space-y-2">
            <label className="text-[#0D1321] text-[16px]">Location:</label>
            <Input
              placeholder="Enter the city or venue name"
              value={form.location ?? ""}
              onChange={e => update("location", e.target.value)}
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
            />
          </div>
          <div className="space-y-2">
            <label className="text-[#0D1321] text-[16px]">Elimination Round Format</label>
            <Select value={form.teamEliminationFormat} onValueChange={v => update("teamEliminationFormat", v as DebateFormat)}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a format for knock-out rounds" />
              </SelectTrigger>
              <SelectContent>
                {formatOptions.map(opt => (
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
                {formatOptions.map(opt => (
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
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 pt-4">
          <Button type="button" variant="outline" className="px-[40px] py-[18px]" onClick={handleCancel}>Cancel</Button>
          <Button type="submit" className="bg-[#0D1321] hover:bg-[#0D1321]/90 px-[40px] py-[18px]">Submit</Button>
        </div>
      </form>
    </section>
  )
}


