// Hooks for filtering and pagination

'use client';

import { useState, useMemo, useCallback } from 'react';
import { FilterState } from '@/types';

interface UseFilterOptions<T> {
  data: T[];
  searchFields: (keyof T)[];
  filterFields?: Record<string, (item: T, value: string) => boolean>;
}

export function useFilter<T extends Record<string, unknown>>({
  data,
  searchFields,
  filterFields = {}
}: UseFilterOptions<T>) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    role: 'all',
    status: 'all',
    dateRange: {}
  });

  const [sortConfig, setSortConfig] = useState<{
    key: keyof T | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });

  const filteredData = useMemo(() => {
    let result = [...data];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(item =>
        searchFields.some(field => {
          const value = item[field];
          if (typeof value === 'string') {
            return value.toLowerCase().includes(searchLower);
          }
          return false;
        })
      );
    }

    // Apply custom filter fields
    Object.entries(filterFields).forEach(([key, filterFn]) => {
      const filterValue = filters[key as keyof FilterState];
      if (filterValue && filterValue !== 'all') {
        result = result.filter(item => filterFn(item, filterValue as string));
      }
    });

    // Apply date range filter
    if (filters.dateRange.from || filters.dateRange.to) {
      result = result.filter(item => {
        const itemDate = new Date(item.createdAt as string);
        if (filters.dateRange.from && itemDate < new Date(filters.dateRange.from)) {
          return false;
        }
        if (filters.dateRange.to && itemDate > new Date(filters.dateRange.to)) {
          return false;
        }
        return true;
      });
    }

    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, filters, searchFields, filterFields, sortConfig]);

  const setSearch = useCallback((search: string) => {
    setFilters(prev => ({ ...prev, search }));
  }, []);

  const setFilter = useCallback((key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const setDateRange = useCallback((from?: string, to?: string) => {
    setFilters(prev => ({ ...prev, dateRange: { from, to } }));
  }, []);

  const handleSort = useCallback((key: keyof T) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      role: 'all',
      status: 'all',
      dateRange: {}
    });
    setSortConfig({ key: null, direction: 'asc' });
  }, []);

  return {
    filters,
    filteredData,
    setSearch,
    setFilter,
    setDateRange,
    handleSort,
    clearFilters,
    sortConfig
  };
}

interface UsePaginationOptions {
  totalItems: number;
  itemsPerPage: number;
  initialPage?: number;
}

export function usePagination({
  totalItems,
  itemsPerPage,
  initialPage = 1
}: UsePaginationOptions) {
  const [currentPage, setCurrentPage] = useState(initialPage);

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  const goToNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const goToPreviousPage = useCallback(() => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  }, []);

  const resetPagination = useCallback(() => {
    setCurrentPage(1);
  }, []);

  return {
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    resetPagination,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1
  };
}

// Combined hook for table management
export function useTable<T extends Record<string, unknown>>({
  data,
  searchFields,
  filterFields,
  itemsPerPage = 10
}: UseFilterOptions<T> & { itemsPerPage?: number }) {
  const {
    filters,
    filteredData,
    setSearch,
    setFilter,
    setDateRange,
    handleSort,
    clearFilters,
    sortConfig
  } = useFilter({ data, searchFields, filterFields });

  const pagination = usePagination({
    totalItems: filteredData.length,
    itemsPerPage
  });

  // Reset pagination when filters change
  const handleSetSearch = useCallback((search: string) => {
    setSearch(search);
    pagination.resetPagination();
  }, [setSearch, pagination]);

  const handleSetFilter = useCallback((key: string, value: string) => {
    setFilter(key, value);
    pagination.resetPagination();
  }, [setFilter, pagination]);

  const paginatedData = filteredData.slice(pagination.startIndex, pagination.endIndex);

  return {
    // Filter state
    filters,
    setSearch: handleSetSearch,
    setFilter: handleSetFilter,
    setDateRange,
    handleSort,
    clearFilters,
    sortConfig,
    
    // Data
    filteredData,
    paginatedData,
    
    // Pagination
    ...pagination
  };
}
