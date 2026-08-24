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
import { localeTags, useLocale, useTranslations, type TranslationCatalog } from "@/lib/i18n"
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

const translations: TranslationCatalog = {
  en: {
    startDebate: "Start the Debate",
    createDebateAnd: "Create a Debate and",
    letDiscussionBegin: "Let the Discussion Begin",
    debateTitle: "Debate Title:",
    titlePlaceholder: "Enter a clear and engaging title for your debate",
    debateDescription: "Debate Description:",
    descriptionPlaceholder: "Provide context and key points to help participants understand the topic",
    tournamentImage: "Tournament Image:",
    uploadTournamentImage: "Upload a tournament image",
    startDate: "Start Date",
    endDate: "End Date",
    registrationDeadline: "Registration Deadline",
    location: "Location:",
    locationPlaceholder: "Enter the city or venue name",
    league: "League:",
    selectLeague: "Select the league",
    school: "School",
    university: "University",
    teamLimit: "Team Limit",
    teamLimitPlaceholder: "Maximum number of teams allowed",
    eliminationRoundFormat: "Elimination Round Format",
    eliminationFormatPlaceholder: "Choose a format for knock-out rounds",
    preliminaryDebateFormat: "Preliminary Debate Format",
    formatPlaceholder: "Choose a format",
    preliminaryRounds: "Number of Preliminary Rounds",
    preliminaryRoundsPlaceholder: "Enter total preliminary rounds",
    eliminationRounds: "Number of Elimination Rounds",
    eliminationRoundsPlaceholder: "Enter total elimination rounds",
    includeLd: "Include LD (solo speaker) bracket",
    ldHelper: "Top speakers from preliminary rounds get their own 1v1 playoff alongside the team bracket.",
    ldBracketSize: "LD bracket size",
    top16Speakers: "Top 16 speakers",
    top32Speakers: "Top 32 speakers",
    cancel: "Cancel",
    creating: "Creating...",
    submit: "Submit",
    allDetailsAndImage: "Please fill in all tournament details and upload an image.",
    teamFormatOnly: "Team stages support APF or BPF only. Use the LD option below to add a solo bracket.",
    minimumRounds: "A tournament must have at least one preliminary round and one elimination round.",
    titleLength: "Title must be {max} characters or fewer.",
    descriptionLength: "Description must be {max} characters or fewer.",
    locationLength: "Location must be {max} characters or fewer.",
    validDates: "Please enter valid dates.",
    deadlineBeforeStart: "Registration deadline must be before the tournament starts.",
    endAfterStart: "End date must be after the start date.",
    createFailed: "Failed to create tournament. Please try again.",
    organizerSignIn: "Please sign in as an organizer before creating a tournament.",
    detailsInvalid: "Please check the tournament details and try again.",
    imageTooLarge: "The selected image is too large.",
    serverError: "Server error. Please try again later.",
  },
  ru: {
    startDebate: "Начните дебаты",
    createDebateAnd: "Создайте дебаты и",
    letDiscussionBegin: "начните обсуждение",
    debateTitle: "Название дебатов:",
    titlePlaceholder: "Введите понятное и интересное название дебатов",
    debateDescription: "Описание дебатов:",
    descriptionPlaceholder: "Добавьте контекст и ключевые моменты, чтобы участники поняли тему",
    tournamentImage: "Изображение турнира:",
    uploadTournamentImage: "Загрузите изображение турнира",
    startDate: "Дата начала",
    endDate: "Дата окончания",
    registrationDeadline: "Крайний срок регистрации",
    location: "Место проведения:",
    locationPlaceholder: "Введите город или название площадки",
    league: "Лига:",
    selectLeague: "Выберите лигу",
    school: "Школьная",
    university: "Университетская",
    teamLimit: "Лимит команд",
    teamLimitPlaceholder: "Максимальное количество команд",
    eliminationRoundFormat: "Формат раундов на выбывание",
    eliminationFormatPlaceholder: "Выберите формат раундов на выбывание",
    preliminaryDebateFormat: "Формат отборочных дебатов",
    formatPlaceholder: "Выберите формат",
    preliminaryRounds: "Количество отборочных раундов",
    preliminaryRoundsPlaceholder: "Введите общее количество отборочных раундов",
    eliminationRounds: "Количество раундов на выбывание",
    eliminationRoundsPlaceholder: "Введите общее количество раундов на выбывание",
    includeLd: "Включить сетку LD (индивидуальные выступления)",
    ldHelper: "Лучшие спикеры отборочных раундов получат отдельный плей-офф 1 на 1 вместе с командной сеткой.",
    ldBracketSize: "Размер сетки LD",
    top16Speakers: "Топ-16 спикеров",
    top32Speakers: "Топ-32 спикера",
    cancel: "Отмена",
    creating: "Создание...",
    submit: "Отправить",
    allDetailsAndImage: "Заполните все данные турнира и загрузите изображение.",
    teamFormatOnly: "На командных этапах доступны только APF или BPF. Используйте опцию LD ниже, чтобы добавить индивидуальную сетку.",
    minimumRounds: "В турнире должен быть хотя бы один отборочный раунд и один раунд на выбывание.",
    titleLength: "Название должно содержать не более {max} символов.",
    descriptionLength: "Описание должно содержать не более {max} символов.",
    locationLength: "Место проведения должно содержать не более {max} символов.",
    validDates: "Введите корректные даты.",
    deadlineBeforeStart: "Крайний срок регистрации должен быть раньше начала турнира.",
    endAfterStart: "Дата окончания должна быть позже даты начала.",
    createFailed: "Не удалось создать турнир. Попробуйте ещё раз.",
    organizerSignIn: "Войдите как организатор, прежде чем создавать турнир.",
    detailsInvalid: "Проверьте данные турнира и попробуйте ещё раз.",
    imageTooLarge: "Выбранное изображение слишком большое.",
    serverError: "Ошибка сервера. Попробуйте ещё раз позже.",
  },
  kk: {
    startDebate: "Пікірсайысты бастаңыз",
    createDebateAnd: "Пікірсайыс құрып,",
    letDiscussionBegin: "талқылауды бастаңыз",
    debateTitle: "Пікірсайыс атауы:",
    titlePlaceholder: "Пікірсайысыңызға түсінікті әрі қызықты атау енгізіңіз",
    debateDescription: "Пікірсайыс сипаттамасы:",
    descriptionPlaceholder: "Қатысушылар тақырыпты түсінуі үшін контекст пен негізгі ойларды қосыңыз",
    tournamentImage: "Турнир суреті:",
    uploadTournamentImage: "Турнир суретін жүктеңіз",
    startDate: "Басталу күні",
    endDate: "Аяқталу күні",
    registrationDeadline: "Тіркелудің соңғы мерзімі",
    location: "Өтетін орны:",
    locationPlaceholder: "Қала немесе өтетін орын атауын енгізіңіз",
    league: "Лига:",
    selectLeague: "Лиганы таңдаңыз",
    school: "Мектеп",
    university: "Университет",
    teamLimit: "Командалар шегі",
    teamLimitPlaceholder: "Рұқсат етілген командалардың ең көп саны",
    eliminationRoundFormat: "Шығу раундтарының форматы",
    eliminationFormatPlaceholder: "Шығу раундтарының форматын таңдаңыз",
    preliminaryDebateFormat: "Іріктеу пікірсайыстарының форматы",
    formatPlaceholder: "Форматты таңдаңыз",
    preliminaryRounds: "Іріктеу раундтарының саны",
    preliminaryRoundsPlaceholder: "Іріктеу раундтарының жалпы санын енгізіңіз",
    eliminationRounds: "Шығу раундтарының саны",
    eliminationRoundsPlaceholder: "Шығу раундтарының жалпы санын енгізіңіз",
    includeLd: "LD (жеке спикер) кестесін қосу",
    ldHelper: "Іріктеу раундтарындағы үздік спикерлер командалық кестемен қатар жеке 1-ге-1 плей-оффқа өтеді.",
    ldBracketSize: "LD кестесінің өлшемі",
    top16Speakers: "Үздік 16 спикер",
    top32Speakers: "Үздік 32 спикер",
    cancel: "Бас тарту",
    creating: "Құрылуда...",
    submit: "Жіберу",
    allDetailsAndImage: "Турнирдің барлық деректерін толтырып, сурет жүктеңіз.",
    teamFormatOnly: "Командалық кезеңдерде тек APF немесе BPF қолжетімді. Жеке кесте қосу үшін төмендегі LD опциясын пайдаланыңыз.",
    minimumRounds: "Турнирде кемінде бір іріктеу раунды және бір шығу раунды болуы керек.",
    titleLength: "Атауда {max} таңбадан артық болмауы керек.",
    descriptionLength: "Сипаттамада {max} таңбадан артық болмауы керек.",
    locationLength: "Өтетін орын атауында {max} таңбадан артық болмауы керек.",
    validDates: "Жарамды күндерді енгізіңіз.",
    deadlineBeforeStart: "Тіркелудің соңғы мерзімі турнир басталғанға дейін болуы керек.",
    endAfterStart: "Аяқталу күні басталу күнінен кейін болуы керек.",
    createFailed: "Турнирді жасау мүмкін болмады. Қайталап көріңіз.",
    organizerSignIn: "Турнир жасау үшін ұйымдастырушы ретінде жүйеге кіріңіз.",
    detailsInvalid: "Турнир деректерін тексеріп, қайталап көріңіз.",
    imageTooLarge: "Таңдалған сурет тым үлкен.",
    serverError: "Сервер қатесі. Кейінірек қайталап көріңіз.",
  },
}

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
  const { locale } = useLocale()
  const t = useTranslations(translations)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState<HostFormState>(createInitialForm)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const leagueOptions = useMemo(() => [
    { value: TournamentLeague.SCHOOL, label: t("school") },
    { value: TournamentLeague.UNIVERSITY, label: t("university") },
  ], [t])

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
      setSubmitError(t("allDetailsAndImage"))
      return
    }

    if (
      !TEAM_FORMATS.has(form.preliminaryFormat as DebateFormat) ||
      !TEAM_FORMATS.has(form.teamEliminationFormat as DebateFormat)
    ) {
      setSubmitError(t("teamFormatOnly"))
      return
    }

    if (
      Number(form.preliminaryRoundCount) < 1 ||
      Number(form.eliminationRoundCount) < 1
    ) {
      setSubmitError(t("minimumRounds"))
      return
    }

    const lengthErrors = []
    if (name.length > TITLE_MAX_LENGTH) {
      lengthErrors.push(t("titleLength", { max: TITLE_MAX_LENGTH }))
    }
    if (description.length > DESCRIPTION_MAX_LENGTH) {
      lengthErrors.push(t("descriptionLength", { max: DESCRIPTION_MAX_LENGTH }))
    }
    if (location.length > LOCATION_MAX_LENGTH) {
      lengthErrors.push(t("locationLength", { max: LOCATION_MAX_LENGTH }))
    }
    if (lengthErrors.length > 0) {
      setSubmitError(lengthErrors.join(" "))
      return
    }

    const startDate = toBackendDateTime(form.startDate)
    const endDate = toBackendDateTime(form.endDate)
    const registrationDeadline = toBackendDateTime(form.registrationDeadline)

    if (!startDate || !endDate || !registrationDeadline) {
      setSubmitError(t("validDates"))
      return
    }

    if (new Date(registrationDeadline) > new Date(startDate)) {
      setSubmitError(t("deadlineBeforeStart"))
      return
    }

    if (new Date(endDate) < new Date(startDate)) {
      setSubmitError(t("endAfterStart"))
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
          fallback: t("createFailed"),
          unauthorized: t("organizerSignIn"),
          badRequest: t("detailsInvalid"),
          payloadTooLarge: t("imageTooLarge"),
          serverError: t("serverError"),
        }))
      }

      const createdTournament = await response.json().catch(() => null) as TournamentResponse | null
      if (createdTournament?.id) {
        router.push(`/tournament/${createdTournament.id}`)
        return
      }

      router.push("/my-tournaments")
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : t("createFailed"))
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
    <section aria-labelledby="host-debate-heading" lang={localeTags[locale]} className="bg-white rounded-[10px] p-6 md:p-8 shadow-sm">
      <div className="mb-6">
        <p className="text-[#0D1321] text-[20px]">{t("startDebate")}</p>
        <h1 id="host-debate-heading" className="text-[#0D1321] text-[32px] md:text-[40px] font-semibold leading-tight">
          {t("createDebateAnd")}
          <br />
          {t("letDiscussionBegin")}
        </h1>
        <div className="h-px bg-[#0D1321]/20 mt-4" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 md:col-span-2">
            <label className="text-[#0D1321] text-[16px]">{t("debateTitle")}</label>
            <Input
              placeholder={t("titlePlaceholder")}
              value={form.name ?? ""}
              onChange={e => update("name", e.target.value)}
              maxLength={TITLE_MAX_LENGTH}
              required
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-[#0D1321] text-[16px]">{t("debateDescription")}</label>
            <Textarea
              placeholder={t("descriptionPlaceholder")}
              value={form.description ?? ""}
              onChange={e => update("description", e.target.value)}
              className="min-h-[96px]"
              maxLength={DESCRIPTION_MAX_LENGTH}
              required
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-[#0D1321] text-[16px]">{t("tournamentImage")}</label>
            <Input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              aria-label={t("uploadTournamentImage")}
              required
              onChange={e => {
                setImageFile(e.target.files?.[0] ?? null)
                setSubmitError(null)
              }}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[#0D1321] text-[16px]">{t("startDate")}</label>
            <Input required type="date" value={form.startDate ?? ""} onChange={e => update("startDate", e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-[#0D1321] text-[16px]">{t("endDate")}</label>
            <Input required type="date" value={form.endDate ?? ""} onChange={e => update("endDate", e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-[#0D1321] text-[16px]">{t("registrationDeadline")}</label>
            <div className="max-w-[320px]"><Input required type="date" value={form.registrationDeadline ?? ""} onChange={e => update("registrationDeadline", e.target.value)} /></div>
          </div>

          <div className="space-y-2">
            <label className="text-[#0D1321] text-[16px]">{t("location")}</label>
            <Input
              placeholder={t("locationPlaceholder")}
              value={form.location ?? ""}
              onChange={e => update("location", e.target.value)}
              maxLength={LOCATION_MAX_LENGTH}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[#0D1321] text-[16px]">{t("league")}</label>
            <Select value={form.league} onValueChange={(v) => update("league", v as TournamentLeague)}>
              <SelectTrigger>
                <SelectValue placeholder={t("selectLeague")} />
              </SelectTrigger>
              <SelectContent>
                {leagueOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-[#0D1321] text-[16px]">{t("teamLimit")}</label>
            <Input
              type="number"
              min={2}
              placeholder={t("teamLimitPlaceholder")}
              value={form.teamLimit ?? ""}
              onChange={e => update("teamLimit", e.target.value === "" ? undefined : Number(e.target.value))}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[#0D1321] text-[16px]">{t("eliminationRoundFormat")}</label>
            <Select value={form.teamEliminationFormat} onValueChange={v => update("teamEliminationFormat", v as DebateFormat)}>
              <SelectTrigger>
                <SelectValue placeholder={t("eliminationFormatPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {teamFormatOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-[#0D1321] text-[16px]">{t("preliminaryDebateFormat")}</label>
            <Select value={form.preliminaryFormat} onValueChange={v => update("preliminaryFormat", v as DebateFormat)}>
              <SelectTrigger>
                <SelectValue placeholder={t("formatPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {teamFormatOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-[#0D1321] text-[16px]">{t("preliminaryRounds")}</label>
            <Input
              type="number"
              min={1}
              placeholder={t("preliminaryRoundsPlaceholder")}
              value={form.preliminaryRoundCount ?? ""}
              onChange={e => update("preliminaryRoundCount", e.target.value === "" ? undefined : Number(e.target.value))}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[#0D1321] text-[16px]">{t("eliminationRounds")}</label>
            <Input
              type="number"
              min={1}
              placeholder={t("eliminationRoundsPlaceholder")}
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
              {t("includeLd")}
            </label>
            <p className="text-[14px] text-[#9a8c98]">
              {t("ldHelper")}
            </p>
            {(form.ldEnabled ?? true) && (
              <div className="space-y-2">
                <label className="text-[#0D1321] text-[16px]" htmlFor="ld-bracket-size">{t("ldBracketSize")}</label>
                <select
                  id="ld-bracket-size"
                  value={form.ldRoundCount ?? 4}
                  onChange={e => update("ldRoundCount", Number(e.target.value))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value={4}>{t("top16Speakers")}</option>
                  <option value={5}>{t("top32Speakers")}</option>
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-end">
          {submitError ? (
            <p className="text-sm text-red-600 sm:mr-auto" role="alert">{submitError}</p>
          ) : null}
          <Button type="button" variant="outline" className="px-[40px] py-[18px]" onClick={handleCancel} disabled={isSubmitting}>{t("cancel")}</Button>
          <Button type="submit" className="bg-[#0D1321] hover:bg-[#0D1321]/90 px-[40px] py-[18px]" disabled={isSubmitting}>
            {isSubmitting ? t("creating") : t("submit")}
          </Button>
        </div>
      </form>
    </section>
  )
}
