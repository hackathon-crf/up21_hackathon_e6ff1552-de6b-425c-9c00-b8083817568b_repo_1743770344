import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "~/lib/supabase";
import { db } from "~/server/db";
import { users } from "~/server/db/schema";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { email } = body;

		if (!email) {
			return NextResponse.json({ error: "Email is required" }, { status: 400 });
		}

		// Get Supabase admin client
		const supabase = createServerClient();

		// Get the user from Supabase
		const { data, error } = await supabase.auth.admin.listUsers();

		if (error) {
			console.error("Error fetching users:", error);
			return NextResponse.json(
				{ error: "Error fetching users" },
				{ status: 500 },
			);
		}

		// Find the user with the matching email
		const user = data.users.find((u) => u.email === email);

		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		// Update Supabase Auth user metadata and email verification status
		await supabase.auth.admin.updateUserById(user.id, {
			email_confirm: true,
			user_metadata: { email_verified: true },
		});

		// Also update our local database to mark the user as verified
		await db
			.update(users)
			.set({ emailVerified: true })
			.where(eq(users.email, email));

		return NextResponse.json({
			success: true,
			message: "User email marked as verified",
		});
	} catch (error) {
		console.error("Error marking email as verified:", error);
		return NextResponse.json(
			{ error: "Server error during verification" },
			{ status: 500 },
		);
	}
}
