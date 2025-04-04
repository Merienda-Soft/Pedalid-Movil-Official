import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Image, StyleSheet, Alert, View, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
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

export default function HomeScreen() {
  const navigation = useNavigation();
  const { authuser } = useAuth();
  const { globalState, setGlobalState } = useGlobalState();
  const { user, setUser } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [managements, setManagements] = useState([]);
  const [selectedManagement, setSelectedManagement] = useState(null);

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

    return user.asignaciones.map((curso) => (
      <Collapsible 
        key={curso.curso._id} 
        title={curso.curso.name} 
        color="info"
      >
        {curso.materias.map((materia) => (
          <CollapsibleOptions
            key={materia._id}
            title={materia.name}
            color="info"
            onPress={() => handleMateriaSelect(curso.curso, materia)}
          />
        ))}
      </Collapsible>
    ));
  }, [user?.asignaciones, handleMateriaSelect]);

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
    gap: 8,
    marginBottom: 0,
  },
  reactLogo: {
    height: '100%',
    width: '100%',
  },
  managementSelect: {
    marginBottom: 8,
  },
});
