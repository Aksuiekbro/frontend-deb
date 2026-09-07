import { useTranslations, type TranslationCatalog } from "@/lib/i18n"

const catalog: TranslationCatalog = {
  en: {
    title: "Results are not published",
    description: "The organizer has not published the results yet. Please check back later.",
  },
  ru: {
    title: "Результаты не опубликованы",
    description: "Организатор ещё не опубликовал результаты. Пожалуйста, проверьте позже.",
  },
  kk: {
    title: "Нәтижелер жарияланбаған",
    description: "Ұйымдастырушы нәтижелерді әлі жариялаған жоқ. Кейінірек тексеріп көріңіз.",
  },
}

export function ResultsPublicationNotice() {
  const t = useTranslations(catalog)

  return (
    <section
      aria-live="polite"
      className="rounded-xl border border-[#D5D9E7] bg-white px-6 py-10 text-center shadow-sm"
    >
      <h2 className="text-xl font-semibold text-[#0D1321]">{t("title")}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm text-[#4A5568]">{t("description")}</p>
    </section>
  )
}
