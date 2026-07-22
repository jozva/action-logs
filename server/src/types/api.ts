export interface ApiPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
  pagination?: ApiPagination;
  errors?: undefined;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  data: null;
  pagination?: undefined;
  errors?: unknown;
  code?: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
