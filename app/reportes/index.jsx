import { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { StyleSheet, Image, View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useRoute } from '@react-navigation/native';
import { getActivities } from '@/services/activity';
import { useNavigation } from 'expo-router';

export default function reportsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { materiaid, cursoid, teacherid, materiaName, cursoName } = route.params;
  const [actividades, setActividades] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedType, setSelectedType] = useState(null);

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]; 

  const activityTypes = [
    { id: 1, name: 'Ser' },
    { id: 2, name: 'Saber' },
    { id: 3, name: 'Hacer' },
    { id: 4, name: 'Decidir' }
  ];

  const handlePrevMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  const fetchTasks = async () => {
    if (!materiaid || !cursoid || !teacherid) {
      Alert.alert('Error', 'Faltan parámetros para realizar la acción.');
      return;
    }
    try {
      const taskData = await getActivities(materiaid, cursoid, teacherid);
      setActividades(taskData);
    } catch (error) {
      Alert.alert('Aviso', 'No tienes creada ninguna tarea para esta materia');
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [materiaid, cursoid, teacherid]);

  useFocusEffect(
    useCallback(() => {
      fetchTasks();
    }, [])
  );
  
  const color = useThemeColor({}, 'text');

  const estudiantesUnicos = {};
  actividades.forEach(tarea => {
    tarea.estudiantes.forEach(est => {
      if (!estudiantesUnicos[est.estudianteId.name]) {
        estudiantesUnicos[est.estudianteId.name] = {};
      }
      estudiantesUnicos[est.estudianteId.name][tarea._id] = est.calificacion;
    });
  });

  const estudiantes = Object.keys(estudiantesUnicos);
  const tareas = actividades.map(tarea => tarea);

  // Filter activities by current month and selected type
  const filteredActivities = actividades.filter(tarea => {
    const taskDate = new Date(tarea.fecha);
    const matchesMonth = taskDate.getMonth() === currentDate.getMonth() && 
                        taskDate.getFullYear() === currentDate.getFullYear();
    const matchesType = selectedType ? tarea.tipo === selectedType : true;
    return matchesMonth && matchesType;
  });

  // Calculate monthly averages
  const calculateAverage = (studentName) => {
    const grades = filteredActivities.map(tarea => 
      estudiantesUnicos[studentName][tarea._id] || 0
    );
    const validGrades = grades.filter(grade => grade > -1);
    if (validGrades.length === 0) return 0;
    return (validGrades.reduce((a, b) => a + b, 0) / validGrades.length).toFixed(2);
  };

  const handleTareaPress = (tarea) => {
    const options = { '1': 'Ser', '2': 'Saber', '3': 'Hacer', '4': 'Decidir' };
    Alert.alert(
      `Detalles de ${tarea.name}`,
      `Descripción: ${tarea.description}\nPonderación: ${tarea.ponderacion}\nTipo: ${options[tarea.tipo]}`,
      [
        {
          text: "Cerrar",
          style: "cancel",
        },
        {
          text: "Ir",
          onPress: () => navigation.navigate("calificaciones", 
            { screen: 'index', 
              params: { students: tarea.estudiantes, allTask: tarea } 
            }),
        },
      ]
    );
  };

  return (
    <ParallaxScrollView
      modo={2}
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={
        <Image
          source={require('@/assets/images/reportes.jpg')}
          style={styles.headerImage}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Registro</ThemedText>
      </ThemedView>

      {/* Month Navigator */}
      <View style={styles.monthNavigator}>
        <TouchableOpacity onPress={handlePrevMonth}>
          <ThemedText style={styles.arrow}>{'<'}</ThemedText>
        </TouchableOpacity>
        <ThemedText type="subtitle">
          {`${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
        </ThemedText>
        <TouchableOpacity onPress={handleNextMonth}>
          <ThemedText style={styles.arrow}>{'>'}</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Type Filter */}
      <View style={styles.typeFilter}>
        <TouchableOpacity 
          onPress={() => setSelectedType(null)}
          style={[
            styles.typeButton, 
            !selectedType && styles.selectedType
          ]}
        >
          <ThemedText style={!selectedType && styles.selectedTypeText}>
            Todos
          </ThemedText>
        </TouchableOpacity>
        {activityTypes.map(type => (
          <TouchableOpacity 
            key={type.id}
            onPress={() => setSelectedType(type.id)}
            style={[
              styles.typeButton,
              selectedType === type.id && styles.selectedType
            ]}
          >
            <ThemedText style={selectedType === type.id && styles.selectedTypeText}>
              {type.name}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView horizontal>
        <View style={styles.table}>
          <View style={styles.row}>
            <Text style={[styles.title, { color }]}>Estudiantes</Text>
            {filteredActivities.map((tarea, index) => (
              <TouchableOpacity key={index} onPress={() => handleTareaPress(tarea)}>
                <Text style={[styles.headerButton, { color }]}>{tarea.name}</Text>
              </TouchableOpacity>
            ))}
            <Text style={[styles.headerButton, { color }]}>Promedio</Text>
          </View>

          {estudiantes.map((nombre, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              <Text style={[styles.name, { color }]}>{nombre}</Text>
              {filteredActivities.map((tarea, colIndex) => (
                <Text key={colIndex} style={[styles.cell, { color }]}>
                  {estudiantesUnicos[nombre][tarea._id] ?? ''}
                </Text>
              ))}
              <Text style={[styles.cell, { color, fontWeight: 'bold' }]}>
                {calculateAverage(nombre)}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  }, 
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerButton: {
    fontWeight: 'bold',
    fontSize: 16,
    width: 100,
    textAlign: 'center',
  },
  cell: {
    fontSize: 16,
    width: 100,
    textAlign: 'center',
  },
  name: {
    fontSize: 16,
    width: 100,
    textAlign: 'start',
  },
  monthNavigator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 5,
  },
  arrow: {
    fontSize: 24,
    paddingHorizontal: 20,
  },
  typeFilter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 5,
  },
  typeButton: {
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  selectedType: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  selectedTypeText: {
    color: '#FFFFFF',
  }
});
