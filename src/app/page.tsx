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

            <div className="mt-10 flex flex-col gap-6">
              {VALUE_PROPS.map((prop) => (
                <div key={prop.title} className="flex gap-4">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
                    <prop.icon className="size-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {prop.title}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {prop.description}
                    </p>
                  </div>
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

          {/* Right — 45% — 3D map placeholder */}
          <div className="flex items-center justify-center lg:col-span-5">
            <div className="flex aspect-square w-full max-w-md items-center justify-center rounded-lg border-2 border-dashed border-primary/30 bg-card/50">
              <div className="text-center">
                <MapPin className="mx-auto size-8 text-primary/40" />
                <p className="mt-3 text-sm font-medium text-muted-foreground">
                  3D Map Coming Phase 3
                </p>
              </div>
            </div>
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
