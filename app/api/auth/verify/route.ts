import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "~/lib/supabase";
import { db } from "~/server/db";
import { users } from "~/server/db/schema";

/**
 * This is a simplified verify route that works with Supabase's verification system.
 * It can be used to check verification status or handle special verification logic
 * that might be needed in your application.
 */
export async function POST(request: NextRequest) {
	try {
		const supabase = createServerClient();
		const body = await request.json();
		const { email, action } = body;

		if (!email) {
			return NextResponse.json({ error: "Email is required" }, { status: 400 });
		}

		// Get current auth user to check verification status
		const { data: userList, error: userError } =
			await supabase.auth.admin.listUsers();

		// Find the user with matching email
		const userData = userList?.users?.find((user) => user.email === email);

		if (userError || !userData) {
			return NextResponse.json(
				{ error: "Error fetching user" },
				{ status: 500 },
			);
		}

		if (!userData) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		// Check if the user is verified in Supabase
		const isVerified = userData.email_confirmed_at !== null;

		// If user is verified, update our local database too
		if (isVerified) {
			await db
				.update(users)
				.set({ emailVerified: true })
				.where(eq(users.email, email));
		}

		// If action is "check", just return verification status
		if (action === "check") {
			return NextResponse.json({
				verified: isVerified,
				userId: userData.id,
			});
		}

		// If action is "send", you could trigger a new verification email
		// (though Supabase usually handles this during sign-in attempts)
		if (action === "send" && !isVerified) {
			const { error: resendError } = await supabase.auth.resetPasswordForEmail(
				email,
				{
					redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/login`,
				},
			);

			if (resendError) {
				return NextResponse.json(
					{ error: "Failed to send verification email" },
					{ status: 500 },
				);
			}

			return NextResponse.json({
				success: true,
				message: "Verification email sent",
			});
		}

		return NextResponse.json({
			success: true,
			verified: isVerified,
		});
	} catch (error) {
		console.error("Verification error:", error);
		return NextResponse.json(
			{ error: "Server error during verification" },
			{ status: 500 },
		);
	}
}
