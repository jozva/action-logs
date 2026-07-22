export interface ApiPagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface ApiSuccessResponse<T> {
  success: true
  message: string
  data: T
  pagination?: ApiPagination
}

export interface ApiErrorResponse {
  success: false
  message: string
  data: null
  errors?: unknown
  code?: string
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse
