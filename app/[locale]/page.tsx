"use client";

import { Shield } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useAuth } from "~/components/auth/AuthProvider";
import { Button } from "~/components/ui/button";
import { useRouter } from "~/i18n/navigation";

export default function Home() {
	const t = useTranslations();
	const router = useRouter();
	const { user, isLoading } = useAuth();

	useEffect(() => {
		if (isLoading) return;

		// Redirect authenticated users to chat, others to login
		if (user) {
			router.push("/chat");
		} else {
			router.push("/auth/login");
		}
	}, [user, isLoading, router]);

	// Show a loading state while redirecting
	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
			<div className="flex flex-col items-center gap-6 text-center">
				<div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-600 shadow-lg">
					<Shield className="h-12 w-12 text-white" />
				</div>
				<div>
					<h1 className="mb-2 font-bold text-4xl text-gray-900">
						{t("homePage.title")}
					</h1>
					<p className="mb-6 text-gray-600 text-lg">{t("homePage.subtitle")}</p>
				</div>

				<div className="flex flex-col gap-3">
					<div className="flex items-center gap-3">
						<div className="h-2 w-2 animate-pulse rounded-full bg-red-600" />
						<span className="text-gray-500">{t("common.loading")}...</span>
					</div>
				</div>

				{/* Show manual navigation buttons if redirect takes too long */}
				<div className="mt-8 flex flex-col gap-3 sm:flex-row">
					<Button
						variant="default"
						onClick={() => router.push("/auth/login")}
						className="bg-red-600 hover:bg-red-700"
					>
						{t("homePage.getStarted")}
					</Button>
					<Button variant="outline" onClick={() => router.push("/chat")}>
						{t("homePage.continueToChat")}
					</Button>
				</div>
			</div>
		</div>
	);
}
