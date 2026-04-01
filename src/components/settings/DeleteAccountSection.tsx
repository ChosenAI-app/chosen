"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { deleteAccount } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Loader2 } from "lucide-react"

export function DeleteAccountSection() {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteAccount()
      if (!result.error) {
        router.push("/")
      }
    })
  }

  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-5">
      <h3 className="text-sm font-semibold text-destructive">Delete Account</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Permanently delete your account and all associated data. This includes
        all your projects, AI scopes, and bid history. This action cannot be
        undone.
      </p>
      <div className="mt-4">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              size="sm"
            >
              Delete My Account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete your account and ALL your data. You
                will be signed out immediately. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isPending}
                className="bg-destructive/10 text-destructive hover:bg-destructive/20"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Yes, delete my account"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
