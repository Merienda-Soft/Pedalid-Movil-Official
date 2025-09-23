import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import { useMemo, useState, useEffect } from "react";
import {
  Alert,
  Image,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { ButtonLink } from "../../components/ButtonLink";
import ChecklistBuilder from "../../components/ChecklistBuilderNew";
import EvaluationToolSelector from "../../components/EvaluationToolSelector";
import AutoEvaluationBuilder from "../../components/AutoEvaluationBuilder";
import { InputComboBox } from "../../components/InputComboBox";
import { InputType } from "../../components/InputType";
import ParallaxScrollView from "../../components/ParallaxScrollView";
import RubricBuilder from "../../components/RubricBuilderNew";
import { ThemedText } from "../../components/ThemedText";
import { ThemedView } from "../../components/ThemedView";
import { createActivity, updateActivity, getWeightsByDimension, getActivityById } from "../../services/activity";
import { useGlobalState } from "../../services/UserContext";
import {
  createEmptyChecklist,
  createEmptyRubric,
  createEmptyAutoEvaluation,
  EvaluationToolType,
  validateChecklistData,
  validateRubricData,
  validateAutoEvaluationData,
} from "../../types/evaluation";

export default function NewTaskScreen() {
  const colorScheme = useColorScheme();
  const { globalState } = useGlobalState();
  const { cursoid, materiaid, teacherid, materiaName, cursoName } = globalState;
  const navigation = useNavigation();
  const params = useLocalSearchParams();

  // Estados
  const [formData, setFormData] = useState({
    name: "",
    date: "",
    startDate: "",
    ponderacion: "",
    descripcion: "",
    tipo: "1",
    type: 0, // 0 = tarea para entregar, 1 = tarea solo para calificar
    isPastTask: false,
  });

  // Estado para edición
  const [editTask, setEditTask] = useState(null);
  const [loading, setLoading] = useState(false);

  // Estado para herramientas de evaluación
  const [evaluationTool, setEvaluationTool] = useState({
    type: null,
    data: null,
  });

  // Estados para control de ponderaciones
  const [dimensionWeights, setDimensionWeights] = useState({});
  const [loadingWeights, setLoadingWeights] = useState(false);
  const [formError, setFormError] = useState('');

  // Colores dinámicos basados en el tema
  const colors = useMemo(
    () => ({
      background: colorScheme === "dark" ? "#1D3D47" : "#A1CEDC",
      text: colorScheme === "dark" ? "#FFFFFF" : "#000000",
      secondaryText: colorScheme === "dark" ? "#B0B0B0" : "#666666",
      error: "#FF6B6B",
      success: "#4CAF50",
    }),
    [colorScheme]
  );

  const options = [
    { value: "1", text: "Ser" },
    { value: "2", text: "Saber" },
    { value: "3", text: "Hacer" },
    { value: "4", text: "Decidir" },
    { value: "5", text: "Autoevaluación" },
  ];

  // Detectar si es modo edición
  const { idTask } = params;
  const isEditing = !!idTask;

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

  // Función para resetear el formulario
  const resetForm = () => {
    setFormData({
      name: '',
      date: '',
      startDate: '',
      ponderacion: '',
      descripcion: '',
      tipo: '1',
      type: 0,
      isPastTask: false
    });
    setEvaluationTool({ type: null, data: null });
  };

  // Cargar datos de tarea para edición
  useEffect(() => {
    const loadTaskForEdit = async () => {
      if (!isEditing || !idTask) return;

      setLoading(true);
      try {
        const response = await getActivityById(idTask);
        if (response.ok && response.data) {
          const task = response.data;
          const startDate = new Date(task.start_date);
          const endDate = new Date(task.end_date);
          const isPastTask = startDate < new Date();

          setFormData({
            name: task.name || '',
            date: task.end_date ? task.end_date.slice(0, 10) : '',
            startDate: task.start_date ? task.start_date.slice(0, 10) : '',
            ponderacion: String(task.weight || 0),
            descripcion: task.description || '',
            tipo: String(task.dimension_id || '1'),
            type: task.type || 0,
            isPastTask: isPastTask
          });

          // Mapear herramienta de evaluación
          const mappedEvaluationTool = mapEvaluationToolFromBackend(task);
          setEvaluationTool(mappedEvaluationTool);
          setEditTask(task);
        }
      } catch (error) {
        console.error('Error loading task for edit:', error);
        Alert.alert('Error', 'No se pudo cargar la tarea para editar');
      } finally {
        setLoading(false);
      }
    };

    loadTaskForEdit();
  }, [isEditing, idTask]);

  // Cargar pesos por dimensión al inicializar el componente
  useEffect(() => {
    const fetchDimensionWeights = async () => {
      if (!cursoid || !materiaid || !teacherid || !globalState.management?.id) return;

      setLoadingWeights(true);
      try {
        const today = new Date().toISOString().split('T')[0];
        const weights = await getWeightsByDimension(
          teacherid.toString(),
          cursoid.toString(),
          materiaid.toString(),
          globalState.management.id.toString(),
          today
        );
        setDimensionWeights(weights.weightByDimension || {});
      } catch (error) {
        console.error('Error loading dimension weights:', error);
      } finally {
        setLoadingWeights(false);
      }
    };

    fetchDimensionWeights();
  }, [cursoid, materiaid, teacherid, globalState.management?.id]);

  // Validaciones de ponderación por dimensión
  const validateDimensionWeight = (dimensionId, newWeight) => {
    const currentWeight = dimensionWeights[dimensionId]?.weight || 0;
    const availableWeight = 100 - currentWeight;
    
    if (currentWeight >= 100) {
      return {
        isValid: false,
        message: `La dimensión ya tiene el 100% asignado. Ajusta otras tareas de esta dimensión.`
      };
    }
    
    if (newWeight > availableWeight) {
      return {
        isValid: false,
        message: `La ponderación no puede ser mayor a ${availableWeight}% (disponible en esta dimensión).`
      };
    }
    
    return { isValid: true, message: '' };
  };

  const getDimensionName = (dimensionId) => {
    const names = { '1': 'SER', '2': 'SABER', '3': 'HACER', '4': 'DECIDIR', '5': 'AUTOEVALUACIÓN' };
    return names[dimensionId] || '';
  };

  const isAutoEvaluationExists = () => {
    return (dimensionWeights['5']?.weight || 0) > 0;
  };

  const handleInputChange = (field, value) => {
    if (field === 'tipo' && value === '5') {
      setFormData(prev => ({ ...prev, [field]: value, ponderacion: '100' }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }

    if (field === 'ponderacion' && formData.tipo && formData.tipo !== '5') {
      const weightValue = Number(value);
      if (!isNaN(weightValue) && weightValue > 0) {
        const validation = validateDimensionWeight(formData.tipo, weightValue);
        if (!validation.isValid) {
          setFormError(validation.message);
        } else {
          setFormError('');
        }
      }
    }

    if (field === 'tipo') {
      const isAutoEvaluationDimension = value === '5';
      const currentToolType = evaluationTool.type;

      // Limpiar errores previos
      setFormError('');

      if (isAutoEvaluationDimension && currentToolType !== EvaluationToolType.AUTO_EVALUATION) {
        setEvaluationTool({ type: null, data: null });
      }
      else if (!isAutoEvaluationDimension && currentToolType === EvaluationToolType.AUTO_EVALUATION) {
        setEvaluationTool({ type: null, data: null });
      }
    }
  };

  const handleCheckboxToggle = () => {
    setFormData(prev => ({ ...prev, type: prev.type === 0 ? 1 : 0 }));
  };

  const handlePastTaskToggle = (checked) => {
    setFormData(prev => ({
      ...prev,
      isPastTask: checked,
      startDate: checked ? prev.startDate : '',
      date: checked ? prev.date : ''
    }));
  };


  const handleEvaluationToolChange = (type) => {
    if (type === null) {
      setEvaluationTool({
        type: null,
        data: null,
      });
    } else if (type !== evaluationTool.type) {
      let defaultData = null;
      if (type === EvaluationToolType.RUBRIC) {
        defaultData = createEmptyRubric();
      } else if (type === EvaluationToolType.CHECKLIST) {
        defaultData = createEmptyChecklist();
      } else if (type === EvaluationToolType.AUTO_EVALUATION) {
        defaultData = createEmptyAutoEvaluation();
      }
      
      setEvaluationTool({
        type,
        data: defaultData,
      });
    }
  };

  const handleEvaluationDataChange = (data) => {
    setEvaluationTool((prev) => ({
      ...prev,
      data,
    }));
  };

  const validateForm = () => {
    const { name, date, startDate, ponderacion, descripcion, isPastTask } = formData;

    if (!name || !ponderacion || !descripcion) {
      setFormError('Por favor, completa todos los campos requeridos.');
      return false;
    }

    // Validar fechas según el tipo de tarea
    if (isPastTask) {
      if (!startDate || !date) {
        setFormError('Por favor, completa ambas fechas para la tarea pasada.');
        return false;
      }
      const start = new Date(startDate);
      const end = new Date(date);
      if (end < start) {
        setFormError('La fecha de fin debe ser posterior a la fecha de inicio.');
        return false;
      }
    } else {
      if (!date) {
        setFormError('Por favor, ingresa la fecha de entrega.');
        return false;
      }
      const now = new Date();
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      if (endDate <= now) {
        setFormError('La fecha de entrega debe ser posterior a la fecha y hora actual.');
        return false;
      }
    }

    const pondValue = Number(ponderacion);
    if (isNaN(pondValue) || pondValue < 1 || pondValue > 100) {
      setFormError('La ponderación debe ser un número entre 1 y 100.');
      return false;
    }

    const dimensionId = formData.tipo;

    // Validación especial para autoevaluación
    if (dimensionId === '5') {
      if (!isEditing && isAutoEvaluationExists()) {
        setFormError('Ya existe una autoevaluación para este trimestre. Solo se permite una autoevaluación por trimestre.');
        return false;
      }

      // Para autoevaluación, la ponderación debe ser 100%
      if (pondValue !== 100) {
        setFormError('La autoevaluación debe tener una ponderación del 100%.');
        return false;
      }
    } else {
      // Validar pesos por dimensión para otras dimensiones
      const currentWeight = dimensionWeights[dimensionId]?.weight || 0;
      const availableWeight = 100 - currentWeight;

      if (currentWeight >= 100 && !isEditing) {
        setFormError(`La dimensión ${getDimensionName(dimensionId)} ya tiene el 100% asignado. Ajusta otras tareas de esta dimensión.`);
        return false;
      }

      if (pondValue > availableWeight) {
        setFormError(`La ponderación no puede ser mayor a ${availableWeight}% (disponible en la dimensión ${getDimensionName(dimensionId)}).`);
        return false;
      }
    }

    // Validar herramientas de evaluación solo si están configuradas
    if (evaluationTool.type && evaluationTool.data) {
      if (evaluationTool.type === EvaluationToolType.RUBRIC) {
        if (!validateRubricData(evaluationTool.data)) {
          setFormError('La rúbrica debe tener un título y al menos un criterio completo.');
          return false;
        }
      } else if (evaluationTool.type === EvaluationToolType.CHECKLIST) {
        if (!validateChecklistData(evaluationTool.data)) {
          setFormError('La lista de cotejo debe tener un título y al menos un ítem.');
          return false;
        }
      } else if (evaluationTool.type === EvaluationToolType.AUTO_EVALUATION) {
        if (!validateAutoEvaluationData(evaluationTool.data)) {
          setFormError('La autoevaluación debe tener un título y al menos un criterio con niveles en alguna dimensión.');
          return false;
        }
        for (const dimension of evaluationTool.data.dimensions) {
          for (const criterion of dimension.criteria) {
            if (criterion.levels.length === 0) {
              setFormError('Cada criterio debe tener al menos un nivel de evaluación');
              return false;
            }
          }
        }
      }
    }

    // Validación especial para tareas de solo calificar
    if (formData.type === 1) {
      if (!evaluationTool.type) {
        setFormError('Seleccione una herramienta de evaluación');
        return false;
      }
    }

    // Validación especial para autoevaluación: debe tener herramienta automáticamente
    if (dimensionId === '5') {
      if (!evaluationTool.type || evaluationTool.type !== EvaluationToolType.AUTO_EVALUATION) {
        setFormError('La autoevaluación requiere seleccionar la herramienta de autoevaluación.');
        return false;
      }
    }

    setFormError('');
    return true;
  };
  const handleCreateOrUpdateTask = async () => {
    if (!validateForm()) return;

    const pondValue = Number(formData.ponderacion);
    const dimensionId = formData.tipo;

    if (dimensionId === '5' && !isEditing && isAutoEvaluationExists()) {
      Alert.alert(
        "Autoevaluación ya existe",
        "Ya existe una autoevaluación para este trimestre. Solo se permite una autoevaluación por trimestre.",
        [{ text: "Entendido" }]
      );
      return;
    }

    // Validar pesos por dimensión (solo para dimensiones que no sean autoevaluación en edición)
    if (dimensionId !== '5') {
      const currentWeight = dimensionWeights[dimensionId]?.weight || 0;
      const availableWeight = 100 - currentWeight;

      if (currentWeight >= 100 && !isEditing) {
        Alert.alert(
          "Dimensión completa",
          `La dimensión ${getDimensionName(dimensionId)} ya tiene el 100% asignado. Ajusta otras tareas de esta dimensión.`,
          [{ text: "Entendido" }]
        );
        return;
      }

      if (pondValue > availableWeight) {
        Alert.alert(
          "Ponderación excedida",
          `La ponderación no puede ser mayor a ${availableWeight}% (disponible en la dimensión ${getDimensionName(dimensionId)}).`,
          [{ text: "Entendido" }]
        );
        return;
      }
    }

    if (formData.type === 1 && !evaluationTool.type) {
      setFormError('Seleccione una herramienta de evaluación');
      return;
    }

    try {
      const now = new Date();
      const startDate = formData.isPastTask ? formData.startDate : now.toISOString();
      const endDate = new Date(formData.date);
      endDate.setHours(23, 59, 59, 999);
      const endDateISO = endDate.toISOString();

      if (isEditing) {
        const updatePayload = {
          task: {
            id: editTask.id,
            name: formData.name,
            description: formData.descripcion,
            dimension_id: Number(formData.tipo),
            management_id: Number(globalState.management.id),
            professor_id: Number(teacherid),
            subject_id: Number(materiaid),
            course_id: cursoid,
            weight: Number(formData.ponderacion),
            is_autoevaluation: 0,
            quarter: 'Q1',
            type: formData.type,
            start_date: formData.isPastTask ? formData.startDate : editTask.start_date,
            end_date: endDateISO
          }
        };

        const update_payload = {
          task: updatePayload,
          tool: evaluationTool.type ? {
            type: evaluationTool.type,
            methodology: evaluationTool.data
          } : null
        };

        await updateActivity(editTask.id, update_payload);

        Alert.alert("Éxito", "La tarea se actualizó correctamente", [
          {
            text: "OK",
            onPress: () =>
              navigation.replace("curso", {
                screen: "index",
                params: {
                  materiaName,
                  cursoName,
                  materiaid,
                  cursoid,
                  teacherid,
                  management: globalState.management,
                },
              }),
          },
        ]);
      } else {
        const taskPayload = {
          name: formData.name,
          description: formData.descripcion,
          dimension_id: Number(formData.tipo),
          management_id: Number(globalState.management.id),
          professor_id: Number(teacherid),
          subject_id: Number(materiaid),
          course_id: cursoid,
          weight: Number(formData.ponderacion),
          is_autoevaluation: 0,
          quarter: 'Q1',
          type: formData.type,
          start_date: startDate,
          end_date: endDateISO
        };

        const payload = {
          task: taskPayload,
          tool: evaluationTool.type ? {
            type: evaluationTool.type,
            methodology: evaluationTool.data
          } : null
        };

        await createActivity(payload);

        Alert.alert("Éxito", "La tarea se creó correctamente", [
          {
            text: "OK",
            onPress: () =>
              navigation.replace("curso", {
                screen: "index",
                params: {
                  materiaName,
                  cursoName,
                  materiaid,
                  cursoid,
                  teacherid,
                  management: globalState.management,
                },
              }),
          },
        ]);
      }
    } catch (error) {
      Alert.alert(
        "Error",
        isEditing ? "No se pudo actualizar la tarea." : "No se pudo crear la tarea. Por favor, intenta nuevamente.",
        [{ text: "Entendido" }]
      );
      console.log(error);
    }
  };

  return (
    <ParallaxScrollView
      modo={2}
      headerBackgroundColor={{
        light: colors.background,
        dark: colors.background,
      }}
      headerImage={
        <Image
          source={require("../../assets/images/newtask.jpg")}
          style={styles.reactLogo}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <View style={styles.titleSection}>
          <ThemedText type="title" style={{ color: colors.text }}>
            {isEditing ? 'Editar Tarea' : 'Nueva Tarea'}
          </ThemedText>
          <View style={styles.subtitleRow}>
            <ThemedText
              type="default"
              style={[styles.materiaName, { color: colors.secondaryText }]}
            >
              {materiaName}
            </ThemedText>
            <ThemedText
              type="default"
              style={[styles.gestionText, { color: colors.secondaryText }]}
            >
              Gestión {globalState.management.management}
            </ThemedText>
          </View>
        </View>
      </ThemedView>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.success} />
          <ThemedText style={{ color: colors.text, marginTop: 10 }}>
            Cargando tarea...
          </ThemedText>
        </View>
      )}

      <InputType
        label="Nombre de la Tarea"
        value={formData.name}
        onChangeText={(value) => handleInputChange("name", value)}
        type="text"
        placeholder="Ej: Tarea 1"
        required
      />

      <View style={styles.checkboxContainer}>
        <TouchableOpacity
          style={[
            styles.checkbox,
            { borderColor: colors.secondaryText },
            formData.isPastTask && { backgroundColor: "#17A2B8" },
          ]}
          onPress={() => handlePastTaskToggle(!formData.isPastTask)}
        >
          {formData.isPastTask && (
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          )}
        </TouchableOpacity>
        <ThemedText style={[styles.checkboxLabel, { color: colors.text }]}>
          Crear tarea pasada
        </ThemedText>
      </View>

      {formData.isPastTask ? (
        <View style={styles.dateGrid}>
          <InputType
            label="Fecha de Inicio"
            value={formData.startDate}
            onChangeText={(value) => handleInputChange("startDate", value)}
            type="date"
            placeholder="Seleccionar fecha"
            required
          />
          <InputType
            label="Fecha de Fin"
            value={formData.date}
            onChangeText={(value) => handleInputChange("date", value)}
            type="date"
            placeholder="Seleccionar fecha"
            required
          />
        </View>
      ) : (
        <InputType
          label="Fecha de Entrega"
          value={formData.date}
          onChangeText={(value) => handleInputChange("date", value)}
          type="date"
          placeholder="Seleccionar fecha"
          required
        />
      )}

      <InputType
        label="Ponderación (%)"
        value={formData.ponderacion}
        onChangeText={(value) => handleInputChange("ponderacion", value)}
        type="number"
        placeholder={
          formData.tipo === '5' 
            ? "100% (Autoevaluación)" 
            : `Máximo ${100 - (dimensionWeights[formData.tipo]?.weight || 0)}%`
        }
        keyboardType="numeric"
        required
        editable={formData.tipo !== '5'} // Deshabilitar para autoevaluación
      />

      {/* Mostrar error de validación si existe */}
      {formError ? (
        <ThemedView style={styles.errorContainer}>
          <ThemedText style={[styles.errorText, { color: colors.error }]}>
            {formError}
          </ThemedText>
        </ThemedView>
      ) : null}

      <InputComboBox
        label="Área de Evaluación"
        selectedValue={formData.tipo}
        onValueChange={(value) => handleInputChange("tipo", value)}
        options={options}
      />

      {/* Mostrar información de peso disponible por dimensión */}
      {!loadingWeights && formData.tipo && (
        <ThemedView style={styles.dimensionWeightInfo}>
          <ThemedText style={[styles.dimensionWeightText, { color: colors.text }]}>
            {formData.tipo === '5' 
              ? `Autoevaluación: ${isAutoEvaluationExists() ? 'Ya existe' : '100% disponible'}`
              : `${getDimensionName(formData.tipo)}: ${100 - (dimensionWeights[formData.tipo]?.weight || 0)}% disponible`
            }
          </ThemedText>
        </ThemedView>
      )}

      <InputType
        label="Descripción"
        value={formData.descripcion}
        onChangeText={(value) => handleInputChange("descripcion", value)}
        type="textarea"
        placeholder="Describe los detalles de la tarea..."
        multiline
        required
      />

      {/* Herramientas de Evaluación - Siempre visibles */}
      <ThemedView style={styles.evaluationSection}>
        <ThemedText style={[styles.evaluationTitle, { color: colors.text }]}>
          Herramienta de Evaluación (Opcional)
        </ThemedText>

        <EvaluationToolSelector
          selectedType={evaluationTool.type}
          selectedDimension={formData.tipo}
          onChange={handleEvaluationToolChange}
        />

        {evaluationTool.type === EvaluationToolType.RUBRIC && (
          <ThemedView style={styles.builderContainer}>
            <RubricBuilder
              initialData={evaluationTool.data}
              onChange={handleEvaluationDataChange}
            />
          </ThemedView>
        )}

        {evaluationTool.type === EvaluationToolType.CHECKLIST && (
          <ThemedView style={styles.builderContainer}>
            <ChecklistBuilder
              initialData={evaluationTool.data}
              onChange={handleEvaluationDataChange}
            />
          </ThemedView>
        )}

        {evaluationTool.type === EvaluationToolType.AUTO_EVALUATION && (
          <ThemedView style={styles.builderContainer}>
            <AutoEvaluationBuilder
              initialData={evaluationTool.data}
              onChange={handleEvaluationDataChange}
            />
          </ThemedView>
        )}
      </ThemedView>

      <TouchableOpacity
        style={[
          styles.checkboxContainer,
          { borderColor: colors.secondaryText },
        ]}
        onPress={handleCheckboxToggle}
      >
        <View
          style={[
            styles.checkbox,
            { borderColor: colors.secondaryText },
            formData.type === 1 && { backgroundColor: "#17A2B8" },
          ]}
        >
          {formData.type === 1 && (
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          )}
        </View>
        <ThemedText style={[styles.checkboxLabel, { color: colors.text }]}>
          Tarea solo para calificar (sin entrega de alumnos)
        </ThemedText>
      </TouchableOpacity>

      <ButtonLink
        text={isEditing ? "Actualizar Tarea" : "Crear Tarea"}
        modo="large"
        onPress={handleCreateOrUpdateTask}
        color="primary"
        style={styles.submitButton}
      />
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 0,
  },
  titleSection: {
    gap: 4,
  },
  subtitleRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  materiaName: {
    fontSize: 16,
  },
  gestionText: {
    fontSize: 16,
  },
  reactLogo: {
    height: "100%",
    width: "100%",
    resizeMode: "cover",
  },
  submitButton: {
    marginTop: 5,
    marginBottom: 10,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 5,
    paddingVertical: 10,
    marginTop: 0,
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxLabel: {
    fontSize: 14,
    flex: 1,
  },
  dateGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
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
  dimensionWeightInfo: {
    backgroundColor: 'rgba(0, 150, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  dimensionWeightText: {
    fontSize: 14,
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
