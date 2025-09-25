"use client"

import Header from "../../components/Header"
import OrganizerBelow from "@/components/organizer/OrganizerBelow"
import HomeTop from "@/components/home/HomeTop"
import WelcomeCard from "@/components/organizer/WelcomeCard"

export default function OrganizerHomePage() {
  return (
    <div className="min-h-screen bg-[#F1F1F1] font-hikasami">
      <Header />
      {/* Use the same top sections as the public homepage (without testimonials) */}
      <HomeTop includeTestimonials={false} aboveUpcoming={<WelcomeCard />} />
      {/* Keep everything below Testimonials from the organizer design */}
      <div className="flex justify-center py-6"><OrganizerBelow /></div>
    </div>
  )
}


