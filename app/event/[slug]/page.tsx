import { getEvent } from '../../../lib/actions'

interface PageParams {
    slug: string
}

export const Page = async ({ params }: { params: Promise<PageParams> }) => {
    const { slug } = await params
    const event = await getEvent(slug)

    return (
        <>
            <h1 className='text-9xl'>{event.name}</h1>
            <p className='text-4xl'>{event.description}</p>
        </>
    )
}

export default Page
