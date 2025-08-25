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

export default function ChecklistBuilder({ initialData, onChange }) {
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
    <View style={styles.container}>
      <InputType
        label="Título de la Lista"
        value={checklist.title}
        onChangeText={(value) => updateChecklist({ title: value })}
        type="text"
        placeholder="Ej: Lista de Verificación del Proyecto"
      />

      <View style={styles.itemsSection}>
        <View style={styles.itemsHeader}>
          <ThemedText style={styles.itemsTitle}>
            Ítems de Verificación
          </ThemedText>
          <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
            <Ionicons name="add" size={16} color="#FFFFFF" />
            <ThemedText style={styles.addButtonText}>Agregar</ThemedText>
          </TouchableOpacity>
        </View>

        {checklist.items.length === 0 ? (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyText}>
              No hay ítems definidos
            </ThemedText>
            <ThemedText style={styles.emptySubtext}>
              Agrega ítems para verificar el cumplimiento
            </ThemedText>
          </View>
        ) : (
          <ScrollView nestedScrollEnabled={true} style={styles.itemsList}>
            {checklist.items.map((item, index) => (
              <View key={index} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <ThemedText style={styles.itemNumber}>
                    Ítem {index + 1}
                  </ThemedText>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveItem(index)}
                  >
                    <Ionicons name="trash" size={14} color="#FF6B6B" />
                  </TouchableOpacity>
                </View>

                <View style={styles.requiredContainer}>
                  <TouchableOpacity
                    style={[
                      styles.checkbox,
                      item.required && styles.checkboxChecked,
                    ]}
                    onPress={() =>
                      updateItem(index, "required", !item.required)
                    }
                  >
                    {item.required && (
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                  <ThemedText style={styles.requiredLabel}>
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
                />
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
  itemsSection: {
    marginTop: 16,
  },
  itemsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  itemsTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: "#17A2B8",
    gap: 4,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
  },
  itemsList: {
    maxHeight: 300,
  },
  itemCard: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#FAFAFA",
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  itemNumber: {
    fontSize: 12,
    fontWeight: "600",
    color: "#17A2B8",
  },
  removeButton: {
    padding: 4,
  },
  requiredContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 6,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderRadius: 3,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  checkboxChecked: {
    backgroundColor: "#17A2B8",
    borderColor: "#17A2B8",
  },
  requiredLabel: {
    fontSize: 12,
    color: "#6C757D",
  },
  emptyState: {
    alignItems: "center",
    padding: 24,
    backgroundColor: "#F8F9FA",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderStyle: "dashed",
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6C757D",
  },
  emptySubtext: {
    fontSize: 12,
    marginTop: 4,
    textAlign: "center",
    color: "#6C757D",
  },
});
