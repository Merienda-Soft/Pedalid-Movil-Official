import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Image, StyleSheet, Alert, View, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, useColorScheme } from 'react-native';
import ParallaxScrollView from '../../components/ParallaxScrollView';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { Collapsible } from '../../components/Collapsible';
import { CollapsibleOptions } from '../../components/CollapsibleOptions';
import { InputComboBox } from '../../components/InputComboBox';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../services/AuthProvider';
import { getManagementActive } from '../../services/management';
import { getStudents } from '../../services/students/students';
import { useGlobalState } from '../../services/UserContext';
import { handleError } from '../../utils/errorHandler';
import { Ionicons } from '@expo/vector-icons';

export default function StudentHomeScreen() {
  const navigation = useNavigation();
  const { authuser } = useAuth();
  const { globalState, setGlobalState } = useGlobalState();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeManagement, setActiveManagement] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const colorScheme = useColorScheme();

  const theme = {
    background: colorScheme === 'dark' ? '#000000' : '#FFFFFF',
    surface: colorScheme === 'dark' ? '#121212' : '#FFFFFF',
    card: colorScheme === 'dark' ? '#1E1E1E' : '#FFFFFF',
    text: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
    subtext: colorScheme === 'dark' ? '#8E8E93' : '#666666',
    border: colorScheme === 'dark' ? '#2C2C2E' : 'rgba(23, 162, 184, 0.1)',
    primary: '#17A2B8',
  };

  const fetchActiveManagement = useCallback(async () => {
    try {
      const response = await getManagementActive();
      if (response.ok && response.data) {
        const managementData = response.data;
        setActiveManagement(managementData);
        setGlobalState(prev => ({
          ...prev,
          management: {
            id: managementData.id,
            management: managementData.management
          }
        }));
      }
    } catch (error) {
      handleError(error, 'Error al cargar la gestión activa');
    }
  }, []);

  const fetchStudentData = useCallback(async () => {
    if (!authuser?.id || !authuser?.role || !activeManagement?.id) return;

    try {
      const response = await getStudents(authuser.id, authuser.role, activeManagement.id);
      
      if (response.ok && response.data) {
        if (authuser.role === 'tutor') {
          setStudentData(response.data.students);
          if (response.data.students.length > 0) {
            setSelectedStudent(response.data.students[0]);
          }
        } else {
          setStudentData(response.data);
        }
      }
    } catch (error) {
      handleError(error, 'Error al cargar los datos del estudiante');
    }
  }, [authuser?.id, authuser?.role, activeManagement?.id]);

  const loadAllData = useCallback(async () => {
    if (!isLoading && !refreshing) setIsLoading(true);
    try {
      await fetchActiveManagement();
      await fetchStudentData();
    } catch (error) {
      handleError(error, 'Error al cargar los datos');
    } finally {
      setIsLoading(false);
    }
  }, [fetchActiveManagement, fetchStudentData]);

  useEffect(() => {
    loadAllData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAllData();
    }, [loadAllData])
  );

  const onRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await loadAllData();
    } finally {
      setRefreshing(false);
    }
  }, [loadAllData]);

  const studentOptions = useMemo(() => {
    if (!studentData || authuser?.role !== 'tutor') return [];
    return studentData.map(studentInfo => ({
      value: studentInfo.student.id,
      text: `${studentInfo.student.name} ${studentInfo.student.lastname} ${studentInfo.student.second_lastname || ''}`,
    }));
  }, [studentData, authuser?.role]);

  const handleStudentChange = useCallback((studentId) => {
    if (studentData) {
      const student = studentData.find(s => s.student.id === studentId);
      if (student) {
        setSelectedStudent(student);
      }
    }
  }, [studentData]);

  const renderCursos = useMemo(() => {
    const currentStudent = authuser?.role === 'tutor' ? selectedStudent : studentData;
    
    if (!currentStudent?.courses?.length) {
      return (
        <ThemedView style={[styles.emptyContainer, { backgroundColor: theme.surface }]}>
          <ThemedText style={[styles.emptyText, { color: theme.subtext }]}>
            No hay cursos asignados
          </ThemedText>
        </ThemedView>
      );
    }

    const courseData = currentStudent.courses[0];

    return (
      <View style={[styles.courseContainer, { backgroundColor: theme.surface }]}>
        <ThemedView style={styles.courseHeader}>
          <ThemedText type="subtitle" style={styles.courseTitle}>
            {courseData.course.course}
          </ThemedText>
        </ThemedView>

        <View style={styles.cardsContainer}>
          {courseData.subjects.map((subject) => (
            <ThemedView key={subject.id} style={styles.cardWrapper}>
              <TouchableOpacity 
                onPress={() => {
                  if (!activeManagement?.id) {
                    Alert.alert('Error', 'No se pudo obtener la gestión activa');
                    return;
                  }
                  navigation.navigate('studentTasks', {
                    studentId: currentStudent.student.id,
                    courseId: courseData.course.id,
                    subjectId: subject.id,
                    managementId: activeManagement.id,
                    materiaName: subject.name,
                    managementYear: activeManagement.management
                  });
                }}
              >
                <View style={[styles.card, { backgroundColor: theme.card }]}>
                  <View style={styles.cardHeader}>
                    <Ionicons name="book-outline" size={24} color={theme.primary} />
                    <ThemedText type="subtitle" style={[styles.subjectName, { color: theme.text }]}>
                      {subject.name}
                    </ThemedText>
                  </View>
                  
                  <View style={[styles.professorInfo, { borderTopColor: theme.border }]}>
                    <View style={[styles.professorIconContainer, { backgroundColor: 'rgba(23, 162, 184, 0.1)' }]}>
                      <Ionicons name="person-outline" size={11} color={theme.primary} />
                    </View>
                    <View style={styles.professorTextContainer}>
                      <ThemedText style={[styles.professorLabel, { color: theme.primary }]}>Profesor</ThemedText>
                      <ThemedText style={[styles.professorName, { color: theme.text }]}>
                        {subject.professor.name} {subject.professor.lastname}
                      </ThemedText>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            </ThemedView>
          ))}
        </View>
      </View>
    );
  }, [authuser?.role, selectedStudent, studentData, navigation, activeManagement, theme]);

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#17A2B8" />
      </ThemedView>
    );
  }

  return (
    <ParallaxScrollView
      modo={2}
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#000000' }}
      headerImage={
        <Image
          source={require('../../assets/images/cursos.jpg')}
          style={styles.reactLogo}
        />
      }
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh}
        />
      }
      style={{ backgroundColor: theme.surface }}
    >
      <ThemedView style={[styles.titleContainer, { backgroundColor: theme.surface }]}>
        <ThemedText type="title" style={{ color: theme.text }}>Cursos</ThemedText>
        <ThemedText type="default" style={{ color: theme.subtext }}>
          Gestión {activeManagement?.management}
        </ThemedText>
      </ThemedView>

      {authuser?.role === 'tutor' && studentData && (
        <ThemedView style={{ backgroundColor: theme.surface }}>
          <InputComboBox
            label="Seleccionar Estudiante"
            selectedValue={selectedStudent?.student?.id}
            onValueChange={handleStudentChange}
            options={studentOptions}
            style={[styles.managementSelect, { backgroundColor: theme.card }]}
          />
        </ThemedView>
      )}

      {isLoading ? (
        <View style={[styles.loadingContainer, { backgroundColor: theme.surface }]}>
          <ActivityIndicator size="large" color={theme.primary} />
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
    padding: 10,
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
  courseContainer: {
    padding: 0,
  },
  courseHeader: {
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#17A2B8',
    borderRadius: 12,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  courseTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  cardWrapper: {
    width: '47%',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 11,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    borderWidth: 1,
    borderColor: 'rgba(23, 162, 184, 0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  iconContainer: {
    backgroundColor: '#17A2B8',
    padding: 10,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    color: '#2C3E50',
  },
  professorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(23, 162, 184, 0.1)',
  },
  professorIconContainer: {
    backgroundColor: 'rgba(23, 162, 184, 0.1)',
    padding: 8,
    borderRadius: 10,
  },
  professorTextContainer: {
    flex: 1,
  },
  professorLabel: {
    fontSize: 12,
    color: '#17A2B8',
    fontWeight: '500',
    marginBottom: 2,
  },
  professorName: {
    fontSize: 13,
    color: '#34495E',
    fontWeight: '500',
  },
});
