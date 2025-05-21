import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Alert, Image, StyleSheet, View, ActivityIndicator, TouchableOpacity, ScrollView, RefreshControl, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ParallaxScrollView from '../../components/ParallaxScrollView';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { InputFilter } from '../../components/InputFilter';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useGlobalState } from '../../services/UserContext';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { deleteActivity, getActivities } from '../../services/activity';
import { handleError } from '../../utils/errorHandler';

// Agregar constante para los tipos de filtro al inicio del archivo
const TASK_FILTERS = {
  ALL: 'Todas',
  ACTIVE: 'Creadas',
  TO_REVIEW: 'Para Revisar'
};

export default function TasksScreen() {
  const colorScheme = useColorScheme();
  const { showActionSheetWithOptions } = useActionSheet();
  const navigation = useNavigation();
  const route = useRoute();
  const { clearGlobalState } = useGlobalState();

  // Estados
  const [searchValue, setSearchValue] = useState('');
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Parámetros de ruta
  const { materiaid, cursoid, teacherid, materiaName, management } = route.params
  
  const [currentDate, setCurrentDate] = useState(() => {
    const currentMonth = new Date().getMonth();
    return new Date(management.management, currentMonth, 1);
  });
  
  // Constantes
  const monthNames = useMemo(() => [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ], []);

  // Actualizar el objeto de colores para que coincida con el tema de studentTasks
  const theme = {
    background: colorScheme === 'dark' ? '#000000' : '#FFFFFF',
    surface: colorScheme === 'dark' ? '#121212' : '#FFFFFF',
    card: colorScheme === 'dark' ? '#1E1E1E' : '#FFFFFF',
    text: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
    subtext: colorScheme === 'dark' ? '#8E8E93' : '#666666',
    border: colorScheme === 'dark' ? '#2C2C2E' : 'rgba(0,0,0,0.05)',
    primary: '#17A2B8',
  };

  // Agregar estado para el filtro de tareas
  const [taskFilter, setTaskFilter] = useState('ALL');

  // Validación de parámetros
  const validateParams = useCallback(() => {
    if (!materiaid || !cursoid || !teacherid) {
      handleError(new Error('Faltan parámetros para realizar la acción'));
      return false;
    }
    return true;
  }, [materiaid, cursoid, teacherid]);

  // Carga de tareas
  const fetchTasks = useCallback(async () => {
    if (!validateParams()) return;

    setIsLoading(true);
    try {
      console.log("Fetching tasks with params:", { materiaid, cursoid, teacherid, managementId: management.id });
      const response = await getActivities(materiaid, cursoid, teacherid, management.id);
      console.log("Received task data:", response);
      
      if (response?.ok && Array.isArray(response.data)) {
        const transformedTasks = response.data.map(task => ({
          id: task.id,
          name: task.name,
          description: task.description,
          weight: task.weight,
          createDate: new Date(task.create_date),
          end_date: new Date(task.end_date),
          subject: task.subject?.subject || '',
          dimension: task.dimension?.dimension || '',
          assignments: task.assignments || [],
          type: task.type,
        }));
        console.log("Transformed tasks:", transformedTasks);
        setTasks(transformedTasks);
      } else {
        console.log("No tasks data received or invalid format");
        setTasks([]);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  }, [materiaid, cursoid, teacherid, validateParams, management.id]);

  // Efectos
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleClearGlobalState = useCallback(() => {
    clearGlobalState(prevState => ({
      management: prevState.management
    }));
  }, [clearGlobalState]);

  useFocusEffect(
    useCallback(() => {
      fetchTasks();

      const unsubscribe = navigation.addListener('beforeRemove', (e) => {
        if (e.data.action.type === 'GO_BACK') {
          handleClearGlobalState();
        }
      });

      return () => {
        unsubscribe();
        setTasks([]);
      };
    }, [fetchTasks, navigation, handleClearGlobalState])
  );

  // Manejadores de eventos
  const handlePrevMonth = useCallback(() => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (newDate.getMonth() === 0) {
        // Si estamos en enero, ir a diciembre del mismo año de gestión
        newDate.setMonth(11);
      } else {
      newDate.setMonth(prev.getMonth() - 1);
      }
      return newDate;
    });
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (newDate.getMonth() === 11) {
        // Si estamos en diciembre, ir a enero del mismo año de gestión
        newDate.setMonth(0);
      } else {
      newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  }, []);

  const handleDeleteTask = useCallback(async (taskid) => {
    try {
    const response = await deleteActivity(taskid);
    if (!response.ok) {
      Alert.alert('Error', 'No se pudo eliminar la tarea.');
      return;
    }

      navigation.replace("curso", {
        screen: 'index',
        params: { materiaid, cursoid, teacherid, management }
      });

      Alert.alert('Éxito', 'Tarea eliminada con éxito');
    } catch (error) {
      handleError(error, 'Error al eliminar la tarea');
    }
  }, [materiaid, cursoid, teacherid, navigation]);

  const handleActionSheet = useCallback((task) => {
    const options = ['Calificar', 'Editar', 'Eliminar'];
    const cancelButtonIndex = 3;
    const destructiveButtonIndex = 2;

    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
        destructiveButtonIndex,
        title: `Opciones de "${task.name}"`,
      },
      (buttonIndex) => {
        switch (buttonIndex) {
          case 0:
            navigation.navigate('calificaciones', {
              screen: 'index',
              params: { idTask: task.id }
            });
            break;
          case 1:
            navigation.navigate('calificaciones', {
              screen: 'editTask',
              params: { idTask: task.id }
            });
            break;
          case 2:
          Alert.alert(
              'Eliminación',
            `¿Deseas eliminar "${task.name}"?`,
            [
                { text: 'No', style: 'cancel' },
                { text: 'Sí', onPress: () => handleDeleteTask(task.id) },
              ]
            );
            break;
        }
      }
    );
  }, [navigation, handleDeleteTask]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchTasks();
    } finally {
      setRefreshing(false);
    }
  }, [fetchTasks]);

  // Modificar el filtrado de tareas
  const filteredTasks = useMemo(() => {
    const now = new Date();
    
    return tasks.filter(task => {
      const taskEndDate = new Date(task.end_date);
      const matchesSearch = task.name.toLowerCase().includes(searchValue.toLowerCase());
      const matchesMonth = taskEndDate.getMonth() === currentDate.getMonth() && 
                         taskEndDate.getFullYear() === currentDate.getFullYear();

      // Aplicar filtros de estado
      let matchesFilter = true;
      switch (taskFilter) {
        case 'ACTIVE':
          matchesFilter = task.end_date > now && task.type !== 1;
          break;
        case 'TO_REVIEW':
          matchesFilter = task.end_date <= now || task.type === 1;
          break;
        default: // 'ALL'
          matchesFilter = true;
      }

      return matchesSearch && matchesMonth && matchesFilter;
    });
  }, [tasks, searchValue, currentDate, taskFilter]);

  // Modificar la función de conteo
  const getTaskCountByFilter = useCallback((filterKey) => {
    const now = new Date();
    return tasks.filter(task => {
      const taskEndDate = new Date(task.end_date);
      const matchesMonth = taskEndDate.getMonth() === currentDate.getMonth() && 
                          taskEndDate.getFullYear() === currentDate.getFullYear();
      
      if (!matchesMonth) return false;

      switch (filterKey) {
        case 'ACTIVE':
          return task.end_date > now && task.type !== 1;
        case 'TO_REVIEW':
          return task.end_date <= now || task.type === 1;
        default: // 'ALL'
          return true;
      }
    }).length;
  }, [tasks, currentDate]);

  // Renderizado de tareas
  

  // Renderizado principal
  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      {/* ParallaxScrollView solo para la imagen */}
      <View style={styles.headerParallax}>
    <ParallaxScrollView
      modo={2}
          headerBackgroundColor={{ light: '#A1CEDC', dark: '#000000' }}
      headerImage={
        <Image
          source={require('../../assets/images/task.jpg')}
              style={styles.headerImage}
            />
          }
          scrollEnabled={false}
          headerHeight={110}
        >
          <View style={{ height: 1 }} />
        </ParallaxScrollView>
      </View>

      {/* Contenido principal */}
      <View style={styles.mainContent}>
        {/* Header fijo con filtros */}
        <View style={[styles.headerFixed, { backgroundColor: theme.surface }]}>
          <ThemedView style={[styles.titleContainer, { backgroundColor: theme.surface }]}>
            <View style={styles.titleRow}>
              <ThemedText type="title" style={{ color: theme.text }}>Tareas</ThemedText>
              <ThemedText type="default" style={{ color: theme.subtext }}>
                Gestión {management.management}
              </ThemedText>
            </View>
            <ThemedText type="default" style={[styles.subtitleText, { color: theme.subtext }]}>
              {materiaName}
            </ThemedText>
      </ThemedView>
      
          <View style={[styles.filtersContainer, { backgroundColor: theme.surface }]}>
      <InputFilter
        value={searchValue}
        onChangeText={setSearchValue}
              placeholder="Buscar tarea..."
              style={[styles.searchInput, { backgroundColor: theme.card }]}
      />
          </View>

          <View style={[styles.monthNavigator, { backgroundColor: theme.card }]}>
        <TouchableOpacity onPress={handlePrevMonth}>
              <Ionicons name="chevron-back" size={24} color={theme.subtext} />
        </TouchableOpacity>
            <ThemedText style={[styles.monthText, { color: theme.text }]}>
              {monthNames[currentDate.getMonth()]}
        </ThemedText>
        <TouchableOpacity onPress={handleNextMonth}>
              <Ionicons name="chevron-forward" size={24} color={theme.subtext} />
        </TouchableOpacity>
      </View>

          {/* Agregar los filtros de estado */}
          <View style={[styles.statusFiltersContainer, { backgroundColor: theme.surface }]}>
            {Object.entries(TASK_FILTERS).map(([key, label]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.filterButton,
                  { 
                    backgroundColor: taskFilter === key ? theme.primary : theme.card,
                    marginRight: 8
                  },
                ]}
                onPress={() => setTaskFilter(key)}
              >
                <View style={styles.filterContent}>
                  <ThemedText style={[
                    styles.filterText,
                    { color: taskFilter === key ? '#FFFFFF' : theme.subtext }
                  ]}>
                    {label}
                  </ThemedText>
                  <View style={[
                    styles.countBadge,
                    { backgroundColor: taskFilter === key ? '#FFFFFF' : theme.primary }
                  ]}>
                    <ThemedText style={[
                      styles.countText,
                      { color: taskFilter === key ? theme.primary : '#FFFFFF' }
                    ]}>
                      {getTaskCountByFilter(key)}
                    </ThemedText>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Contenido scrolleable */}
        <ScrollView 
          style={styles.scrollContent}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor={theme.text}
              colors={[theme.primary]}
            />
          }
        >
          {isLoading ? (
            <ActivityIndicator size="large" color={theme.primary} style={styles.loader} />
          ) : filteredTasks.length === 0 ? (
            <ThemedView style={[styles.emptyContainer, { backgroundColor: theme.surface }]}>
              <ThemedText style={[styles.emptyText, { color: theme.subtext }]}>
                {tasks.length === 0 ? 'No hay tareas disponibles' : 'No hay tareas para este mes'}
              </ThemedText>
            </ThemedView>
          ) : (
            <View style={[styles.tasksContainer, { backgroundColor: theme.surface }]}>
              {filteredTasks.map((task) => (
                <TouchableOpacity 
                  key={task.id}
                  style={[styles.taskCard, { backgroundColor: theme.card }]}
                  onPress={() => handleActionSheet(task)}
                >
                  <View style={styles.taskContent}>
                    <View style={styles.taskHeader}>
                      <View style={styles.taskTitleContainer}>
                        <View style={styles.titleRow}>
                          <View style={styles.statusIndicatorContainer}>
                            <View style={[
                              styles.statusIndicator, 
                              { 
                                backgroundColor: task.type === 1 ? '#9C27B0' : // Morado para type 1
                                  task.end_date > new Date() ? '#4CAF50' : '#FF5252' 
                              }
                            ]} />
                            <ThemedText style={[styles.taskName, { color: theme.text }]}>
                              {task.name || 'Sin nombre'}
                            </ThemedText>
                          </View>
                        </View>
                        <View style={styles.datesContainer}>
                          <View style={styles.dateItem}>
                            <Ionicons name="calendar-outline" size={14} color={theme.subtext} />
                            <ThemedText style={[styles.taskDate, { color: theme.subtext }]}>
                              Creada: {task.createDate?.toLocaleDateString() || 'Fecha no disponible'}
                            </ThemedText>
                          </View>
                          {task.type !== 1 && (
                            <View style={styles.dateItem}>
                              <Ionicons name="time-outline" size={14} color={theme.subtext} />
                              <ThemedText style={[styles.taskDate, { color: theme.subtext }]}>
                                Entrega: {task.end_date?.toLocaleDateString() || 'Fecha no disponible'}
                              </ThemedText>
                            </View>
                          )}
                        </View>
                      </View>
                      <View style={styles.taskMetadata}>
                        <View style={[
                          styles.dimensionContainer,
                          { backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }
                        ]}>
                          <Ionicons name="school-outline" size={14} color={theme.subtext} />
                          <ThemedText 
                            style={[styles.dimensionText, { color: theme.subtext }]}
                            numberOfLines={1}
                          >
                            {task.dimension || 'Sin dimensión'}
                          </ThemedText>
                        </View>
                        <View style={styles.weightBadge}>
                          <ThemedText style={styles.weightText}>
                            {task.weight || 0}%
                          </ThemedText>
                        </View>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerParallax: {
    height: 110,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  mainContent: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  headerFixed: {
    width: '100%',
    zIndex: 2,
    marginTop: 110,
  },
  titleContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  subtitleText: {
    marginTop: 4,
  },
  filtersContainer: {
    padding: 16,
    paddingTop: 0,
  },
  scrollContent: {
    flex: 1,
  },
  searchInput: {
    marginBottom: 0,
  },
  monthNavigator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 10,
    marginBottom: 8,
  },
  monthText: {
    fontSize: 16,
    fontWeight: '600',
  },
  tasksContainer: {
    padding: 16,
    gap: 12,
  },
  taskCard: {
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 5,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  taskContent: {
    padding: 16,
    gap: 0,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  taskTitleContainer: {
    flex: 1,
    gap: 4,
  },
  taskName: {
    fontSize: 16,
    fontWeight: '600',
  },
  datesContainer: {
    marginTop: 4,
    gap: 4,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  taskDate: {
    fontSize: 12,
  },
  weightBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#17A2B8',
  },
  weightText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  taskMetadata: {
    alignItems: 'flex-end',
    gap: 8,
    flex: 1,
    marginLeft: 8,
  },
  dimensionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    maxWidth: '100%',
  },
  dimensionText: {
    fontSize: 12,
    flexShrink: 1,
  },
  loader: {
    marginTop: 20,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
  taskButton: {
    marginVertical: 4,
    marginHorizontal: 16,
  },
  statusFiltersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 0,
    marginBottom: 0,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  filterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    minWidth: 20,
    alignItems: 'center',
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
});
