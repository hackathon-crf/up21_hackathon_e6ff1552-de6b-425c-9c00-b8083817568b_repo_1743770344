"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSeparator,
	InputOTPSlot,
} from "~/components/ui/input-otp";
import { useToast } from "~/hooks/use-toast";

interface OTPVerificationFormProps {
	email: string;
	onVerify: (otp: string) => Promise<void>;
	onCancel: () => void;
	isLoading: boolean;
}

export function OTPVerificationForm({
	email,
	onVerify,
	onCancel,
	isLoading,
}: OTPVerificationFormProps) {
	const { toast } = useToast();
	const [otp, setOtp] = useState("");
	const [isResending, setIsResending] = useState(false);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (otp.length !== 6) {
			toast({
				title: "Invalid code",
				description: "Please enter the complete 6-digit verification code.",
				variant: "destructive",
			});
			return;
		}

		await onVerify(otp);
	};

	const handleResendOTP = async () => {
		setIsResending(true);

		try {
			const response = await fetch("/api/auth/verify", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					action: "generate",
					email,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Failed to resend verification code");
			}

			toast({
				title: "Verification code resent",
				description: "A new verification code has been sent to your email.",
				variant: "success",
			});
		} catch (error) {
			toast({
				title: "Error",
				description:
					error instanceof Error
						? error.message
						: "Failed to resend verification code",
				variant: "destructive",
			});
		} finally {
			setIsResending(false);
		}
	};

	const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, "$1•••$3");

	return (
		<Card className="w-full">
			<CardHeader>
				<CardTitle className="text-2xl">Verify your email</CardTitle>
				<CardDescription>
					We've sent a 6-digit verification code to {maskedEmail}. The code will
					expire in 30 minutes.
				</CardDescription>
			</CardHeader>
			<form onSubmit={handleSubmit}>
				<CardContent className="space-y-4">
					<div className="flex flex-col items-center space-y-4">
						<InputOTP
							maxLength={6}
							value={otp}
							onChange={setOtp}
							containerClassName="group justify-center"
							disabled={isLoading || isResending}
						>
							<InputOTPGroup>
								<InputOTPSlot index={0} />
								<InputOTPSlot index={1} />
								<InputOTPSlot index={2} />
								<InputOTPSeparator />
								<InputOTPSlot index={3} />
								<InputOTPSlot index={4} />
								<InputOTPSlot index={5} />
							</InputOTPGroup>
						</InputOTP>
						<p className="text-muted-foreground text-sm">
							Enter the 6-digit code sent to your email
						</p>
					</div>
				</CardContent>
				<CardFooter className="flex flex-col space-y-4">
					<div className="flex w-full space-x-2">
						<Button
							variant="outline"
							className="flex-1"
							onClick={onCancel}
							type="button"
							disabled={isLoading || isResending}
						>
							Cancel
						</Button>
						<Button
							className="flex-1"
							type="submit"
							disabled={otp.length !== 6 || isLoading || isResending}
						>
							{isLoading ? "Verifying..." : "Verify"}
						</Button>
					</div>
					<Button
						variant="ghost"
						className="w-full text-sm"
						onClick={handleResendOTP}
						disabled={isLoading || isResending}
						type="button"
					>
						{isResending ? "Resending..." : "Didn't receive the code? Resend"}
					</Button>
				</CardFooter>
			</form>
		</Card>
	);
}
