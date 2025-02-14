"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { useTheme } from "../../context/ThemeContext"
import { toast } from "react-hot-toast"
import {
  Moon,
  Sun,
  Scissors,
  Menu,
  X,
  ChevronDown,
  LogOut,
  User,
  BarChart2,
  PlusCircle,
  Users,
  CheckCircle,
  Package,
  DollarSign,
  Calendar,
} from "lucide-react"

const Navbar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()

  const menuLinks =
    user?.role === "admin"
      ? [
          { to: "/admin", text: "Estadísticas", icon: BarChart2 },
          { to: "/admin/new-haircut", text: "Nuevo Servicio", icon: PlusCircle },
          { to: "/admin/barbers", text: "Gestionar Barberos", icon: Users },
          { to: "/admin/services", text: "Servicios", icon: Scissors },
          { to: "/admin/approvals", text: "Aprobar Servicios", icon: CheckCircle },
          { to: "/admin/inventory", text: "Inventario", icon: Package },
          { to: "/admin/expenses", text: "Control de Gastos", icon: DollarSign },
          { to: "/admin/appointments", text: "Citas", icon: Calendar },
        ]
      : [
          { to: "/barber", text: "Estadísticas", icon: BarChart2 },
          { to: "/barber/new-haircut", text: "Nuevo Servicio", icon: PlusCircle },
          { to: "/barber/services", text: "Mis Servicios", icon: Scissors },
        ]

  const handleLogout = async () => {
    try {
      await logout()
      toast.success("Sesión cerrada exitosamente")
      navigate("/login")
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
      toast.error("Error al cerrar sesión")
    }
  }

  const isCurrentPath = (path) => {
    return location.pathname === path
  }

  useEffect(() => {
    const closeMenus = () => {
      setIsMenuOpen(false)
      setIsUserMenuOpen(false)
    }

    window.addEventListener("resize", closeMenus)
    return () => window.removeEventListener("resize", closeMenus)
  }, [])

  return (
    <nav
      className={`
      bg-gradient-to-r from-blue-600 to-purple-600 
      dark:from-gray-900 dark:to-gray-800 
      shadow-lg transition-all duration-300 ease-in-out
      sticky top-0 z-50
    `}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <Scissors className="h-8 w-8 text-white transform transition-transform duration-300 group-hover:rotate-45" />
            <span className="text-white font-bold text-xl tracking-wide">StarBarber</span>
          </Link>

          {/* Desktop menu */}
          {user && (
            <div className="hidden md:flex items-center space-x-1">
              {menuLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`
                    px-3 py-2 rounded-md text-sm font-medium transition-all duration-300
                    flex items-center space-x-1
                    ${
                      isCurrentPath(link.to)
                        ? "bg-white/20 text-white shadow-inner"
                        : "text-blue-100 hover:bg-white/10 hover:text-white"
                    }
                  `}
                >
                  <link.icon className="h-4 w-4" />
                  <span>{link.text}</span>
                </Link>
              ))}

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-white hover:bg-white/10 transition-colors duration-300"
                title={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
              >
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>

              {/* User Menu */}
              <div className="relative ml-4">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-1 text-white hover:text-blue-200 transition-colors duration-300 bg-white/10 rounded-full px-3 py-1"
                >
                  <User className="h-5 w-5" />
                  <span className="text-sm font-medium">{user.name}</span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-300 ${isUserMenuOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-10 top-full ring-1 ring-black ring-opacity-5 transition-all duration-300 ease-in-out">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-500 hover:text-white transition-colors duration-300"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-white/10 focus:outline-none transition-colors duration-300"
              aria-expanded={isMenuOpen}
            >
              <span className="sr-only">Abrir menú principal</span>
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {user && (
          <>
            {/* Dark overlay */}
            <div
              className={`
                fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden
                transition-opacity duration-300 ease-in-out
                ${isMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
              `}
              onClick={() => setIsMenuOpen(false)}
            />

            {/* Slide-in menu */}
            <div
              className={`
              fixed top-0 right-0 h-full w-64 
              bg-gradient-to-b from-blue-600 to-purple-600 
              dark:from-gray-900 dark:to-gray-800
              z-50 transform transition-transform duration-300 ease-in-out md:hidden
              ${isMenuOpen ? "translate-x-0" : "translate-x-full"} shadow-2xl
            `}
            >
              <div className="flex flex-col h-full">
                {/* Menu header */}
                <div className="flex justify-between items-center p-4 border-b border-white/20">
                  <span className="text-white font-bold text-lg">Menú</span>
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="text-white hover:text-blue-200 transition-colors duration-300"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Navigation links */}
                <div className="flex-1 px-2 py-4 overflow-y-auto">
                  {menuLinks.map((link, index) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={`
                        flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium mb-1 transition-all duration-300
                        ${
                          isCurrentPath(link.to)
                            ? "bg-white/20 text-white shadow-inner"
                            : "text-blue-100 hover:bg-white/10 hover:text-white"
                        }
                        transform transition-transform duration-300 ease-in-out
                        ${isMenuOpen ? "translate-x-0" : "translate-x-full"}
                        transition-delay-${index * 50}
                      `}
                      onClick={() => setIsMenuOpen(false)}
                      style={{ transitionDelay: `${index * 50}ms` }}
                    >
                      <link.icon className="h-5 w-5" />
                      <span>{link.text}</span>
                    </Link>
                  ))}
                  {/* Mobile Theme Toggle */}
                  <button
                    onClick={() => {
                      toggleTheme()
                      setIsMenuOpen(false)
                    }}
                    className={`
                      w-full flex items-center px-3 py-2 rounded-md text-base font-medium 
                      text-blue-100 hover:bg-white/10 hover:text-white transition-all duration-300
                      transform ${isMenuOpen ? "translate-x-0" : "translate-x-full"}
                      transition-delay-${menuLinks.length * 50}
                    `}
                    style={{ transitionDelay: `${menuLinks.length * 50}ms` }}
                  >
                    {theme === "dark" ? (
                      <>
                        <Sun className="h-5 w-5 mr-2" />
                        Modo Claro
                      </>
                    ) : (
                      <>
                        <Moon className="h-5 w-5 mr-2" />
                        Modo Oscuro
                      </>
                    )}
                  </button>
                </div>

                {/* User info footer */}
                <div
                  className={`
                  border-t border-white/20 p-4
                  transform transition-transform duration-300 ease-in-out
                  ${isMenuOpen ? "translate-x-0" : "translate-x-full"}
                  transition-delay-${(menuLinks.length + 1) * 50}
                `}
                  style={{ transitionDelay: `${(menuLinks.length + 1) * 50}ms` }}
                >
                  <div className="flex items-center mb-4">
                    <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-3">
                      <div className="text-white font-medium">{user.name}</div>
                      <div className="text-blue-200 text-sm">{user.email}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      handleLogout()
                      setIsMenuOpen(false)
                    }}
                    className="w-full flex items-center px-3 py-2 rounded-md text-blue-100 hover:bg-white/10 hover:text-white transition-colors duration-300 text-left"
                  >
                    <LogOut className="h-5 w-5 mr-2" />
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </nav>
  )
}

export default Navbar

