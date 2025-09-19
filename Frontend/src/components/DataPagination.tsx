"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface DataPaginationProps {
  currentPage: number
  totalPages: number
  totalRecords: number
  recordsPerPage: number
  onPageChange: (page: number) => void
}

export const DataPagination: React.FC<DataPaginationProps> = ({
  currentPage,
  totalPages,
  totalRecords,
  recordsPerPage,
  onPageChange,
}) => {
  const [inputPage, setInputPage] = React.useState(currentPage.toString())

  React.useEffect(() => {
    setInputPage(currentPage.toString())
  }, [currentPage])

  const startIndex = (currentPage - 1) * recordsPerPage
  const endIndex = Math.min(startIndex + recordsPerPage, totalRecords)

  const handleInputPageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputPage(e.target.value.replace(/[^0-9]/g, ""))
  }

  const goToInputPage = () => {
    let newPage = Number.parseInt(inputPage, 10)
    if (isNaN(newPage) || newPage < 1) newPage = 1
    if (newPage > totalPages) newPage = totalPages
    onPageChange(newPage)
    setInputPage(newPage.toString())
  }

  const goToNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1)
    }
  }

  const goToPrev = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1)
    }
  }

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 border-t">
      <div className="text-sm text-gray-600">
        Mostrando {startIndex + 1} a {endIndex} de {totalRecords} registros
      </div>

      <div className="flex items-center space-x-3">
        <Button variant="outline" size="sm" onClick={goToPrev} disabled={currentPage === 1} className="bg-white">
          Anterior
        </Button>

        <div className="flex items-center space-x-2 text-sm">
          <span>Página</span>
          <Input
            type="text"
            value={inputPage}
            onChange={handleInputPageChange}
            onBlur={goToInputPage}
            onKeyDown={(e) => e.key === "Enter" && goToInputPage()}
            className="w-16 text-center bg-white"
          />
          <span>de {totalPages}</span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={goToNext}
          disabled={currentPage === totalPages}
          className="bg-white"
        >
          Siguiente
        </Button>
      </div>
    </div>
  )
}
