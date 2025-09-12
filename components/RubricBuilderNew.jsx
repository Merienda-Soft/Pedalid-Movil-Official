import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import {
  createEmptyRubric,
  createEmptyRubricCriterion,
  DEFAULT_RUBRIC_LEVELS,
} from "../types/evaluation";
import { InputType } from "./InputType";
import { ThemedText } from "./ThemedText";
import { useThemeColor } from "../hooks/useThemeColor";

export default function RubricBuilder({ initialData, onChange }) {
  const colorScheme = useColorScheme();
  
  // Definir colores según el tema
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  
  const theme = {
    background: backgroundColor,
    text: textColor,
    card: colorScheme === 'dark' ? '#2A2A2A' : '#FAFAFA',
    border: colorScheme === 'dark' ? '#404040' : '#E0E0E0',
    surface: colorScheme === 'dark' ? '#1E1E1E' : '#FFFFFF',
    subtext: colorScheme === 'dark' ? '#A0A0A0' : '#6C757D',
    primary: '#17A2B8',
    danger: '#FF6B6B',
    empty: colorScheme === 'dark' ? '#2A2A2A' : '#F8F9FA',
  };

  const [rubric, setRubric] = useState(() => {
    if (initialData) {
      return {
        title: initialData.title || "",
        criteria:
          initialData.criteria?.map((criterion) => ({
            name: criterion.name || "",
            weight: criterion.weight || 0,
            selected: criterion.selected || 0,
            levels: criterion.levels?.map((level) => ({
              description: level.description || "",
              score: level.score || 0,
            })) || [...DEFAULT_RUBRIC_LEVELS],
          })) || [],
      };
    }
    return createEmptyRubric();
  });

  const updateRubric = (updates) => {
    const updated = { ...rubric, ...updates };
    setRubric(updated);
    onChange(updated);
  };

  const handleAddCriterion = () => {
    const newCriterion = createEmptyRubricCriterion();
    updateRubric({
      criteria: [...rubric.criteria, newCriterion],
    });
  };

  const handleRemoveCriterion = (index) => {
    Alert.alert(
      "Eliminar Criterio",
      "¿Estás seguro de que quieres eliminar este criterio?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            const updatedCriteria = [...rubric.criteria];
            updatedCriteria.splice(index, 1);
            updateRubric({ criteria: updatedCriteria });
          },
        },
      ]
    );
  };

  const updateCriterion = (index, field, value) => {
    const updatedCriteria = [...rubric.criteria];
    updatedCriteria[index] = {
      ...updatedCriteria[index],
      [field]: value,
    };
    updateRubric({ criteria: updatedCriteria });
  };

  const updateLevel = (criterionIndex, levelIndex, field, value) => {
    const updatedCriteria = [...rubric.criteria];
    updatedCriteria[criterionIndex].levels[levelIndex] = {
      ...updatedCriteria[criterionIndex].levels[levelIndex],
      [field]: value,
    };
    updateRubric({ criteria: updatedCriteria });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <InputType
        label="Título de la Rúbrica"
        value={rubric.title}
        onChangeText={(value) => updateRubric({ title: value })}
        type="text"
        placeholder="Ej: Rúbrica de Evaluación del Proyecto"
      />

      <View style={styles.criteriaSection}>
        <View style={styles.criteriaHeader}>
          <ThemedText style={styles.criteriaTitle}>
            Criterios de Evaluación
          </ThemedText>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.primary }]}
            onPress={handleAddCriterion}
          >
            <Ionicons name="add" size={16} color="#FFFFFF" />
            <ThemedText style={styles.addButtonText}>Agregar</ThemedText>
          </TouchableOpacity>
        </View>

        {rubric.criteria.length === 0 ? (
          <View style={[styles.emptyState, { 
            backgroundColor: theme.empty, 
            borderColor: theme.border 
          }]}>
            <ThemedText style={[styles.emptyText, { color: theme.subtext }]}>
              No hay criterios definidos
            </ThemedText>
            <ThemedText style={[styles.emptySubtext, { color: theme.subtext }]}>
              Agrega criterios para evaluar el desempeño
            </ThemedText>
          </View>
        ) : (
          <ScrollView nestedScrollEnabled={true} style={styles.criteriaList}>
            {rubric.criteria.map((criterion, criterionIndex) => (
              <View key={criterionIndex} style={[styles.criterionCard, {
                backgroundColor: theme.card,
                borderColor: theme.border
              }]}>
                <View style={styles.criterionHeader}>
                  <ThemedText style={[styles.criterionNumber, { color: theme.primary }]}>
                    Criterio {criterionIndex + 1}
                  </ThemedText>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveCriterion(criterionIndex)}
                  >
                    <Ionicons name="trash" size={14} color={theme.danger} />
                  </TouchableOpacity>
                </View>

                <InputType
                  label="Nombre del Criterio"
                  value={criterion.name}
                  onChangeText={(value) =>
                    updateCriterion(criterionIndex, "name", value)
                  }
                  type="text"
                  placeholder="Ej: Contenido y Organización"
                />

                <InputType
                  label="Peso (%)"
                  value={criterion.weight.toString()}
                  onChangeText={(value) => {
                    const numValue = Number(value);
                    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
                      updateCriterion(criterionIndex, "weight", numValue);
                    }
                  }}
                  type="number"
                  placeholder="0-100"
                  keyboardType="numeric"
                />

                <ThemedText style={styles.levelsTitle}>
                  Niveles de Desempeño:
                </ThemedText>

                {criterion.levels.map((level, levelIndex) => (
                  <View key={levelIndex} style={[styles.levelCard, {
                    backgroundColor: theme.surface,
                    borderColor: theme.border
                  }]}>
                    <View style={styles.levelRow}>
                      <View style={styles.levelDescription}>
                        <InputType
                          label={`Nivel ${levelIndex + 1}`}
                          value={level.description}
                          onChangeText={(value) =>
                            updateLevel(
                              criterionIndex,
                              levelIndex,
                              "description",
                              value
                            )
                          }
                          type="text"
                          placeholder="Descripción del nivel"
                        />
                      </View>
                      <View style={styles.levelScore}>
                        <InputType
                          label="Puntos"
                          value={level.score.toString()}
                          onChangeText={(value) => {
                            const numValue = Number(value);
                            if (!isNaN(numValue) && numValue >= 0) {
                              updateLevel(
                                criterionIndex,
                                levelIndex,
                                "score",
                                numValue
                              );
                            }
                          }}
                          type="number"
                          placeholder="0"
                          keyboardType="numeric"
                        />
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  criteriaSection: {
    marginTop: 16,
  },
  criteriaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  criteriaTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    gap: 4,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
  },
  criteriaList: {
    maxHeight: 300,
  },
  criterionCard: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
  },
  criterionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  criterionNumber: {
    fontSize: 12,
    fontWeight: "600",
  },
  removeButton: {
    padding: 4,
  },
  levelsTitle: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 8,
    marginBottom: 6,
  },
  levelCard: {
    borderRadius: 4,
    padding: 8,
    marginBottom: 6,
    borderWidth: 1,
  },
  levelRow: {
    flexDirection: "row",
    gap: 8,
  },
  levelDescription: {
    flex: 2,
  },
  levelScore: {
    flex: 1,
  },
  emptyState: {
    alignItems: "center",
    padding: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "500",
  },
  emptySubtext: {
    fontSize: 12,
    marginTop: 4,
    textAlign: "center",
  },
});
