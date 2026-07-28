import Container from "@/components/container"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <Container width="reading" className="py-20">
      <div className="flex flex-col items-center">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <Skeleton className="mt-4 h-7 w-56" />
        <Skeleton className="mt-3 h-4 w-80 max-w-full" />
        <Skeleton className="mt-8 h-12 w-full max-w-lg" />
      </div>
      <div className="mt-12 space-y-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
      <span className="sr-only">Loading</span>
    </Container>
  )
}
