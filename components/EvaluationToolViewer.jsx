import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { EvaluationToolType } from "../types/evaluation";
import { ThemedText } from "./ThemedText";

export default function EvaluationToolViewer({
  methodology,
  onScoreChange,
  onEvaluationChange,
  isEditable = true,
}) {
  const colorScheme = useColorScheme();
  const [localMethodology, setLocalMethodology] = useState(methodology);

  const theme = {
    text: colorScheme === "dark" ? "#FFFFFF" : "#000000",
    subtext: colorScheme === "dark" ? "#8E8E93" : "#666666",
    border: colorScheme === "dark" ? "#2C2C2E" : "rgba(0,0,0,0.05)",
    card: colorScheme === "dark" ? "#1E1E1E" : "#FFFFFF",
    surface: colorScheme === "dark" ? "#121212" : "#F5F5F5",
    primary: "#17A2B8",
    success: "#4CAF50",
    warning: "#FF9800",
  };

  useEffect(() => {
    setLocalMethodology(methodology);
  }, [methodology]);

  // Calcular puntaje total automáticamente
  const calculateTotalScore = (updatedMethodology) => {
    if (!updatedMethodology?.methodology) return 0;

    if (updatedMethodology.type === EvaluationToolType.RUBRIC) {
      const rubric = updatedMethodology.methodology;
      let totalScore = 0;
      let totalWeight = 0;

      // Primero calcular el peso total para normalizar
      rubric.criteria?.forEach((criterion) => {
        totalWeight += criterion.weight || 0;
      });

      // Si no hay pesos asignados, no se puede calcular
      if (totalWeight === 0) {
        return 0;
      }

      // Calcular el puntaje ponderado basado en los pesos
      rubric.criteria?.forEach((criterion) => {
        if (
          criterion.selected !== undefined &&
          criterion.levels?.[criterion.selected]
        ) {
          const selectedLevel = criterion.levels[criterion.selected];
          const weight = criterion.weight || 0;
          const maxScore = Math.max(...criterion.levels.map(level => level.score));
          
          // Calcular el porcentaje del nivel seleccionado respecto al máximo
          const levelPercentage = selectedLevel.score / maxScore;
          
          // Aplicar el peso del criterio al puntaje total (sobre 100)
          const weightedScore = (weight / totalWeight) * 100 * levelPercentage;
          totalScore += weightedScore;
        }
      });

      return Math.round(totalScore * 100) / 100;
    } else if (updatedMethodology.type === EvaluationToolType.CHECKLIST) {
      const checklist = updatedMethodology.methodology;
      if (!checklist.items || checklist.items.length === 0) return 0;

      const totalItems = checklist.items.length;
      const checkedItems = checklist.items.filter(
        (item) => item.checked
      ).length;

      return Math.round((checkedItems / totalItems) * 100);
    }

    return 0;
  };

  const handleRubricLevelSelect = (criterionIndex, levelIndex) => {
    if (!isEditable) return;

    const updatedMethodology = {
      ...localMethodology,
      methodology: {
        ...localMethodology.methodology,
        criteria: localMethodology.methodology.criteria.map((criterion, idx) =>
          idx === criterionIndex
            ? { ...criterion, selected: levelIndex }
            : criterion
        ),
      },
    };

    setLocalMethodology(updatedMethodology);
    onEvaluationChange(updatedMethodology);

    const totalScore = calculateTotalScore(updatedMethodology);
    onScoreChange(totalScore);
  };

  const handleChecklistItemToggle = (itemIndex) => {
    if (!isEditable) return;

    const updatedMethodology = {
      ...localMethodology,
      methodology: {
        ...localMethodology.methodology,
        items: localMethodology.methodology.items.map((item, idx) =>
          idx === itemIndex ? { ...item, checked: !item.checked } : item
        ),
      },
    };

    setLocalMethodology(updatedMethodology);
    onEvaluationChange(updatedMethodology);

    const totalScore = calculateTotalScore(updatedMethodology);
    onScoreChange(totalScore);
  };

  if (!localMethodology || !localMethodology.methodology) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: theme.surface }]}>
        <Ionicons name="document-outline" size={48} color={theme.subtext} />
        <ThemedText style={[styles.emptyText, { color: theme.subtext }]}>
          No hay metodología de evaluación configurada
        </ThemedText>
      </View>
    );
  }

  // Renderizar Rúbrica
  if (localMethodology.type === EvaluationToolType.RUBRIC) {
    const rubric = localMethodology.methodology;
    const totalCriteria = rubric.criteria?.length || 0;
    const evaluatedCriteria =
      rubric.criteria?.filter((c) => c.selected !== undefined).length || 0;

    return (
      <ScrollView style={styles.container}>
        <View style={[styles.header, { backgroundColor: theme.card }]}>
          <Ionicons name="list-outline" size={24} color={theme.primary} />
          <View style={styles.headerContent}>
            <ThemedText style={[styles.title, { color: theme.text }]}>
              {rubric.title || "Rúbrica de Evaluación"}
            </ThemedText>
            {totalCriteria > 0 && (
              <ThemedText
                style={[styles.progressText, { color: theme.subtext }]}
              >
                Evaluados: {evaluatedCriteria}/{totalCriteria} criterios
              </ThemedText>
            )}
          </View>
        </View>

        {rubric.criteria?.map((criterion, criterionIndex) => (
          <View
            key={criterionIndex}
            style={[styles.criterionCard, { backgroundColor: theme.card }]}
          >
            <View style={styles.criterionHeader}>
              <ThemedText style={[styles.criterionName, { color: theme.text }]}>
                {criterion.name}
              </ThemedText>
              <ThemedText
                style={[styles.criterionWeight, { color: theme.subtext }]}
              >
                Peso: {criterion.weight}%
              </ThemedText>
            </View>

            <View style={styles.levelsContainer}>
              {criterion.levels?.map((level, levelIndex) => {
                const isSelected = criterion.selected === levelIndex;

                return (
                  <TouchableOpacity
                    key={levelIndex}
                    style={[
                      styles.levelButton,
                      {
                        backgroundColor: isSelected
                          ? theme.primary
                          : theme.surface,
                        borderColor: isSelected ? theme.primary : theme.border,
                      },
                    ]}
                    onPress={() =>
                      handleRubricLevelSelect(criterionIndex, levelIndex)
                    }
                    disabled={!isEditable}
                  >
                    <View style={styles.levelRow}>
                      <View style={styles.levelDescription}>
                        <ThemedText
                          style={[
                            styles.levelText,
                            { color: isSelected ? "#FFFFFF" : theme.text },
                          ]}
                        >
                          {level.description}
                        </ThemedText>
                      </View>
                      <View style={styles.levelScore}>
                        <ThemedText
                          style={[
                            styles.scoreText,
                            { color: isSelected ? "#FFFFFF" : theme.primary },
                          ]}
                        >
                          {level.score} pts
                        </ThemedText>
                      </View>
                    </View>

                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color="#FFFFFF"
                        style={styles.selectedIcon}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        <View style={[styles.totalScore, { backgroundColor: theme.card }]}>
          <ThemedText style={[styles.totalLabel, { color: theme.text }]}>
            Puntaje Total:
          </ThemedText>
          <ThemedText style={[styles.totalValue, { color: theme.primary }]}>
            {calculateTotalScore(localMethodology)} / 100
          </ThemedText>
        </View>
      </ScrollView>
    );
  }

  // Renderizar Lista de Cotejo
  if (localMethodology.type === EvaluationToolType.CHECKLIST) {
    const checklist = localMethodology.methodology;

    return (
      <ScrollView style={styles.container}>
        <View style={[styles.header, { backgroundColor: theme.card }]}>
          <Ionicons name="checkbox-outline" size={24} color={theme.primary} />
          <ThemedText style={[styles.title, { color: theme.text }]}>
            {checklist.title || "Lista de Cotejo"}
          </ThemedText>
        </View>

        {checklist.items?.map((item, itemIndex) => (
          <TouchableOpacity
            key={itemIndex}
            style={[
              styles.checklistItem,
              {
                backgroundColor: theme.card,
                borderLeftColor: item.required ? theme.warning : theme.success,
              },
            ]}
            onPress={() => handleChecklistItemToggle(itemIndex)}
            disabled={!isEditable}
          >
            <View style={styles.checklistContent}>
              <Ionicons
                name={item.checked ? "checkbox" : "square-outline"}
                size={24}
                color={item.checked ? theme.success : theme.subtext}
              />
              <ThemedText
                style={[
                  styles.checklistText,
                  {
                    color: theme.text,
                    textDecorationLine: item.checked ? "line-through" : "none",
                    opacity: item.checked ? 0.7 : 1,
                  },
                ]}
              >
                {item.description}
              </ThemedText>
              {item.required && (
                <View
                  style={[
                    styles.requiredBadge,
                    { backgroundColor: theme.warning },
                  ]}
                >
                  <ThemedText style={styles.requiredText}>
                    Obligatorio
                  </ThemedText>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}

        <View style={[styles.totalScore, { backgroundColor: theme.card }]}>
          <ThemedText style={[styles.totalLabel, { color: theme.text }]}>
            Progreso:
          </ThemedText>
          <ThemedText style={[styles.totalValue, { color: theme.primary }]}>
            {calculateTotalScore(localMethodology)}%
          </ThemedText>
        </View>
      </ScrollView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    borderRadius: 12,
    marginVertical: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  progressText: {
    fontSize: 14,
    marginTop: 4,
  },
  criterionCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  criterionHeader: {
    marginBottom: 12,
  },
  criterionName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  criterionWeight: {
    fontSize: 14,
  },
  levelsContainer: {
    gap: 8,
  },
  levelButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    position: "relative",
  },
  levelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  levelDescription: {
    flex: 2,
  },
  levelScore: {
    flex: 1,
    alignItems: "flex-end",
  },
  levelText: {
    fontSize: 14,
    lineHeight: 20,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: "600",
  },
  selectedIcon: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  checklistItem: {
    borderRadius: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  checklistContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  checklistText: {
    fontSize: 16,
    flex: 1,
    lineHeight: 22,
  },
  requiredBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  requiredText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },
  totalScore: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "600",
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "bold",
  },
});
