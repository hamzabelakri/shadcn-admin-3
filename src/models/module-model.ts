export enum ModuleEnum {
  Dashboard = "dashboard",
  Roles = "roles",
  Users = "users",
  Audits = "audits",
  Settings = "settings",
}

export interface Module  {
  id: number
  module_name: string
  read: number
  add: number
  edit: number
  delete: number
  module_icon:string
  module_icon_color:string
  enabled_permissions: string[];
}