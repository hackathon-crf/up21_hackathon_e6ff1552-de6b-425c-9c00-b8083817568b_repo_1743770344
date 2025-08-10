"use client";

import { Check, Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { Button } from "~/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { usePathname, useRouter } from "~/i18n/navigation";
import { routing } from "~/i18n/routing";

const languages = {
	fr: { name: "Français", flag: "🇫🇷" },
	en: { name: "English", flag: "🇺🇸" },
} as const;

export function LanguageSwitcher() {
	const t = useTranslations("common");
	const locale = useLocale();
	const router = useRouter();
	const pathname = usePathname();
	const [isPending, startTransition] = useTransition();

	const handleLanguageChange = (newLocale: string) => {
		startTransition(() => {
			// Use the locale-aware router which handles locale switching properly
			router.replace(pathname, { locale: newLocale });
		});
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="outline"
					size="sm"
					className="gap-2"
					disabled={isPending}
				>
					<Globe className="h-4 w-4" />
					<span className="hidden sm:inline-block">
						{languages[locale as keyof typeof languages]?.flag}
						{languages[locale as keyof typeof languages]?.name}
					</span>
					<span className="sm:hidden">
						{languages[locale as keyof typeof languages]?.flag}
					</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-48">
				{routing.locales.map((lang: string) => (
					<DropdownMenuItem
						key={lang}
						onClick={() => handleLanguageChange(lang)}
						className="flex cursor-pointer items-center justify-between"
					>
						<div className="flex items-center gap-2">
							<span>{languages[lang as keyof typeof languages]?.flag}</span>
							<span>{languages[lang as keyof typeof languages]?.name}</span>
						</div>
						{locale === lang && <Check className="h-4 w-4 text-green-600" />}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
