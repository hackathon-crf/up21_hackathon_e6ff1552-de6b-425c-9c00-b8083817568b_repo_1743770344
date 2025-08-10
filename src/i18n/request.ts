import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
	// This typically corresponds to the `[locale]` segment
	const requestedLocale = await requestLocale;

	// Ensure that a valid locale is used
	const locale =
		requestedLocale &&
		routing.locales.includes(
			requestedLocale as (typeof routing.locales)[number],
		)
			? requestedLocale
			: routing.defaultLocale;

	return {
		locale,
		messages: (await import(`../../messages/${locale}.json`)).default,
	};
});
