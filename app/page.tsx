import { getAllEvents } from '../lib/actions.ts'
import EventList from './event-list.tsx'

export const Page = async (
    { searchParams }: { searchParams: Promise<{ edit?: string }> },
) => {
    const events = await getAllEvents()
    const { edit } = await searchParams

    const editingEvent = edit ? events.find((item) => item.id === Number(edit)) : null

    return (
        <EventList
            initialItems={events}
            editingEvent={editingEvent}
            key={editingEvent?.id}
        />
    )
}

export default Page
