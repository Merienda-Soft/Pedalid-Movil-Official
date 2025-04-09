import { useEffect, useState, useCallback, useMemo } from 'react';
import { StyleSheet, Image, View, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import ParallaxScrollView from '../../components/ParallaxScrollView';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { getActivities } from '../../services/activity';
import { getStudentsByCourse } from '../../services/attendance';
import { useColorScheme } from 'react-native';

export default function ReportsScreen() {
  const colorScheme = useColorScheme();
  const route = useRoute();
  const { materiaid, cursoid, teacherid, materiaName, management } = route.params;
  const [activities, setActivities] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDimension, setSelectedDimension] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const currentMonth = new Date().getMonth();
    return currentMonth;
  });

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

  const dimensions = [
    { id: 1, name: 'Ser', icon: 'heart-outline', color: '#FF6B6B' },
    { id: 2, name: 'Saber', icon: 'book-outline', color: '#4ECDC4' },
    { id: 3, name: 'Hacer', icon: 'construct-outline', color: '#45B7D1' },
    { id: 4, name: 'Decidir', icon: 'bulb-outline', color: '#96CEB4' }
  ];

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const fetchData = useCallback(async () => {
    setLoading(true);

    try {
      // Modificamos la llamada para manejar el caso donde management es undefined
      const managementId = JSON.parse(management)?.id; // Valor por defecto si no existe


      const [activitiesData, studentsData] = await Promise.all([
        getActivities(materiaid, cursoid, teacherid, managementId),
        getStudentsByCourse(cursoid)
      ]);


      if (activitiesData) {
        setActivities(activitiesData);
      }

      if (studentsData && studentsData.ok) {
        setStudents(studentsData.data);
      }
    } catch (error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [materiaid, cursoid, teacherid, management]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const filteredActivities = useMemo(() => {
    return activities.filter(activity => {
      const activityDate = new Date(activity.create_date);
      const monthMatch = activityDate.getMonth() === selectedMonth;
      const dimensionMatch = !selectedDimension || activity.dimension_id === selectedDimension;
      
      return monthMatch && dimensionMatch;
    });
  }, [activities, selectedMonth, selectedDimension]);

  const getStudentGrade = useCallback((studentId, taskId) => {
    const activity = activities.find(a => a.id === taskId);
    if (!activity?.assignments) return '-';
    
    const assignment = activity.assignments.find(a => a.student_id === studentId);
    if (!assignment?.qualification) return '-';
    
    return assignment.qualification.toString().trim();
  }, [activities]);

  const calculateAverage = (studentId) => {
    const grades = filteredActivities
      .map(activity => {
        const assignment = activity.assignments.find(a => a.student_id === studentId);
        return assignment?.qualification ? parseFloat(assignment.qualification.trim()) : null;
      })
      .filter(grade => grade !== null);

    if (grades.length === 0) return '-';
    return (grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(1);
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
          source={require('../../assets/images/reportes.jpg')}
          style={styles.headerImage}
        />
      }
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <ThemedView style={styles.container}>
        {/* Cabecera actualizada */}
        <View style={styles.titleContainer}>
          <View style={styles.titleRow}>
            <View style={styles.titleWrapper}>
              <ThemedText type="title" style={styles.title}>Registro de Notas</ThemedText>
              <ThemedText type="default" style={styles.managementText}>
                Gestión {JSON.parse(management)?.management || '2024'}
              </ThemedText>
            </View>
          </View>
          <ThemedText style={styles.subtitle}>
            {materiaName}
          </ThemedText>
        </View>

        {/* Selector de mes actualizado */}
        <View style={[styles.monthNavigator, { backgroundColor: theme.card }]}>
          <TouchableOpacity 
            onPress={() => setSelectedMonth(prev => prev === 0 ? 11 : prev - 1)}
            style={styles.monthButton}
          >
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <ThemedText style={styles.monthText}>
            {months[selectedMonth]}
          </ThemedText>
          <TouchableOpacity 
            onPress={() => setSelectedMonth(prev => prev === 11 ? 0 : prev + 1)}
            style={styles.monthButton}
          >
            <Ionicons name="chevron-forward" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>

        {/* Filtros de dimensión */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
        >
          <TouchableOpacity
            style={[
              styles.filterButton,
              !selectedDimension && { backgroundColor: theme.primary }
            ]}
            onPress={() => setSelectedDimension(null)}
          >
            <Ionicons 
              name="apps-outline" 
              size={20} 
              color={!selectedDimension ? '#FFFFFF' : theme.text} 
            />
            <ThemedText style={[
              styles.filterText,
              !selectedDimension && { color: '#FFFFFF' }
            ]}>
              Todas
            </ThemedText>
          </TouchableOpacity>

          {dimensions.map(dim => (
            <TouchableOpacity
              key={`dimension-${dim.id}`}
              style={[
                styles.filterButton,
                selectedDimension === dim.id && { backgroundColor: dim.color }
              ]}
              onPress={() => setSelectedDimension(dim.id)}
            >
              <Ionicons 
                name={dim.icon} 
                size={20} 
                color={selectedDimension === dim.id ? '#FFFFFF' : theme.text} 
              />
              <ThemedText style={[
                styles.filterText,
                selectedDimension === dim.id && { color: '#FFFFFF' }
              ]}>
                {dim.name}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Tabla de calificaciones */}
        <ScrollView horizontal>
          <View style={styles.tableContainer}>
            {/* Encabezado de la tabla */}
            <View style={[styles.headerRow, { backgroundColor: theme.card }]}>
              <View style={[styles.headerCell, styles.nameCell]}>
                <ThemedText style={styles.headerText}>Estudiante</ThemedText>
              </View>
              {filteredActivities.map(activity => (
                <View key={`header-activity-${activity.id}`} style={[styles.headerCell, styles.gradeCell]}>
                  <ThemedText style={styles.headerText} numberOfLines={2}>
                    {activity.name}
                  </ThemedText>
                  <ThemedText style={styles.weightText}>
                    {activity.weight}%
                  </ThemedText>
                </View>
              ))}
              <View style={[styles.headerCell, styles.gradeCell]}>
                <ThemedText style={styles.headerText}>Promedio</ThemedText>
              </View>
            </View>

            {/* Filas de estudiantes */}
            {students.map((student, index) => (
              <View 
                key={`student-row-${student.student_id}`}
                style={[
                  styles.row,
                  { backgroundColor: index % 2 === 0 ? theme.background : theme.card }
                ]}
              >
                <View style={[styles.cell, styles.nameCell]}>
                  <ThemedText style={styles.studentName}>
                    {`${student.lastname || ''} ${student.second_lastname || ''} ${student.name || ''}`}
                  </ThemedText>
                </View>
                {filteredActivities.map(activity => (
                  <View 
                    key={`grade-${student.student_id}-${activity.id}`}
                    style={[styles.cell, styles.gradeCell]}
                  >
                    <ThemedText style={[
                      styles.gradeText,
                      getStudentGrade(student.student_id, activity.id) !== '-' && {
                        color: parseFloat(getStudentGrade(student.student_id, activity.id)) >= 51 ? 
                          theme.success : theme.error
                      }
                    ]}>
                      {getStudentGrade(student.student_id, activity.id)}
                    </ThemedText>
                  </View>
                ))}
                <View style={[styles.cell, styles.gradeCell]}>
                  <ThemedText style={[
                    styles.averageText,
                    { color: theme.primary }
                  ]}>
                    {calculateAverage(student.student_id)}
                  </ThemedText>
                </View>
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
    flex: 1,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    paddingVertical: 16,
    paddingHorizontal: 0,
  },
  titleRow: {
    flexDirection: 'column',
    gap: 4,
  },
  titleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  managementText: {
    fontSize: 14,
    opacity: 0.7,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginTop: 4,
  },
  filterContainer: {
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  filterText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  tableContainer: {
    borderRadius: 0,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerCell: {
    padding: 12,
    justifyContent: 'center',
  },
  cell: {
    padding: 12,
    justifyContent: 'center',
  },
  nameCell: {
    width: 180,
  },
  gradeCell: {
    width: 100,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  weightText: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
  },
  studentName: {
    fontSize: 14,
  },
  gradeText: {
    fontSize: 16,
    fontWeight: '500',
  },
  averageText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  monthNavigator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 0,
    borderRadius: 10,
    marginBottom: 8,
  },
  monthButton: {
    padding: 8,
  },
  monthText: {
    fontSize: 16,
    fontWeight: '600',
  }
});
