import { useState, useEffect, useMemo } from 'react';
import { Image, StyleSheet, Alert, View } from 'react-native';
import ParallaxScrollView from '../../components/ParallaxScrollView';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { InputType } from '../../components/InputType';
import { InputComboBox } from '../../components/InputComboBox';
import { ButtonLink } from '../../components/ButtonLink';
import EvaluationToolSelector from '../../components/EvaluationToolSelector';
import RubricBuilder from '../../components/RubricBuilderNew';
import ChecklistBuilder from '../../components/ChecklistBuilderNew';
import { updateActivity, getActivityById, updateTask } from '../../services/activity';
import { useGlobalState } from '../../services/UserContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useColorScheme } from 'react-native';
import { EvaluationToolType, validateRubricData, validateChecklistData } from '../../types/evaluation';

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
    
    // Estados para la evaluación
    const [selectedEvaluationTool, setSelectedEvaluationTool] = useState(null);
    const [rubricData, setRubricData] = useState(null);
    const [checklistData, setChecklistData] = useState(null);

    const { idTask } = route.params;

    // Función para mapear los datos de evaluación desde el backend al frontend
    const mapEvaluationToolFromBackend = (backendData) => {
        if (!backendData || !backendData.evaluationTool) {
            return { type: null, data: null };
        }

        const { type, methodology } = backendData.evaluationTool;

        // Mapear tipo de herramienta
        let mappedType = null;
        if (type === 1) {
            mappedType = EvaluationToolType.RUBRIC;
        } else if (type === 2) {
            mappedType = EvaluationToolType.CHECKLIST;
        }

        // Si no hay metodología, retornar datos por defecto
        if (!methodology) {
            return {
                type: mappedType,
                data: mappedType === EvaluationToolType.RUBRIC 
                    ? { title: 'Rúbrica de Evaluación', criteria: [] }
                    : { title: 'Lista de Cotejo', items: [] }
            };
        }

        let mappedData = null;
        try {
            const methodologyData = typeof methodology === 'string' 
                ? JSON.parse(methodology) 
                : methodology;

            if (mappedType === EvaluationToolType.RUBRIC) {
                if (methodologyData.criteria && Array.isArray(methodologyData.criteria)) {
                    mappedData = {
                        title: methodologyData.title || 'Rúbrica de Evaluación',
                        criteria: methodologyData.criteria.map(criterion => ({
                            name: criterion.name || '',
                            weight: criterion.weight || 0,
                            levels: criterion.levels && Array.isArray(criterion.levels) 
                                ? criterion.levels.map(level => ({
                                    description: level.description || '',
                                    score: level.score || 0
                                }))
                                : [
                                    { description: 'Excelente', score: 5 },
                                    { description: 'Bueno', score: 3 },
                                    { description: 'Regular', score: 1 }
                                ]
                        }))
                    };
                }
            } else if (mappedType === EvaluationToolType.CHECKLIST) {
                if (methodologyData.items && Array.isArray(methodologyData.items)) {
                    mappedData = {
                        title: methodologyData.title || 'Lista de Cotejo',
                        items: methodologyData.items.map(item => ({
                            description: item.description || '',
                            required: item.required !== undefined ? item.required : true
                        }))
                    };
                }
            }
        } catch (error) {
            console.error('Error parsing evaluation methodology:', error);
        }

        if (!mappedData) {
            mappedData = mappedType === EvaluationToolType.RUBRIC 
                ? { title: 'Rúbrica de Evaluación', criteria: [] }
                : { title: 'Lista de Cotejo', items: [] };
        }

        return { type: mappedType, data: mappedData };
    };

    // Función auxiliar para mapear cuando los datos vienen directamente
    const mapDirectEvaluationData = (taskData) => {
        if (!taskData.evaluation_methodology) {
            return { type: null, data: null };
        }

        // Determinar el tipo basado en la estructura de los datos
        let evalType = null;
        
        if (taskData.evaluation_tool_type) {
            evalType = taskData.evaluation_tool_type;
        } else if (taskData.evaluation_methodology.criteria) {
            evalType = EvaluationToolType.RUBRIC;
        } else if (taskData.evaluation_methodology.items) {
            evalType = EvaluationToolType.CHECKLIST;
        }

        if (!evalType) {
            return { type: null, data: null };
        }

        let mappedData = null;
        try {
            const methodologyData = typeof taskData.evaluation_methodology === 'string' 
                ? JSON.parse(taskData.evaluation_methodology) 
                : taskData.evaluation_methodology;

            if (evalType === EvaluationToolType.RUBRIC && methodologyData.criteria) {
                mappedData = {
                    title: methodologyData.title || 'Rúbrica de Evaluación',
                    criteria: methodologyData.criteria.map(criterion => ({
                        name: criterion.name || '',
                        weight: criterion.weight || 0,
                        levels: criterion.levels && Array.isArray(criterion.levels) 
                            ? criterion.levels.map(level => ({
                                description: level.description || '',
                                score: level.score || 0
                            }))
                            : [
                                { description: 'Excelente', score: 5 },
                                { description: 'Bueno', score: 3 },
                                { description: 'Regular', score: 1 }
                            ]
                    }))
                };
            } else if (evalType === EvaluationToolType.CHECKLIST && methodologyData.items) {
                mappedData = {
                    title: methodologyData.title || 'Lista de Cotejo',
                    items: methodologyData.items.map(item => ({
                        description: item.description || '',
                        required: item.required !== undefined ? item.required : true
                    }))
                };
            }
        } catch (error) {
            console.error('Error parsing direct evaluation methodology:', error);
        }

        return { type: evalType, data: mappedData };
    };

    const colors = useMemo(() => ({
        background: colorScheme === 'dark' ? '#1D3D47' : '#A1CEDC',
        text: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
        secondaryText: colorScheme === 'dark' ? '#B0B0B0' : '#666666',
    }), [colorScheme]);

    useEffect(() => {
        const loadTask = async () => {
            try {
                setIsLoading(true);
                console.log('Cargando tarea con ID:', idTask);
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
                
                // Mapear y cargar metodología de evaluación si existe
                let mappedEvaluation = mapEvaluationToolFromBackend(taskData);
                
                // Si no se encontró con la estructura estándar, intentar mapeo directo
                if (!mappedEvaluation.type) {
                    mappedEvaluation = mapDirectEvaluationData(taskData);
                }
                
                console.log('Metodología de evaluación mapeada:', mappedEvaluation);
                
                if (mappedEvaluation.type && mappedEvaluation.data) {
                    setSelectedEvaluationTool(mappedEvaluation.type);
                    
                    if (mappedEvaluation.type === EvaluationToolType.RUBRIC) {
                        setRubricData(mappedEvaluation.data);
                        console.log('Datos de rúbrica cargados:', mappedEvaluation.data);
                    } else if (mappedEvaluation.type === EvaluationToolType.CHECKLIST) {
                        setChecklistData(mappedEvaluation.data);
                        console.log('Datos de checklist cargados:', mappedEvaluation.data);
                    }
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

    // Funciones para manejar la evaluación
    const handleEvaluationToolChange = (tool) => {
        // Si ya hay una metodología configurada y se está cambiando, pedir confirmación
        if (selectedEvaluationTool && selectedEvaluationTool !== tool) {
            Alert.alert(
                "Cambiar Herramienta de Evaluación",
                "¿Estás seguro de que quieres cambiar la herramienta de evaluación? Se perderán los datos actuales.",
                [
                    {
                        text: "Cancelar",
                        style: "cancel"
                    },
                    {
                        text: "Cambiar",
                        onPress: () => {
                            setSelectedEvaluationTool(tool);
                            // Limpiar datos de la herramienta anterior
                            if (tool !== EvaluationToolType.RUBRIC) {
                                setRubricData(null);
                            }
                            if (tool !== EvaluationToolType.CHECKLIST) {
                                setChecklistData(null);
                            }
                        }
                    }
                ]
            );
        } else {
            setSelectedEvaluationTool(tool);
            // Limpiar datos de la herramienta anterior
            if (tool !== EvaluationToolType.RUBRIC) {
                setRubricData(null);
            }
            if (tool !== EvaluationToolType.CHECKLIST) {
                setChecklistData(null);
            }
        }
    };

    const handleRubricChange = (rubric) => {
        setRubricData(rubric);
    };

    const handleChecklistChange = (checklist) => {
        setChecklistData(checklist);
    };

    const handleClearEvaluationTool = () => {
        if (selectedEvaluationTool) {
            Alert.alert(
                "Eliminar Herramienta de Evaluación",
                "¿Estás seguro de que quieres eliminar la herramienta de evaluación configurada?",
                [
                    {
                        text: "Cancelar",
                        style: "cancel"
                    },
                    {
                        text: "Eliminar",
                        style: "destructive",
                        onPress: () => {
                            setSelectedEvaluationTool(null);
                            setRubricData(null);
                            setChecklistData(null);
                        }
                    }
                ]
            );
        }
    };

    

    const handleUpdateTask = async () => {
        if (!name || !selectedDate || !ponderacion || !descripcion) {
            Alert.alert("Error", "Por favor, completa todos los campos.");
            return;
        }

        // Validar herramientas de evaluación si están seleccionadas
        if (selectedEvaluationTool === EvaluationToolType.RUBRIC && rubricData) {
            const rubricValidation = validateRubricData(rubricData);
            if (!rubricValidation.isValid) {
                Alert.alert("Error en Rúbrica", rubricValidation.error);
                return;
            }
        }

        if (selectedEvaluationTool === EvaluationToolType.CHECKLIST && checklistData) {
            const checklistValidation = validateChecklistData(checklistData);
            if (!checklistValidation.isValid) {
                Alert.alert("Error en Lista de Cotejo", checklistValidation.error);
                return;
            }
        }

        try {
            // Obtener la fecha actual para start_date
            const today = new Date();
            const startDate = today.toISOString();

            // Convertir la fecha de entrega a formato ISO con hora final del día
            const endDate = new Date(selectedDate);
            endDate.setHours(23, 59, 59, 999);
            const endDateISO = endDate.toISOString();

            // Preparar la metodología de evaluación
            let evaluationMethodology = null;
            let evaluationToolType = null;

            if (selectedEvaluationTool === EvaluationToolType.RUBRIC && rubricData) {
                evaluationMethodology = rubricData;
                evaluationToolType = EvaluationToolType.RUBRIC;
            } else if (selectedEvaluationTool === EvaluationToolType.CHECKLIST && checklistData) {
                evaluationMethodology = checklistData;
                evaluationToolType = EvaluationToolType.CHECKLIST;
            }

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
                    end_date: endDateISO,
                    evaluation_methodology: evaluationMethodology,
                    evaluation_tool_type: evaluationToolType
                }
            };

            console.log('Enviando actualización:', updatedTask);
            const response = await updateTask(updatedTask, teacherid);

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

          {/* Herramientas de Evaluación */}
          <ThemedView style={styles.evaluationSection}>
            <ThemedText type="subtitle" style={{ color: colors.text, marginBottom: 12 }}>
              Herramientas de Evaluación
            </ThemedText>
            
            {/* Mostrar información actual si existe */}
            {selectedEvaluationTool && (
              <View style={styles.currentEvaluationInfo}>
                <ThemedText style={[styles.currentEvaluationText, { color: colors.secondaryText }]}>
                  Configuración actual: {selectedEvaluationTool === EvaluationToolType.RUBRIC ? 'Rúbrica' : 'Lista de Cotejo'}
                </ThemedText>
                {selectedEvaluationTool === EvaluationToolType.RUBRIC && rubricData && (
                  <ThemedText style={[styles.currentEvaluationDetails, { color: colors.secondaryText }]}>
                    • {rubricData.criteria?.length || 0} criterios configurados
                    {rubricData.title && ` • Título: "${rubricData.title}"`}
                  </ThemedText>
                )}
                {selectedEvaluationTool === EvaluationToolType.CHECKLIST && checklistData && (
                  <ThemedText style={[styles.currentEvaluationDetails, { color: colors.secondaryText }]}>
                    • {checklistData.items?.length || 0} ítems configurados
                    {checklistData.title && ` • Título: "${checklistData.title}"`}
                  </ThemedText>
                )}
              </View>
            )}
            
            <EvaluationToolSelector
              selectedTool={selectedEvaluationTool}
              onToolSelect={handleEvaluationToolChange}
              onClear={handleClearEvaluationTool}
            />

            {/* Renderizar el constructor de rúbrica si está seleccionado */}
            {selectedEvaluationTool === EvaluationToolType.RUBRIC && (
              <View style={styles.builderContainer}>
                <ThemedText style={[styles.builderTitle, { color: colors.text }]}>
                  Editor de Rúbrica
                </ThemedText>
                {rubricData && rubricData.criteria?.length > 0 && (
                  <ThemedText style={[styles.builderSubtitle, { color: colors.secondaryText }]}>
                    Edita la configuración existente o agrega más criterios
                  </ThemedText>
                )}
                <RubricBuilder
                  initialData={rubricData}
                  onChange={handleRubricChange}
                />
              </View>
            )}

            {/* Renderizar el constructor de lista de cotejo si está seleccionado */}
            {selectedEvaluationTool === EvaluationToolType.CHECKLIST && (
              <View style={styles.builderContainer}>
                <ThemedText style={[styles.builderTitle, { color: colors.text }]}>
                  Editor de Lista de Cotejo
                </ThemedText>
                {checklistData && checklistData.items?.length > 0 && (
                  <ThemedText style={[styles.builderSubtitle, { color: colors.secondaryText }]}>
                    Edita la configuración existente o agrega más ítems
                  </ThemedText>
                )}
                <ChecklistBuilder
                  initialData={checklistData}
                  onChange={handleChecklistChange}
                />
              </View>
            )}
          </ThemedView>

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
    evaluationSection: {
        marginVertical: 16,
        padding: 16,
        borderRadius: 12,
        backgroundColor: 'transparent',
    },
    currentEvaluationInfo: {
        backgroundColor: 'rgba(23, 162, 184, 0.1)',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#17A2B8',
    },
    currentEvaluationText: {
        fontSize: 14,
        fontStyle: 'italic',
        marginBottom: 4,
    },
    currentEvaluationDetails: {
        fontSize: 12,
        fontStyle: 'italic',
        opacity: 0.8,
    },
    builderContainer: {
        marginTop: 16,
        padding: 16,
        borderRadius: 12,
        backgroundColor: 'rgba(23, 162, 184, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(23, 162, 184, 0.2)',
    },
    builderTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    builderSubtitle: {
        fontSize: 13,
        marginBottom: 12,
        fontStyle: 'italic',
    },
});
