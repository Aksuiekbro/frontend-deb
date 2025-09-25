import React from "react";

export interface OrganizerTestimonialItem {
	name: string;
	role: string;
	text: string;
}

export interface OrganizerTestimonialsProps {
	items?: OrganizerTestimonialItem[];
	className?: string;
}

const defaultItems: OrganizerTestimonialItem[] = [
	{
		name: "Alex Chen",
		role: "Tournament Director",
		text:
			"This platform streamlined our entire registration and scheduling process.",
	},
	{
		name: "Priya Singh",
		role: "Coach",
		text:
			"Our students love the clarity and structure. Planning debates is a breeze.",
	},
	{
		name: "Marcus Lee",
		role: "Organizer",
		text:
			"Reliable tools and great UX — it saved us hours every tournament.",
	},
];

export default function OrganizerTestimonials(
	props: OrganizerTestimonialsProps,
) {
	const { items = defaultItems, className } = props;

	return (
		<section
			aria-labelledby="testimonials-heading"
			className={`w-full ${className ? className : ""}`}
		>
			<h2 id="testimonials-heading" className="text-2xl font-semibold">
				Testimonials
			</h2>
			<div className="mt-6 grid gap-6 md:grid-cols-3">
				{items.map((t, idx) => (
					<article
						key={`${t.name}-${idx}`}
						className="rounded-xl border border-black/10 bg-white p-6 shadow-sm"
					>
						<header className="mb-3">
							<h3 className="text-lg font-medium">{t.name}</h3>
							<p className="text-sm text-black/60">{t.role}</p>
						</header>
						<p className="text-black/80">{t.text}</p>
					</article>
				))}
			</div>
		</section>
	);
}

"use client"

// Minimal extraction of the testimonials block from the Figma export.
// Note: This preserves visuals but still uses absolute positioning. We won't render it for now.

const imgVector = "http://localhost:3845/assets/2d5f19ff54f8a7bc55d0c2f6198e4bc14a1e8175.svg";
const imgEllipse2 = "http://localhost:3845/assets/027806adc24a4f992aba4bf6149d5f329926066b.svg";

function IconexLightLeftCircle() {
  return (
    <div className="relative size-full">
      <div className="absolute contents left-[2px] top-[2px]">
        <div className="absolute flex items-center justify-center left-[2px] size-[52px] top-[2px]">
          <div className="flex-none scale-y-[-100%]">
            <div className="relative size-[52px]">
              <div className="absolute inset-[-1.442%]">
                <img alt="" className="block max-w-none size-full" src={imgVector} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrganizerTestimonials() {
  return (
    <div className="relative">
      <p className="absolute left-[80px] text-[#0d1321] text-[46px] top-[1543px]">Testimonials</p>
      <div className="absolute aspect-[24/24] flex items-center justify-center left-[5.56%] right-[90.56%] translate-y-[-50%]" style={{ top: "calc(50% - 697px)" }}>
        <div className="flex-none scale-y-[-100%] size-[56px]"><IconexLightLeftCircle /></div>
      </div>
      <div className="absolute aspect-[24/24] flex items-center justify-center left-[90.56%] right-[5.56%] translate-y-[-50%]" style={{ top: "calc(50% - 697px)" }}>
        <div className="flex-none rotate-[180deg] size-[56px]"><IconexLightLeftCircle /></div>
      </div>
      {/* Card 1 */}
      <div className="absolute bg-[#f1f1f1] h-[378px] left-[160px] rounded-[10px] top-[1624px] w-[340px]">
        <div aria-hidden="true" className="absolute border border-[#3e5c76] border-solid inset-0 pointer-events-none rounded-[10px]" />
      </div>
      <p className="absolute text-[#3e5c76] text-[20px] top-[1748px]" style={{ left: "calc(8.333% + 108px)" }}>Zheksembek Abdolla</p>
      <p className="absolute text-[#3e5c76] text-[14px] top-[1775px]" style={{ left: "calc(16.667% + 59px)" }}>Debatter</p>
      <div className="absolute size-[60px] top-[1674px]" style={{ left: "calc(16.667% + 60px)" }}>
        <img alt="" className="block max-w-none size-full" src={imgEllipse2} />
      </div>
      <p className="absolute text-[#3e5c76] text-[14px] text-center top-[1819px] translate-x-[-50%] w-[256px]" style={{ left: "calc(8.333% + 210px)" }}>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi posuere ipsum vel mattis mollis.
      </p>
      {/* Card 2 */}
      <div className="absolute bg-[#f1f1f1] h-[378px] rounded-[10px] top-[1624px] w-[340px]" style={{ left: "calc(33.333% + 70px)" }}>
        <div aria-hidden="true" className="absolute border border-[#3e5c76] border-solid inset-0 pointer-events-none rounded-[10px]" />
      </div>
      <p className="absolute text-[#3e5c76] text-[20px] top-[1748px]" style={{ left: "calc(41.667% + 18px)" }}>Zheksembek Abdolla</p>
      <p className="absolute text-[#3e5c76] text-[14px] top-[1775px]" style={{ left: "calc(41.667% + 89px)" }}>Debatter</p>
      <div className="absolute size-[60px] top-[1674px]" style={{ left: "calc(41.667% + 90px)" }}>
        <img alt="" className="block max-w-none size-full" src={imgEllipse2} />
      </div>
      <p className="absolute text-[#3e5c76] text-[14px] text-center top-[1819px] translate-x-[-50%] w-[256px]" style={{ left: "calc(33.333% + 240px)" }}>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi posuere ipsum vel mattis mollis.
      </p>
      {/* Card 3 */}
      <div className="absolute bg-[#f1f1f1] h-[378px] rounded-[10px] top-[1624px] w-[340px]" style={{ left: "calc(66.667% - 20px)" }}>
        <div aria-hidden="true" className="absolute border border-[#3e5c76] border-solid inset-0 pointer-events-none rounded-[10px]" />
      </div>
      <p className="absolute text-[#3e5c76] text-[20px] top-[1748px]" style={{ left: "calc(66.667% + 48px)" }}>Zheksembek Abdolla</p>
      <p className="absolute text-[#3e5c76] text-[14px] top-[1775px]" style={{ left: "calc(75% - 1px)" }}>Debatter</p>
      <div className="absolute left-3/4 size-[60px] top-[1674px]">
        <img alt="" className="block max-w-none size-full" src={imgEllipse2} />
      </div>
      <p className="absolute text-[#3e5c76] text-[14px] text-center top-[1819px] translate-x-[-50%] w-[256px]" style={{ left: "calc(66.667% + 150px)" }}>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi posuere ipsum vel mattis mollis.
      </p>
    </div>
  )
}


