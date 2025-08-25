# Herramientas de Evaluación - Aplicación Móvil

## Descripción

Se ha implementado la funcionalidad de herramientas de evaluación (Rúbricas y Listas de Cotejo) en la aplicación móvil, siguiendo el mismo patrón que la aplicación web.

## Archivos Creados

### 1. `types/evaluation.js`

- Define los tipos de evaluación (RUBRIC y CHECKLIST)
- Contiene funciones de validación
- Incluye funciones auxiliares para crear datos vacíos

### 2. `components/EvaluationToolSelector.jsx`

- Selector visual para elegir entre Rúbrica o Lista de Cotejo
- Diseño adaptado para móvil con botones táctiles
- Soporte para temas oscuros y claros

### 3. `components/RubricBuilder.jsx`

- Constructor de rúbricas con criterios y niveles de desempeño
- Interfaz intuitiva para agregar/eliminar criterios
- Validación de datos en tiempo real
- Scroll optimizado para móvil

### 4. `components/ChecklistBuilder.jsx`

- Constructor de listas de cotejo con ítems verificables
- Opción para marcar ítems como obligatorios
- Interfaz simple y clara para móvil

## Funcionalidades Implementadas

### En newTask.jsx:

1. **Checkbox mejorado**: Al marcar "Tarea solo para calificar", se habilitan las herramientas de evaluación

2. **Selector de herramientas**: Permite elegir entre Rúbrica o Lista de Cotejo

3. **Constructor dinámico**: Según la selección, aparece el constructor correspondiente

4. **Validación extendida**:

   - Para tareas solo de calificación, es obligatorio seleccionar una herramienta
   - Valida que las rúbricas tengan título y al menos un criterio completo
   - Valida que las listas de cotejo tengan título y al menos un ítem

5. **Integración con API**: Los datos de la herramienta se envían al crear la tarea

## Uso

### Para crear una tarea con herramienta de evaluación:

1. Llena los campos básicos (nombre, fecha, ponderación, etc.)
2. Marca el checkbox "Tarea solo para calificar"
3. Selecciona el tipo de herramienta (Rúbrica o Lista de Cotejo)
4. Configura la herramienta según tus necesidades:

   **Para Rúbricas:**

   - Define el título
   - Agrega criterios con sus pesos
   - Cada criterio tiene niveles de desempeño predefinidos (Excelente=5, Bueno=3, Regular=1)

   **Para Listas de Cotejo:**

   - Define el título
   - Agrega ítems a verificar
   - Marca si cada ítem es obligatorio

5. Crea la tarea

## Estructura de Datos

### Rúbrica:

```javascript
{
  title: "Título de la rúbrica",
  criteria: [
    {
      name: "Nombre del criterio",
      weight: 25, // Peso en porcentaje
      selected: 0, // Nivel seleccionado (para evaluación)
      levels: [
        { description: "Excelente", score: 5 },
        { description: "Bueno", score: 3 },
        { description: "Regular", score: 1 }
      ]
    }
  ]
}
```

### Lista de Cotejo:

```javascript
{
  title: "Título de la lista",
  items: [
    {
      description: "Descripción del ítem",
      required: true, // Si es obligatorio
      checked: false // Si está marcado (para evaluación)
    }
  ]
}
```

## Características Técnicas

- **Sin TypeScript**: Adaptado completamente a JavaScript (JSX)
- **Responsive**: Optimizado para pantallas móviles
- **Temas**: Soporte para modo oscuro y claro
- **Performance**: ScrollView optimizado y componentes eficientes
- **Validación**: Validación robusta en múltiples niveles
- **UX**: Interfaz intuitiva con iconos y retroalimentación visual

## Compatibilidad

- Compatible con React Native
- Funciona con Expo
- Integrado con el sistema de navegación existente
- Compatible con el sistema de estados global (UserContext)
