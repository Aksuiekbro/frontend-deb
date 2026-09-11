import Image from "next/image";
import Link from "next/link";
import React from "react";

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

const defaultFaq: FAQItem[] = [
	{
		question: "What happens if you’re unavailable on our event day?",
		answer:
			"In rare cases of emergency, we provide timely notice and help with a qualified backup.",
	},
	{
		question: "How long does it take to receive schedules?",
		answer: "Schedules are generated within minutes after registrations close.",
	},
	{
		question: "Can we request specific formats or rules?",
		answer: "Yes, organizers can configure formats, time limits, and speaker orders.",
	},
	{
		question: "What if participants are new to debating?",
		answer:
			"We provide guidance notes and onboarding materials to help first-time debaters.",
	},
];

export default function OrganizerBelow(props: OrganizerBelowProps) {
	const {
        imageSrc = "/organizer_placeholder.png",
		faq = defaultFaq,
		initialOpenIndex = 0,
		className,
	} = props;

	const [openIndex, setOpenIndex] = React.useState<number | null>(
		Number.isInteger(initialOpenIndex) ? initialOpenIndex : 0,
	);

	return (
		<section
			className={`db-container py-12 space-y-12 ${
				className ? className : ""
			}`}
		>
			{/* CTA Row */}
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div className="flex flex-wrap items-center gap-3">
					<button
						type="button"
						className="db-btn db-btn-primary"
					>
						Join Debates
					</button>
                  <Link
                    href="/create-tournament"
                    className="db-btn db-btn-on-backdrop"
                  >
                    Host Debate
                  </Link>
				</div>
				<div aria-hidden className="text-sm home-sub">Connect Us</div>
			</div>

			{/* Title */}
			<header className="space-y-2">
				<h2 className="home-heading text-3xl md:text-4xl font-semibold leading-tight font-[var(--db-font-display)]">
					Get <span className="text-[var(--db-accent)]">Expert Advice</span> on
					<br />
					Debating journey
				</h2>
				<p className="home-sub max-w-3xl">
					Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam
					libero urna, mollis a rhoncus id, convallis in dui. Sed erat arcu,
					porttitor ut mi sed, elementum venenatis lectus. Nam porttitor
					pharetra tortor non consequat.
				</p>
			</header>

			{/* Image */}
			<div className="db-panel w-full overflow-hidden">
				<div className="relative aspect-[16/9] w-full">
					<Image
						src={imageSrc}
						alt="Organizer guidance"
						fill
						className="object-cover"
						priority={false}
					/>
				</div>
			</div>

			{/* FAQ */}
			<section aria-labelledby="faq-heading" className="space-y-4">
				<h3 id="faq-heading" className="home-heading text-2xl font-semibold font-[var(--db-font-display)]">
					FAQ
				</h3>
				<div className="db-panel divide-y" style={{ borderColor: 'var(--db-border)' }}>
					{faq.map((item, idx) => {
						const isOpen = openIndex === idx;
						return (
							<div key={idx} className="p-4 md:p-5" style={{ borderColor: 'var(--db-border)' }}>
								<button
									onClick={() =>
										setOpenIndex(isOpen ? null : idx)
									}
									className="w-full flex items-center justify-between text-left"
									aria-expanded={isOpen}
									aria-controls={`faq-panel-${idx}`}
								>
									<span className="text-base md:text-lg font-medium text-[var(--db-fg)]">
										{item.question}
									</span>
									<span
										className="ml-4 inline-flex h-6 w-6 items-center justify-center rounded border border-[var(--db-border)] text-[var(--db-fg)]"
										aria-hidden="true"
									>
										{isOpen ? "-" : "+"}
									</span>
								</button>
								{isOpen ? (
									<div
										id={`faq-panel-${idx}`}
										className="mt-3 text-[var(--db-muted)]"
									>
										{item.answer}
									</div>
								) : null}
							</div>
						);
					})}
				</div>
			</section>
		</section>
	);
}
