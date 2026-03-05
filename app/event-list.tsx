'use client'

import { useActionState, useOptimistic, useRef, useTransition } from 'react'
import { EventResponse, EventSchema, ValidColors } from '../lib/schemas.ts'
import { createEvent, deleteEvent, FormState, updateEvent } from '../lib/actions.ts'
import { cleanFormData } from '../lib/utils.ts'
import { flattenError } from 'zod'
import clsx from 'clsx'
import Link from 'next/link'
import { FormInput } from './form-input.tsx'

type Pending = { pending?: boolean }
type PendingEvent = Event & Pending
type PendingEventResponse = EventResponse & Pending

type Actions =
    | { type: 'add'; event: PendingEventResponse }
    | { type: 'edit'; id: number; event: Partial<PendingEvent> }
    | { type: 'delete'; id: number }

const optimisticReducer = (
    state: EventResponse[],
    action: Actions,
): EventResponse[] => {
    switch (action.type) {
        case 'add':
            return [action.event, ...state].sort((a, b) => a.company.localeCompare(b.company))
        case 'delete':
            return state.filter((item) => item.id !== action.id)
        case 'edit':
            return state.map((item) => {
                if (item.id === action.id) {
                    return { ...item, ...action.event }
                }

                return item
            })
    }
}

interface EventListProps {
    initialItems: PendingEventResponse[]
    editingEvent?: EventResponse | null
}

const initialState: FormState = { message: '', errors: {}, values: {} }

type FormEditState = 'edit' | 'add'

export const EventList = (
    { initialItems = [], editingEvent }: EventListProps,
) => {
    const [isPending, startTransition] = useTransition()
    const [optimisticEvents, optimisticAction] = useOptimistic(
        initialItems,
        optimisticReducer,
    )

    const formRef = useRef<HTMLFormElement>(null)

    // Optimistically updates the event list
    const handleAdd = async (
        prevState: FormState,
        formData: FormData,
    ): Promise<FormState> => {
        const cleanedFormData = cleanFormData(formData)
        const validatedFields = EventSchema.safeParse(cleanedFormData)

        // Validate form
        if (!validatedFields.success) {
            return {
                errors: flattenError(validatedFields.error),
                message: 'Errors found, please fix',
                values: cleanedFormData,
            } as FormState
        }

        const tempId = -Math.floor(Math.random() * 1_000_000)

        // Optimistically show the new event in the list
        optimisticAction({
            type: 'add',
            event: { id: tempId, ...validatedFields.data, pending: true },
        })

        // Process the real form data on the backend
        const result = await createEvent(prevState, formData)

        if (
            (result?.errors?.formErrors ?? [])?.length === 0 &&
            Object.keys(result.errors?.fieldErrors ?? {}).length === 0
        ) {
            formRef.current?.reset()
        }

        return result
    }

    const handleEdit = async (
        prevState: FormState,
        formData: FormData,
    ): Promise<FormState> => {
        // Guard clause
        if (
            prevState.activeEditId === null || prevState.activeEditId === undefined
        ) return prevState

        const cleanedFormData = cleanFormData(formData)
        const validatedFields = EventSchema.safeParse(cleanedFormData)

        // Validate form
        if (!validatedFields.success) {
            return {
                errors: flattenError(validatedFields.error),
                message: 'Errors found, please fix',
                values: cleanedFormData,
            } as FormState
        }

        // Optimistically show the new event in the list
        optimisticAction({
            type: 'edit',
            id: prevState.activeEditId,
            event: { ...validatedFields?.data, pending: true },
        })

        // Process the real form data on the backend
        const result = await updateEvent(
            prevState,
            formData,
            String(prevState.activeEditId),
        )

        if (
            (result?.errors?.formErrors ?? [])?.length === 0 &&
            Object.keys(result?.errors?.fieldErrors ?? {}).length === 0
        ) {
            formRef.current?.reset()
        }

        return result
    }

    // Removes item from the list before backend confirms it
    const handleDelete = (eventId: number) => {
        startTransition(async () => {
            optimisticAction({ type: 'delete', id: eventId })
            await deleteEvent(eventId)
        })
    }

    const formInitialState: FormState = editingEvent
        ? {
            message: '',
            errors: {},
            values: editingEvent,
            activeEditId: editingEvent.id,
        }
        : initialState

    // Handle form submission
    const handleSubmit = (
        prevState: FormState,
        formData: FormData,
    ): Promise<FormState> => {
        if (prevState?.activeEditId) {
            return handleEdit(prevState, formData)
        }

        return handleAdd(prevState, formData)
    }

    const [state, formAction, pending] = useActionState(
        handleSubmit,
        formInitialState,
    )

    return (
        <div className='flex gap-6 h-full max-h-dvh items-start'>
            <div className='flex-1 flex flex-col max-h-full space-y-4 divide-y divide-cyan-50 overflow-auto'>
                {optimisticEvents.map((event: PendingEventResponse) => {
                    const isEditing = state?.activeEditId === event.id

                    return (
                        <div
                            key={event.id}
                            className={clsx(
                                'flex flex-col gap-4 justify-start pb-8',
                                event?.pending && 'opacity-50',
                            )}
                        >
                            <div>
                                <h2 className='text-3xl font-black'>{event.name}</h2>
                                <p className='text-xl mb-4'>{event.company}</p>
                                <p>{event.description}</p>
                            </div>

                            <div className='flex justify-between'>
                                <div className='flex gap-3'>
                                    <Link
                                        href={`event/${event.id}`}
                                        className='text-white-500 border p-1 text-center disabled:opacity-50'
                                    >
                                        View
                                    </Link>
                                    <Link
                                        href={`?edit=${event.id}`}
                                        className={clsx(
                                            'text-white-500 border p-1 text-center disabled:opacity-50',
                                            isEditing && 'border-green-500 border-2 text-green-500',
                                        )}
                                    >
                                        {isEditing ? 'Editing' : 'Edit'}
                                    </Link>
                                </div>

                                <button
                                    className='text-red-500 border disabled:opacity-50 p-1'
                                    onClick={() => handleDelete(event.id)}
                                    disabled={!!event.pending || isPending}
                                    type='button'
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>
            <aside>
                <div className='p-4 border-dashed border border-white-50 max-w-75 w-full'>
                    <h2 className='text-3xl mb-5 border-double border-b pb-2 uppercase'>
                        {editingEvent ? 'Edit' : 'Add'} Event
                    </h2>
                    <form
                        ref={formRef}
                        action={formAction}
                        className='flex flex-col gap-y-4'
                    >
                        {state?.message && <p aria-live='polite' className='text-red-400'>{state.message}</p>}

                        <FormInput
                            name='name'
                            label='Name'
                            required
                            errors={state?.errors?.fieldErrors?.name}
                            pending={pending}
                            defaultValue={state?.values?.name}
                        />

                        <FormInput
                            name='company'
                            label='Company'
                            required
                            errors={state?.errors?.fieldErrors?.company}
                            pending={pending}
                            defaultValue={state?.values?.company}
                        />

                        <FormInput
                            name='description'
                            label='Description'
                            required
                            errors={state?.errors?.fieldErrors?.description}
                            pending={pending}
                            defaultValue={state?.values?.description}
                        />

                        <FormInput
                            name='email'
                            label='Email'
                            type='email'
                            required
                            errors={state?.errors?.fieldErrors?.email}
                            pending={pending}
                            defaultValue={state?.values?.email}
                        />

                        <div>
                            <label className='flex gap-2'>
                                <input
                                    type='checkbox'
                                    name='isActive'
                                    disabled={pending}
                                    defaultChecked={state?.values?.isActive}
                                />
                                Is Active?
                            </label>
                            {state?.errors?.fieldErrors?.isActive?.join(', ')}
                        </div>

                        <FormInput
                            label='Color'
                            name='color'
                            defaultValue={state?.values?.color}
                            required
                            pending={pending}
                            errors={state?.errors?.fieldErrors?.color}
                            InputComponent={() => (
                                <select
                                    className='bg-background border'
                                    name='color'
                                    defaultValue={state?.values?.color}
                                    required
                                    disabled={pending}
                                >
                                    {ValidColors.options.map((color) => (
                                        <option key={color} value={color}>{color}</option>
                                    ))}
                                </select>
                            )}
                        />

                        <input className='border p-5' type='submit' disabled={pending} />
                    </form>
                </div>

                {editingEvent && (
                    <Link
                        className='flex items-center border-blue-500 p-5 mt-4 justify-center border-2'
                        href='?'
                    >
                        Add New Event
                    </Link>
                )}
            </aside>
        </div>
    )
}

export default EventList
