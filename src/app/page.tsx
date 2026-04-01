import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, Users, FileCheck, MapPin } from "lucide-react"

const VALUE_PROPS = [
  {
    icon: Sparkles,
    title: "AI scope in 60 seconds",
    description:
      "Get a detailed project plan with permits, costs, and timeline — powered by Palo Alto permit intelligence.",
  },
  {
    icon: Users,
    title: "Verified contractor marketplace",
    description:
      "Post your project and receive competitive bids from licensed local contractors, architects, and engineers.",
  },
  {
    icon: FileCheck,
    title: "Automated permits to CO",
    description:
      "AI fills every form, submits to the city, handles corrections, and tracks inspections to Certificate of Occupancy.",
  },
]

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: MapPin,
    title: "Enter your address",
    description: "Type your Palo Alto address and see your property in 3D.",
  },
  {
    step: "02",
    icon: Sparkles,
    title: "AI generates your scope",
    description:
      "Permits needed, realistic costs, and timeline — in under 60 seconds.",
  },
  {
    step: "03",
    icon: Users,
    title: "Contractors bid",
    description:
      "Verified professionals compete for your project on the marketplace.",
  },
  {
    step: "04",
    icon: FileCheck,
    title: "Permits filed automatically",
    description:
      "AI fills forms, submits to the city, and tracks through approval.",
  },
]

function HeroMapVisual() {
  return (
    <div className="relative w-full max-w-md mx-auto lg:mx-0">
      {/* Outer glow */}
      <div className="absolute inset-0 rounded-xl bg-primary/5 blur-xl" />

      {/* Main card */}
      <div className="relative rounded-xl border border-border bg-card overflow-hidden ring-1 ring-primary/20 shadow-[0_0_60px_rgba(245,158,11,0.06)]">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-muted-foreground font-mono">
              chosenai.com / explore
            </span>
          </div>
          <span className="text-[10px] font-bold tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-sm">
            3D LIVE
          </span>
        </div>

        {/* Map area */}
        <div className="relative h-72 bg-[#0a0e1a] overflow-hidden">
          {/* Grid lines */}
          <svg
            className="absolute inset-0 w-full h-full opacity-[0.07]"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id="grid"
                width="32"
                height="32"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 32 0 L 0 0 0 32"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* Building blocks */}
          <div className="absolute top-8 left-12 w-16 h-10 bg-zinc-700/60 rounded-sm" />
          <div className="absolute top-8 left-32 w-10 h-14 bg-zinc-700/40 rounded-sm" />
          <div className="absolute top-6 right-16 w-20 h-8 bg-zinc-700/50 rounded-sm" />
          <div className="absolute top-20 right-8 w-12 h-16 bg-zinc-700/60 rounded-sm" />
          <div className="absolute bottom-16 left-8 w-14 h-10 bg-zinc-700/40 rounded-sm" />
          <div className="absolute bottom-12 left-28 w-8 h-12 bg-zinc-700/50 rounded-sm" />
          <div className="absolute bottom-20 right-20 w-16 h-8 bg-zinc-700/40 rounded-sm" />

          {/* Highlighted "selected" property */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -mt-4">
            <div className="w-20 h-14 border-2 border-primary/80 rounded-sm bg-primary/10 shadow-[0_0_20px_rgba(245,158,11,0.3)]" />
          </div>

          {/* Pulse rings */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -mt-4 flex items-center justify-center">
            <div className="absolute size-32 rounded-full border border-primary/30 animate-ping" />
            <div className="absolute size-24 rounded-full border border-primary/20" />
            <div className="absolute size-40 rounded-full border border-primary/10" />
          </div>

          {/* Center pin dot */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -mt-4 flex items-center justify-center">
            <div className="size-3 rounded-full bg-primary shadow-[0_0_10px_rgba(245,158,11,0.8)]" />
          </div>

          {/* Floating data cards */}
          <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm border border-border/50 rounded-lg px-3 py-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Lot Size
            </p>
            <p className="text-sm font-bold text-primary">7,500 SF</p>
          </div>

          <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm border border-border/50 rounded-lg px-3 py-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              ADU Max
            </p>
            <p className="text-sm font-bold text-foreground">1,000 SF</p>
          </div>
        </div>

        {/* Property info strip */}
        <div className="px-4 py-3 border-t border-border/50 bg-black/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">
                444 Tennyson Ave
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Palo Alto, CA 94301 · Zoning: R-1 · Built 2007
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Est. ADU Cost
              </p>
              <p className="text-sm font-bold text-primary">$420–$650k</p>
            </div>
          </div>

          {/* Mini permit checklist */}
          <div className="flex gap-2 mt-3">
            {["Building Permit", "Electrical", "Plumbing", "Mechanical"].map(
              (p) => (
                <span
                  key={p}
                  className="text-[9px] bg-primary/10 text-primary/80 border border-primary/20 px-1.5 py-0.5 rounded-sm font-medium"
                >
                  {p}
                </span>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Amber accent line */}
      <div className="h-0.5 w-full bg-primary" />

      {/* Nav */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <span className="text-xs font-bold tracking-[0.25em] text-foreground">
            CHOSEN
          </span>
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">
              I&apos;m a Contractor
              <ArrowRight className="ml-1 size-3" />
            </Link>
          </Button>
        </nav>
      </header>

      {/* Hero */}
      <section className="flex flex-1 items-center">
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-20 lg:grid-cols-12 lg:py-28">
          {/* Left — 55% */}
          <div className="flex flex-col justify-center lg:col-span-7">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Your home project,
              <br />
              <span className="text-primary">fully handled.</span>
            </h1>
            <p className="mt-4 max-w-lg text-lg text-muted-foreground">
              From AI-powered scoping to permit approval — the end-to-end
              platform for residential construction in Palo Alto.
            </p>

            <div className="mt-8 flex flex-col gap-3">
              {VALUE_PROPS.map((prop) => (
                <div key={prop.title} className="flex items-center gap-3">
                  <div className="size-5 shrink-0 rounded-full bg-primary/20 flex items-center justify-center">
                    <div className="size-1.5 rounded-full bg-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {prop.title}
                    </span>
                    {" — "}
                    {prop.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-10">
              <Button
                asChild
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 text-base font-semibold transition-all duration-150"
              >
                <Link href="/start">
                  Start Your Project
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Right — 45% — Hero visual */}
          <div className="flex items-center justify-center lg:col-span-5">
            <HeroMapVisual />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border bg-card/30">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            How it works
          </h2>
          <p className="mt-3 text-center text-2xl font-bold tracking-tight">
            Four steps to your permit
          </p>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="flex flex-col">
                <span className="text-3xl font-bold text-primary/30">
                  {item.step}
                </span>
                <div className="mt-3 flex items-center gap-2">
                  <item.icon className="size-4 text-primary" />
                  <h3 className="font-semibold">{item.title}</h3>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Contractors strip */}
      <section className="border-t border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              For Contractors
            </p>
            <p className="mt-1 text-sm text-foreground">
              Get verified and start receiving bids from Palo Alto homeowners.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/login">
              Join the marketplace
              <ArrowRight className="ml-1 size-3" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6">
          <span className="text-xs text-muted-foreground">
            &copy; 2026 Chosen. Palo Alto, CA.
          </span>
          <span className="text-xs font-bold tracking-[0.25em] text-muted-foreground">
            CHOSEN
          </span>
        </div>
      </footer>
    </div>
  )
}
