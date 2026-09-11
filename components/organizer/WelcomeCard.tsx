import Link from "next/link";
import React from "react";

export interface WelcomeCardProps {
	username?: string;
	userId?: number | string;
	profileHref?: string;
	tournaments?: number;
	activeTournaments?: number;
	className?: string;
}

export default function WelcomeCard(props: WelcomeCardProps) {
	const {
		username = "User",
		userId,
		profileHref,
		tournaments = 0,
		activeTournaments = 0,
		className,
	} = props;

	const myProfileHref = profileHref ?? (userId != null ? `/profile/${userId}` : "/profile");

	const initial = (username && username[0]) ? username[0].toUpperCase() : "U";

	return (
		<section
			aria-labelledby="welcome-heading"
			className={`home-hero-slide rounded-[10px] px-6 md:px-10 py-8 md:py-10 text-white ${
				className ? className : ""
			}`}
		>
			<div className="flex flex-wrap items-center justify-between gap-6">
				<div className="flex items-center gap-4">
					<div
						className="h-14 w-14 md:h-16 md:w-16 rounded-full bg-white/10 flex items-center justify-center text-lg md:text-xl font-semibold"
						aria-hidden="true"
					>
						{initial}
					</div>
					<div>
						<h2 id="welcome-heading" className="text-xl md:text-2xl font-semibold font-[var(--db-font-display)]">
							Welcome Back {username}!
						</h2>
						<p className="text-sm text-white/70">Glad to see you again.</p>
					</div>
				</div>

				<nav aria-label="User actions" className="flex flex-wrap gap-3">
					<Link
						href={myProfileHref}
						className="db-btn db-btn-primary"
					>
						My Profile
					</Link>
					<Link
						href="/my-tournaments"
						className="db-btn db-btn-ghost-on-dark"
					>
						My Tournaments
					</Link>
				</nav>
			</div>

			<div className="mt-8">
				<h3 className="text-sm uppercase tracking-wide text-white/70">Your Stats</h3>
				<dl className="mt-4 grid grid-cols-2 gap-4">
					<div className="rounded-lg bg-white/5 p-4">
						<dt className="text-white/70 text-sm">Tournaments</dt>
						<dd className="text-2xl md:text-3xl font-bold">{tournaments}</dd>
					</div>
					<div className="rounded-lg bg-white/5 p-4">
						<dt className="text-white/70 text-sm">Active Tournaments</dt>
						<dd className="text-2xl md:text-3xl font-bold">{activeTournaments}</dd>
					</div>
				</dl>
			</div>
		</section>
	);
}
