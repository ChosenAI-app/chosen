"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { signIn } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    startTransition(async () => {
      const result = await signIn(email, password);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="w-full max-w-sm">
      {/* Mobile-only branding */}
      <p className="mb-8 text-xs font-bold tracking-[0.25em] text-foreground lg:hidden">
        CHOSEN
      </p>

      <h1 className="text-xl font-bold tracking-tight">Log in to Chosen</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter your credentials to continue
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="email"
            className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
          >
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="password"
            className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
          >
            Password
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />
        </div>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        <Button
          type="submit"
          disabled={isPending}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-150"
        >
          {isPending ? "Loading..." : "Log in"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-foreground underline underline-offset-4 transition-all duration-150 hover:text-primary"
          >
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}
