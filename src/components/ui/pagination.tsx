"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  baseUrl: string
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  baseUrl,
}: PaginationProps) {
  const searchParams = useSearchParams()

  function buildUrl(page: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", page.toString())
    return `${baseUrl}?${params.toString()}`
  }

  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  if (totalPages <= 1) {
    return null
  }

  const pages: (number | "...")[] = []

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i)
    }
  } else {
    pages.push(1)

    if (currentPage > 3) {
      pages.push("...")
    }

    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i)
    }

    if (currentPage < totalPages - 2) {
      pages.push("...")
    }

    pages.push(totalPages)
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
      <p className="text-sm text-muted-foreground">
        Mostrando {startItem} a {endItem} de {totalItems} itens
      </p>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          asChild
          disabled={currentPage === 1}
        >
          <Link href={buildUrl(1)} aria-label="Primeira pagina">
            <ChevronsLeft className="h-4 w-4" />
          </Link>
        </Button>

        <Button
          variant="outline"
          size="icon"
          asChild
          disabled={currentPage === 1}
        >
          <Link href={buildUrl(currentPage - 1)} aria-label="Pagina anterior">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>

        {pages.map((page, i) =>
          page === "..." ? (
            <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground">
              ...
            </span>
          ) : (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="icon"
              asChild
            >
              <Link href={buildUrl(page)}>{page}</Link>
            </Button>
          )
        )}

        <Button
          variant="outline"
          size="icon"
          asChild
          disabled={currentPage === totalPages}
        >
          <Link href={buildUrl(currentPage + 1)} aria-label="Proxima pagina">
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>

        <Button
          variant="outline"
          size="icon"
          asChild
          disabled={currentPage === totalPages}
        >
          <Link href={buildUrl(totalPages)} aria-label="Ultima pagina">
            <ChevronsRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
