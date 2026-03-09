// AI Exam Proctoring — Class Labels

// Import classes from the model training
// The model was trained with these class labels
import { CLASS_LABELS } from './aiTypes'
export { CLASS_LABELS }

/**
 * Get human-readable label for a class ID
 */
export function getLabel(classId: number): string {
  return CLASS_LABELS[classId] || `unknown_${classId}`
}

/**
 * Get all available class labels
 */
export function getAllLabels(): Record<number, string> {
  return { ...CLASS_LABELS }
}
