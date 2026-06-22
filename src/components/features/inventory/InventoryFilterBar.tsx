'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Filter } from 'lucide-react'
import type { InventoryCategory, InventoryItem } from './types'

interface InventoryFilterBarProps {
  items: InventoryItem[]
  categories: InventoryCategory[]
  searchTerm: string
  onSearchChange: (value: string) => void
  categoryFilter: string
  onCategoryChange: (value: string) => void
  expiryFilter: string
  onExpiryChange: (value: string) => void
  stockFilter: string
  onStockChange: (value: string) => void
}

const SUGGESTION_LIMIT = 8

export default function InventoryFilterBar({
  items,
  categories,
  searchTerm,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  expiryFilter,
  onExpiryChange,
  stockFilter,
  onStockChange,
}: InventoryFilterBarProps) {
  const [inputValue, setInputValue] = useState(searchTerm)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (inputValue.trim().length < 1) {
      setSuggestions([])
      return
    }
    const lower = inputValue.toLowerCase()
    const matches = items
      .map(i => i.name)
      .filter((name, idx, arr) => arr.indexOf(name) === idx)
      .filter(name => name.toLowerCase().includes(lower))
      .slice(0, SUGGESTION_LIMIT)
    setSuggestions(matches)
  }, [inputValue, items])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onSearchChange(inputValue)
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [inputValue, onSearchChange])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSelectSuggestion(name: string) {
    setInputValue(name)
    onSearchChange(name)
    setShowSuggestions(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') setShowSuggestions(false)
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search with auto-suggestion */}
      <div className="relative flex-1" ref={wrapperRef}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search products..."
          value={inputValue}
          onChange={e => { setInputValue(e.target.value); setShowSuggestions(true) }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          className="w-full pl-9 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition text-sm"
        />
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-20 top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
            {suggestions.map(name => (
              <li
                key={name}
                onMouseDown={() => handleSelectSuggestion(name)}
                className="px-4 py-2.5 text-sm cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition"
              >
                {name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Category filter */}
      <div className="relative min-w-[160px]">
        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <select
          value={categoryFilter}
          onChange={e => onCategoryChange(e.target.value)}
          className="w-full pl-9 pr-8 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition appearance-none bg-white text-sm cursor-pointer"
        >
          <option value="">All Categories</option>
          {categories.map(c => (
            <option key={c.id} value={String(c.id)}>{c.name}</option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">▼</div>
      </div>

      {/* Expiry filter */}
      <div className="relative min-w-[170px]">
        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <select
          value={expiryFilter}
          onChange={e => onExpiryChange(e.target.value)}
          className="w-full pl-9 pr-8 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition appearance-none bg-white text-sm cursor-pointer"
        >
          <option value="">All Expiry</option>
          <option value="expired">Expired</option>
          <option value="expiring_soon">Expiring Soon</option>
          <option value="not_expired">Not Expired</option>
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">▼</div>
      </div>

      {/* Stock filter */}
      <div className="relative min-w-[160px]">
        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <select
          value={stockFilter}
          onChange={e => onStockChange(e.target.value)}
          className="w-full pl-9 pr-8 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition appearance-none bg-white text-sm cursor-pointer"
        >
          <option value="">All Stock</option>
          <option value="out_of_stock">Out of Stock</option>
          <option value="low_stock">Low Stock</option>
          <option value="normal">Normal</option>
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">▼</div>
      </div>
    </div>
  )
}
