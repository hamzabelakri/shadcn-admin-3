import { ApiResponse } from "./api";

export type ID = undefined | null | number

export interface Role {
  role_id: number;
  role_name: string;
  user_count: number
  role_permissions: Record<string, string>; 
  created_at: string;
  updated_at: string;
}

export interface RoleQueryParams  {
  search?: string;
}

export type RoleResponse = ApiResponse<Role>;
