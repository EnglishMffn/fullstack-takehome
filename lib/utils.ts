// React Form data comes with all these $ACTION keys that we don't want
export function cleanFormData(formData: FormData): Record<string, unknown> {
    const result: Record<string, unknown> = {}

    for (const [key, value] of formData.entries()) {
        if (key.startsWith('$ACTION')) continue
        result[key] = value
    }

    return result
}
