import * as z from 'zod'

// All of the acceptable colors from the early web
export const ValidColors = z.enum([
    'black',
    'silver',
    'gray',
    'white',
    'maroon',
    'red',
    'purple',
    'fuchsia',
    'green',
    'lime',
    'olive',
    'yellow',
    'navy',
    'blue',
    'teal',
    'aqua',
])

export const EventSchema = z.object({
    name: z.string().min(5),
    description: z.string().min(5),
    company: z.string().min(5),
    color: ValidColors.optional(),
    isActive: z.preprocess((val) => val === 'on', z.boolean()).optional(),
    // TODO: figure out proper validation
    date: z.date().optional(),
    email: z.email().optional(),
    address: z.string().optional(),
    image: z.string().optional(),
    createdOn: z.date().optional(),
})

export const EventReponseSchema = EventSchema.extend({
    // id is returned from the response, but must never be sent or modified
    id: z.number().readonly(),
})

export type Event = z.infer<typeof EventSchema>
export type EventResponse = z.infer<typeof EventReponseSchema>
export type Color = z.infer<typeof ValidColors>
