// app/dashboard/_components/WelcomeHeader.tsx
type Props = { name: string; userType: "business" | "investor" | "admin" };
export default function WelcomeHeader({ name, userType }: Props) {
  return (
    <div className="py-6">
      <h1 className="text-2xl font-semibold">Welcome, {name}!</h1>
      <p className="text-neutral-600">You are signed in as {userType}.</p>
    </div>
  );
}
