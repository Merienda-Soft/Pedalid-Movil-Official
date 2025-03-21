import { useEffect, useState, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { StyleSheet, Image, View, ScrollView, TouchableOpacity, Alert, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ParallaxScrollView from '../../components/ParallaxScrollView';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { useThemeColor } from '../../hooks/useThemeColor';
import { useRoute } from '@react-navigation/native';
import { getActivities } from '../../services/activity';
import { useNavigation } from 'expo-router';

export default function ReportsScreen() {
  const colorScheme = useColorScheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { materiaid, cursoid, teacherid, materiaName } = route.params;
  const [actividades, setActividades] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedType, setSelectedType] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Colores dinámicos basados en el tema
  const colors = useMemo(() => ({
    background: colorScheme === 'dark' ? '#1D3D47' : '#D0D0D0',
    text: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
    secondaryText: colorScheme === 'dark' ? '#B0B0B0' : '#666666',
    border: colorScheme === 'dark' ? '#2A4A54' : '#E0E0E0',
    accent: colorScheme === 'dark' ? '#4DA6FF' : '#007AFF',
    cell: colorScheme === 'dark' ? '#2A4A54' : '#F5F5F5',
    headerCell: colorScheme === 'dark' ? '#1D3D47' : '#E0E0E0',
  }), [colorScheme]);

  const monthNames = useMemo(() => [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ], []);

  const activityTypes = useMemo(() => [
    { id: 1, name: 'Ser', icon: 'heart-outline' },
    { id: 2, name: 'Saber', icon: 'book-outline' },
    { id: 3, name: 'Hacer', icon: 'construct-outline' },
    { id: 4, name: 'Decidir', icon: 'bulb-outline' }
  ], []);

  const handlePrevMonth = useCallback(() => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  }, []);

  const fetchTasks = useCallback(async () => {
    if (!materiaid || !cursoid || !teacherid) {
      Alert.alert('Error', 'Faltan parámetros para realizar la acción.');
      return;
    }
    setIsLoading(true);
    try {
      const taskData = await getActivities(materiaid, cursoid, teacherid);
      setActividades(taskData);
    } catch (error) {
      Alert.alert('Aviso', 'No hay tareas registradas para esta materia');
      setActividades([]);
    } finally {
      setIsLoading(false);
    }
  }, [materiaid, cursoid, teacherid]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useFocusEffect(
    useCallback(() => {
      fetchTasks();
    }, [fetchTasks])
  );

  const estudiantesUnicos = useMemo(() => {
    const estudiantes = {};
    actividades.forEach(tarea => {
      tarea.estudiantes.forEach(est => {
        if (!estudiantes[est.estudianteId.name]) {
          estudiantes[est.estudianteId.name] = {};
        }
        estudiantes[est.estudianteId.name][tarea._id] = est.calificacion;
      });
    });
    return estudiantes;
  }, [actividades]);

  const filteredActivities = useMemo(() => {
    return actividades.filter(tarea => {
      const taskDate = new Date(tarea.fecha);
      const matchesMonth = taskDate.getMonth() === currentDate.getMonth() && 
                          taskDate.getFullYear() === currentDate.getFullYear();
      const matchesType = selectedType ? tarea.tipo === selectedType : true;
      return matchesMonth && matchesType;
    });
  }, [actividades, currentDate, selectedType]);

  const calculateAverage = useCallback((studentName) => {
    const grades = filteredActivities.map(tarea => 
      estudiantesUnicos[studentName][tarea._id] || 0
    );
    const validGrades = grades.filter(grade => grade > -1);
    if (validGrades.length === 0) return 0;
    return (validGrades.reduce((a, b) => a + b, 0) / validGrades.length).toFixed(2);
  }, [filteredActivities, estudiantesUnicos]);

  const handleTareaPress = useCallback((tarea) => {
    const options = { '1': 'Ser', '2': 'Saber', '3': 'Hacer', '4': 'Decidir' };
    Alert.alert(
      `Detalles de ${tarea.name}`,
      `Descripción: ${tarea.description}\nPonderación: ${tarea.ponderacion}%\nTipo: ${options[tarea.tipo]}`,
      [
        { text: "Cerrar", style: "cancel" },
        {
          text: "Ver Calificaciones",
          onPress: () => navigation.navigate("calificaciones", { 
            screen: 'index', 
            params: { students: tarea.estudiantes, allTask: tarea } 
          }),
        },
      ]
    );
  }, [navigation]);

  return (
    <ParallaxScrollView
      modo={2}
      headerBackgroundColor={{ light: colors.background, dark: colors.background }}
      headerImage={
        <Image
          source={require('../../assets/images/reportes.jpg')}
          style={styles.headerImage}
        />
      }>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title" style={{ color: colors.text }}>
            Registro de Calificaciones
          </ThemedText>
          <ThemedText type="subtitle" style={{ color: colors.secondaryText }}>
            {materiaName}
          </ThemedText>
        </ThemedView>

        <View style={[styles.monthNavigator, { backgroundColor: colors.headerCell }]}>
          <TouchableOpacity 
            onPress={handlePrevMonth}
            style={styles.monthButton}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText type="subtitle" style={{ color: colors.text }}>
            {`${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
          </ThemedText>
          <TouchableOpacity 
            onPress={handleNextMonth}
            style={styles.monthButton}
          >
            <Ionicons name="chevron-forward" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          horizontal 
          style={styles.typeFilter}
          showsHorizontalScrollIndicator={false}
        >
          <TouchableOpacity 
            onPress={() => setSelectedType(null)}
            style={[
              styles.typeButton, 
              { borderColor: colors.border },
              !selectedType && { backgroundColor: colors.accent }
            ]}
          >
            <Ionicons 
              name="apps-outline" 
              size={20} 
              color={!selectedType ? '#FFFFFF' : colors.text} 
            />
            <ThemedText style={[
              styles.typeText,
              !selectedType && styles.selectedTypeText
            ]}>
              Todos
            </ThemedText>
          </TouchableOpacity>
          {activityTypes.map(type => (
            <TouchableOpacity 
              key={type.id}
              onPress={() => setSelectedType(type.id)}
              style={[
                styles.typeButton,
                { borderColor: colors.border },
                selectedType === type.id && { backgroundColor: colors.accent }
              ]}
            >
              <Ionicons 
                name={type.icon} 
                size={20} 
                color={selectedType === type.id ? '#FFFFFF' : colors.text} 
              />
              <ThemedText style={[
                styles.typeText,
                selectedType === type.id && styles.selectedTypeText
              ]}>
                {type.name}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView horizontal>
          <View style={styles.table}>
            <View style={[styles.headerRow, { backgroundColor: colors.headerCell }]}>
              <ThemedText style={[styles.headerCell, { color: colors.text }]}>
                Estudiantes
              </ThemedText>
              {filteredActivities.map((tarea, index) => (
                <TouchableOpacity 
                  key={index} 
                  onPress={() => handleTareaPress(tarea)}
                  style={styles.headerButton}
                >
                  <ThemedText style={[styles.headerText, { color: colors.text }]}>
                    {tarea.name}
                  </ThemedText>
                </TouchableOpacity>
              ))}
              <ThemedText style={[styles.headerCell, { color: colors.text }]}>
                Promedio
              </ThemedText>
            </View>

            {Object.keys(estudiantesUnicos).map((nombre, rowIndex) => (
              <View 
                key={rowIndex} 
                style={[
                  styles.row,
                  { backgroundColor: rowIndex % 2 === 0 ? colors.cell : 'transparent' }
                ]}
              >
                <ThemedText style={[styles.nameCell, { color: colors.text }]}>
                  {nombre}
                </ThemedText>
                {filteredActivities.map((tarea, colIndex) => (
                  <ThemedText 
                    key={colIndex} 
                    style={[styles.gradeCell, { color: colors.text }]}
                  >
                    {estudiantesUnicos[nombre][tarea._id] ?? '-'}
                  </ThemedText>
                ))}
                <ThemedText 
                  style={[styles.averageCell, { color: colors.accent }]}
                >
                  {calculateAverage(nombre)}
                </ThemedText>
              </View>
            ))}
          </View>
        </ScrollView>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 0,
  },
  headerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  titleContainer: {
    marginBottom: 0,
  },
  monthNavigator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  monthButton: {
    padding: 8,
  },
  typeFilter: {
    marginBottom: 10,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 2,
  },
  typeText: {
    marginLeft: 8,
  },
  selectedTypeText: {
    color: '#FFFFFF',
  },
  table: {
    marginTop: 8,
  },
  headerRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  headerCell: {
    width: 120,
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 15,
  },
  headerButton: {
    width: 100,
    alignItems: 'center',
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  nameCell: {
    width: 120,
    fontSize: 14,
  },
  gradeCell: {
    width: 100,
    textAlign: 'center',
    fontSize: 14,
  },
  averageCell: {
    width: 100,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
