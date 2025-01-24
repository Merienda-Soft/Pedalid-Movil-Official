import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, Button, Alert } from 'react-native';
import ParallaxScrollView from '../../components/ParallaxScrollView';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { Picker } from '@react-native-picker/picker';  // Picker para seleccionar la asistencia
import DateTimePicker from '@react-native-community/datetimepicker';  // DatePicker para seleccionar la fecha
import { getStudentsByCourseAndSubject, saveAttendance, getAttendanceByCourseAndDate } from '../../services/attendance';  // Importar el servicio de API
import { useGlobalState } from '../../services/UserContext';

import { useColorScheme } from 'react-native';


export default function AttendanceScreen() {
  const colorScheme = useColorScheme();
  const { globalState } = useGlobalState();
  const {cursoid, materiaid, cursoName} = globalState
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [students, setStudents] = useState([]);
  const [attendances, setAttendances] = useState({});  // Estado para almacenar las asistencias

  // Obtener los estudiantes del curso y materia
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const courseid = cursoid;  // Obtener los IDs dinámicamente según el curso y materia
        const materiaaid = materiaid;
        const response = await getStudentsByCourseAndSubject(courseid, materiaaid);
        setStudents(response);
        // Inicializar las asistencias con "A" (asistió) por defecto
        const initialAttendance = {};
        response.forEach(student => {
          initialAttendance[student._id] = 'A';  // 'A' = Asistió por defecto
        });
        setAttendances(initialAttendance);
      } catch (error) {
        Alert.alert('Error', 'No se pudieron obtener los estudiantes');
      }
    };

    fetchStudents();
  }, []);

  // Manejar el cambio de asistencia
  const handleAttendanceChange = (studentId, attendance) => {
    setAttendances((prevState) => ({
      ...prevState,
      [studentId]: attendance,
    }));
  };


const handleSaveAttendance = async (courseid, materiaid, date, attendances) => {
  try {
    // Primero, verifica si ya existe una asistencia para esa fecha
    const existingAttendance = await getAttendanceByCourseAndDate(courseid, materiaid, date);
    
    if (existingAttendance) {
      Alert.alert('Atención', 'Ya existe una asistencia para esta fecha. Por favor, edítala en lugar de crear una nueva.');
      return;
    }
    
    // Si no existe, guarda la nueva asistencia
    const attendanceData = {
      courseid,
      materiaid,
      date,
      attendances  // La lista de estudiantes con sus asistencias
    };

    await saveAttendance(attendanceData);
    Alert.alert('Éxito', 'Asistencia guardada correctamente.');
    
  } catch (error) {
    if (error.message.includes('No se encontró asistencia')) {
      // No se encontró asistencia para esa fecha, puedes proceder a guardar una nueva
      const attendanceData = {
        courseid,
        materiaid,
        date,
        attendances  // La lista de estudiantes con sus asistencias
      };
      
      await saveAttendance(attendanceData);
      Alert.alert('Éxito', 'Asistencia guardada correctamente.');
    } else {
      Alert.alert('Error', 'Error al guardar la asistencia.');
    }
  }
};


  // Mostrar el selector de fecha
  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  return (
    <ParallaxScrollView
      modo={2}
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('../../assets/images/asistencia.jpg')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Asistencias</ThemedText>
        <ThemedText type="defualt">({cursoName})</ThemedText>
      </ThemedView>

      {/* Selector de fecha */}
      <View style={styles.datePickerContainer}>
        <Button title="Seleccionar Fecha" onPress={showDatepicker} />
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowDatePicker(false);
              setSelectedDate(date || selectedDate);
            }}
          />
        )}
        <Text>Fecha seleccionada: {selectedDate.toDateString()}</Text>
      </View>

      {/* Lista de estudiantes con asistencia */}
      {students.map((student) => (
        <View key={student._id} style={styles.studentContainer}>
          <Text style={[
            styles.studentName, 
            {color: colorScheme === 'dark' ? '#FFFFFF' : '#000000'}
          ]}>
            {student.name}
          </Text>
          <Picker
            selectedValue={attendances[student._id]}
            style={[
              styles.picker,
              {
                color: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
                backgroundColor: colorScheme === 'dark' ? '#333333' : '#FFFFFF'
              }
            ]}
            dropdownIconColor={colorScheme === 'dark' ? '#FFFFFF' : '#000000'}
            onValueChange={(itemValue) => handleAttendanceChange(student._id, itemValue)}>
            <Picker.Item 
              label="Asistió" 
              value="A" 
              style={{color: '#000000'}}
            />
            <Picker.Item 
              label="Falta" 
              value="F" 
              style={{color: '#000000'}}
            />
            <Picker.Item 
              label="Licencia" 
              value="L" 
              style={{color: '#000000'}}
            />
          </Picker>
        </View>
      ))}

      {/* Botón para guardar las asistencias */}
      <Button title="Guardar Asistencias" onPress={handleSaveAttendance} color="green" />
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  reactLogo: {
    height: '100%',
    width: '100%',
  },
  datePickerContainer: {
  },
  studentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  studentName: {
    width: '55%',
    fontSize: 16,
    fontWeight: 'bold',
  },
  picker: {
    width: 150,
    height: 40,
  },
});
