"use client"

import { useState, useEffect } from "react"
import { collection, query, where, getDocs, updateDoc, doc, setDoc } from "firebase/firestore"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { db, secondaryAuth } from "../../firebase/config"
import { useAuth } from "../../context/AuthContext"
import { toast } from "react-hot-toast"
import { FiXCircle, FiToggleLeft, FiToggleRight, FiUserPlus, FiSearch } from "react-icons/fi"

const BarbersManagement = () => {
  const { user } = useAuth()
  const [barbers, setBarbers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    confirmPassword: "",
  })

  const translateStatus = (status) => {
    switch (status) {
      case "active":
        return "activo"
      case "inactive":
        return "inactivo"
      default:
        return ""
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-600"
      case "inactive":
        return "bg-red-100 text-red-600"
      default:
        return "bg-gray-100 text-gray-600"
    }
  }

  useEffect(() => {
    const fetchBarbers = async () => {
      setLoading(true)
      try {
        if (!user?.shopId) {
          console.error("ShopId no disponible")
          toast.error("Error: ID de la barbería no disponible")
          setLoading(false)
          return
        }

        const barbersCollectionRef = collection(db, "users")
        const q = query(barbersCollectionRef, where("shopId", "==", user.shopId), where("role", "==", "barber"))

        const querySnapshot = await getDocs(q)
        const barbersData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        console.log("Barberos obtenidos:", barbersData)
        setBarbers(barbersData)
      } catch (error) {
        console.error("Error fetching barbers:", error)
        toast.error("Error al obtener la lista de barberos")
      } finally {
        setLoading(false)
      }
    }

    if (user?.shopId) {
      fetchBarbers()
    }
  }, [user?.shopId])

  const handleToggleActive = async (barberId, currentStatus) => {
    try {
      const newStatus = currentStatus === "active" ? "inactive" : "active"
      const barberRef = doc(db, "users", barberId)
      await updateDoc(barberRef, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
        updatedBy: user.uid,
      })

      setBarbers((prevBarbers) =>
        prevBarbers.map((barber) => (barber.id === barberId ? { ...barber, status: newStatus } : barber)),
      )

      toast.success(`Estado del barbero actualizado a ${newStatus === "active" ? "activo" : "inactivo"}`)
    } catch (error) {
      console.error("Error toggling barber status:", error)
      toast.error("Error al actualizar el estado del barbero")
    }
  }

  const handleCreateBarber = async (e) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      toast.error("Las contraseñas no coinciden")
      return
    }

    try {
      const createdUser = await createUserWithEmailAndPassword(secondaryAuth, formData.email, formData.password)
      const barberData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        status: "active",
        role: "barber",
        shopId: user.shopId,
        uid: createdUser.user.uid,
      }
      await setDoc(doc(db, "users", createdUser.user.uid), barberData)
      setBarbers((prevBarbers) => [...prevBarbers, barberData])
      setFormData({
        name: "",
        email: "",
        password: "",
        phone: "",
        confirmPassword: "",
      })
      setIsModalOpen(false)
      toast.success("Barbero registrado correctamente")

      await secondaryAuth.signOut()
    } catch (error) {
      console.error("Error creating barber:", error)
      toast.error("Error al registrar el barbero")

      try {
        await secondaryAuth.signOut()
      } catch (signOutError) {
        console.error("Error al cerrar sesión secundaria:", signOutError)
      }
    }
  }

  const filteredBarbers = barbers.filter((barber) => {
    if (filter !== "all" && barber.status !== filter) return false
    if (searchTerm && !barber.name.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Gestión de Barberos</h1>
          <p className="text-indigo-100 text-sm sm:text-base">Barbería: {user?.shopName}</p>
        </div>

        <div className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4 w-full sm:w-auto">
              <div className="relative flex-grow sm:flex-grow-0">
                <input
                  type="text"
                  placeholder="Buscar barbero..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full sm:w-auto rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
              >
                <option value="all">Todos</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </select>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full sm:w-auto bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-md"
            >
              <FiUserPlus className="w-5 h-5" />
              <span>Agregar Barbero</span>
            </button>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredBarbers.length === 0 ? (
              <p className="text-center text-gray-500 col-span-full">
                No hay barberos {filter !== "all" ? `en estado ${translateStatus(filter)}` : ""}
              </p>
            ) : (
              filteredBarbers.map((barber) => (
                <div
                  key={barber.id}
                  className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-2">{barber.name}</h2>
                      <p className="text-gray-600 mb-1">{barber.email}</p>
                      <p className="text-gray-600 mb-2">{barber.phone}</p>
                      <span
                        className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(barber.status)}`}
                      >
                        {translateStatus(barber.status)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleToggleActive(barber.id, barber.status)}
                      className={`p-2 rounded-full transition-colors ${
                        barber.status === "active"
                          ? "bg-green-100 text-green-600 hover:bg-green-200"
                          : "bg-red-100 text-red-600 hover:bg-red-200"
                      }`}
                      aria-label={`Cambiar estado del barbero a ${barber.status === "active" ? "inactivo" : "activo"}`}
                    >
                      {barber.status === "active" ? (
                        <FiToggleRight size={24} className="text-green-600" />
                      ) : (
                        <FiToggleLeft size={24} className="text-red-600" />
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal de Registro de Barbero */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Registrar Nuevo Barbero</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiXCircle size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateBarber} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-gray-700 font-bold mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-gray-700 font-bold mb-2">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-gray-700 font-bold mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-gray-700 font-bold mb-2">
                  Contraseña
                </label>
                <input
                  type="password"
                  id="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-gray-700 font-bold mb-2">
                  Confirmar Contraseña
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-md"
                >
                  <FiUserPlus className="w-5 h-5" />
                  Registrar Barbero
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default BarbersManagement

