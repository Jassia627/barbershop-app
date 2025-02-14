import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { toast } from 'react-hot-toast';
import { Clock, Calendar, Save, Edit, User, ArrowLeft } from 'lucide-react';

const ScheduleManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [barbers, setBarbers] = useState([]);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [formData, setFormData] = useState({
    startTime: '09:00',
    endTime: '18:00',
    breakStart: '13:00',
    breakEnd: '14:00',
    daysOff: [],
    appointmentDuration: 30
  });

  const weekDays = [
    { id: 'LUN', name: 'Lunes' },
    { id: 'MAR', name: 'Martes' },
    { id: 'MIE', name: 'Miércoles' },
    { id: 'JUE', name: 'Jueves' },
    { id: 'VIE', name: 'Viernes' },
    { id: 'SAB', name: 'Sábado' },
    { id: 'DOM', name: 'Domingo' }
  ];

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchBarbers();
    } else {
      setSelectedBarber(user);
      fetchBarberSchedule(user.uid);
    }
  }, [user]);

  const fetchBarbers = async () => {
    try {
      const q = query(
        collection(db, "users"),
        where("shopId", "==", user.shopId),
        where("role", "==", "barber"),
        where("status", "==", "active")
      );
      
      const querySnapshot = await getDocs(q);
      const barbersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBarbers(barbersData);
      setLoading(false);
    } catch (error) {
      toast.error("Error al cargar barberos");
      setLoading(false);
    }
  };

  const fetchBarberSchedule = async (barberId) => {
    try {
      const q = query(
        collection(db, "schedules"),
        where("barberId", "==", barberId),
        where("active", "==", true)
      );
      
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const scheduleData = snapshot.docs[0].data();
        setEditingSchedule({ id: snapshot.docs[0].id, ...scheduleData });
        setFormData({
          startTime: scheduleData.startTime,
          endTime: scheduleData.endTime,
          breakStart: scheduleData.breakStart,
          breakEnd: scheduleData.breakEnd,
          daysOff: scheduleData.daysOff || [],
          appointmentDuration: scheduleData.appointmentDuration || 30
        });
      }
    } catch (error) {
      toast.error("Error al cargar horario");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const scheduleData = {
        barberId: selectedBarber.id,
        shopId: user.shopId,
        ...formData,
        active: true,
        updatedAt: new Date().toISOString()
      };

      if (editingSchedule?.id) {
        await updateDoc(doc(db, "schedules", editingSchedule.id), scheduleData);
        toast.success("Horario actualizado exitosamente");
      } else {
        await addDoc(collection(db, "schedules"), {
          ...scheduleData,
          createdAt: new Date().toISOString()
        });
        toast.success("Horario creado exitosamente");
      }

      if (user.role === 'admin') {
        navigate('/admin/appointments');
      } else {
        navigate('/barber');
      }
    } catch (error) {
      toast.error("Error al guardar horario");
    }
  };

  const toggleDayOff = (dayId) => {
    setFormData(prev => ({
      ...prev,
      daysOff: prev.daysOff.includes(dayId)
        ? prev.daysOff.filter(d => d !== dayId)
        : [...prev.daysOff, dayId]
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Gestión de Horarios
            </h1>
          </div>
        </div>

        {user.role === 'admin' && (
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Seleccionar Barbero
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {barbers.map((barber) => (
                <button
                  key={barber.id}
                  onClick={() => {
                    setSelectedBarber(barber);
                    fetchBarberSchedule(barber.id);
                  }}
                  className={`p-4 rounded-lg border transition-all ${
                    selectedBarber?.id === barber.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center">
                    <User className="h-10 w-10 text-gray-400 mr-3" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {barber.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {barber.email}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedBarber && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Hora de inicio
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Hora de fin
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Inicio de descanso
                  </label>
                  <input
                    type="time"
                    value={formData.breakStart}
                    onChange={(e) => setFormData({ ...formData, breakStart: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Fin de descanso
                  </label>
                  <input
                    type="time"
                    value={formData.breakEnd}
                    onChange={(e) => setFormData({ ...formData, breakEnd: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Duración de citas (minutos)
                </label>
                <select
                  value={formData.appointmentDuration}
                  onChange={(e) => setFormData({ ...formData, appointmentDuration: parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                >
                  <option value={15}>15 minutos</option>
                  <option value={30}>30 minutos</option>
                  <option value={45}>45 minutos</option>
                  <option value={60}>1 hora</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Días de descanso
                </label>
                <div className="grid grid-cols-7 gap-2">
                  {weekDays.map((day) => (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => toggleDayOff(day.id)}
                      className={`p-2 text-sm font-medium rounded-lg ${
                        formData.daysOff.includes(day.id)
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {day.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Horario
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleManagement;