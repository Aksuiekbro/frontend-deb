export interface PageResult<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
}

export interface Pageable {
    page?: number;
    size?: number;
    sort?: string | string[];
}