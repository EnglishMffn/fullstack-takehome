'use server'

import { revalidatePath } from 'next/cache'
import { Event, EventResponse, EventSchema } from './schemas.ts'
import { notFound } from 'next/navigation'
import * as z from 'zod'
import { cleanFormData } from './utils.ts'

export const getAllEvents = async (): Promise<EventResponse[]> => {
    const response = await fetch('https://rf-json-server.herokuapp.com/events/')

    if (!response.ok) {
        throw Error('Failed to fetch events!')
    }

    const events: EventResponse[] = await response.json()

    return events?.sort((a, b) => a.company.localeCompare(b.company))
}

export const getEvent = async (eventId: string): Promise<EventResponse> => {
    const response = await fetch(
        `https://rf-json-server.herokuapp.com/events/${eventId}`,
    )

    console.log(response)

    if (!response.ok) {
        notFound()
    }

    return response.json()
}

export interface FormState {
    message?: string
    // For persisting form values
    values?: Partial<Event>
    activeEditId?: number
    errors: {
        formErrors?: string[]
        fieldErrors?: Partial<Record<keyof Event, string[]>>
    }
}

export const createEvent = async (prevState: FormState, formData: FormData) => {
    const cleanedFormData = cleanFormData(formData)
    const validatedFields = EventSchema.safeParse(cleanedFormData)

    // Validate form
    if (!validatedFields.success) {
        return {
            errors: z.flattenError(validatedFields.error),
            message: 'Errors found, please fix',
            values: cleanedFormData,
        }
    }

    const res = await fetch('https://rf-json-server.herokuapp.com/events/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedFields.data),
    })

    if (!res.ok) {
        return { message: 'Failed to create event', errors: {} }
    }

    revalidatePath('/')

    return prevState
}

export const updateEvent = async (
    prevState: FormState,
    formData: FormData,
    eventId: string,
) => {
    const cleanedFormData = cleanFormData(formData)
    const validatedFields = EventSchema.safeParse(cleanedFormData)

    // Validate form
    if (!validatedFields.success) {
        return {
            errors: z.flattenError(validatedFields.error),
            message: 'Errors found, please fix',
            values: cleanedFormData,
        }
    }

    const res = await fetch(
        `https://rf-json-server.herokuapp.com/events/${eventId}`,
        {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(validatedFields.data),
        },
    )

    if (!res.ok) {
        return { message: 'Failed to update event', errors: {} }
    }

    revalidatePath('/')

    return prevState
}

export const deleteEvent = async (eventId: number) => {
    const res = await fetch(
        `https://rf-json-server.herokuapp.com/events/${eventId}`,
        { method: 'DELETE' },
    )

    if (!res.ok) {
        return { message: 'Failed to delete event' }
    }

    revalidatePath('/')
}
