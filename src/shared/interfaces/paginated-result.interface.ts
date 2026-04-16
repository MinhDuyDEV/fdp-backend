/**
 * Generic paginated result structure for consistent API responses.
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
