"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Compass, CreditCard, FileBarChart, LogOut, Plane, Hotel, FileText } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("sv_user");
      if (!raw) {
        router.replace("/login");
        return;
      }
      const u = JSON.parse(raw);
      setUserName(u?.name || "");
    } catch (e) {
      router.replace("/login");
    }
  }, [router]);

  const logout = () => {
    try {
      localStorage.removeItem("sv_user");
    } catch (e) {}
    router.replace("/login");
  };

  const nav = [
    { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
    { href: "/dashboard/questionnaire", label: "Cuestionario", icon: Compass },
    { href: "/dashboard/historial", label: "Historial", icon: FileText },
    { href: "/dashboard/destino", label: "Destino", icon: Compass },
    { href: "/dashboard/pago", label: "Pagar viaje", icon: Plane },
    { href: "/dashboard/reserva", label: "Reserva hotel", icon: Hotel },
    { href: "/dashboard/pagos", label: "Pagos", icon: CreditCard },
    { href: "/dashboard/reportes", label: "Reportes", icon: FileBarChart },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="px-4 py-4 border-b border-slate-200">
          <Link href="/" className="block">
            <span className="text-lg font-semibold text-slate-900">Sistema de Viajes</span>
            <span className="block text-xs text-slate-500">Dashboard</span>
          </Link>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${active ? "bg-slate-100 text-slate-900" : "text-slate-700 hover:bg-slate-50"} flex items-center gap-2 px-3 py-2 rounded-lg transition`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="px-3 py-4 border-t border-slate-200">
          <div className="text-sm text-slate-600 mb-2">Sesión: <span className="font-semibold text-slate-900">{userName || "usuario"}</span></div>
          <button onClick={logout} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-semibold transition">
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>
      <div className="ml-64">
        <header className="fixed top-0 left-64 right-0 bg-white border-b border-slate-200 px-6 h-14 flex items-center z-10">
          <div className="flex items-center justify-between w-full">
            <div className="text-slate-700">
              Bienvenido{userName ? `, ${userName}` : ""}
            </div>
            <div className="text-sm text-slate-500">Gestiona recomendaciones, pagos y reportes</div>
          </div>
        </header>
        <main className="pt-14 px-8 py-10 max-w-7xl mx-auto w-full">{children}</main>
      </div>
    </div>
  );
}