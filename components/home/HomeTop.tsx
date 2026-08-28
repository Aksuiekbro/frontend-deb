"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCurrentUser, useUpcomingTournaments } from "@/hooks/use-api";
import { LoadingState, CardSkeleton } from "@/components/ui/loading";
import { ErrorState } from "@/components/ui/error";
import { Role } from "@/types/user/user";
import {
  localeTags,
  useLocale,
  useTranslations,
  type TranslationCatalog,
} from "@/lib/i18n";

type HomeTopProps = {
  includeTestimonials?: boolean;
  aboveUpcoming?: ReactNode;
};

const messages: TranslationCatalog = {
  en: {
    welcomeTo: "Welcome to DeBetter",
    websiteForDebates: "website for",
    debatesOrganisation: "debates organisation",
    joinDebate: "Join Debate",
    browseDebates: "Browse Debates",
    createTournament: "Create Tournament",
    slide: "Slide {number}",
    previousSlide: "Previous slide",
    nextSlide: "Next slide",
    upcomingDebates: "Upcoming Debates",
    failedUpcoming: "Failed to load upcoming tournaments",
    locationTba: "Location TBA",
    dateTba: "Date TBA",
    schoolLeague: "School league",
    universityLeague: "University league",
    more: "More...",
    joinDebates: "Join Debates",
    noUpcoming: "No upcoming tournaments available",
    communityVoices: "Community Voices",
    communityEmpty:
      "Community testimonials will appear as more users join tournaments",
  },
  ru: {
    welcomeTo: "Добро пожаловать в DeBetter",
    websiteForDebates: "сайт для",
    debatesOrganisation: "организации дебатов",
    joinDebate: "Присоединиться к дебатам",
    browseDebates: "Смотреть дебаты",
    createTournament: "Создать турнир",
    slide: "Слайд {number}",
    previousSlide: "Предыдущий слайд",
    nextSlide: "Следующий слайд",
    upcomingDebates: "Предстоящие дебаты",
    failedUpcoming: "Не удалось загрузить предстоящие турниры",
    locationTba: "Место уточняется",
    dateTba: "Дата уточняется",
    schoolLeague: "Школьная лига",
    universityLeague: "Университетская лига",
    more: "Подробнее...",
    joinDebates: "Присоединиться к дебатам",
    noUpcoming: "Нет доступных предстоящих турниров",
    communityVoices: "Мнения сообщества",
    communityEmpty:
      "Отзывы участников появятся, когда к турнирам присоединится больше пользователей",
  },
  kk: {
    welcomeTo: "DeBetter-ге қош келдіңіз",
    websiteForDebates: "пікірсайыстарды",
    debatesOrganisation: "ұйымдастыруға арналған сайт",
    joinDebate: "Пікірсайысқа қосылу",
    browseDebates: "Пікірсайыстарды көру",
    createTournament: "Турнир құру",
    slide: "Слайд {number}",
    previousSlide: "Алдыңғы слайд",
    nextSlide: "Келесі слайд",
    upcomingDebates: "Алдағы пікірсайыстар",
    failedUpcoming: "Алдағы турнирлерді жүктеу мүмкін болмады",
    locationTba: "Өтетін орны нақтылануда",
    dateTba: "Күні нақтылануда",
    schoolLeague: "Мектеп лигасы",
    universityLeague: "Университет лигасы",
    more: "Толығырақ...",
    joinDebates: "Пікірсайыстарға қосылу",
    noUpcoming: "Қолжетімді алдағы турнирлер жоқ",
    communityVoices: "Қауымдастық пікірі",
    communityEmpty:
      "Турнирлерге көбірек пайдаланушы қосылған сайын қауымдастық пікірлері пайда болады",
  },
};

export default function HomeTop({
  includeTestimonials = true,
  aboveUpcoming,
}: HomeTopProps) {
  const { locale } = useLocale();
  const t = useTranslations(messages);
  const {
    user: currentUser,
    isLoading: currentUserLoading,
    error: currentUserError,
  } = useCurrentUser();
  const isOrganizer = currentUser?.role === Role.ORGANIZER;
  const hasResolvedCurrentUser = !currentUserLoading && !currentUserError;
  const canBrowseDebates = hasResolvedCurrentUser;
  const canHostDebates = hasResolvedCurrentUser && (isOrganizer || !currentUser);
  const formatLeague = (league: string) => {
    if (league === "SCHOOL") return t("schoolLeague");
    if (league === "UNIVERSITY") return t("universityLeague");
    return league;
  };
  const [activeSlide, setActiveSlide] = useState<number>(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: "start",
  });
  const {
    upcomingTournaments,
    isLoading: tournamentsLoading,
    error: tournamentsError,
  } = useUpcomingTournaments(6);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setActiveSlide(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi]);

  return (
    <>
      <section className="text-center py-8">
        <h1 className="text-[#0D1321] text-[56px] font-bold mb-6 md:mb-8 font-hikasami">
          {t("welcomeTo")}
        </h1>
        <div className="relative mx-8">
          <div ref={emblaRef} className="overflow-hidden rounded-[16px]">
            <div className="flex">
              {[0, 1].map((i) => (
                <div key={i} className="min-w-0 flex-[0_0_100%]">
                  <div
                    className="rounded-[16px] py-6 md:py-10 px-6 md:px-8 relative h-[360px] md:h-[311px] overflow-hidden"
                    style={{
                      boxShadow: "0px 10px 28px 4px rgba(43, 63, 108, 0.25)",
                    }}
                  >
                    {i === 1 ? (
                      <img
                        src="/images/Frame 78.png"
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 w-full h-full object-cover rounded-[16px]"
                      />
                    ) : (
                      <>
                        <div className="absolute inset-0 rounded-[16px] bg-gradient-to-r from-[#0D1321] to-[#2B3F6C] z-10" />
                        <div className="relative z-20 h-full flex flex-col justify-center">
                          <h2 className="text-[#FFFFFF] text-[30px] md:text-[46px] font-semibold mb-6 md:mb-8 font-hikasami">
                            <span className="text-[#748CAB] font-hikasami font-semibold">
                              DeBetter
                            </span>{" "}
                            - {t("websiteForDebates")}{" "}
                            <span className="text-[#748CAB] font-hikasami font-semibold">
                              {t("debatesOrganisation")}
                            </span>
                          </h2>
                          <div className="flex justify-center space-x-4 mb-8">
                            {canBrowseDebates && (
                              <Link
                                href="/join"
                                className="inline-block bg-[#3E5C76] text-[#FFFFFF] px-6 py-3 rounded-[8px] hover:bg-[#748cab] text-[16px] font-normal font-hikasami text-center"
                              >
                                {isOrganizer ? t("browseDebates") : t("joinDebate")}
                              </Link>
                            )}
                            {canHostDebates && (
                              <Link
                                href="/tournament/create"
                                className="border border-[#FFFFFF] text-[#FFFFFF] px-6 py-3 rounded-[8px] hover:bg-[#FFFFFF] hover:text-[#22223b] text-[16px] font-normal font-hikasami"
                              >
                                {t("createTournament")}
                              </Link>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-2 z-20">
            <button
              type="button"
              aria-label={t("slide", { number: 1 })}
              onClick={() => emblaApi?.scrollTo(0)}
              className={`h-[4px] rounded transition-all duration-200 ${activeSlide === 0 ? "w-[28px] bg-white" : "w-[24px] bg-[#3E5C76]"}`}
            />
            <button
              type="button"
              aria-label={t("slide", { number: 2 })}
              onClick={() => emblaApi?.scrollTo(1)}
              className={`h-[4px] rounded transition-all duration-200 ${activeSlide === 1 ? "w-[28px] bg-white" : "w-[24px] bg-[#3E5C76]"}`}
            />
          </div>
        </div>
      </section>
      {aboveUpcoming}
      <section className="px-8 pt-6 pb-12">
        <h3 className="text-[#0D1321] text-[38px] font-semibold mb-8 font-hikasami">
          {t("upcomingDebates")}
        </h3>
        <LoadingState
          isLoading={tournamentsLoading}
          fallback={
            <div className="flex space-x-6 px-16">
              <CardSkeleton />
              <CardSkeleton />
            </div>
          }
        >
          {tournamentsError ? (
            <ErrorState
              error={tournamentsError}
              onRetry={() => window.location.reload()}
              message={t("failedUpcoming")}
            />
          ) : upcomingTournaments && upcomingTournaments.content.length > 0 ? (
            <div className="relative">
              <button
                type="button"
                aria-label={t("previousSlide")}
                className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-lg z-10"
              >
                <ChevronLeft className="w-[24px] h-[24px] text-[#4a4e69]" />
              </button>
              <div className="flex space-x-6 overflow-hidden px-16">
                {upcomingTournaments.content.slice(0, 2).map((tournament) => (
                  <div
                    key={tournament.id}
                    className="bg-[#0D1321] rounded-[12px] p-6 flex-1 min-w-0"
                  >
                    <h4 className="text-[#FFFFFF] text-[30px] font-medium mb-2 font-hikasami">
                      {tournament.name}
                    </h4>
                    <p className="text-[#9a8c98] mb-1 text-[16px] font-normal font-hikasami">
                      {tournament.location || t("locationTba")}
                    </p>
                    <p className="text-[#9a8c98] mb-4 text-[16px] font-normal font-hikasami">
                      {tournament.startDate
                        ? new Date(tournament.startDate).toLocaleDateString(
                            localeTags[locale],
                          )
                        : t("dateTba")}
                    </p>
                    <div className="flex space-x-2 mb-6">
                      <span className="bg-[#FFFFFF] text-[#22223b] px-3 py-1 rounded text-[14px] font-normal font-hikasami cursor-default">
                        {tournament.preliminaryFormat}
                      </span>
                      <span className="bg-[#FFFFFF] text-[#22223b] px-3 py-1 rounded text-[14px] font-normal font-hikasami cursor-default">
                        {tournament.teamEliminationFormat}
                      </span>
                      <span className="bg-[#FFFFFF] text-[#22223b] px-3 py-1 rounded text-[14px] font-normal font-hikasami cursor-default">
                        {formatLeague(tournament.league)}
                      </span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-start">
                        <Link
                          href={`/tournament/${tournament.id}`}
                          className="text-[#FFFFFF] underline hover:text-[#83c5be] text-[14px] font-normal font-hikasami"
                        >
                          {t("more")}
                        </Link>
                      </div>
                      {canBrowseDebates && (
                        <div className="flex justify-start">
                          <Link
                            href="/join"
                            className="inline-block bg-[#3E5C76] text-[#FFFFFF] px-4 py-2 rounded hover:bg-[#748cab] text-[14px] font-normal font-hikasami text-center"
                          >
                            {isOrganizer ? t("browseDebates") : t("joinDebates")}
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                aria-label={t("nextSlide")}
                className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-lg z-10"
              >
                <ChevronRight className="w-[24px] h-[24px] text-[#4a4e69]" />
              </button>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-[#4a4e69] text-[18px] font-hikasami">
                {t("noUpcoming")}
              </p>
              {canHostDebates && (
                <Link
                  href="/tournament/create"
                  className="inline-block mt-4 bg-[#3E5C76] text-[#FFFFFF] px-6 py-3 rounded hover:bg-[#748cab] text-[16px] font-normal font-hikasami"
                >
                  {t("createTournament")}
                </Link>
              )}
            </div>
          )}
        </LoadingState>
      </section>
      {includeTestimonials && (
        <section className="px-8 py-12">
          <h3 className="text-[#0D1321] text-[38px] font-semibold mb-8 font-hikasami">
            {t("communityVoices")}
          </h3>
          <div className="text-center py-12">
            <p className="text-[#4a4e69] text-[18px] font-hikasami">
              {t("communityEmpty")}
            </p>
          </div>
        </section>
      )}
    </>
  );
}
