import { Skeleton } from "@/components/ui/skeleton"

export function OrganizationsSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <Skeleton className="h-8 w-52" />
      <div className="grid gap-4 md:grid-cols-2">
        {[0, 1].map((item) => (
          <div key={item} className="space-y-4 rounded-xl border p-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
