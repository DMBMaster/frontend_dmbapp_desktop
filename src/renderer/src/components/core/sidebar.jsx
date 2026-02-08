import { useState, useEffect, useMemo } from 'react'
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Typography,
  Divider,
  Collapse,
  CircularProgress,
  Chip
} from '@mui/material'
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  ExpandLess,
  ExpandMore,
  Logout as LogoutIcon
} from '@mui/icons-material'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  getAvailableRoutes,
  isRouteAvailable as checkRouteAvailable
} from '@renderer/routes/routeHelper'

const DRAWER_WIDTH = 280
const DRAWER_WIDTH_COLLAPSED = 72

// eslint-disable-next-line react/prop-types
export const Sidebar = ({ logo, onLogout, sidebarService, appRoutes = [] }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(true)
  const [expandedMenus, setExpandedMenus] = useState([])
  const [sidebars, setSidebars] = useState([])
  const [menus, setMenus] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const pathname = location.pathname

  // Memoize available routes untuk performance
  const availableRoutes = useMemo(() => getAvailableRoutes(appRoutes), [appRoutes])

  // Helper function to check if route exists
  const checkRouteExists = (path) => {
    return checkRouteAvailable(path, availableRoutes)
  }
  /* ================= FETCH SIDEBAR ================= */
  useEffect(() => {
    const fetchSidebar = async () => {
      if (!sidebarService) {
        setLoading(false)
        return
      }

      try {
        // Service sudah handle caching, tidak perlu forceRefresh
        // eslint-disable-next-line react/prop-types
        const res = await sidebarService.getAllSidebar()
        setSidebars(res.data)
      } catch (err) {
        console.error(err)
        setError('Gagal memuat sidebar')
      } finally {
        setLoading(false)
      }
    }

    fetchSidebar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Hanya run sekali saat mount, karena service sudah handle cache

  /* ================= TRANSFORM MENU ================= */
  useEffect(() => {
    if (!sidebars?.length) return

    const outletCategoryId =
      typeof window !== 'undefined' ? Number(localStorage.getItem('outletCategoryId')) : null

    const excludedLinks = [
      '/transaction/create',
      '/transaction/instore',
      '/product/add',
      '/transaction/invoice/create',
      '/transaction/do/create',
      '/transaction/guest',
      'mobile'
    ]

    if (outletCategoryId !== 1) {
      excludedLinks.push('/dashboard/frontoffice', '/transaction/ota', '/dashboard/density')
    }

    const processChildren = (childs = []) =>
      childs
        .filter((c) => c?.link && !excludedLinks.includes(c.link.trim().toLowerCase()))
        .map((c) => ({
          id: c.id,
          title: c.name,
          href: c.link,
          icon: (
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                bgcolor: 'currentColor'
              }}
            />
          ),
          ...(c.childs?.length && {
            children: processChildren(c.childs)
          })
        }))

    const modules = sidebars[0]?.role?.modules || []
    const result = []

    modules.forEach((m) => {
      const link = m.link?.trim().toLowerCase()
      if (excludedLinks.includes(link)) return

      if (link === '#group') {
        result.push({
          navlabel: true,
          subheader: m.name
        })
      } else {
        result.push({
          id: m.id,
          title: m.name,
          href: m.link,
          icon: (
            <Box
              sx={{
                width: 20,
                height: 20,
                borderRadius: 1,
                bgcolor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Typography sx={{ fontSize: 12, color: 'white', fontWeight: 600 }}>
                {m.name?.charAt(0) || '?'}
              </Typography>
            </Box>
          ),
          ...(m.childs?.length && {
            children: processChildren(m.childs)
          })
        })
      }
    })

    setMenus(result)

    // Auto expand menu yang memiliki active child
    const activeMenuIds = []
    result.forEach((item) => {
      if (item.children?.some((child) => isActive(child.href))) {
        activeMenuIds.push(String(item.id))
      }
    })
    setExpandedMenus(activeMenuIds)
  }, [sidebars, pathname])

  const toggleDrawer = () => {
    setOpen(!open)
  }

  const handleMenuClick = (menuId, hasChildren) => {
    if (!hasChildren) return

    if (expandedMenus.includes(menuId)) {
      setExpandedMenus(expandedMenus.filter((id) => id !== menuId))
    } else {
      setExpandedMenus([...expandedMenus, menuId])
    }
  }

  const handleNavigation = (path) => {
    if (path) {
      navigate(path)
    }
  }

  const isActive = (path) => {
    if (!path) return false
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  const isMenuExpanded = (menuId) => {
    return expandedMenus.includes(menuId)
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: open ? DRAWER_WIDTH : DRAWER_WIDTH_COLLAPSED,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: open ? DRAWER_WIDTH : DRAWER_WIDTH_COLLAPSED,
          boxSizing: 'border-box',
          borderRight: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          transition: 'width 0.3s ease',
          overflowX: 'hidden'
        }
      }}
    >
      {/* Header with Logo and Toggle */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: open ? 'space-between' : 'center',
          p: 2,
          pt: 7, // Tambah padding top untuk ruang titlebar
          minHeight: 80
        }}
      >
        {open && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {logo && <img src={logo} alt="Logo" style={{ width: 40, height: 40 }} />}
            <Typography variant="h6" fontWeight={700} color="text.primary">
              <span
                style={{
                  marginLeft: '10px',
                  display: 'inline-block',
                  verticalAlign: 'middle',
                  fontWeight: 'bold',
                  fontSize: '22px',
                  color: '#DD5070'
                }}
              >
                DMB SATU
              </span>
            </Typography>
          </Box>
        )}
        <IconButton onClick={toggleDrawer} size="small">
          {open ? <ChevronLeftIcon /> : <MenuIcon />}
        </IconButton>
      </Box>

      <Divider />

      {/* Menu Items */}
      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <List sx={{ px: 1, py: 2 }}>
          {loading && (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress size={24} />
            </Box>
          )}

          {error && (
            <Box px={2} color="error.main">
              <Typography variant="caption">{error}</Typography>
            </Box>
          )}

          {!loading &&
            !error &&
            menus.map((menuItem, index) => {
              // Header/Group label
              if (menuItem.navlabel) {
                return open ? (
                  <Typography
                    key={`group-${index}`}
                    variant="caption"
                    sx={{
                      px: 2,
                      py: 2,
                      mt: index > 0 ? 2 : 0,
                      display: 'block',
                      color: 'text.secondary',
                      fontWeight: 700,
                      letterSpacing: 0.5,
                      fontSize: '0.7rem',
                      textTransform: 'uppercase'
                    }}
                  >
                    {menuItem.subheader}
                  </Typography>
                ) : (
                  <Divider key={`divider-${index}`} sx={{ my: 2 }} />
                )
              }

              const menuId = String(menuItem.id || index)
              const isExpanded = isMenuExpanded(menuId)
              const hasChildren = menuItem.children && menuItem.children.length > 0

              // Menu item without children
              if (!hasChildren) {
                const routeExists = checkRouteExists(menuItem.href)

                return (
                  <ListItem key={menuId} disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                      onClick={() => routeExists && handleNavigation(menuItem.href)}
                      disabled={!routeExists}
                      sx={{
                        borderRadius: 2,
                        mx: 1,
                        px: 2,
                        bgcolor: isActive(menuItem.href) ? 'primary.light' : 'transparent',
                        '&:hover': {
                          bgcolor: isActive(menuItem.href) ? 'primary.light' : 'action.hover'
                        },
                        justifyContent: open ? 'initial' : 'center',
                        opacity: routeExists ? 1 : 0.6
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 0,
                          mr: open ? 2 : 'auto',
                          justifyContent: 'center',
                          color: isActive(menuItem.href) ? 'primary.main' : 'text.secondary'
                        }}
                      >
                        {menuItem.icon}
                      </ListItemIcon>
                      {open && (
                        <>
                          <ListItemText
                            primary={menuItem.title}
                            primaryTypographyProps={{
                              fontSize: 14,
                              fontWeight: isActive(menuItem.href) ? 600 : 400,
                              color: isActive(menuItem.href) ? 'primary.main' : 'text.primary'
                            }}
                          />
                          {!routeExists && (
                            <Chip
                              label="Soon"
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '0.65rem',
                                fontWeight: 600,
                                bgcolor: 'warning.light',
                                color: 'warning.dark',
                                borderRadius: 1
                              }}
                            />
                          )}
                        </>
                      )}
                    </ListItemButton>
                  </ListItem>
                )
              }

              // Menu item with children (expandable)
              return (
                <Box key={menuId}>
                  <ListItem disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                      onClick={() => handleMenuClick(menuId, hasChildren)}
                      sx={{
                        borderRadius: 2,
                        mx: 1,
                        px: 2,
                        justifyContent: open ? 'initial' : 'center'
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 0,
                          mr: open ? 2 : 'auto',
                          justifyContent: 'center',
                          color: 'text.secondary'
                        }}
                      >
                        {menuItem.icon}
                      </ListItemIcon>
                      {open && (
                        <>
                          <ListItemText
                            primary={menuItem.title}
                            primaryTypographyProps={{
                              fontSize: 14,
                              fontWeight: 500,
                              color: 'text.primary'
                            }}
                          />
                          {isExpanded ? (
                            <ExpandLess sx={{ fontSize: 20 }} />
                          ) : (
                            <ExpandMore sx={{ fontSize: 20 }} />
                          )}
                        </>
                      )}
                    </ListItemButton>
                  </ListItem>

                  {/* Submenu Items */}
                  <Collapse in={isExpanded && open} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                      {menuItem.children?.map((child, childIndex) => {
                        const childRouteExists = checkRouteExists(child.href)

                        return (
                          <ListItem
                            key={`${menuId}-child-${childIndex}`}
                            disablePadding
                            sx={{ mb: 0.3 }}
                          >
                            <ListItemButton
                              onClick={() => childRouteExists && handleNavigation(child.href)}
                              disabled={!childRouteExists}
                              sx={{
                                borderRadius: 2,
                                mx: 1,
                                pl: 6,
                                pr: 2,
                                py: 0.8,
                                bgcolor: isActive(child.href) ? 'primary.light' : 'transparent',
                                '&:hover': {
                                  bgcolor: isActive(child.href) ? 'primary.light' : 'action.hover'
                                },
                                opacity: childRouteExists ? 1 : 0.6
                              }}
                            >
                              <Box
                                sx={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: '50%',
                                  bgcolor: isActive(child.href) ? 'primary.main' : 'text.secondary',
                                  mr: 2,
                                  flexShrink: 0
                                }}
                              />
                              <ListItemText
                                primary={child.title}
                                primaryTypographyProps={{
                                  fontSize: 13,
                                  fontWeight: isActive(child.href) ? 600 : 400,
                                  color: isActive(child.href) ? 'primary.main' : 'text.primary'
                                }}
                              />
                              {!childRouteExists && (
                                <Chip
                                  label="Soon"
                                  size="small"
                                  sx={{
                                    height: 18,
                                    fontSize: '0.6rem',
                                    fontWeight: 600,
                                    bgcolor: 'warning.light',
                                    color: 'warning.dark',
                                    borderRadius: 1
                                  }}
                                />
                              )}
                            </ListItemButton>
                          </ListItem>
                        )
                      })}
                    </List>
                  </Collapse>
                </Box>
              )
            })}
        </List>
      </Box>

      {/* Logout Button */}
      {onLogout && (
        <Box sx={{ p: 2 }}>
          <Divider sx={{ mb: 2 }} />
          <ListItemButton
            onClick={onLogout}
            sx={{
              borderRadius: 2,
              bgcolor: '#FFEBEE',
              color: '#C62828',
              justifyContent: open ? 'initial' : 'center',
              '&:hover': {
                bgcolor: '#FFCDD2'
              }
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: open ? 2 : 'auto',
                justifyContent: 'center',
                color: '#C62828'
              }}
            >
              <LogoutIcon />
            </ListItemIcon>
            {open && (
              <ListItemText
                primary="Logout"
                primaryTypographyProps={{
                  fontSize: 14,
                  fontWeight: 600
                }}
              />
            )}
          </ListItemButton>
        </Box>
      )}
    </Drawer>
  )
}
