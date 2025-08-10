import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { setRequestLocale } from "next-intl/server";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";
import { AuthProvider } from "~/components/auth/AuthProvider";
import { ThemeProvider } from "~/components/theme-provider";
import { Toaster } from "~/components/ui/toaster";
import { TooltipProvider } from "~/components/ui/tooltip";
import { routing } from "~/i18n/routing";
import { TRPCReactProvider } from "~/trpc/react";

const inter = Inter({ subsets: ["latin"] });

export function generateStaticParams() {
	return routing.locales.map((locale) => ({ locale }));
}

interface LocaleLayoutProps {
	children: React.ReactNode;
	params: Promise<{
		locale: string;
	}>;
}

export default async function LocaleLayout({
	children,
	params,
}: LocaleLayoutProps) {
	// Await params properly in async function
	const { locale } = await params;

	// Ensure that the incoming `locale` is valid
	if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
		notFound();
	}

	// Enable static rendering
	setRequestLocale(locale);

	// Providing all messages to the client
	// side is the easiest way to get started
	const messages = await getMessages({ locale });

	return (
		<html lang={locale} suppressHydrationWarning>
			<body className={inter.className}>
				<NextIntlClientProvider messages={messages}>
					<TRPCReactProvider>
						<ThemeProvider
							attribute="class"
							defaultTheme="system"
							enableSystem
							disableTransitionOnChange
						>
							<AuthProvider>
								{/* Add a global TooltipProvider to prevent nested tooltip providers causing render loops */}
								<TooltipProvider delayDuration={300}>
									<div className="min-h-screen bg-gray-50">
										<main>{children}</main>
									</div>
								</TooltipProvider>
								<Toaster />
							</AuthProvider>
						</ThemeProvider>
					</TRPCReactProvider>
				</NextIntlClientProvider>
			</body>
		</html>
	);
}
