import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Alert, Image, StyleSheet, View, ActivityIndicator, TouchableOpacity, RefreshControl, useColorScheme, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ParallaxScrollView from '../../components/ParallaxScrollView';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { InputFilter } from '../../components/InputFilter';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { getTasksByStudentId } from '../../services/activity';
import { handleError } from '../../utils/errorHandler';
import { LinearGradient } from 'expo-linear-gradient';

const STATUS_FILTERS = {
  ALL: 'Todas',
  PENDING: 'Pendientes',
  SUBMITTED: 'Entregadas',
  RETURNED: 'Devueltas'
};

const STATUS_COLORS = {
  0: '#FFA500', // Pendiente - Naranja
  1: '#4CAF50', // Entregada - Verde
  2: '#2196F3'  // Devuelta - Azul
};

export default function StudentTasksScreen() {
  const colorScheme = useColorScheme();
  const navigation = useNavigation();
  const route = useRoute();

  // Estados
  const [searchValue, setSearchValue] = useState('');
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // Parámetros de ruta
  const { studentId, courseId, subjectId, managementId, materiaName } = route.params;
  
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  
  const monthNames = useMemo(() => [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ], []);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('Fetching tasks with params:', {
        studentId,
        courseId,
        subjectId,
        managementId
      });

      const response = await getTasksByStudentId(studentId, courseId, subjectId, managementId);
      console.log('API Response:', response);

      if (response.ok && response.data) {
        const transformedTasks = response.data.map(task => ({
          ...task,
          createDate: new Date(task.create_date),
          status: task.assignments?.[0]?.status ?? 0
        }));
        console.log('Transformed tasks:', transformedTasks);
        setTasks(transformedTasks);
      } else {
        console.log('No tasks found or invalid response');
        setTasks([]);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      handleError(error, 'Error al cargar las tareas');
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  }, [studentId, courseId, subjectId, managementId]);

  useEffect(() => {
    if (studentId && courseId && subjectId && managementId) {
      console.log('Initial fetch triggered');
      fetchTasks();
    }
  }, [studentId, courseId, subjectId, managementId]);

  useFocusEffect(
    useCallback(() => {
      if (studentId && courseId && subjectId && managementId) {
        console.log('Focus effect fetch triggered');
        fetchTasks();
      }
    }, [fetchTasks])
  );

  // Manejadores de eventos
  const handlePrevMonth = useCallback(() => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      console.log('New date after prev:', newDate);
      return newDate;
    });
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      console.log('New date after next:', newDate);
      return newDate;
    });
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchTasks();
    } finally {
      setRefreshing(false);
    }
  }, [fetchTasks]);

  // Filtrado de tareas
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const taskCreateDate = task.createDate;
      const matchesSearch = task.name.toLowerCase().includes(searchValue.toLowerCase());
      const matchesMonth = taskCreateDate.getMonth() === currentDate.getMonth() && 
                          taskCreateDate.getFullYear() === currentDate.getFullYear();
      const matchesStatus = statusFilter === 'ALL' || 
                          (statusFilter === 'PENDING' && task.status === 0) ||
                          (statusFilter === 'SUBMITTED' && task.status === 1) ||
                          (statusFilter === 'RETURNED' && task.status === 2);
      
      return matchesSearch && matchesMonth && matchesStatus;
    });
  }, [tasks, searchValue, currentDate, statusFilter]);

  // Renderizado de tareas
  const renderTask = useCallback((task) => {
    const statusColor = STATUS_COLORS[task.status];
    const statusText = task.status === 0 ? 'Pendiente' : 
                      task.status === 1 ? 'Entregada' : 'Devuelta';
    const qualification = task.assignments[0]?.qualification?.trim() || '-';

    return (
      <TouchableOpacity 
        key={task.id}
        style={styles.taskCard}
        onPress={() => {/* Implementar navegación al detalle de la tarea */}}
      >
        <LinearGradient
          colors={['#FFFFFF', '#F8FAFB']}
          style={styles.taskContent}
        >
          <View style={styles.taskHeader}>
            <View style={styles.taskTitleContainer}>
              <ThemedText style={styles.taskName}>{task.name}</ThemedText>
              <ThemedText style={styles.taskDate}>
                {task.createDate.toLocaleDateString()}
              </ThemedText>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <ThemedText style={styles.statusText}>{statusText}</ThemedText>
            </View>
          </View>
          
          <View style={styles.taskDetails}>
            <View style={styles.detailItem}>
              <Ionicons name="school-outline" size={16} color="#666" />
              <ThemedText style={styles.detailText}>{task.dimension.dimension}</ThemedText>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="stats-chart-outline" size={16} color="#666" />
              <ThemedText style={styles.detailText}>Peso: {task.weight}%</ThemedText>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="star-outline" size={16} color="#666" />
              <ThemedText style={styles.detailText}>Nota: {qualification}</ThemedText>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }, []);

  return (
    <ParallaxScrollView
      modo={2}
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('../../assets/images/task.jpg')}
          style={styles.headerImage}
        />
      }
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Tareas</ThemedText>
        <ThemedText type="default">{materiaName}</ThemedText>
      </ThemedView>

      <View style={styles.filtersContainer}>
        <InputFilter
          value={searchValue}
          onChangeText={setSearchValue}
          placeholder="Buscar tarea..."
          style={styles.searchInput}
        />

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.statusFilters}
        >
          {Object.entries(STATUS_FILTERS).map(([key, label]) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.filterButton,
                statusFilter === key && styles.filterButtonActive
              ]}
              onPress={() => setStatusFilter(key)}
            >
              <ThemedText style={[
                styles.filterText,
                statusFilter === key && styles.filterTextActive
              ]}>
                {label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.monthNavigator}>
        <TouchableOpacity onPress={handlePrevMonth}>
          <Ionicons name="chevron-back" size={24} color="#666" />
        </TouchableOpacity>
        <ThemedText style={styles.monthText}>
          {monthNames[currentDate.getMonth()]}
        </ThemedText>
        <TouchableOpacity onPress={handleNextMonth}>
          <Ionicons name="chevron-forward" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#17A2B8" style={styles.loader} />
      ) : filteredTasks.length === 0 ? (
        <ThemedView style={styles.emptyContainer}>
          <ThemedText style={styles.emptyText}>
            No hay tareas para mostrar
          </ThemedText>
        </ThemedView>
      ) : (
        <View style={styles.tasksContainer}>
          {filteredTasks.map(renderTask)}
        </View>
      )}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    width: '100%',
    height: '100%',
  },
  titleContainer: {
    padding: 10,
    gap: 4,
  },
  filtersContainer: {
    padding: 10,
    gap: 12,
  },
  searchInput: {
    marginBottom: 0,
  },
  statusFilters: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    marginRight: 8,
    backgroundColor: '#F0F0F0',
  },
  filterButtonActive: {
    backgroundColor: '#17A2B8',
  },
  filterText: {
    color: '#666',
    fontSize: 14,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  monthNavigator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    marginBottom: 8,
  },
  monthText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loader: {
    marginTop: 20,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },
  tasksContainer: {
    padding: 16,
    gap: 12,
  },
  taskCard: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  taskContent: {
    padding: 16,
    gap: 12,
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
    color: '#2C3E50',
  },
  taskDate: {
    fontSize: 12,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  taskDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
  },
});
