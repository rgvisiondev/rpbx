import { signUp } from './actions'

export default function SignUpPage() {
  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold">Create your account</h1>

      <form action={signUp} className="mt-6 space-y-4">
        <input name="full_name" placeholder="Full name" required />
        <input name="username" placeholder="Username" required />
        <input name="email" type="email" placeholder="Email" required />
        <input name="password" type="password" placeholder="Password" required />
        {/* (Optional) carry the plan they picked so we can resume later */}
        <input type="hidden" name="next" value="/pricing" />
        <button type="submit">Sign up</button>
      </form>
    </div>
  )
}
