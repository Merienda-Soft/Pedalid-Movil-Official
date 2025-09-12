import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import ParallaxScrollView from '../../components/ParallaxScrollView';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { getStudentsByCourse, registerAttendance, getAttendanceByCourseSubjectDate, updateAttendanceRecord } from '../../services/attendance';
import { useGlobalState } from '../../services/UserContext';
import { useColorScheme } from 'react-native';

// Constantes para los estados de asistencia
const ATTENDANCE_STATES = {
  PRESENT: 'P',
  ABSENT: 'A',
  JUSTIFIED: 'J'
};

export default function AttendanceScreen() {
  const colorScheme = useColorScheme();
  const { globalState } = useGlobalState();
  const { cursoid, materiaid, cursoName, teacherid, management } = globalState;
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [students, setStudents] = useState([]);
  const [attendances, setAttendances] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [existingAttendance, setExistingAttendance] = useState(false);
  const [managementIdValue, setManagementIdValue] = useState(null);
  const [professorIdValue, setProfessorIdValue] = useState(null);
  const [attendanceId, setAttendanceId] = useState(null);
  const [originalAttendances, setOriginalAttendances] = useState({});

  // Colores basados en el tema
  const theme = {
    background: colorScheme === 'dark' ? '#1D3D47' : '#F5F5F5',
    card: colorScheme === 'dark' ? '#2A4A54' : '#FFFFFF',
    text: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
    subtext: colorScheme === 'dark' ? '#B0B0B0' : '#666666',
    border: colorScheme === 'dark' ? '#3A5A64' : '#E0E0E0',
    primary: '#17A2B8',
    success: '#4CAF50',
    error: '#FF5252',
    warning: '#FFC107',
  };

  // Obtener datos iniciales
  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  // En useEffect, puedes cargar estos valores
  useEffect(() => {
    // Función para cargar los IDs necesarios
    const loadRequiredIds = async () => {
      try {
        // Aquí podrías hacer una llamada a la API para obtener estos valores
        // Por ejemplo:
        // const response = await fetchManagementData();
        // setManagementIdValue(response.data.managementId);
        // setProfessorIdValue(response.data.professorId);
        
        // O si están disponibles en algún almacenamiento local:
        const storedManagementId = 1; // Reemplazar con el valor real
        const storedProfessorId = 1; // Reemplazar con el valor real
        
        setManagementIdValue(storedManagementId);
        setProfessorIdValue(storedProfessorId);
      } catch (error) {
        console.error("Error cargando datos requeridos:", error);
      }
    };

    loadRequiredIds();
  }, []);

  // Función para cargar estudiantes y verificar asistencias existentes
  const fetchData = async () => {
    setLoading(true);
    try {
      // Cargar estudiantes del curso
      const studentsResponse = await getStudentsByCourse(cursoid);
      
      if (studentsResponse && studentsResponse.ok && Array.isArray(studentsResponse.data)) {
        const studentsData = studentsResponse.data;
        setStudents(studentsData);
        
        // Inicializar asistencias por defecto
        const newAttendances = {};
        studentsData.forEach(student => {
          newAttendances[student.student_id] = ATTENDANCE_STATES.PRESENT;
        });
        
        // Verificar si ya existe una asistencia para esta fecha
        const dateString = formatDate(selectedDate);
        
        try {
          const existingData = await getAttendanceByCourseSubjectDate(
            cursoid, 
            materiaid,
            dateString
          );
          
          console.log("Respuesta completa:", JSON.stringify(existingData));
          
          if (existingData && existingData.ok && existingData.data) {
            // Guardar el ID de la asistencia
            if (existingData.data.id) {
              setAttendanceId(existingData.data.id);
            }
            
            // Ver la estructura completa de los records
            console.log("Records:", JSON.stringify(existingData.data.records));
            
            // Intentar acceder a cada registro
            const recordsMap = {};
            
            existingData.data.records.forEach((record, index) => {
              console.log(`Record ${index}:`, JSON.stringify(record));
              
              // Asegúrate de que record.student_id y record.status existan
              if (record && record.student_id !== undefined && record.status) {
                // Guardar el estado y el ID del registro
                recordsMap[record.student_id] = {
                  status: record.status.trim(),
                  record_id: record.id // Guardar el ID del registro
                };
              }
            });
            
            console.log("Mapa de asistencias:", recordsMap);
            
            // Solo establecer como existente si hay registros
            if (Object.keys(recordsMap).length > 0) {
              setAttendances(recordsMap);
              setExistingAttendance(true);
              setOriginalAttendances(JSON.parse(JSON.stringify(recordsMap)));
            } else {
              setAttendances(newAttendances);
              setExistingAttendance(false);
            }
          } else {
            setAttendances(newAttendances);
            setExistingAttendance(false);
          }
        } catch (error) {
          console.error("Error al cargar asistencias:", error);
          setAttendances(newAttendances);
          setExistingAttendance(false);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los datos de asistencia');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Función para refrescar los datos
  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Función para formatear la fecha a YYYY-MM-DD
  const formatDate = (date) => {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
  };

  // Manejar el cambio de asistencia
  const handleAttendanceChange = (studentId, status) => {
    setAttendances(prev => {
      const currentValue = prev[studentId];
      
      // Si el valor actual es un objeto (con record_id), preservar el record_id
      if (typeof currentValue === 'object' && currentValue.record_id) {
        return {
          ...prev,
          [studentId]: {
            status: status,
            record_id: currentValue.record_id
          }
        };
      }
      
      // Si no es un objeto, simplemente actualizar el estado
      return {
        ...prev,
        [studentId]: status
      };
    });
  };

  // Guardar la asistencia
  const handleSaveAttendance = async () => {
    setSaving(true);
    try {
      const dateString = formatDate(selectedDate);
      
      // Verificar que los IDs requeridos existan
      if (!management?.id) {
        throw new Error('No se encontró el ID de gestión (management_id)');
      }
      
      if (!teacherid) {
        throw new Error('No se encontró el ID del profesor (professor_id)');
      }
      
      // Si es una actualización
      if (existingAttendance && attendanceId) {
        // Filtrar solo los estudiantes con cambios
        const changedStudents = Object.keys(attendances).filter(studentId => {
          const currentValue = attendances[studentId];
          const originalValue = originalAttendances[studentId];
          
          // Obtener el estado actual
          const currentStatus = typeof currentValue === 'object' ? currentValue.status : currentValue;
          
          // Obtener el estado original
          const originalStatus = typeof originalValue === 'object' ? originalValue.status : originalValue;
          
          // Comparar para ver si hay cambio
          return currentStatus !== originalStatus;
        });
        
        // Si no hay cambios, mostrar mensaje y salir
        if (changedStudents.length === 0) {
          Alert.alert('Información', 'No hay cambios para guardar');
          setSaving(false);
      return;
    }
    
        // Preparar solo los datos de los estudiantes modificados
        const studentsData = changedStudents.map(studentId => {
          const currentValue = attendances[studentId];
          const status = typeof currentValue === 'object' ? currentValue.status : currentValue;
          
          return {
            student_id: parseInt(studentId),
            status_attendance: status
          };
        });
        
        const updateData = {
          attendance_id: attendanceId,
          students: studentsData
        };
        
        console.log("Enviando actualización:", JSON.stringify(updateData));
        
        // Usar el endpoint de actualización
        const response = await updateAttendanceRecord(updateData, teacherid);
        
        if (response && response.ok) {
          Alert.alert('Éxito', 'Asistencia actualizada correctamente');
          // Actualizar los originales después de guardar
          setOriginalAttendances(JSON.parse(JSON.stringify(attendances)));
        } else {
          throw new Error('Error al actualizar la asistencia');
        }
      } else {
        // Si es una nueva asistencia, usar registerAttendance como antes
        const quarter = "Q1"; // Ajustar según necesidades
        
      const attendanceData = {
          attendance_date: dateString,
          quarter: quarter,
          management_id: management.id,
          subject_id: materiaid,
          professor_id: teacherid,
          course_id: cursoid
        };
        
        const recordsData = Object.keys(attendances).map(studentId => ({
          student_id: parseInt(studentId),
          status_attendance: attendances[studentId]
        }));
        
        const response = await registerAttendance(attendanceData, recordsData, teacherid);
        
        if (response && response.ok) {
          // Guardar el ID de asistencia recién creada si está disponible
          if (response.data && response.data.id) {
            setAttendanceId(response.data.id);
          }
          Alert.alert('Éxito', 'Asistencia guardada correctamente');
          setExistingAttendance(true);
    } else {
          throw new Error('Error al guardar la asistencia');
        }
      }
      
      // Recargar los datos para reflejar los cambios
      fetchData();
      
    } catch (error) {
      Alert.alert('Error', `No se pudo guardar la asistencia: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <ParallaxScrollView
      modo={2}
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('../../assets/images/asistencia.jpg')}
          style={styles.reactLogo}
        />
      }
      scrollComponent={ScrollView}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />
      }
    >
      <ThemedView style={styles.container}>
        {/* Cabecera compacta con título y fecha */}
        <View style={styles.headerRow}>
          <View>
            <ThemedText type="title" style={styles.title}>Asistencias</ThemedText>
            <ThemedText type="subtitle" style={styles.subtitle}>{cursoName}</ThemedText>
          </View>
          
          <View style={styles.dateStatusContainer}>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={18} color={theme.primary} />
              <ThemedText style={styles.dateText}>
                {selectedDate.toLocaleDateString()}
              </ThemedText>
            </TouchableOpacity>
            
            <View 
              style={[
                styles.statusDot, 
                { backgroundColor: existingAttendance ? theme.success : theme.warning }
              ]}
            />
          </View>
          
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowDatePicker(false);
                if (date) setSelectedDate(date);
            }}
          />
        )}
      </View>

        {/* Contador de estudiantes más compacto */}
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          {students.length} estudiantes
        </ThemedText>
        
        {/* Lista de estudiantes en columna */}
        <View style={styles.studentsColumn}>
          {students
            // Ordenar por apellido
            .sort((a, b) => a.lastname.localeCompare(b.lastname))
            .map((student) => {
              const currentValue = attendances[student.student_id];
              const currentStatus = typeof currentValue === 'object' ? 
                currentValue.status : currentValue;
              let statusColor;
              
              switch(currentStatus) {
                case ATTENDANCE_STATES.PRESENT: 
                  statusColor = theme.success; break;
                case ATTENDANCE_STATES.ABSENT: 
                  statusColor = theme.error; break;
                case ATTENDANCE_STATES.JUSTIFIED: 
                  statusColor = theme.warning; break;
              }
              
              return (
                <ThemedView 
                  key={student.student_id} 
                  style={[styles.studentCard, {borderLeftColor: statusColor, borderLeftWidth: 3}]}
                >
                  <View style={styles.studentRow}>
                    <ThemedText style={styles.studentName}>
                      {student.lastname} {student.second_lastname || ''} {student.name}
                    </ThemedText>
                    
                    <View style={styles.attendanceOptions}>
                      <TouchableOpacity
                        style={[styles.attendanceButton, { 
                          backgroundColor: currentStatus === ATTENDANCE_STATES.PRESENT ? 
                            theme.success : 'transparent',
                          borderColor: theme.success
                        }]}
                        onPress={() => handleAttendanceChange(student.student_id, ATTENDANCE_STATES.PRESENT)}
                      >
                        <Text style={{ 
                          color: currentStatus === ATTENDANCE_STATES.PRESENT ? '#FFFFFF' : theme.success,
                          fontWeight: 'bold',
                          fontSize: 16
                        }}>P</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[styles.attendanceButton, { 
                          backgroundColor: currentStatus === ATTENDANCE_STATES.ABSENT ? 
                            theme.error : 'transparent',
                          borderColor: theme.error
                        }]}
                        onPress={() => handleAttendanceChange(student.student_id, ATTENDANCE_STATES.ABSENT)}
                      >
                        <Text style={{ 
                          color: currentStatus === ATTENDANCE_STATES.ABSENT ? '#FFFFFF' : theme.error,
                          fontWeight: 'bold',
                          fontSize: 16
                        }}>A</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[styles.attendanceButton, { 
                          backgroundColor: currentStatus === ATTENDANCE_STATES.JUSTIFIED ? 
                            theme.warning : 'transparent',
                          borderColor: theme.warning
                        }]}
                        onPress={() => handleAttendanceChange(student.student_id, ATTENDANCE_STATES.JUSTIFIED)}
                      >
                        <Text style={{ 
                          color: currentStatus === ATTENDANCE_STATES.JUSTIFIED ? '#FFFFFF' : theme.warning,
                          fontWeight: 'bold',
                          fontSize: 16
                        }}>J</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </ThemedView>
              );
            })
          }
        </View>
        
        {/* Botón de guardar */}
        <TouchableOpacity
          style={[styles.saveButton, { opacity: saving ? 0.7 : 1 }]}
          onPress={handleSaveAttendance}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Ionicons name="save-outline" size={22} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>
                {existingAttendance ? 'Actualizar' : 'Guardar'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 0,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.8,
  },
  dateStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '500',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  reactLogo: {
    height: '100%',
    width: '100%',
    resizeMode: 'cover',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 6,
  },
  studentsColumn: {
    flexDirection: 'column',
  },
  studentCard: {
    width: '100%',
    padding: 10,
    marginBottom: 8,
    borderRadius: 5,
  },
  studentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
    flexWrap: 'wrap',
    paddingRight: 5,
  },
  attendanceOptions: {
    flexDirection: 'row',
    gap: 10,
    alignSelf: 'center',
  },
  attendanceButton: {
    width: 34,
    height: 34,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#17A2B8',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    gap: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
});
