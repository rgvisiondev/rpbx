'use client'

import { useFormState } from 'react-dom'
import { updatePassword } from './actions'
import Button from '@/app/components/Button'

const initialState = { ok: false, message: ''}

export default function ResetPasswordForm(){
    const [state, formAction] = useFormState(updatePassword, initialState)

    return (
        <form action={formAction} className="space-y-4 max-w-sm">
            <label className="block">
                <span>New Password</span>
                <input name="password" type="password" required className="border p-2 w-full"/>
            </label>
            <label className="block">
                <span>Confirm Password</span>
                <input name="confirm" type="password" required className="border p-2 w-full"/>
            </label>
            <Button type="submit">
                Update Password
            </Button>
            {state.message && <p>{state.message}</p>}
        </form>
    )
}