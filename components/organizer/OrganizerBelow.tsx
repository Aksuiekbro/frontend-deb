"use client";

import Image from "next/image";
import Link from "next/link";
import React from "react";
import {
  useLocale,
  useTranslations,
  type TranslationCatalog,
} from "@/lib/i18n";

export interface FAQItem {
  question: string;
  answer: string;
}
export interface OrganizerBelowProps {
  imageSrc?: string;
  faq?: FAQItem[];
  initialOpenIndex?: number;
  className?: string;
}

const messages: TranslationCatalog = {
  en: {
    joinDebates: "Join Debates",
    browseDebates: "Browse Debates",
    hostDebate: "Host Debate",
    connectUs: "Connect Us",
    advicePrefix: "Get",
    expertAdvice: "Expert Advice",
    adviceSuffix: "on",
    debatingJourney: "Debating journey",
    description:
      "Get practical guidance on formats, schedules, and participant support for a smooth debating journey.",
    guidanceAlt: "Organizer guidance",
    faq: "FAQ",
    socialLinks: "Social links",
    icon: "Icon",
    contactUs: "Contact us: debetter@gmail.com",
    allRights: "© 2025 all rights reserved",
    privacy: "Privacy Policy",
    faqUnavailable: "What happens if you’re unavailable on our event day?",
    faqUnavailableAnswer:
      "In rare cases of emergency, we provide timely notice and help with a qualified backup.",
    faqSchedules: "How long does it take to receive schedules?",
    faqSchedulesAnswer:
      "Schedules are generated within minutes after registrations close.",
    faqFormats: "Can we request specific formats or rules?",
    faqFormatsAnswer:
      "Yes, organizers can configure formats, time limits, and speaker orders.",
    faqNew: "What if participants are new to debating?",
    faqNewAnswer:
      "We provide guidance notes and onboarding materials to help first-time debaters.",
  },
  ru: {
    joinDebates: "Присоединиться к дебатам",
    browseDebates: "Смотреть дебаты",
    hostDebate: "Провести дебаты",
    connectUs: "Связаться с нами",
    advicePrefix: "Получите",
    expertAdvice: "советы экспертов",
    adviceSuffix: "о",
    debatingJourney: "пути в дебатах",
    description:
      "Получите практические рекомендации по форматам, расписаниям и поддержке участников для успешного пути в дебатах.",
    guidanceAlt: "Рекомендации для организатора",
    faq: "Часто задаваемые вопросы",
    socialLinks: "Ссылки на соцсети",
    icon: "Иконка",
    contactUs: "Связаться с нами: debetter@gmail.com",
    allRights: "© 2025 все права защищены",
    privacy: "Политика конфиденциальности",
    faqUnavailable:
      "Что произойдёт, если вы не сможете присутствовать в день мероприятия?",
    faqUnavailableAnswer:
      "В редких экстренных случаях мы заранее уведомим вас и поможем найти квалифицированную замену.",
    faqSchedules: "Сколько времени занимает получение расписаний?",
    faqSchedulesAnswer:
      "Расписания создаются в течение нескольких минут после окончания регистрации.",
    faqFormats: "Можно ли запросить определённые форматы или правила?",
    faqFormatsAnswer:
      "Да, организаторы могут настроить форматы, ограничения по времени и порядок выступления.",
    faqNew: "Что делать, если участники впервые участвуют в дебатах?",
    faqNewAnswer:
      "Мы предоставляем пояснения и материалы для адаптации новичков.",
  },
  kk: {
    joinDebates: "Пікірсайыстарға қосылу",
    browseDebates: "Пікірсайыстарды көру",
    hostDebate: "Пікірсайыс өткізу",
    connectUs: "Бізбен байланысу",
    advicePrefix: "Пікірсайыс жолы туралы",
    expertAdvice: "сарапшы кеңесін",
    adviceSuffix: "алыңыз",
    debatingJourney: "",
    description:
      "Пікірсайыс жолын сәтті өту үшін форматтар, кестелер және қатысушыларды қолдау туралы практикалық кеңес алыңыз.",
    guidanceAlt: "Ұйымдастырушыға арналған кеңестер",
    faq: "Жиі қойылатын сұрақтар",
    socialLinks: "Әлеуметтік желі сілтемелері",
    icon: "Белгіше",
    contactUs: "Бізбен байланысу: debetter@gmail.com",
    allRights: "© 2025 барлық құқықтар қорғалған",
    privacy: "Құпиялылық саясаты",
    faqUnavailable: "Іс-шара өтетін күні сіз келе алмасаңыз не болады?",
    faqUnavailableAnswer:
      "Сирек кездесетін төтенше жағдайда алдын ала хабарлап, білікті алмастырушы табуға көмектесеміз.",
    faqSchedules: "Кестелерді алу қанша уақытты алады?",
    faqSchedulesAnswer:
      "Тіркеу аяқталғаннан кейін кестелер бірнеше минут ішінде жасалады.",
    faqFormats: "Белгілі бір форматтар мен ережелерді сұрауға бола ма?",
    faqFormatsAnswer:
      "Иә, ұйымдастырушылар форматтарды, уақыт шектеулерін және сөйлеу ретін баптай алады.",
    faqNew: "Қатысушылар пікірсайысқа жаңадан келсе не болады?",
    faqNewAnswer:
      "Біз алғаш рет қатысатын пікірсайысшыларға нұсқаулықтар мен бейімдеу материалдарын ұсынамыз.",
  },
};

export default function OrganizerBelow({
  imageSrc = "/organizer_placeholder.png",
  faq,
  initialOpenIndex = 0,
  className,
}: OrganizerBelowProps) {
  const { locale } = useLocale();
  const t = useTranslations(messages);
  const isKazakh = locale === "kk";
  const localizedDefaultFaq: FAQItem[] = [
    { question: t("faqUnavailable"), answer: t("faqUnavailableAnswer") },
    { question: t("faqSchedules"), answer: t("faqSchedulesAnswer") },
    { question: t("faqFormats"), answer: t("faqFormatsAnswer") },
    { question: t("faqNew"), answer: t("faqNewAnswer") },
  ];
  const faqItems = faq ?? localizedDefaultFaq;
  const [openIndex, setOpenIndex] = React.useState<number | null>(
    Number.isInteger(initialOpenIndex) ? initialOpenIndex : 0,
  );

  return (
    <section
      className={`container mx-auto max-w-[1280px] px-8 py-12 space-y-12 ${className || ""}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/join"
            className="px-4 py-2 rounded-md bg-[#0D1321] text-white text-sm md:text-base font-medium hover:bg-[#0D1321]/90 transition-colors"
          >
            {t("browseDebates")}
          </Link>
          <Link
            href="/create-tournament"
            className="px-4 py-2 rounded-md border border-black/20 text-sm md:text-base font-medium hover:bg-black/5 transition-colors"
          >
            {t("hostDebate")}
          </Link>
        </div>
        <div aria-hidden className="text-sm text-black/60">
          {t("connectUs")}
        </div>
      </div>
      <header className="space-y-2">
        <h2 className="text-3xl md:text-4xl font-semibold leading-tight">
          {t("advicePrefix")}{" "}
          <span className="text-[#748CAB]">{t("expertAdvice")}</span>{" "}
          {t("adviceSuffix")}
          {!isKazakh && (
            <>
              <br />
              {t("debatingJourney")}
            </>
          )}
        </h2>
        <p className="text-black/70 max-w-3xl">{t("description")}</p>
      </header>
      <div className="w-full overflow-hidden rounded-[20px] bg-black/5">
        <div className="relative aspect-[16/9] w-full">
          <Image
            src={imageSrc}
            alt={t("guidanceAlt")}
            fill
            className="object-cover"
            priority={false}
          />
        </div>
      </div>
      <section aria-labelledby="faq-heading" className="space-y-4">
        <h3 id="faq-heading" className="text-2xl font-semibold">
          {t("faq")}
        </h3>
        <div className="divide-y divide-black/10 rounded-xl border border-black/10 bg-white">
          {faqItems.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={idx} className="p-4 md:p-5">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between text-left"
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${idx}`}
                >
                  <span className="text-base md:text-lg font-medium">
                    {item.question}
                  </span>
                  <span
                    className="ml-4 inline-flex h-6 w-6 items-center justify-center rounded border border-black/20"
                    aria-hidden="true"
                  >
                    {isOpen ? "-" : "+"}
                  </span>
                </button>
                {isOpen && (
                  <div id={`faq-panel-${idx}`} className="mt-3 text-black/70">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
      <footer className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-black/10 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-md bg-black text-white flex items-center justify-center text-sm font-semibold">
              DB
            </div>
            <nav
              aria-label={t("socialLinks")}
              className="flex items-center gap-3 text-sm text-black/70"
            >
              <span
                className="h-7 w-7 rounded bg-black/5 inline-flex items-center justify-center"
                aria-hidden
              >
                {t("icon")}
              </span>
              <span
                className="h-7 w-7 rounded bg-black/5 inline-flex items-center justify-center"
                aria-hidden
              >
                {t("icon")}
              </span>
              <span
                className="h-7 w-7 rounded bg-black/5 inline-flex items-center justify-center"
                aria-hidden
              >
                {t("icon")}
              </span>
            </nav>
          </div>
        </div>
        <div className="border-t border-black/10 pt-4 text-xs md:text-sm text-black/60 flex flex-wrap items-center justify-between gap-3">
          <div>{t("contactUs")}</div>
          <div>{t("allRights")}</div>
          <div>
            <a
              href="#"
              className="underline underline-offset-2 hover:text-black/80"
            >
              {t("privacy")}
            </a>
          </div>
        </div>
      </footer>
    </section>
  );
}
