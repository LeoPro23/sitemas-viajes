"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, CheckCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("sv_user");
      if (raw) {
        router.replace("/dashboard");
      }
    } catch (e) {}
  }, [router]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Por favor ingresa correo y contraseña.");
      return;
    }

    // Autenticación básica local (demo): guarda sesión en localStorage
    const user = {
      email,
      name: email.split("@")[0],
      loggedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem("sv_user", JSON.stringify(user));
      router.push("/dashboard");
    } catch (e) {
      setError("No fue posible guardar la sesión.");
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white shadow-sm rounded-xl p-8 border border-slate-200">
        <div className="flex items-center gap-3 mb-6">
          <CheckCircle className="w-6 h-6 text-emerald-600" />
          <h1 className="text-xl font-semibold text-slate-900">Iniciar sesión</h1>
        </div>

        <p className="text-slate-600 mb-6">
          Accede para gestionar recomendaciones, pagos y reportes.
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Correo</span>
            <div className="mt-1 flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2">
              <Mail className="w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tucorreo@ejemplo.com"
                className="w-full outline-none text-slate-900 placeholder-slate-400"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Contraseña</span>
            <div className="mt-1 flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2">
              <Lock className="w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                className="w-full outline-none text-slate-900 placeholder-slate-400"
              />
            </div>
          </label>

          <button
            type="submit"
            className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 transition"
          >
            Entrar
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/" className="text-slate-600 hover:text-slate-900 font-medium">
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}