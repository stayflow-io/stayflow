"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Search, Building2, Users, ClipboardList, CheckSquare, Loader2 } from "lucide-react"
import { globalSearch, type SearchResult } from "@/actions/search"
import { useDebounce } from "@/hooks/use-debounce"

const typeIcons = {
  property: Building2,
  reservation: ClipboardList,
  owner: Users,
  task: CheckSquare,
}

const typeLabels = {
  property: "Imovel",
  reservation: "Reserva",
  owner: "Proprietario",
  task: "Tarefa",
}

export function GlobalSearch() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    async function search() {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        setResults([])
        return
      }

      setIsLoading(true)
      try {
        const data = await globalSearch(debouncedQuery)
        setResults(data)
      } catch (error) {
        console.error("Erro na busca:", error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }

    search()
  }, [debouncedQuery])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function handleSelect(result: SearchResult) {
    router.push(result.href)
    setQuery("")
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar imoveis, reservas, proprietarios..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-9 pr-9"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {isOpen && (query.length >= 2 || results.length > 0) && (
        <div className="absolute top-full mt-2 w-full bg-popover border rounded-md shadow-lg z-50 overflow-hidden">
          {results.length === 0 && !isLoading && query.length >= 2 && (
            <div className="p-4 text-sm text-muted-foreground text-center">
              Nenhum resultado encontrado
            </div>
          )}

          {results.length > 0 && (
            <div className="max-h-80 overflow-y-auto">
              {results.map((result) => {
                const Icon = typeIcons[result.type]
                return (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleSelect(result)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors text-left"
                  >
                    <div className="p-2 bg-muted rounded">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{result.title}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {result.subtitle}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {typeLabels[result.type]}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
