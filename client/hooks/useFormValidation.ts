/**
 * Custom hook for form validation with real-time feedback
 * 
 * Features:
 * - Field-level validation with custom rules
 * - Real-time validation on change/blur
 * - Form submission validation
 * - Error state management
 * - Touch state tracking
 */

import { useState, useCallback, useMemo } from 'react'

export type ValidationRule<T = string> = {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: T) => string | null
  message?: string
}

export type ValidationRules<T> = {
  [K in keyof T]?: ValidationRule<T[K]>
}

export type ValidationErrors<T> = {
  [K in keyof T]?: string
}

export type TouchedFields<T> = {
  [K in keyof T]?: boolean
}

interface UseFormValidationOptions<T> {
  initialValues: T
  validationRules: ValidationRules<T>
  validateOnChange?: boolean
  validateOnBlur?: boolean
}

export function useFormValidation<T extends Record<string, unknown>>({
  initialValues,
  validationRules,
  validateOnChange = true,
  validateOnBlur = true,
}: UseFormValidationOptions<T>) {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<ValidationErrors<T>>({})
  const [touched, setTouched] = useState<TouchedFields<T>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Validate a single field
  const validateField = useCallback(
    (name: keyof T, value: T[keyof T]): string | null => {
      const rules = validationRules[name]
      if (!rules) return null

      // Required validation
      if (rules.required && (!value || String(value).trim() === '')) {
        return rules.message || `${String(name)} is required`
      }

      // Skip other validations if field is empty and not required
      if (!value || String(value).trim() === '') return null

      const stringValue = String(value)

      // Min length validation
      if (rules.minLength && stringValue.length < rules.minLength) {
        return rules.message || `${String(name)} must be at least ${rules.minLength} characters`
      }

      // Max length validation
      if (rules.maxLength && stringValue.length > rules.maxLength) {
        return rules.message || `${String(name)} must be no more than ${rules.maxLength} characters`
      }

      // Pattern validation
      if (rules.pattern && !rules.pattern.test(stringValue)) {
        return rules.message || `${String(name)} format is invalid`
      }

      // Custom validation
      if (rules.custom) {
        return rules.custom(value)
      }

      return null
    },
    [validationRules]
  )

  // Validate all fields
  const validateForm = useCallback((): boolean => {
    const newErrors: ValidationErrors<T> = {}
    let isValid = true

    Object.keys(validationRules).forEach((key) => {
      const fieldName = key as keyof T
      const error = validateField(fieldName, values[fieldName])
      if (error) {
        newErrors[fieldName] = error
        isValid = false
      }
    })

    setErrors(newErrors)
    return isValid
  }, [values, validateField, validationRules])

  // Handle field change
  const handleChange = useCallback(
    (name: keyof T, value: T[keyof T]) => {
      setValues(prev => ({ ...prev, [name]: value }))

      if (validateOnChange && touched[name]) {
        const error = validateField(name, value)
        setErrors(prev => ({ ...prev, [name]: error || undefined }))
      }
    },
    [validateField, validateOnChange, touched]
  )

  // Handle field blur
  const handleBlur = useCallback(
    (name: keyof T) => {
      setTouched(prev => ({ ...prev, [name]: true }))

      if (validateOnBlur) {
        const error = validateField(name, values[name])
        setErrors(prev => ({ ...prev, [name]: error || undefined }))
      }
    },
    [validateField, validateOnBlur, values]
  )

  // Handle form submission
  const handleSubmit = useCallback(
    async (onSubmit: (values: T) => Promise<void> | void) => {
      setIsSubmitting(true)
      
      // Mark all fields as touched
      const allTouched = Object.keys(validationRules).reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {} as TouchedFields<T>
      )
      setTouched(allTouched)

      try {
        const isValid = validateForm()
        if (isValid) {
          await onSubmit(values)
        }
      } catch (error) {
        console.error('Form submission error:', error)
        throw error
      } finally {
        setIsSubmitting(false)
      }
    },
    [values, validateForm, validationRules]
  )

  // Reset form
  const resetForm = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
    setIsSubmitting(false)
  }, [initialValues])

  // Check if form has errors
  const hasErrors = useMemo(
    () => Object.values(errors).some(error => error),
    [errors]
  )

  // Check if form is dirty (has changes)
  const isDirty = useMemo(
    () => JSON.stringify(values) !== JSON.stringify(initialValues),
    [values, initialValues]
  )

  // Get field props for easy integration with form inputs
  const getFieldProps = useCallback(
    (name: keyof T) => ({
      value: values[name],
      onChange: (value: T[keyof T]) => handleChange(name, value),
      onBlur: () => handleBlur(name),
      error: touched[name] ? errors[name] : undefined,
      hasError: Boolean(touched[name] && errors[name]),
    }),
    [values, errors, touched, handleChange, handleBlur]
  )

  return {
    values,
    errors,
    touched,
    isSubmitting,
    hasErrors,
    isDirty,
    handleChange,
    handleBlur,
    handleSubmit,
    validateForm,
    validateField,
    resetForm,
    getFieldProps,
  }
}
