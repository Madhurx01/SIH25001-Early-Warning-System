import { useEffect, useState } from "react";

import ConnectionStatus from "../components/ConnectionStatus.jsx";
import { getHealth } from "../services/api.js";

function HomePage() {
  const [connection, setConnection] = useState({ status: "checking" });

  useEffect(() => {
    const controller = new AbortController();

    async function checkBackend() {
      try {
        const health = await getHealth(controller.signal);
        setConnection({ status: "connected", service: health.service });
      } catch (error) {
        if (error.name !== "AbortError") {
          setConnection({ status: "unavailable" });
        }
      }
    }

    checkBackend();

    return () => controller.abort();
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-16">
      <section className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
        <p className="mb-5 text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">
          SIH25001
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
          Smart Community Health Monitoring
        </h1>
        <p className="mt-5 text-lg leading-8 text-slate-600">
          Water-Borne Disease Early Warning System
        </p>
        <ConnectionStatus {...connection} />
      </section>
    </main>
  );
}

export default HomePage;
