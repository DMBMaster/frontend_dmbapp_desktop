export const getAvailableRoutes = (appRoutes) => {
  return appRoutes.filter((route) => route.active).map((route) => route.path)
}
export const isRouteAvailable = (path, availableRoutes) => {
  if (!path || !availableRoutes || availableRoutes.length === 0) return false

  return availableRoutes.some((route) => {
    // Handle exact match
    if (route === path) return true

    // Handle dynamic routes (e.g., /expenses/detail/:id)
    if (route.includes(':')) {
      const routeParts = route.split('/')
      const pathParts = path.split('/')

      // Cek apakah jumlah segment sama
      if (routeParts.length !== pathParts.length) return false

      // Compare setiap segment
      return routeParts.every((part, index) => {
        return part.startsWith(':') || part === pathParts[index]
      })
    }

    return false
  })
}
