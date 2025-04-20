import { z } from "zod";

/**
 * Common password list based on security research
 * Only includes a small sample for demonstration - in production use a more comprehensive list
 */
const COMMON_PASSWORDS = [
	"password",
	"123456",
	"qwerty",
	"admin",
	"welcome",
	"password123",
	"abc123",
	"letmein",
	"monkey",
	"1234567",
	"12345678",
	"football",
	"iloveyou",
	"123123",
	"dragon",
	"baseball",
	"sunshine",
	"princess",
	"qwerty123",
	"solo",
	"master",
	"welcome1",
];

/**
 * Email schema with RFC compliant validation
 */
export const emailSchema = z
	.string({
		required_error: "Email is required",
		invalid_type_error: "Email must be a string",
	})
	.min(5, { message: "Email must be at least 5 characters long" })
	.max(255, { message: "Email must not exceed 255 characters" })
	.email("Please enter a valid email address")
	.trim()
	.toLowerCase()
	.transform((email) => {
		// Normalize email for consistent storage - trim, lowercase
		return email.trim().toLowerCase();
	});

/**
 * Password schema with strong requirements
 */
export const passwordSchema = z
	.string({
		required_error: "Password is required",
		invalid_type_error: "Password must be a string",
	})
	.min(8, { message: "Password must be at least 8 characters long" })
	.max(128, { message: "Password must not exceed 128 characters" })
	.refine((password) => /[A-Z]/.test(password), {
		message: "Password must contain at least one uppercase letter",
	})
	.refine((password) => /[a-z]/.test(password), {
		message: "Password must contain at least one lowercase letter",
	})
	.refine((password) => /[0-9]/.test(password), {
		message: "Password must contain at least one number",
	})
	.refine((password) => /[\W_]/.test(password), {
		message: "Password must contain at least one special character",
	})
	.refine((password) => !/\s/.test(password), {
		message: "Password must not contain spaces",
	})
	.refine((password) => !COMMON_PASSWORDS.includes(password.toLowerCase()), {
		message:
			"This password is too common and easily guessed. Please choose a stronger password",
	});

/**
 * Login schema combining email and password
 */
export const loginSchema = z.object({
	email: emailSchema,
	password: z.string().min(1, "Password is required"),
});

/**
 * Registration schema with additional fields and password confirmation
 */
export const registerSchema = z
	.object({
		firstName: z
			.string()
			.min(1, "First name is required")
			.max(50, "First name must not exceed 50 characters"),
		lastName: z
			.string()
			.min(1, "Last name is required")
			.max(50, "Last name must not exceed 50 characters"),
		email: emailSchema,
		password: passwordSchema,
		confirmPassword: z.string({
			required_error: "Please confirm your password",
		}),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords don't match",
		path: ["confirmPassword"],
	});

/**
 * Types derived from schemas
 */
export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;

/**
 * Helper function for client-side validation
 */
export function validateEmail(email: string) {
	return emailSchema.safeParse(email);
}

/**
 * Helper function for client-side validation
 */
export function validatePassword(password: string) {
	return passwordSchema.safeParse(password);
}

/**
 * Helper function to calculate password strength from 0-100
 * This is a basic implementation - consider using zxcvbn for production
 */
export function calculatePasswordStrength(password: string): number {
	if (!password) return 0;

	let score = 0;

	// Length
	score += Math.min(password.length * 4, 25);

	// Character variety
	if (/[A-Z]/.test(password)) score += 10;
	if (/[a-z]/.test(password)) score += 10;
	if (/[0-9]/.test(password)) score += 10;
	if (/[\W_]/.test(password)) score += 15;

	// Complexity
	const uniqueChars = new Set(password.split("")).size;
	score += Math.min(uniqueChars * 2, 15);

	// Penalize common passwords
	if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
		score = Math.max(score - 50, 10);
	}

	return Math.min(score, 100);
}
