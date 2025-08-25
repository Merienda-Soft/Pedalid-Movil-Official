import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  createEmptyChecklist,
  createEmptyChecklistItem,
} from "../types/evaluation";
import { InputType } from "./InputType";
import { ThemedText } from "./ThemedText";

export default function ChecklistBuilder({
  initialData,
  onChange,
  colors = {},
}) {
  const defaultColors = {
    text: "#000000",
    secondaryText: "#666666",
    primary: "#17A2B8",
    background: "#FFFFFF",
    border: "#E0E0E0",
    error: "#FF6B6B",
    success: "#4CAF50",
    ...colors,
  };

  const [checklist, setChecklist] = useState(() => {
    if (initialData) {
      return {
        title: initialData.title || "",
        items:
          initialData.items?.map((item) => ({
            description: item.description || "",
            required: item.required !== undefined ? item.required : true,
            checked: item.checked !== undefined ? item.checked : false,
          })) || [],
      };
    }
    return createEmptyChecklist();
  });

  const updateChecklist = (updates) => {
    const updated = { ...checklist, ...updates };
    setChecklist(updated);
    onChange(updated);
  };

  const handleAddItem = () => {
    const newItem = createEmptyChecklistItem();
    updateChecklist({
      items: [...checklist.items, newItem],
    });
  };

  const handleRemoveItem = (index) => {
    Alert.alert(
      "Eliminar Ítem",
      "¿Estás seguro de que quieres eliminar este ítem?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            const updatedItems = [...checklist.items];
            updatedItems.splice(index, 1);
            updateChecklist({ items: updatedItems });
          },
        },
      ]
    );
  };

  const updateItem = (index, field, value) => {
    const updatedItems = [...checklist.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };
    updateChecklist({ items: updatedItems });
  };

  return (
    <ScrollView style={styles.container} nestedScrollEnabled={true}>
      <View
        style={[styles.section, { backgroundColor: defaultColors.background }]}
      >
        <ThemedText
          style={[styles.sectionTitle, { color: defaultColors.text }]}
        >
          Configuración de Lista de Cotejo
        </ThemedText>

        <InputType
          label="Título de la Lista"
          value={checklist.title}
          onChangeText={(value) => updateChecklist({ title: value })}
          type="text"
          placeholder="Ej: Lista de Verificación del Proyecto"
          required
        />

        <View style={styles.itemsSection}>
          <View style={styles.itemsHeader}>
            <ThemedText
              style={[styles.itemsTitle, { color: defaultColors.text }]}
            >
              Ítems de Verificación
            </ThemedText>
            <TouchableOpacity
              style={[
                styles.addButton,
                { backgroundColor: defaultColors.success },
              ]}
              onPress={handleAddItem}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <ThemedText style={styles.addButtonText}>Agregar Ítem</ThemedText>
            </TouchableOpacity>
          </View>

          {checklist.items.map((item, index) => (
            <View
              key={index}
              style={[styles.itemCard, { borderColor: defaultColors.border }]}
            >
              <View style={styles.itemHeader}>
                <ThemedText
                  style={[styles.itemNumber, { color: defaultColors.primary }]}
                >
                  Ítem {index + 1}
                </ThemedText>
                <TouchableOpacity
                  style={[
                    styles.removeButton,
                    { backgroundColor: defaultColors.error },
                  ]}
                  onPress={() => handleRemoveItem(index)}
                >
                  <Ionicons name="trash" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.requiredContainer}>
                <TouchableOpacity
                  style={[
                    styles.checkbox,
                    { borderColor: defaultColors.border },
                    item.required && { backgroundColor: defaultColors.primary },
                  ]}
                  onPress={() => updateItem(index, "required", !item.required)}
                >
                  {item.required && (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
                <ThemedText
                  style={[styles.requiredLabel, { color: defaultColors.text }]}
                >
                  Ítem obligatorio
                </ThemedText>
              </View>

              <InputType
                label="Descripción del Ítem"
                value={item.description}
                onChangeText={(value) =>
                  updateItem(index, "description", value)
                }
                type="textarea"
                placeholder="Describe qué debe verificarse..."
                multiline
                required
              />
            </View>
          ))}

          {checklist.items.length === 0 && (
            <View
              style={[
                styles.emptyState,
                {
                  backgroundColor: defaultColors.background,
                  borderColor: defaultColors.border,
                },
              ]}
            >
              <Ionicons
                name="checkbox-outline"
                size={48}
                color={defaultColors.secondaryText}
              />
              <ThemedText
                style={[
                  styles.emptyText,
                  { color: defaultColors.secondaryText },
                ]}
              >
                No hay ítems definidos
              </ThemedText>
              <ThemedText
                style={[
                  styles.emptySubtext,
                  { color: defaultColors.secondaryText },
                ]}
              >
                Agrega ítems para verificar el cumplimiento
              </ThemedText>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  itemsSection: {
    marginTop: 16,
  },
  itemsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  itemsTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
  },
  itemCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  itemNumber: {
    fontSize: 14,
    fontWeight: "600",
  },
  removeButton: {
    padding: 6,
    borderRadius: 4,
  },
  requiredContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  requiredLabel: {
    fontSize: 14,
    flex: 1,
  },
  emptyState: {
    alignItems: "center",
    padding: 32,
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 4,
    textAlign: "center",
  },
});
