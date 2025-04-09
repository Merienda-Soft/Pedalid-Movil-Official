import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import ParallaxScrollView from '../../components/ParallaxScrollView';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { getStudentsByCourse, registerAttendance, getAttendanceByCourseSubjectDate } from '../../services/attendance';
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
          
          if (existingData && existingData.ok && existingData.data) {
            // Si existe, cargar esos datos
            const recordsMap = {};
            existingData.data.records.forEach(record => {
              recordsMap[record.student_id] = record.status_attendance;
            });
            setAttendances(recordsMap);
            setExistingAttendance(true);
          } else {
            setAttendances(newAttendances);
            setExistingAttendance(false);
          }
        } catch (error) {
          // Si no existe asistencia para esa fecha, usar valores por defecto
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
    setAttendances(prev => ({
      ...prev,
      [studentId]: status
    }));
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
      
      // Preparar los datos para la API
      const quarter = "Q1"; // Ajustar según necesidades o hacer dinámico
      
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
      
      const response = await registerAttendance(attendanceData, recordsData);
      
      if (response && response.ok) {
        Alert.alert('Éxito', 'Asistencia guardada correctamente');
        setExistingAttendance(true);
      } else {
        throw new Error('Error al guardar la asistencia');
      }
    } catch (error) {
      Alert.alert('Error', `No se pudo guardar la asistencia: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Renderizar botón de asistencia
  const renderAttendanceButton = (studentId, status, targetStatus) => {
    const isSelected = attendances[studentId] === targetStatus;
    
    let iconName, color, label;
    switch (targetStatus) {
      case ATTENDANCE_STATES.PRESENT:
        iconName = 'checkmark-circle';
        color = theme.success;
        label = 'Presente';
        break;
      case ATTENDANCE_STATES.ABSENT:
        iconName = 'close-circle';
        color = theme.error;
        label = 'Ausente';
        break;
      case ATTENDANCE_STATES.JUSTIFIED:
        iconName = 'alert-circle';
        color = theme.warning;
        label = 'Justificado';
        break;
    }
    
    return (
      <TouchableOpacity
        style={[
          styles.attendanceButton,
          { borderColor: color, backgroundColor: isSelected ? color : 'transparent' }
        ]}
        onPress={() => handleAttendanceChange(studentId, targetStatus)}
      >
        <Ionicons
          name={iconName}
          size={22}
          color={isSelected ? '#FFFFFF' : color}
        />
        <Text style={[styles.buttonText, { color: isSelected ? '#FFFFFF' : color }]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
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
        {/* Título y subtítulo */}
        <View style={styles.headerContainer}>
          <ThemedText type="title" style={styles.title}>Registro de Asistencias</ThemedText>
          <ThemedText type="default" style={styles.subtitle}>{cursoName}</ThemedText>
        </View>
        
        {/* Selector de fecha */}
        <ThemedView style={styles.dateContainer}>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={24} color={theme.primary} />
            <ThemedText style={styles.dateText}>
              {selectedDate.toLocaleDateString()}
            </ThemedText>
          </TouchableOpacity>
          
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
        </ThemedView>
        
        {/* Estado de la asistencia */}
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: existingAttendance ? theme.success : theme.warning }]}>
            <ThemedText style={styles.statusText}>
              {existingAttendance ? 'Asistencia registrada' : 'Pendiente de registro'}
            </ThemedText>
          </View>
        </View>
        
        {/* Lista de estudiantes */}
        <ThemedText type="subtitle" style={styles.sectionTitle}>Estudiantes ({students.length})</ThemedText>
        
        {students.map((student) => (
          <ThemedView key={student.student_id} style={styles.studentCard}>
            <View style={styles.studentInfo}>
              <View style={styles.nameContainer}>
                <ThemedText style={styles.studentName}>
                  {student.name} {student.lastname} {student.second_lastname || ''}
                </ThemedText>
                <ThemedText style={styles.studentRude}>
                  RUDE: {student.matricula || 'N/A'}
                </ThemedText>
              </View>
            </View>
            
            <View style={styles.attendanceOptions}>
              {renderAttendanceButton(student.student_id, attendances[student.student_id], ATTENDANCE_STATES.PRESENT)}
              {renderAttendanceButton(student.student_id, attendances[student.student_id], ATTENDANCE_STATES.ABSENT)}
              {renderAttendanceButton(student.student_id, attendances[student.student_id], ATTENDANCE_STATES.JUSTIFIED)}
            </View>
          </ThemedView>
        ))}
        
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
              <Ionicons name="save-outline" size={24} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>
                {existingAttendance ? 'Actualizar Asistencia' : 'Guardar Asistencia'}
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
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
  },
  dateContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '500',
  },
  reactLogo: {
    height: '100%',
    width: '100%',
    resizeMode: 'cover',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
  studentCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  studentInfo: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  nameContainer: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
  },
  studentRude: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
  attendanceOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  attendanceButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#17A2B8',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
});
