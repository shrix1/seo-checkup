"use client"

import Container from "@/components/container"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import Link from "next/link"
import { useEffect } from "react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <Container width="narrow" className="py-24">
      <div className="flex flex-col items-center text-center">
        <span className="grid h-10 w-10 place-items-center rounded-lg border bg-warning-subtle text-warning">
          <AlertTriangle className="h-5 w-5" aria-hidden />
        </span>
        <h1 className="mt-4 text-heading font-semibold">Something broke</h1>
        <p className="mt-2 text-body text-muted-foreground">
          That page hit an unexpected error. Trying again usually clears it.
        </p>
        {error.digest && (
          <p className="mt-3 font-mono text-xs text-muted-foreground">
            {error.digest}
          </p>
        )}
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <Button onClick={reset}>Try again</Button>
          <Button variant="outline" asChild>
            <Link href="/">Go home</Link>
          </Button>
        </div>
      </div>
    </Container>
  )
}
