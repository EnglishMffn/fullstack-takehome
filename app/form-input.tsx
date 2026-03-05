import { ReactNode } from 'react'
import clsx from 'clsx'

interface FormInput {
    label: string
    name?: string
    defaultValue?: string
    errors?: string[]
    pending?: boolean
    type?: string
    required?: boolean
    children?: ReactNode
    hasErrors?: boolean
    InputComponent?: (props: FormInput) => ReactNode
}

const TextInputComponent = ({ name, hasErrors, type, pending, defaultValue }: Partial<FormInput>) => (
    <input
        className={clsx('py-2, px-1 border', hasErrors && 'border-red-400')}
        required
        type={type}
        name={name}
        disabled={pending}
        defaultValue={defaultValue}
    />
)

export const FormInput = (
    {
        label,
        defaultValue,
        errors = [],
        hasErrors = errors?.length > 0,
        name,
        pending,
        required,
        InputComponent = TextInputComponent,
        type = 'text',
    }: FormInput,
) => {
    return (
        <div className='flex flex-col gap-1'>
            <label className={clsx(hasErrors && 'text-red-400')}>
                {label}
                {required ? '*' : ''}
            </label>

            <InputComponent defaultValue={defaultValue} name={name} pending={pending} type={type} />

            {hasErrors && <span className='text-red-400'>{errors.join(', ')}</span>}
        </div>
    )
}
