import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Alert,
  Image,
  StyleSheet,
  View,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  useColorScheme,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ParallaxScrollView from "../../components/ParallaxScrollView";
import { ThemedText } from "../../components/ThemedText";
import { ThemedView } from "../../components/ThemedView";
import { InputFilter } from "../../components/InputFilter";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import { getTasksByStudentId } from "../../services/activity";
import { handleError } from "../../utils/errorHandler";
import { LinearGradient } from "expo-linear-gradient";

const STATUS_FILTERS = {
  ALL: "Todas",
  PENDING: "Pendientes",
  SUBMITTED: "Entregadas",
  RETURNED: "Devueltas",
};

const STATUS_COLORS = {
  0: "#FFA500", // Pendiente - Naranja
  1: "#4CAF50", // Entregada - Verde
  2: "#2196F3", // Devuelta - Azul
};

export default function StudentTasksScreen() {
  const colorScheme = useColorScheme();
  const navigation = useNavigation();
  const route = useRoute();

  // Estados
  const [searchValue, setSearchValue] = useState("");
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Parámetros de ruta
  const { studentId, courseId, subjectId, managementId, materiaName } =
    route.params;

  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const monthNames = useMemo(
    () => [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ],
    []
  );

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    try {

      const response = await getTasksByStudentId(
        studentId,
        courseId,
        subjectId,
        managementId
      );

      if (response.ok && response.data) {
        const transformedTasks = response.data.map((task) => ({
          ...task,
          createDate: new Date(task.create_date),
          status: task.assignments?.[0]?.status ?? 0,
        }));
        setTasks(transformedTasks);
      } else {
        console.log("No tasks found or invalid response");
        setTasks([]);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      handleError(error, "Error al cargar las tareas");
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  }, [studentId, courseId, subjectId, managementId]);

  useEffect(() => {
    if (studentId && courseId && subjectId && managementId) {
      
      fetchTasks();
    }
  }, [studentId, courseId, subjectId, managementId]);

  useFocusEffect(
    useCallback(() => {
      if (studentId && courseId && subjectId && managementId) {
        
        fetchTasks();
      }
    }, [fetchTasks])
  );

  // Manejadores de eventos
  const handlePrevMonth = useCallback(() => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      
      return newDate;
    });
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      
      return newDate;
    });
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchTasks();
    } finally {
      setRefreshing(false);
    }
  }, [fetchTasks]);

  // Filtrado de tareas
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const taskCreateDate = task.createDate;
      const matchesSearch = task.name
        .toLowerCase()
        .includes(searchValue.toLowerCase());
      const matchesMonth =
        taskCreateDate.getMonth() === currentDate.getMonth() &&
        taskCreateDate.getFullYear() === currentDate.getFullYear();
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "PENDING" && task.status === 0) ||
        (statusFilter === "SUBMITTED" && task.status === 1) ||
        (statusFilter === "RETURNED" && task.status === 2);

      return matchesSearch && matchesMonth && matchesStatus;
    });
  }, [tasks, searchValue, currentDate, statusFilter]);

  // Definir colores basados en el tema
  const theme = {
    background: colorScheme === "dark" ? "#000000" : "#FFFFFF",
    surface: colorScheme === "dark" ? "#121212" : "#FFFFFF",
    card: colorScheme === "dark" ? "#1E1E1E" : "#FFFFFF",
    text: colorScheme === "dark" ? "#FFFFFF" : "#000000",
    subtext: colorScheme === "dark" ? "#8E8E93" : "#666666",
    border: colorScheme === "dark" ? "#2C2C2E" : "rgba(0,0,0,0.05)",
    primary: "#17A2B8",
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      {/* ParallaxScrollView solo para la imagen */}
      <View style={styles.headerParallax}>
        <ParallaxScrollView
          modo={2}
          headerBackgroundColor={{ light: "#A1CEDC", dark: "#000000" }}
          headerImage={
            <Image
              source={require("../../assets/images/task.jpg")}
              style={styles.headerImage}
            />
          }
          scrollEnabled={false}
          headerHeight={150}
        >
          <View style={{ height: 1 }} />
        </ParallaxScrollView>
      </View>

      {/* Contenido principal */}
      <View style={styles.mainContent}>
        {/* Header fijo con filtros */}
        <View style={[styles.headerFixed, { backgroundColor: theme.surface }]}>
          <ThemedView
            style={[styles.titleContainer, { backgroundColor: theme.surface }]}
          >
            <View style={styles.titleRow}>
              <ThemedText type="title" style={{ color: theme.text }}>
                Tareas
              </ThemedText>
              <ThemedText type="default" style={{ color: theme.subtext }}>
                Gestión {route.params.managementYear}
              </ThemedText>
            </View>
            <ThemedText
              type="default"
              style={[styles.subtitleText, { color: theme.subtext }]}
            >
              {materiaName}
            </ThemedText>
          </ThemedView>

          <View
            style={[
              styles.filtersContainer,
              { backgroundColor: theme.surface },
            ]}
          >
            <InputFilter
              value={searchValue}
              onChangeText={setSearchValue}
              placeholder="Buscar tarea..."
              style={[styles.searchInput, { backgroundColor: theme.card }]}
            />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.statusFilters}
            >
              {Object.entries(STATUS_FILTERS).map(([key, label]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.filterButton,
                    {
                      backgroundColor:
                        statusFilter === key ? theme.primary : theme.card,
                    },
                  ]}
                  onPress={() => setStatusFilter(key)}
                >
                  <ThemedText
                    style={[
                      styles.filterText,
                      {
                        color: statusFilter === key ? "#FFFFFF" : theme.subtext,
                      },
                    ]}
                  >
                    {label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View
            style={[styles.monthNavigator, { backgroundColor: theme.card }]}
          >
            <TouchableOpacity onPress={handlePrevMonth}>
              <Ionicons name="chevron-back" size={24} color={theme.subtext} />
            </TouchableOpacity>
            <ThemedText style={[styles.monthText, { color: theme.text }]}>
              {monthNames[currentDate.getMonth()]}
            </ThemedText>
            <TouchableOpacity onPress={handleNextMonth}>
              <Ionicons
                name="chevron-forward"
                size={24}
                color={theme.subtext}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Contenido scrolleable (solo las tareas) */}
        <ScrollView
          style={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {isLoading ? (
            <ActivityIndicator
              size="large"
              color={theme.primary}
              style={styles.loader}
            />
          ) : filteredTasks.length === 0 ? (
            <ThemedView
              style={[
                styles.emptyContainer,
                { backgroundColor: theme.surface },
              ]}
            >
              <ThemedText style={[styles.emptyText, { color: theme.subtext }]}>
                No hay tareas para mostrar
              </ThemedText>
            </ThemedView>
          ) : (
            <View
              style={[
                styles.tasksContainer,
                { backgroundColor: theme.surface },
              ]}
            >
              {filteredTasks.map((task) => {
                const isLate = new Date(task.end_date) < new Date();

                return (
                  <TouchableOpacity
                    key={task.id}
                    style={[styles.taskCard, { backgroundColor: theme.card }]}
                    onPress={() =>
                      navigation.navigate("calificaciones", {
                        screen: "TaskDetail",
                        params: {
                          studentId: studentId,
                          taskId: task.id,
                        },
                      })
                      
                    }
                  >
                    <View style={styles.taskContent}>
                      <View style={styles.taskHeader}>
                        <View style={styles.taskTitleContainer}>
                          <View style={styles.titleRow}>
                            <View style={styles.statusIndicatorContainer}>
                              <View
                                style={[
                                  styles.statusIndicator,
                                  {
                                    backgroundColor: isLate
                                      ? "#FF5252"
                                      : "#4CAF50",
                                  },
                                ]}
                              />
                              <ThemedText
                                style={[styles.taskName, { color: theme.text }]}
                              >
                                {task.name}
                              </ThemedText>
                            </View>
                          </View>
                          <View style={styles.datesContainer}>
                            <View style={styles.dateItem}>
                              <Ionicons
                                name="calendar-outline"
                                size={14}
                                color={theme.subtext}
                              />
                              <ThemedText
                                style={[
                                  styles.taskDate,
                                  { color: theme.subtext },
                                ]}
                              >
                                Creada:{" "}
                                {new Date(task.createDate).toLocaleDateString()}
                              </ThemedText>
                            </View>
                            <View style={styles.dateItem}>
                              <Ionicons
                                name="time-outline"
                                size={14}
                                color={theme.subtext}
                              />
                              <ThemedText
                                style={[
                                  styles.taskDate,
                                  { color: theme.subtext },
                                ]}
                              >
                                Entrega:{" "}
                                {new Date(task.end_date).toLocaleDateString()}
                              </ThemedText>
                            </View>
                          </View>
                        </View>
                        <View style={styles.statusContainer}>
                          <View
                            style={[
                              styles.statusBadge,
                              { backgroundColor: STATUS_COLORS[task.status] },
                            ]}
                          >
                            <ThemedText style={styles.statusText}>
                              {task.status === 0
                                ? "Pendiente"
                                : task.status === 1
                                ? "Entregada"
                                : "Devuelta"}
                            </ThemedText>
                          </View>
                          {isLate && (
                            <ThemedText style={styles.lateText}>
                              Con retraso
                            </ThemedText>
                          )}
                        </View>
                      </View>

                      <View
                        style={[
                          styles.taskDetails,
                          { borderTopColor: theme.border },
                        ]}
                      >
                        <View style={styles.detailItem}>
                          <Ionicons
                            name="school-outline"
                            size={16}
                            color={theme.subtext}
                          />
                          <ThemedText
                            style={[
                              styles.detailText,
                              { color: theme.subtext },
                            ]}
                          >
                            {task.dimension.dimension}
                          </ThemedText>
                        </View>
                        <View style={styles.detailItem}>
                          <Ionicons
                            name="stats-chart-outline"
                            size={16}
                            color={theme.subtext}
                          />
                          <ThemedText
                            style={[
                              styles.detailText,
                              { color: theme.subtext },
                            ]}
                          >
                            Peso: {task.weight}%
                          </ThemedText>
                        </View>
                        <View style={styles.detailItem}>
                          <Ionicons
                            name="star-outline"
                            size={16}
                            color={theme.subtext}
                          />
                          <ThemedText
                            style={[
                              styles.detailText,
                              { color: theme.subtext },
                            ]}
                          >
                            Nota:{" "}
                            {task.assignments[0]?.qualification?.trim() || "-"}
                          </ThemedText>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerParallax: {
    height: 110, // Altura fija para la imagen parallax
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  headerImage: {
    width: "100%",
    height: "100%",
  },
  mainContent: {
    flex: 1,
    backgroundColor: "transparent",
  },
  headerFixed: {
    width: "100%",
    zIndex: 2,
    marginTop: 110, // Mismo valor que headerParallax height
  },
  titleContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  subtitleText: {
    marginTop: 4,
  },
  filtersContainer: {
    padding: 16,
    paddingTop: 8,
    gap: 12,
  },
  scrollContent: {
    flex: 1,
  },
  searchInput: {
    marginBottom: 0,
  },
  statusFilters: {
    flexDirection: "row",
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    marginRight: 8,
  },
  filterText: {
    fontSize: 14,
  },
  monthNavigator: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  monthText: {
    fontSize: 16,
    fontWeight: "600",
  },
  loader: {
    marginTop: 20,
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    color: "#666",
    fontSize: 16,
  },
  tasksContainer: {
    padding: 16,
    gap: 12,
  },
  taskCard: {
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  taskContent: {
    padding: 16,
    gap: 12,
  },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  taskTitleContainer: {
    flex: 1,
    gap: 4,
  },
  taskName: {
    fontSize: 16,
    fontWeight: "600",
  },
  taskDate: {
    fontSize: 12,
  },
  statusContainer: {
    alignItems: "flex-end",
    gap: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
  },
  taskDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTopWidth: 1,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailText: {
    fontSize: 12,
  },
  statusIndicatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  datesContainer: {
    marginTop: 4,
    gap: 4,
  },
  dateItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  lateText: {
    color: "#FF5252",
    fontSize: 12,
    fontWeight: "500",
  },
});
