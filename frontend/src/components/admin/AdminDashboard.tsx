"use client";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";

interface SupportThread {
  id: string;
  content: string;
  createdAt: string;
  messages?: { content: string; createdAt: string }[];
}

const AdminDashboard = () => {
  const [threads, setThreads] = useState<SupportThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchThreads = async () => {
      try {
        const res = await apiFetch("/support/threads");
        if (!res.ok) throw new Error("Failed to fetch support threads");
        const data = await res.json();
        setThreads(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchThreads();
  }, []);

  const navButtonStyle = `font-sans text-xl text-[#F0E7A1] m-2 rounded-sm btn-soft md:subpixel-antialiased hover:bg-[#F0E7A1] hover:text-[#1A1A1A] transition delay-150 duration-100 ease-in-out hover:-translate-y-1`;

  const formatDate = (dateString: string) => new Date(dateString).toLocaleString();

  return (
    <div className="flex flex-col min-h-screen bg-black text-[#F0E7A1]">
      <div className="navbar bg-black shadow-sm text-xl">
        <div className="m-2 flex-1">
          <Button variant="ghost" className={navButtonStyle}>
            <Link to="/Portfolio">W4LLET</Link>
          </Button>
        </div>
        <Button variant="ghost" className="text-white">
          <Link to="/CustomerSupport">Customer Support</Link>
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-64 bg-white shadow-sm p-4">
          <h2 className="text-xl font-semibold mb-4 text-neutral-800">Admin</h2>
          <nav>
            <ul className="space-y-2">
              <li>
                <Button variant="ghost" className="w-full justify-start text-neutral-800 hover:bg-neutral-100">
                  Support Threads
                </Button>
              </li>
            </ul>
          </nav>
        </aside>

        <main className="flex-1 p-6 overflow-y-auto bg-white">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-semibold mb-6 text-neutral-800">
              Support Threads {loading ? "(Loading...)" : `(${threads.length})`}
            </h2>

            {error && <p className="text-red-600 font-medium mb-4">Error: {error}</p>}

            <div className="space-y-4">
              {threads.map((thread) => (
                <div
                  key={thread.id}
                  className="p-6 bg-neutral-50 rounded-lg border border-neutral-200 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm text-neutral-500">Submitted: {formatDate(thread.createdAt)}</p>
                  </div>
                  <p className="text-neutral-800 whitespace-pre-line bg-neutral-100 p-3 rounded">
                    {thread.content || "No content"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
