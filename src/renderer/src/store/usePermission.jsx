import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'

export const usePermissions = (userRole) => {
  const location = useLocation()
  const currentPath = location.pathname

  return useMemo(() => {
    const defaultPermission = {
      read: false,
      create: false,
      update: false,
      delete: false
    }

    const modules = userRole?.data?.[0]?.role?.modules
    if (!modules) return defaultPermission

    const hasPermission = (actionName) => {
      return modules.some((module) => {
        const checkModule =
          module.link === currentPath &&
          module.action?.some((a) => a.name === actionName) &&
          module.action_module?.includes(actionName)

        const checkChild = module.childs?.some(
          (child) =>
            child.link === currentPath &&
            child.action?.some((a) => a.name === actionName) &&
            child.action_module?.includes(actionName)
        )

        return checkModule || checkChild
      })
    }

    return {
      read: hasPermission('read'),
      create: hasPermission('create'),
      update: hasPermission('update'),
      delete: hasPermission('delete')
    }
  }, [userRole, currentPath])
}
