import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Image, StyleSheet, Alert, View, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import ParallaxScrollView from '../../components/ParallaxScrollView';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { Collapsible } from '../../components/Collapsible';
import { CollapsibleOptions } from '../../components/CollapsibleOptions';
import { InputComboBox } from '../../components/InputComboBox';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../../services/UserContext';
import { useGlobalState } from '../../services/UserContext';
import { useAuth } from '../../services/AuthProvider';
import { getTeacherByEmail } from '../../services/teacher';
import { getManagements } from '../../services/management';
import { handleError } from '../../utils/errorHandler';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { authuser } = useAuth();
  const { globalState, setGlobalState } = useGlobalState();
  const { user, setUser } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [managements, setManagements] = useState([]);
  const [selectedManagement, setSelectedManagement] = useState(null);
  const [expandedCourseId, setExpandedCourseId] = useState(null);

  // Función para cargar las gestiones
  const fetchManagements = useCallback(async () => {
    try {
      const response = await getManagements();
      if (response.success && response.managements) {
        setManagements(response.managements);
        const activeManagement = response.managements.find(m => m.status === 1);
        if (activeManagement && (!selectedManagement || selectedManagement.id !== activeManagement.id)) {
          setSelectedManagement({
            id: activeManagement.id,
            management: activeManagement.management
          });
          setGlobalState(prev => ({
            ...prev,
            management: {
              id: activeManagement.id,
              management: activeManagement.management
            }
          }));
        }
      }
    } catch (error) {
      handleError(error, 'Error al cargar las gestiones');
    }
  }, [selectedManagement, setGlobalState]);

  // Función para cargar datos del usuario
  const fetchUserData = useCallback(async () => {
    if (!authuser?.email || !selectedManagement) return;

    try {
      setIsLoading(true);
      const response = await getTeacherByEmail(authuser.email);

      if (response.success && response.professor) {
        const cursosMaterias = response.professor.assignments.reduce((acc, assignment) => {
          const cursoId = assignment.course.id;
          if (!acc[cursoId]) {
            acc[cursoId] = {
              curso: {
                _id: assignment.course.id,
                name: assignment.course.course,
                parallel: assignment.course.parallel.trim(),
              },
              professor: assignment.professor_id,
              materias: []
            };
          }
          acc[cursoId].materias.push({
            _id: assignment.subject.id,
            name: assignment.subject.subject,
          });
          return acc;
        }, {});

        const transformedData = {
          _id: response.professor.id,
          name: response.professor.person.name,
          lastname: response.professor.person.lastname,
          email: response.professor.person.email,
          asignaciones: Object.values(cursosMaterias)
        };

        setUser(prevUser => {
          if (!prevUser || JSON.stringify(prevUser.asignaciones) !== JSON.stringify(transformedData.asignaciones)) {
            return transformedData;
          }
          return prevUser;
        });

        setGlobalState(prev => {
          if (!prev.assigned || JSON.stringify(prev.assigned) !== JSON.stringify(transformedData.asignaciones)) {
            return {
              ...prev,
              assigned: transformedData.asignaciones,
              management: selectedManagement
            };
          }
          return prev;
        });
      }
    } catch (err) {
      handleError(err, 'Error al cargar los datos');
      Alert.alert('Error', 'No se pudieron cargar las materias asignadas');
    } finally {
      setIsLoading(false);
    }
  }, [authuser?.email, selectedManagement, setUser, setGlobalState]);

  // Función para cargar todos los datos
  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      await fetchManagements();
      if (selectedManagement) {
        await fetchUserData();
      }
    } catch (error) {
      handleError(error, 'Error al cargar los datos');
    } finally {
      setIsLoading(false);
    }
  }, [fetchManagements, fetchUserData, selectedManagement]);

  // Cargar datos al inicio
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Verificación de autenticación
  useEffect(() => {
    if (!authuser?.email) {
      navigation.replace('auth');
    }
  }, [authuser, navigation]);

  // Modificar el useFocusEffect para recargar todo
  useFocusEffect(
    useCallback(() => {
      loadAllData();
    }, [loadAllData])
  );

  // Función para manejar el refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadAllData();
    } finally {
      setRefreshing(false);
    }
  }, [loadAllData]);

  // Función para manejar el cambio de gestión
  const handleManagementChange = useCallback((value) => {
    const selectedMgmt = managements.find(m => m.management === value);
    if (selectedMgmt && (selectedManagement?.id !== selectedMgmt.id)) {
      setSelectedManagement({
        id: selectedMgmt.id,
        management: selectedMgmt.management
      });
      setGlobalState(prev => ({
        ...prev,
        management: {
          id: selectedMgmt.id,
          management: selectedMgmt.management
        }
      }));
    }
  }, [selectedManagement, managements, setGlobalState]);

  // Opciones para el combobox de gestiones
  const managementOptions = useMemo(() => {
    return managements.map(management => ({
      value: management.management,
      text: `Gestión ${management.management}`,
    }));
  }, [managements]);

  // Función para manejar la selección de materia
  const handleMateriaSelect = useCallback((curso, materia) => {
    if (!materia._id || !curso._id || !user._id) {
      Alert.alert('Error', 'Datos incompletos para acceder al curso');
      return;
    }
    
    setGlobalState(prevState => ({
      ...prevState,
      materiaid: materia._id,
      cursoid: curso._id,
      teacherid: user._id,
      materiaName: materia.name,
      cursoName: curso.name,
      management: selectedManagement
    }));

    navigation.navigate("curso", {
      screen: 'index',
      params: {
        materiaName: materia.name,
        cursoName: curso.name,
        materiaid: materia._id,
        cursoid: curso._id,
        teacherid: user._id,
        management: selectedManagement
      }
    });
  }, [user, setGlobalState, navigation, selectedManagement]);

  // Renderizado de la lista de cursos
  const renderCursos = useMemo(() => {
    if (!user?.asignaciones?.length) {
      return (
        <ThemedView style={styles.emptyContainer}>
          <ThemedText style={styles.emptyText}>
            No tienes cursos asignados
          </ThemedText>
        </ThemedView>
      );
    }

    return user.asignaciones.map((curso) => {
      const isExpanded = expandedCourseId === curso.curso._id;

      return (
        <ThemedView key={curso.curso._id} style={styles.courseCard}>
          <TouchableOpacity 
            onPress={() => setExpandedCourseId(isExpanded ? null : curso.curso._id)}
            style={[
              styles.courseHeader,
              isExpanded && styles.courseHeaderExpanded
            ]}
          >
            <View style={styles.courseInfo}>
              <View style={styles.courseIconContainer}>
                <Ionicons 
                  name="school-outline" 
                  size={20} 
                  color="#FFFFFF" 
                />
              </View>
              <ThemedText style={styles.courseTitle}>
                {curso.curso.name} {curso.curso.parallel}
              </ThemedText>
            </View>
            <Ionicons 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
              size={20} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>

          {isExpanded && (
            <View style={styles.materiasContainer}>
              {curso.materias.map((materia) => (
                <TouchableOpacity 
                  key={materia._id}
                  style={styles.materiaCard}
                  onPress={() => handleMateriaSelect(curso.curso, materia)}
                >
                  <View style={styles.materiaIconContainer}>
                    <Ionicons name="book-outline" size={18} color="#FFFFFF" />
                  </View>
                  <ThemedText style={styles.materiaName}>
                    {materia.name}
                  </ThemedText>
                  <Ionicons name="chevron-forward" size={18} color="#17A2B8" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ThemedView>
      );
    });
  }, [user?.asignaciones, expandedCourseId, handleMateriaSelect]);

  return (
    <ParallaxScrollView
      modo={2}
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('../../assets/images/cursos.jpg')}
          style={styles.reactLogo}
        />
      }
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Cursos</ThemedText>
        <ThemedText type="default">
          Gestión {globalState.management?.management}
        </ThemedText>
      </ThemedView>

      <ThemedView>
        <InputComboBox
          label="Gestión Académica"
          selectedValue={selectedManagement?.management}
          onValueChange={handleManagementChange}
          options={managementOptions}
          style={styles.managementSelect}
        />
      </ThemedView>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#17A2B8" />
        </View>
      ) : (
        renderCursos
      )}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  titleContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  reactLogo: {
    height: '100%',
    width: '100%',
  },
  managementSelect: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  courseCard: {
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    overflow: 'hidden',
  },
  courseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#17A2B8',
    justifyContent: 'space-between',
  },
  courseHeaderExpanded: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  courseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  courseIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 8,
    borderRadius: 8,
  },
  courseTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  materiasContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
  },
  materiaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 12,
  },
  materiaIconContainer: {
    backgroundColor: '#17A2B8',
    padding: 8,
    borderRadius: 8,
  },
  materiaName: {
    flex: 1,
    fontSize: 14,
    color: '#2C3E50',
    fontWeight: '500',
  },
});
