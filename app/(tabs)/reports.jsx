import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Image, Alert, RefreshControl, ActivityIndicator, Modal, View, TouchableOpacity } from 'react-native';
import ParallaxScrollView from '../../components/ParallaxScrollView';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { useGlobalState } from '../../services/UserContext';
import { useRouter } from 'expo-router';
import { useAuth } from '../../services/AuthProvider';
import { getReportsByCurso } from '../../services/reports';
import { handleError } from '../../utils/errorHandler';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';

export default function ReportsScreen() {
  const router = useRouter();
  const { authuser } = useAuth();
  const { globalState } = useGlobalState();
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const colorScheme = useColorScheme();

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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Aquí podrías actualizar los datos necesarios
      await fetchReportsData();
    } catch (error) {
      handleError(error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!authuser) {
      router.replace('/auth');
      return;
    }
  }, [authuser]);

  const handleCourseReport = async (curso) => {
    setIsLoading(true);
    try {
      await getReportsByCurso(curso.professor, curso.curso._id);
      Alert.alert('Éxito', `El reporte del curso ${curso.curso.name} ha sido descargado`);
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToSubjectReport = (curso, materia) => {
    router.push({
      pathname: '/reportes',
      params: {
        materiaid: materia._id,
        cursoid: curso.curso._id,
        teacherid: curso.professor
      }
    });
  };

  const LoadingModal = () => (
    <Modal transparent visible={isLoading}>
      <View style={styles.modalContainer}>
        <ThemedView style={styles.loadingBox}>
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText style={styles.loadingText}>
            Generando reporte...
          </ThemedText>
        </ThemedView>
      </View>
    </Modal>
  );

  return (
    <>
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
          {/* Cabecera */}
          <View style={styles.header}>
            <ThemedText type="title" style={styles.title}>Reportes</ThemedText>
            <ThemedText style={styles.subtitle}>
              Gestión {globalState.management?.name || 'Actual'}
            </ThemedText>
          </View>

          {/* Sección de Cursos */}
          <ThemedText style={styles.sectionTitle}>Mis Cursos</ThemedText>
          
          {globalState.assigned?.map((curso, index) => (
            <ThemedView key={index} style={styles.courseCard}>
              <View style={styles.courseHeader}>
                <ThemedText style={styles.courseName}>{curso.curso.name}</ThemedText>
                <TouchableOpacity 
                  style={styles.downloadButton}
                  onPress={() => handleCourseReport(curso)}
                >
                  <Ionicons name="download-outline" size={24} color={theme.primary} />
                  <ThemedText style={styles.downloadText}>Informe Trimestral</ThemedText>
                </TouchableOpacity>
              </View>

              <View style={styles.subjectsContainer}>
                {curso.materias.map((materia, subIndex) => (
                  <TouchableOpacity
                    key={subIndex}
                    style={styles.subjectButton}
                    onPress={() => navigateToSubjectReport(curso, materia)}
                  >
                    <Ionicons name="document-text-outline" size={20} color={theme.text} />
                    <ThemedText style={styles.subjectText}>{materia.name}</ThemedText>
                    <Ionicons name="chevron-forward" size={20} color={theme.subtext} />
                  </TouchableOpacity>
                ))}
              </View>
            </ThemedView>
          ))}
        </ThemedView>
      </ParallaxScrollView>
      <LoadingModal />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  courseCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  courseName: {
    fontSize: 18,
    fontWeight: '600',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#17A2B8',
  },
  downloadText: {
    fontSize: 14,
    color: '#17A2B8',
    fontWeight: '500',
  },
  subjectsContainer: {
    gap: 8,
  },
  subjectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  subjectText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  headerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  loadingBox: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    gap: 12,
    minWidth: 200,
  },
  loadingText: {
    fontSize: 16,
  },
});
