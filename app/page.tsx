import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold">Event Follow-up System</h1>
        <p className="text-gray-600">Meeting request follow-up messaging for non-responders</p>
        <div className="pt-4">
          <Link 
            href="/events/evt_123"
            className="inline-block border rounded px-6 py-3 bg-black text-white hover:bg-gray-800"
          >
            View Demo Event
          </Link>
        </div>
      </div>
    </main>
  );
}

