import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
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
import { createActivity, getWeightsByDimension } from "../../services/activity";
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

  // Estados
  const [formData, setFormData] = useState({
    name: "",
    date: "",
    ponderacion: "",
    descripcion: "",
    tipo: "1",
    type: 0, // 0 = tarea para entregar, 1 = tarea solo para calificar
  });

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
    // Lógica especial para autoevaluación
    if (field === 'tipo' && value === '5') {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
        ponderacion: '100', // Autoevaluación siempre es 100%
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
    
    // Validar ponderación en tiempo real para dimensiones que no sean autoevaluación
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
    
    // Limpiar errores si se cambia de dimensión
    if (field === 'tipo') {
      setFormError('');
      const isAutoEvaluationDimension = value === '5';
      const currentToolType = evaluationTool.type;
      
      // Limpiar herramienta de evaluación si cambia entre autoevaluación y otras dimensiones
      if (isAutoEvaluationDimension && currentToolType && currentToolType !== EvaluationToolType.AUTO_EVALUATION) {
        // Cambió a autoevaluación pero tiene herramienta incompatible
        setEvaluationTool({ type: null, data: null });
      } else if (!isAutoEvaluationDimension && currentToolType === EvaluationToolType.AUTO_EVALUATION) {
        // Cambió de autoevaluación a otra dimensión
        setEvaluationTool({ type: null, data: null });
      }
    }
  };

  const handleCheckboxToggle = () => {
    setFormData((prev) => ({
      ...prev,
      type: prev.type === 0 ? 1 : 0,
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
    const { name, date, ponderacion, descripcion } = formData;
    
    // Validaciones básicas
    if (!name || !date || !ponderacion || !descripcion) {
      Alert.alert(
        "Campos Incompletos",
        "Por favor, completa todos los campos requeridos.",
        [{ text: "Entendido" }]
      );
      return false;
    }

    const pondValue = Number(ponderacion);
    if (isNaN(pondValue) || pondValue <= 0 || pondValue > 100) {
      Alert.alert(
        "Ponderación Inválida",
        "La ponderación debe ser un número entre 1 y 100.",
        [{ text: "Entendido" }]
      );
      return false;
    }

    const dimensionId = formData.tipo;
    
    // Validación especial para autoevaluación
    if (dimensionId === '5') {
      if (isAutoEvaluationExists()) {
        Alert.alert(
          "Autoevaluación ya existe",
          "Ya existe una autoevaluación para este trimestre. Solo se permite una autoevaluación por trimestre.",
          [{ text: "Entendido" }]
        );
        return false;
      }
      
      // Para autoevaluación, la ponderación debe ser 100%
      if (pondValue !== 100) {
        Alert.alert(
          "Ponderación Incorrecta",
          "La autoevaluación debe tener una ponderación del 100%.",
          [{ text: "Entendido" }]
        );
        return false;
      }
    } else {
      // Validar pesos por dimensión para otras dimensiones
      const currentWeight = dimensionWeights[dimensionId]?.weight || 0;
      const availableWeight = 100 - currentWeight;
      
      if (currentWeight >= 100) {
        Alert.alert(
          "Dimensión completa",
          `La dimensión ${getDimensionName(dimensionId)} ya tiene el 100% asignado. Ajusta otras tareas de esta dimensión.`,
          [{ text: "Entendido" }]
        );
        return false;
      }
      
      if (pondValue > availableWeight) {
        Alert.alert(
          "Ponderación excedida",
          `La ponderación no puede ser mayor a ${availableWeight}% (disponible en la dimensión ${getDimensionName(dimensionId)}).`,
          [{ text: "Entendido" }]
        );
        return false;
      }
    }

    // Validar fecha de entrega
    const now = new Date();
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    if (endDate <= now) {
      Alert.alert(
        "Fecha Inválida",
        "La fecha de entrega debe ser posterior a la fecha y hora actual.",
        [{ text: "Entendido" }]
      );
      return false;
    }

    // Validar herramientas de evaluación solo si están configuradas
    if (evaluationTool.type && evaluationTool.data) {
      if (evaluationTool.type === EvaluationToolType.RUBRIC) {
        if (!validateRubricData(evaluationTool.data)) {
          Alert.alert(
            "Rúbrica Incompleta",
            "La rúbrica debe tener un título y al menos un criterio completo.",
            [{ text: "Entendido" }]
          );
          return false;
        }
      } else if (evaluationTool.type === EvaluationToolType.CHECKLIST) {
        if (!validateChecklistData(evaluationTool.data)) {
          Alert.alert(
            "Lista de Cotejo Incompleta",
            "La lista de cotejo debe tener un título y al menos un ítem.",
            [{ text: "Entendido" }]
          );
          return false;
        }
      } else if (evaluationTool.type === EvaluationToolType.AUTO_EVALUATION) {
        if (!validateAutoEvaluationData(evaluationTool.data)) {
          Alert.alert(
            "Autoevaluación Incompleta",
            "La autoevaluación debe tener un título y al menos un criterio con niveles en alguna dimensión.",
            [{ text: "Entendido" }]
          );
          return false;
        }
      }
    }

    // Validación especial para tareas de solo calificar
    if (formData.type === 1 && !evaluationTool.type) {
      Alert.alert(
        "Herramienta Requerida",
        "Las tareas solo para calificar requieren una herramienta de evaluación.",
        [{ text: "Entendido" }]
      );
      return false;
    }

    // Validación especial para autoevaluación: debe tener herramienta automáticamente
    if (dimensionId === '5') {
      if (!evaluationTool.type || evaluationTool.type !== EvaluationToolType.AUTO_EVALUATION) {
        Alert.alert(
          "Herramienta Requerida",
          "La autoevaluación requiere seleccionar la herramienta de autoevaluación.",
          [{ text: "Entendido" }]
        );
        return false;
      }
    }

    return true;
  };
  const handleCreateTask = async () => {
    if (!validateForm()) return;

    // Obtener la fecha actual para start_date
    const today = new Date();
    const startDate = today.toISOString();

    // Convertir la fecha de entrega a formato ISO con hora final del día
    const endDate = new Date(formData.date);
    endDate.setHours(23, 59, 59, 999);
    const endDateISO = endDate.toISOString();

    const newTask = {
      task: {
        name: formData.name,
        description: formData.descripcion,
        dimension_id: Number(formData.tipo),
        management_id: globalState.management.id, // Asumiendo que management tiene id
        professor_id: teacherid,
        subject_id: materiaid,
        course_id: cursoid,
        weight: Number(formData.ponderacion),
        is_autoevaluation: 0,
        quarter: "Q1",
        type: formData.type,
        start_date: startDate,
        end_date: endDateISO,
      },
    };

    // Agregar herramienta de evaluación si está definida
    if (evaluationTool.type && evaluationTool.data) {
      newTask.tool = {
        type: evaluationTool.type,
        methodology: evaluationTool.data,
      };
    }

    try {
      await createActivity(newTask, teacherid);
      const management = globalState.management;
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
                management,
              },
            }),
        },
      ]);
    } catch (error) {
      Alert.alert(
        "Error",
        "No se pudo crear la tarea. Por favor, intenta nuevamente.",
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
            Nueva Tarea
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

      <InputType
        label="Nombre de la Tarea"
        value={formData.name}
        onChangeText={(value) => handleInputChange("name", value)}
        type="text"
        placeholder="Ej: Tarea 1"
        required
      />

      <InputType
        label="Fecha de Entrega"
        value={formData.date}
        onChangeText={(value) => handleInputChange("date", value)}
        type="date"
        placeholder="Seleccionar fecha"
        required
      />

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
        text="Crear Tarea"
        modo="large"
        onPress={handleCreateTask}
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
    paddingVertical: 0,
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
