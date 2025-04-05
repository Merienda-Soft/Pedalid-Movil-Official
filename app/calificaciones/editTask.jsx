import { useState, useEffect, useMemo } from 'react';
import { Image, StyleSheet, Alert, View } from 'react-native';
import ParallaxScrollView from '../../components/ParallaxScrollView';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { InputType } from '../../components/InputType';
import { InputComboBox } from '../../components/InputComboBox';
import { ButtonLink } from '../../components/ButtonLink';
import { updateActivity, getActivityById } from '../../services/activity';
import { useGlobalState } from '../../services/UserContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useColorScheme } from 'react-native';

export default function EditTaskScreen() {
    const colorScheme = useColorScheme();
    const route = useRoute();
    const { globalState } = useGlobalState();
    const { cursoid, materiaid, teacherid, materiaName } = globalState;
    const navigation = useNavigation();

    const [selectedDate, setSelectedDate] = useState('');
    const [name, setName] = useState('');
    const [ponderacion, setPonderacion] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [selectedValue, setSelectedValue] = useState('1'); // Default value
    const [isLoading, setIsLoading] = useState(true);

    const { idTask } = route.params;

    const colors = useMemo(() => ({
        background: colorScheme === 'dark' ? '#1D3D47' : '#A1CEDC',
        text: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
        secondaryText: colorScheme === 'dark' ? '#B0B0B0' : '#666666',
    }), [colorScheme]);

    useEffect(() => {
        const loadTask = async () => {
            try {
                setIsLoading(true);
                console.log(idTask);
                const taskData = await getActivityById(idTask);
                console.log('Tarea cargada:', taskData);
                
                // Establecer los valores iniciales
                setName(taskData.name || '');
                setPonderacion(taskData.weight?.toString() || '');
                setDescripcion(taskData.description || '');
                
                // Establecer el área de evaluación (dimension_id)
                setSelectedValue(taskData.dimension_id?.toString() || '1');
                
                // Establecer la fecha de entrega (end_date)
                if (taskData.end_date) {
                    const date = new Date(taskData.end_date);
                    const formattedDate = date.toISOString().split('T')[0];
                    setSelectedDate(formattedDate);
                }
                
            } catch (error) {
                console.error('Error al cargar la tarea:', error);
                Alert.alert('Error', 'No se pudo cargar la información de la tarea');
            } finally {
                setIsLoading(false);
            }
        };

        loadTask();
    }, [idTask]);

    const options = [
      { value: '1', text: 'Ser' },
      { value: '2', text: 'Saber' },
      { value: '3', text: 'Hacer' },
      { value: '4', text: 'Decidir' },
    ];

    

    const handleUpdateTask = async () => {
        if (!name || !selectedDate || !ponderacion || !descripcion) {
            Alert.alert("Error", "Por favor, completa todos los campos.");
            return;
        }

        try {
            // Obtener la fecha actual para start_date
            const today = new Date();
            const startDate = today.toISOString();

            // Convertir la fecha de entrega a formato ISO con hora final del día
            const endDate = new Date(selectedDate);
            endDate.setHours(23, 59, 59, 999);
            const endDateISO = endDate.toISOString();

            const updatedTask = {
                task: {
                    id: idTask,
                    name: name,
                    description: descripcion,
                    dimension_id: Number(selectedValue),
                    management_id: globalState.management.id,
                    professor_id: teacherid,
                    subject_id: materiaid,
                    course_id: cursoid,
                    weight: Number(ponderacion),
                    is_autoevaluation: 0,
                    quarter: "Q1",
                    start_date: startDate,
                    end_date: endDateISO
                }
            };

            console.log('Enviando actualización:', updatedTask);
            const response = await updateActivity(updatedTask);

            if (response.ok) {
                Alert.alert("Éxito", "Tarea actualizada correctamente");
                const management = globalState.management;
                navigation.replace("curso", {
                    screen: 'index',
                    params: {
                        materiaid: materiaid,
                        cursoid: cursoid,
                        teacherid: teacherid,
                        management
                    }
                });
            } else {
                Alert.alert("Error", "No se pudo actualizar la tarea");
            }
        } catch (error) {
            console.error('Error al actualizar:', error);
            Alert.alert("Error", `Error al actualizar la tarea: ${error.message}`);
        }
    };

    // Render con loading state
    if (isLoading) {
        return (
            <ThemedView style={styles.loadingContainer}>
                <ThemedText>Cargando información de la tarea...</ThemedText>
            </ThemedView>
        );
    }

    return (
        <ParallaxScrollView
          modo={2}
          headerBackgroundColor={{ light: colors.background, dark: colors.background }}
          headerImage={
            <Image
              source={require('../../assets/images/newtask.jpg')}
              style={styles.reactLogo}
            />
          }>
          <ThemedView style={styles.titleContainer}>
            <View style={styles.titleSection}>
              <ThemedText type="title" style={{ color: colors.text }}>
                Editar Tarea
              </ThemedText>
              <View style={styles.subtitleRow}>
                <ThemedText type="default" style={[styles.materiaName, { color: colors.secondaryText }]}>
                  {materiaName}
                </ThemedText>
                <ThemedText type="default" style={[styles.gestionText, { color: colors.secondaryText }]}>
                  Gestión {globalState.management.management}
                </ThemedText>
              </View>
            </View>
          </ThemedView>

          <InputType
            label="Nombre"
            value={name}
            onChangeText={setName}
            type="text"
            placeholder="Ej: Tarea 1"
            />

          <InputType
            label="Fecha de Entrega"
            value={selectedDate}
            onChangeText={setSelectedDate}
            type="date"
            placeholder="Seleccionar fecha"
            />

          <InputType
            label="Ponderación (%)"
            value={ponderacion}
            onChangeText={setPonderacion}
            type="number"
            placeholder="Ingrese la ponderación de la tarea"
            />
          <InputComboBox
            label="Área de Evaluación"
            selectedValue={selectedValue}
            onValueChange={setSelectedValue}
            options={options}
            />

          <InputType
            label="Descripción"
            value={descripcion}
            onChangeText={setDescripcion}
            type="textarea"
            placeholder="Describe los detalles de la tarea..."
            />

          <ButtonLink 
            text="Actualizar tarea" 
            modo='large' 
            onPress={handleUpdateTask} 
            color='primary'
            style={styles.submitButton}
          />

        </ParallaxScrollView>
    );
}

const styles = StyleSheet.create({
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        paddingHorizontal: 0,
    },
    titleSection: {
        gap: 4,
    },
    subtitleRow: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    materiaName: {
        fontSize: 16,
    },
    gestionText: {
        fontSize: 16,
    },
    reactLogo: {
        height: '100%',
        width: '100%',
        resizeMode: 'cover',
    },
    submitButton: {
        marginTop: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
