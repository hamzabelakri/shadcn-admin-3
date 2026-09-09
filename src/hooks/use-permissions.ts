import { ModuleEnum } from '@/models/module-model'
import { useAuthStore } from '@/stores/auth-store'
import {
  hasPermission,
  getModulePermissions,
  PermissionType,
  type Permissions,
} from '@/lib/permissions'

export function usePermissions() {
  const user = useAuthStore((state) => state.user)
  const permissions: Permissions | undefined = user?.permissions

  // Standard helpers
  const helpers = {
    hasPermission: (module: string, action: PermissionType) =>
      hasPermission(permissions, module, action),

    getPermissions: (module: string) =>
      getModulePermissions(permissions, module),

    canAccess: (module: string) =>
      hasPermission(permissions, module, PermissionType.VIEW),

    canCreate: (module: string) =>
      hasPermission(permissions, module, PermissionType.CREATE),

    canUpdate: (module: string) =>
      hasPermission(permissions, module, PermissionType.EDIT),

    canDelete: (module: string) =>
      hasPermission(permissions, module, PermissionType.DELETE),
  }

  const modulePermissions = {
    roles: {
      canView: helpers.canAccess(ModuleEnum.Roles),
      canCreate: helpers.canCreate(ModuleEnum.Roles),
      canUpdate: helpers.canUpdate(ModuleEnum.Roles),
      canDelete: helpers.canDelete(ModuleEnum.Roles),
    },
    users: {
      canView: helpers.canAccess(ModuleEnum.Users),
      canCreate: helpers.canCreate(ModuleEnum.Users),
      canUpdate: helpers.canUpdate(ModuleEnum.Users),
      canDelete: helpers.canDelete(ModuleEnum.Users),
    },

    audits: {
      canView: helpers.canAccess(ModuleEnum.Audits),
      canCreate: helpers.canCreate(ModuleEnum.Audits),
      canUpdate: helpers.canUpdate(ModuleEnum.Audits),
      canDelete: helpers.canDelete(ModuleEnum.Audits),
    },

    settings: {
      canView: helpers.canAccess(ModuleEnum.Settings),
      canCreate: helpers.canCreate(ModuleEnum.Settings),
      canUpdate: helpers.canUpdate(ModuleEnum.Settings),
      canDelete: helpers.canDelete(ModuleEnum.Settings),
    },
  }

  return {
    permissions,
    ...helpers,
    modulePermissions,
  }
}
