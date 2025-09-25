import Image from "next/image";
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
		imageSrc = "/placeholder-1280x720.png",
		faq = defaultFaq,
		initialOpenIndex = 0,
		className,
	} = props;

	const [openIndex, setOpenIndex] = React.useState<number | null>(
		Number.isInteger(initialOpenIndex) ? initialOpenIndex : 0,
	);

	return (
		<section
			className={`container mx-auto max-w-[1280px] px-8 py-12 space-y-12 ${
				className ? className : ""
			}`}
		>
			{/* CTA Row */}
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div className="flex items-center gap-3">
					<button
						type="button"
						className="px-4 py-2 rounded-md bg-[#0D1321] text-white text-sm md:text-base font-medium hover:bg-[#0D1321]/90 transition-colors"
					>
						Join Debates
					</button>
					<button
						type="button"
						className="px-4 py-2 rounded-md border border-black/20 text-sm md:text-base font-medium hover:bg-black/5 transition-colors"
					>
						Host Debate
					</button>
				</div>
				<div aria-hidden className="text-sm text-black/60">Connect Us</div>
			</div>

			{/* Title */}
			<header className="space-y-2">
				<h2 className="text-3xl md:text-4xl font-semibold leading-tight">
					Get <span className="text-[#748CAB]">Expert Advice</span> on
					<br />
					Debating journey
				</h2>
				<p className="text-black/70 max-w-3xl">
					Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam
					libero urna, mollis a rhoncus id, convallis in dui. Sed erat arcu,
					porttitor ut mi sed, elementum venenatis lectus. Nam porttitor
					pharetra tortor non consequat.
				</p>
			</header>

			{/* Image */}
			<div className="w-full overflow-hidden rounded-[20px] bg-black/5">
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
				<h3 id="faq-heading" className="text-2xl font-semibold">
					FAQ
				</h3>
				<div className="divide-y divide-black/10 rounded-xl border border-black/10 bg-white">
					{faq.map((item, idx) => {
						const isOpen = openIndex === idx;
						return (
							<div key={idx} className="p-4 md:p-5">
								<button
									onClick={() =>
										setOpenIndex(isOpen ? null : idx)
									}
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
								{isOpen ? (
									<div
										id={`faq-panel-${idx}`}
										className="mt-3 text-black/70"
									>
										{item.answer}
									</div>
								) : null}
							</div>
						);
					})}
				</div>
			</section>

			{/* Footer */}
			<footer className="space-y-6">
				<div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-black/10 bg-white p-4">
					<div className="flex items-center gap-3">
						<div className="h-9 w-9 rounded-md bg-black text-white flex items-center justify-center text-sm font-semibold">
							DB
						</div>
						<nav aria-label="Social links" className="flex items-center gap-3 text-sm text-black/70">
							<span className="h-7 w-7 rounded bg-black/5 inline-flex items-center justify-center" aria-hidden>
								Icon
							</span>
							<span className="h-7 w-7 rounded bg-black/5 inline-flex items-center justify-center" aria-hidden>
								Icon
							</span>
							<span className="h-7 w-7 rounded bg-black/5 inline-flex items-center justify-center" aria-hidden>
								Icon
							</span>
						</nav>
					</div>
				</div>
				<div className="border-t border-black/10 pt-4 text-xs md:text-sm text-black/60 flex flex-wrap items-center justify-between gap-3">
					<div>Contact us: debetter@gmail.com</div>
					<div>© 2025 all rights reserved</div>
					<div>
						<a href="#" className="underline underline-offset-2 hover:text-black/80">
							Privacy Policy
						</a>
					</div>
				</div>
			</footer>
		</section>
	);
}
