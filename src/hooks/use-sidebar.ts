import { NavItem, SidebarData, NavGroup } from '@/models/sidebar-model'
import { usePermissions } from './use-permissions'


export function useFilteredSidebarData(sidebarData: SidebarData): SidebarData {
  const { canAccess } = usePermissions()

  const filterNavItems = (items: NavItem[]): NavItem[] => {
    return items
      .filter((item) => {
        // If item has a module, check permission
        if (item.module) {
          return canAccess(item.module)
        }
        // If no module specified, allow access (e.g., Dashboard, Auth pages)
        return true
      })
      .map((item) => {
        // If item has nested items, recursively filter them
        if (item.items) {
          const filteredSubItems = filterNavItems(item.items)
          // Only include parent if it has accessible children
          if (filteredSubItems.length > 0) {
            return { ...item, items: filteredSubItems }
          }
          // If parent has module permission but no children, still show it
          if (item.module && canAccess(item.module)) {
            return item
          }
          return null
        }
        return item
      })
      .filter((item): item is NavItem => item !== null)
  }

  const filterNavGroups = (navGroups: NavGroup[]): NavGroup[] => {
    return navGroups
      .map((group) => ({
        ...group,
        items: filterNavItems(group.items),
      }))
      .filter((group) => group.items.length > 0) // Remove empty groups
  }

  return {
    ...sidebarData,
    navGroups: filterNavGroups(sidebarData.navGroups),
  }
}