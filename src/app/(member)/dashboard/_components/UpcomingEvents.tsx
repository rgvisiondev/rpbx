// app/dashboard/_components/UpcomingEventsList.tsx
type EventItem = { _id?: string; title: string; date: string; url?: string };

export default function UpcomingEventsList({ events }: { events: EventItem[] }) {
  if (!events?.length) {
    return (
      <ul className="list-disc list-inside space-y-2">
        <li>No upcoming events.</li>
      </ul>
    );
  }

  return (
    <ul className="list-disc list-inside space-y-2">
      {events.map((e) => (
        <li key={e._id ?? `${e.title}-${e.date}`}>
          <a className="underline" href={e.url} target="_blank" rel="noreferrer">
            {e.title}
          </a>{" "}
          – {new Date(e.date).toLocaleDateString()}
        </li>
      ))}
    </ul>
  );
}
