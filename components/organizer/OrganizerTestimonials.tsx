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

