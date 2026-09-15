import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ALL_CITIES, type SortDirection } from '../lib/deriveVisibleUsers'
import { useUsersListFilters } from '../lib/useUsersListFilters'

interface UsersFiltersProps {
  availableCities: string[]
}

export function UsersFilters({ availableCities }: UsersFiltersProps) {
  const { search, city, sort, isFiltered, updateSearch, updateCity, updateSort, clearFilters } =
    useUsersListFilters()

  return (
    <div className="border-border bg-card mb-4 flex flex-col gap-3 rounded-lg border p-3 sm:p-3.5">
      <label className="relative flex items-center">
        <span className="sr-only">Search users by name or email</span>
        <Search className="text-muted-foreground pointer-events-none absolute left-3 size-4" aria-hidden="true" />
        <Input
          type="search"
          value={search}
          onChange={(event) => updateSearch(event.target.value)}
          placeholder="Search by name or email"
          className="pr-9 pl-9 [&::-webkit-search-cancel-button]:appearance-none"
        />
        {search ? (
          <button
            type="button"
            onClick={() => updateSearch('')}
            aria-label="Clear search"
            className="text-muted-foreground hover:text-foreground hover:bg-muted absolute right-1.5 inline-flex size-6 items-center justify-center rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        ) : null}
      </label>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex min-w-[130px] flex-1 flex-col gap-1.5 sm:flex-none sm:basis-[180px]">
          <Label className="text-xs">City</Label>
          <Select value={city} onValueChange={updateCity}>
            <SelectTrigger className="w-full" aria-label="Filter by city">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CITIES}>All cities</SelectItem>
              {availableCities.map((cityOption) => (
                <SelectItem key={cityOption} value={cityOption}>
                  {cityOption}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex min-w-[130px] flex-1 flex-col gap-1.5 sm:flex-none sm:basis-[170px]">
          <Label className="text-xs">Sort by name</Label>
          <Select value={sort} onValueChange={(value) => updateSort(value as SortDirection)}>
            <SelectTrigger className="w-full" aria-label="Sort by name">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">A – Z</SelectItem>
              <SelectItem value="desc">Z – A</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isFiltered ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground hover:text-foreground ml-auto"
          >
            <X className="size-3.5" aria-hidden="true" />
            Clear filters
          </Button>
        ) : null}
      </div>
    </div>
  )
}
