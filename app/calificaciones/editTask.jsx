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
import AutoEvaluationBuilder from '../../components/AutoEvaluationBuilder';
import { updateActivity, getActivityById, updateTask } from '../../services/activity';
import { useGlobalState } from '../../services/UserContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useColorScheme } from 'react-native';
import { EvaluationToolType, validateRubricData, validateChecklistData, validateAutoEvaluationData } from '../../types/evaluation';

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
    const [autoEvaluationData, setAutoEvaluationData] = useState(null);

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
        } else if (type === 3) {
            mappedType = EvaluationToolType.AUTO_EVALUATION;
        }

        // Si no hay metodología, retornar datos por defecto
        if (!methodology) {
            return {
                type: mappedType,
                data: mappedType === EvaluationToolType.RUBRIC
                    ? { title: 'Rúbrica de Evaluación', criteria: [] }
                    : mappedType === EvaluationToolType.CHECKLIST
                    ? { title: 'Lista de Cotejo', items: [] }
                    : mappedType === EvaluationToolType.AUTO_EVALUATION
                    ? { title: 'Autoevaluación', dimensions: [{ name: 'SER', criteria: [] }, { name: 'DECIDIR', criteria: [] }] }
                    : null
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
            } else if (mappedType === EvaluationToolType.AUTO_EVALUATION) {
                if (methodologyData.dimensions && Array.isArray(methodologyData.dimensions)) {
                    mappedData = {
                        title: methodologyData.title || 'Autoevaluación',
                        dimensions: methodologyData.dimensions.map(dimension => ({
                            name: dimension.name,
                            criteria: dimension.criteria && Array.isArray(dimension.criteria)
                                ? dimension.criteria.map(criterion => ({
                                    description: criterion.description || '',
                                    levels: criterion.levels && Array.isArray(criterion.levels)
                                        ? criterion.levels.map(level => ({
                                            name: level.name || '',
                                            value: level.value || 0,
                                            selected: level.selected || false
                                        }))
                                        : [
                                            { name: 'Si', value: 3, selected: false },
                                            { name: 'A veces', value: 2, selected: false },
                                            { name: 'No', value: 1, selected: false }
                                        ]
                                }))
                                : []
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
                : mappedType === EvaluationToolType.CHECKLIST
                ? { title: 'Lista de Cotejo', items: [] }
                : mappedType === EvaluationToolType.AUTO_EVALUATION
                ? { title: 'Autoevaluación', dimensions: [{ name: 'SER', criteria: [] }, { name: 'DECIDIR', criteria: [] }] }
                : null;
        }

        return { type: mappedType, data: mappedData };
    };

    // Función auxiliar para mapear cuando los datos vienen directamente desde assignments
    const mapDirectEvaluationData = (taskData) => {
        // Buscar en assignments[0] que es donde está la metodología de evaluación
        const assignment = taskData.assignments?.[0];
        if (!assignment || !assignment.evaluation_methodology) {
            return { type: null, data: null };
        }

        // Determinar el tipo basado en assignment.type
        let evalType = null;
        
        if (assignment.type === 1) {
            evalType = EvaluationToolType.RUBRIC;
        } else if (assignment.type === 2) {
            evalType = EvaluationToolType.CHECKLIST;
        } else if (assignment.type === 3) {
            evalType = EvaluationToolType.AUTO_EVALUATION;
        } else if (assignment.evaluation_methodology.criteria) {
            evalType = EvaluationToolType.RUBRIC;
        } else if (assignment.evaluation_methodology.items) {
            evalType = EvaluationToolType.CHECKLIST;
        } else if (assignment.evaluation_methodology.dimensions) {
            evalType = EvaluationToolType.AUTO_EVALUATION;
        }

        if (!evalType) {
            return { type: null, data: null };
        }

        let mappedData = null;
        try {
            const methodologyData = typeof assignment.evaluation_methodology === 'string' 
                ? JSON.parse(assignment.evaluation_methodology) 
                : assignment.evaluation_methodology;

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
            } else if (evalType === EvaluationToolType.AUTO_EVALUATION && methodologyData.dimensions) {
                mappedData = {
                    title: methodologyData.title || 'Autoevaluación',
                    dimensions: methodologyData.dimensions.map(dimension => ({
                        name: dimension.name,
                        criteria: dimension.criteria && Array.isArray(dimension.criteria)
                            ? dimension.criteria.map(criterion => ({
                                description: criterion.description || '',
                                levels: criterion.levels && Array.isArray(criterion.levels)
                                    ? criterion.levels.map(level => ({
                                        name: level.name || '',
                                        value: level.value || 0,
                                        selected: level.selected || false
                                    }))
                                    : [
                                        { name: 'Si', value: 3, selected: false },
                                        { name: 'A veces', value: 2, selected: false },
                                        { name: 'No', value: 1, selected: false }
                                    ]
                            }))
                            : []
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
                console.log('Assignments encontrados:', taskData.assignments?.length);
                if (taskData.assignments?.[0]) {
                    console.log('Primer assignment:', taskData.assignments[0]);
                    console.log('Tipo de evaluación (assignment.type):', taskData.assignments[0].type);
                    console.log('Metodología de evaluación:', taskData.assignments[0].evaluation_methodology);
                }
                
                // Establecer los valores iniciales
                console.log('📝 Estableciendo valores iniciales...');
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
                    console.log('Fecha de entrega establecida:', formattedDate);
                }
                
                console.log('🔄 Procesando metodología de evaluación...');
                // Mapear y cargar metodología de evaluación si existe
                // Intentar primero con mapeo directo desde assignments
                let mappedEvaluation = mapDirectEvaluationData(taskData);
                console.log('Mapeo directo resultado:', mappedEvaluation);
                
                // Si no se encontró con la estructura de assignments, intentar estructura estándar
                if (!mappedEvaluation.type) {
                    console.log('Intentando mapeo estándar...');
                    mappedEvaluation = mapEvaluationToolFromBackend(taskData);
                    console.log('Mapeo estándar resultado:', mappedEvaluation);
                }
                
                console.log('Metodología de evaluación mapeada final:', mappedEvaluation);
                
                if (mappedEvaluation.type && mappedEvaluation.data) {
                    console.log('✅ Configurando herramienta de evaluación:', mappedEvaluation.type);
                    setSelectedEvaluationTool(mappedEvaluation.type);
                    
                    if (mappedEvaluation.type === EvaluationToolType.RUBRIC) {
                        setRubricData(mappedEvaluation.data);
                        console.log('Datos de rúbrica cargados:', mappedEvaluation.data);
                    } else if (mappedEvaluation.type === EvaluationToolType.CHECKLIST) {
                        setChecklistData(mappedEvaluation.data);
                        console.log('Datos de checklist cargados:', mappedEvaluation.data);
                    } else if (mappedEvaluation.type === EvaluationToolType.AUTO_EVALUATION) {
                        setAutoEvaluationData(mappedEvaluation.data);
                        console.log('Datos de autoevaluación cargados:', mappedEvaluation.data);
                    }
                } else {
                    console.log('❌ No hay metodología de evaluación para cargar');
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
        console.log('🛠️ Cambio de herramienta de evaluación:', tool);
        console.log('Herramienta anterior:', selectedEvaluationTool);
        
        // Si ya hay una metodología configurada y se está cambiando, pedir confirmación
        if (selectedEvaluationTool && selectedEvaluationTool !== tool) {
            console.log('⚠️ Cambio de herramienta detectado, pidiendo confirmación');
            Alert.alert(
                "Cambiar Herramienta de Evaluación",
                "¿Estás seguro de que quieres cambiar la herramienta de evaluación? Se perderán los datos actuales.",
                [
                    {
                        text: "Cancelar",
                        style: "cancel",
                        onPress: () => console.log('❌ Cambio de herramienta cancelado')
                    },
                    {
                        text: "Cambiar",
                        onPress: () => {
                            console.log('✅ Confirmado cambio de herramienta a:', tool);
                            setSelectedEvaluationTool(tool);
                            // Limpiar datos de la herramienta anterior
                            if (tool !== EvaluationToolType.RUBRIC) {
                                console.log('🧹 Limpiando datos de rúbrica');
                                setRubricData(null);
                            }
                            if (tool !== EvaluationToolType.CHECKLIST) {
                                console.log('🧹 Limpiando datos de checklist');
                                setChecklistData(null);
                            }
                            if (tool !== EvaluationToolType.AUTO_EVALUATION) {
                                console.log('🧹 Limpiando datos de autoevaluación');
                                setAutoEvaluationData(null);
                            }
                            if (tool !== EvaluationToolType.AUTO_EVALUATION) {
                                console.log('🧹 Limpiando datos de autoevaluación');
                                setAutoEvaluationData(null);
                            }
                        }
                    }
                ]
            );
        } else {
            console.log('✅ Estableciendo herramienta:', tool);
            setSelectedEvaluationTool(tool);
            // Limpiar datos de la herramienta anterior
            if (tool !== EvaluationToolType.RUBRIC) {
                console.log('🧹 Limpiando datos de rúbrica');
                setRubricData(null);
            }
            if (tool !== EvaluationToolType.CHECKLIST) {
                console.log('🧹 Limpiando datos de checklist');
                setChecklistData(null);
            }
        }
    };

    const handleRubricChange = (rubric) => {
        console.log('📝 Cambio en rúbrica:', rubric);
        setRubricData(rubric);
    };

    const handleChecklistChange = (checklist) => {
        console.log('📋 Cambio en checklist:', checklist);
        setChecklistData(checklist);
    };

    const handleAutoEvaluationChange = (autoEvaluation) => {
        console.log('🤔 Cambio en autoevaluación:', autoEvaluation);
        setAutoEvaluationData(autoEvaluation);
    };

    

    const handleUpdateTask = async () => {
        console.log('=== INICIANDO ACTUALIZACIÓN DE TAREA ===');
        console.log('Datos del formulario:', {
            name,
            selectedDate,
            ponderacion,
            descripcion,
            selectedValue,
            selectedEvaluationTool,
            rubricData,
            checklistData,
            autoEvaluationData
        });

        if (!name || !selectedDate || !ponderacion || !descripcion) {
            console.log('❌ Validación fallida: campos faltantes');
            Alert.alert("Error", "Por favor, completa todos los campos.");
            return;
        }

        console.log('✅ Validación básica pasó');

        // Validar herramientas de evaluación si están seleccionadas
        if (selectedEvaluationTool === EvaluationToolType.RUBRIC && rubricData) {
            console.log('📝 Validando rúbrica...');
            const rubricValidation = validateRubricData(rubricData);
            console.log('Resultado validación rúbrica:', rubricValidation);
            if (!rubricValidation) {
                console.log('❌ Validación de rúbrica falló');
                Alert.alert("Error en Rúbrica", "La rúbrica debe tener título, criterios válidos con nombre, peso mayor a 0 y niveles definidos.");
                return;
            }
            console.log('✅ Validación de rúbrica pasó');
        }

        if (selectedEvaluationTool === EvaluationToolType.CHECKLIST && checklistData) {
            console.log('📋 Validando lista de cotejo...');
            const checklistValidation = validateChecklistData(checklistData);
            console.log('Resultado validación checklist:', checklistValidation);
            if (!checklistValidation) {
                console.log('❌ Validación de lista de cotejo falló');
                Alert.alert("Error en Lista de Cotejo", "La lista de cotejo debe tener título e ítems con descripción válida.");
                return;
            }
            console.log('✅ Validación de lista de cotejo pasó');
        }

        if (selectedEvaluationTool === EvaluationToolType.AUTO_EVALUATION && autoEvaluationData) {
            console.log('🤔 Validando autoevaluación...');
            const autoEvaluationValidation = validateAutoEvaluationData(autoEvaluationData);
            console.log('Resultado validación autoevaluación:', autoEvaluationValidation);
            if (!autoEvaluationValidation) {
                console.log('❌ Validación de autoevaluación falló');
                Alert.alert("Error en Autoevaluación", "La autoevaluación debe tener título y al menos un criterio con niveles en alguna dimensión.");
                return;
            }
            console.log('✅ Validación de autoevaluación pasó');
        }

        try {
            console.log('🔄 Preparando datos para envío...');
            
            // Obtener la fecha actual para start_date
            const today = new Date();
            const startDate = today.toISOString();
            console.log('Fecha inicio:', startDate);

            // Convertir la fecha de entrega a formato ISO con hora final del día
            const endDate = new Date(selectedDate);
            endDate.setHours(23, 59, 59, 999);
            const endDateISO = endDate.toISOString();
            console.log('Fecha fin:', endDateISO);

            // Preparar la metodología de evaluación
            let evaluationMethodology = null;
            let evaluationToolType = null;

            console.log('🛠️ Preparando metodología de evaluación...');
            console.log('Herramienta seleccionada:', selectedEvaluationTool);
            console.log('EvaluationToolType.RUBRIC:', EvaluationToolType.RUBRIC);
            console.log('EvaluationToolType.CHECKLIST:', EvaluationToolType.CHECKLIST);

            if (selectedEvaluationTool === EvaluationToolType.RUBRIC && rubricData) {
                console.log('📝 Configurando rúbrica...');
                evaluationMethodology = JSON.stringify(rubricData);
                evaluationToolType = 1; // Cambiar a número para el backend
                console.log('Metodología configurada (rúbrica):', evaluationMethodology);
            } else if (selectedEvaluationTool === EvaluationToolType.CHECKLIST && checklistData) {
                console.log('📋 Configurando lista de cotejo...');
                evaluationMethodology = JSON.stringify(checklistData);
                evaluationToolType = 2; // Cambiar a número para el backend
                console.log('Metodología configurada (checklist):', evaluationMethodology);
            } else if (selectedEvaluationTool === EvaluationToolType.AUTO_EVALUATION && autoEvaluationData) {
                console.log('🤔 Configurando autoevaluación...');
                evaluationMethodology = JSON.stringify(autoEvaluationData);
                evaluationToolType = 3; // Cambiar a número para el backend
                console.log('Metodología configurada (autoevaluación):', evaluationMethodology);
            } else {
                console.log('❌ Sin herramienta de evaluación o datos faltantes');
                evaluationToolType = 0; // Sin herramienta
            }

            console.log('Tipo de herramienta final:', evaluationToolType);

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

            console.log('📦 Datos finales a enviar:', JSON.stringify(updatedTask, null, 2));
            
            console.log('🌐 Enviando petición al servidor...');
            const response = await updateTask(updatedTask, teacherid);
            
            console.log('📨 Respuesta del servidor:', response);
            console.log('Status de respuesta:', response.status);
            console.log('Response.ok:', response.ok);

            if (response.ok) {
                console.log('✅ Actualización exitosa');
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
                console.log('❌ Error en la respuesta del servidor');
                try {
                    const errorData = await response.text();
                    console.log('Datos de error:', errorData);
                    Alert.alert("Error", `No se pudo actualizar la tarea. Error: ${errorData}`);
                } catch (parseError) {
                    console.log('Error parseando respuesta de error:', parseError);
                    Alert.alert("Error", "No se pudo actualizar la tarea");
                }
            }
        } catch (error) {
            console.error('💥 Error en el proceso:', error);
            console.error('Stack trace:', error.stack);
            Alert.alert("Error", `Error al actualizar la tarea: ${error.message}`);
        }
        
        console.log('=== FIN DEL PROCESO DE ACTUALIZACIÓN ===');
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

          {/* Herramientas de Evaluación - Mismo diseño que newTask */}
          <ThemedView style={styles.evaluationSection}>
            <ThemedText style={[styles.evaluationTitle, { color: colors.text }]}>
              Herramienta de Evaluación (Opcional)
            </ThemedText>

            <EvaluationToolSelector
              selectedType={selectedEvaluationTool}
              onChange={handleEvaluationToolChange}
            />

            {selectedEvaluationTool === EvaluationToolType.RUBRIC && (
              <ThemedView style={styles.builderContainer}>
                <RubricBuilder
                  initialData={rubricData}
                  onChange={handleRubricChange}
                />
              </ThemedView>
            )}

            {selectedEvaluationTool === EvaluationToolType.CHECKLIST && (
              <ThemedView style={styles.builderContainer}>
                <ChecklistBuilder
                  initialData={checklistData}
                  onChange={handleChecklistChange}
                />
              </ThemedView>
            )}

            {selectedEvaluationTool === EvaluationToolType.AUTO_EVALUATION && (
              <ThemedView style={styles.builderContainer}>
                <AutoEvaluationBuilder
                  initialData={autoEvaluationData}
                  onChange={handleAutoEvaluationChange}
                />
              </ThemedView>
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
        marginTop: 20,
        marginBottom: 16,
    },
    evaluationTitle: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 16,
    },
    builderContainer: {
        marginTop: 12,
    },
});
