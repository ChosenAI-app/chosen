import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DeleteAccountSection } from "@/components/settings/DeleteAccountSection"
import { ProfileEditForm } from "@/components/settings/ProfileEditForm"

const USER_TYPE_LABELS: Record<string, string> = {
  contractor: "General Contractor",
  architect: "Architect",
  engineer: "Engineer",
  inspector: "Inspector",
}

export default async function ContractorSettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "full_name, user_type, company_name, license_number, bio, phone, website_url, created_at"
    )
    .eq("id", user.id)
    .maybeSingle()

  return (
    <div className="mx-auto max-w-lg flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account and professional profile.
        </p>
      </div>

      {/* Account info */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Account
        </h3>
        <div className="mt-4 flex flex-col gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Name</p>
            <p className="mt-0.5 text-sm font-medium">
              {profile?.full_name ?? "Not set"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="mt-0.5 text-sm font-medium">{user.email}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Role</p>
            <span className="mt-0.5 inline-block rounded-sm bg-primary/10 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-primary">
              {USER_TYPE_LABELS[profile?.user_type ?? ""] ?? "Professional"}
            </span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Member Since</p>
            <p className="mt-0.5 text-sm font-medium">
              {profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Unknown"}
            </p>
          </div>
        </div>
      </div>

      {/* Profile edit */}
      <ProfileEditForm
        companyName={profile?.company_name ?? ""}
        licenseNumber={profile?.license_number ?? ""}
        bio={profile?.bio ?? ""}
        phone={profile?.phone ?? ""}
        websiteUrl={profile?.website_url ?? ""}
      />

      {/* Danger zone */}
      <DeleteAccountSection />
    </div>
  )
}
