'use client'

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalCount: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  showingCount: number
  selectedCount?: number
}

export default function Pagination({
  currentPage,
  totalPages,
  totalCount,
  onPageChange,
  showingCount,
  selectedCount = 0,
}: Omit<PaginationProps, 'itemsPerPage'>) { // FIX: Removed unused itemsPerPage
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)

  return (
    <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 flex items-center justify-between text-sm text-gray-600">
      <div className="flex items-center gap-4">
        <span>
          Showing {showingCount} of {totalCount}
        </span>
        {selectedCount > 0 && (
          <span className="text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded">
            {selectedCount} selected
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1 hover:bg-gray-200 rounded transition disabled:opacity-50"
          aria-label="Previous page"
        >
          &lt;
        </button>

        {pageNumbers.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-2 py-1 hover:bg-gray-200 rounded transition ${
              currentPage === page ? 'text-blue-600 font-medium' : ''
            }`}
            aria-current={currentPage === page ? 'page' : undefined}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
          className="p-1 hover:bg-gray-200 rounded transition disabled:opacity-50"
          aria-label="Next page"
        >
          &gt;
        </button>
      </div>
    </div>
  )
}
