"use client";
import { useEffect, useRef, useState } from "react";
import { FileBarChart, FileDown } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import Chart from "chart.js/auto";
import { Bar, Doughnut } from "react-chartjs-2";

type PaymentItem = {
  type: "trip" | "hotel";
  amountUSD?: number;
  date?: number;
  destination?: string | null;
  hotel?: string | null;
  nights?: number | null;
  ref?: string | null;
};

export default function ReportsSection() {
  const [items, setItems] = useState<PaymentItem[]>([]);
  const [exporting, setExporting] = useState(false);
  const [exportingDoc, setExportingDoc] = useState(false);
  const reportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    (async () => {
      let list: PaymentItem[] = [];
      try {
        localStorage.removeItem("sv_payments");
        localStorage.removeItem("sv_trip_paid");
        localStorage.removeItem("sv_confirmation");
      } catch {}
      try {
        const rawUser = localStorage.getItem("sv_user");
        const user = rawUser ? JSON.parse(rawUser) : null;
        const url = user?.email ? `/api/payments?email=${encodeURIComponent(user.email)}` : `/api/payments`;
        const res = await fetch(url, { cache: "no-store" });
        if (res.ok) {
          const j = await res.json();
          const safeDecode = (s: any) => { try { return decodeURIComponent(String(s)); } catch { return String(s); } };
          list = (j?.items || []).map((r: any) => ({
            type: String(r.type).toLowerCase() === "trip" ? "trip" : "hotel",
            amountUSD: typeof r.amount_usd === "number" ? r.amount_usd : Number(r.amount_usd),
            date: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
            destination: r.destination ? safeDecode(r.destination) : null,
            hotel: r.hotel ? safeDecode(r.hotel) : null,
            nights: typeof r.nights === "number" ? r.nights : r.nights ? Number(r.nights) : null,
            ref: r.ref ?? null,
          }));
        }
      } catch {}
      setItems(list);
    })();
  }, []);

  const totalTrip = items.filter((i) => i.type === "trip").reduce((s, i) => s + (i.amountUSD || 0), 0);
  const totalHotel = items.filter((i) => i.type === "hotel").reduce((s, i) => s + (i.amountUSD || 0), 0);
  const countTrip = items.filter((i) => i.type === "trip").length;
  const countHotel = items.filter((i) => i.type === "hotel").length;

  const currency = (n?: number) =>
    typeof n === "number" ? n.toLocaleString("en-US", { style: "currency", currency: "USD" }) : "-";

  // Datos agregados para gráficos en UI
  const typeLabels = ["Viaje", "Hotel"];
  const typeValues = [totalTrip, totalHotel];
  const typeColors = ["#0ea5e9", "#22c55e"]; // azul y verde

  const monthMap = new Map<string, number>();
  for (const it of items) {
    const d = new Date(it.date || Date.now());
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthMap.set(key, (monthMap.get(key) || 0) + (it.amountUSD || 0));
  }
  const monthLabels = Array.from(monthMap.keys()).sort((a, b) => (a < b ? -1 : 1));
  const monthValues = monthLabels.map((k) => monthMap.get(k) || 0);

  const destMap = new Map<string, number>();
  for (const it of items) {
    const dest = (it.destination || "-").trim();
    destMap.set(dest, (destMap.get(dest) || 0) + (it.amountUSD || 0));
  }
  const destSorted = Array.from(destMap.entries()).sort((a, b) => b[1] - a[1]);
  const topDest = destSorted.slice(0, 5);
  const destLabels = topDest.map(([d]) => d);
  const destValues = topDest.map(([, v]) => v);

  const handleExportPDF = async () => {
    if (!reportRef.current || exporting) return;
    setExporting(true);
    let canvas: HTMLCanvasElement | null = null;
    try {
      canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        onclone: (doc) => {
          try {
            const styleEl = doc.createElement("style");
            styleEl.textContent = `
              [data-export-root="true"], [data-export-root="true"] * {
                color: #0f172a !important;
                border-color: #e5e7eb !important;
                background: transparent !important;
              }
              [data-export-root="true"] .bg-white { background-color: #ffffff !important; }
              [data-export-root="true"] .text-slate-900 { color: #0f172a !important; }
              [data-export-root="true"] .text-slate-700 { color: #334155 !important; }
              [data-export-root="true"] .text-slate-600 { color: #475569 !important; }
              [data-export-root="true"] .text-slate-500 { color: #64748b !important; }
              [data-export-root="true"] .border-slate-200 { border-color: #e5e7eb !important; }
            `;
            doc.head.appendChild(styleEl);
          } catch {}
        },
        ignoreElements: (el) => (el as HTMLElement)?.dataset?.exportIgnore === "true",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      // Convert px to mm using 96 DPI -> 25.4 mm per inch
      const pxToMm = (px: number) => (px * 25.4) / 96;
      const imgWidthMm = pxToMm(canvas.width);
      const imgHeightMm = pxToMm(canvas.height);
      const ratio = Math.min(pageWidth / imgWidthMm, pageHeight / imgHeightMm);
      const finalWidth = imgWidthMm * ratio;
      const finalHeight = imgHeightMm * ratio;
      const x = (pageWidth - finalWidth) / 2;
      const y = (pageHeight - finalHeight) / 2;
      pdf.addImage(imgData, "PNG", x, y, finalWidth, finalHeight, undefined, "FAST");
      pdf.save("reporte.pdf");
    } catch (err) {
      console.error("Error al exportar PDF", err);
      if (canvas) {
        try {
          canvas.toBlob((blob) => {
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "reporte.png";
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
          }, "image/png");
        } catch {}
      }
    } finally {
      setExporting(false);
    }
  };

  const handleExportDocPDF = async () => {
    if (exportingDoc) return;
    setExportingDoc(true);
    try {
      // 1) Leer usuario para filtrar por email
      let email: string | undefined = undefined;
      try {
        const raw = localStorage.getItem("sv_user");
        const u = raw ? JSON.parse(raw) : null;
        email = u?.email;
      } catch {}

      // 2) Consultar datos desde la base (API) con más campos
      type DetailedItem = {
        type: "trip" | "hotel";
        amountUSD?: number;
        date?: number;
        destination?: string | null;
        hotel?: string | null;
        nights?: number | null;
        ref?: string | null;
      };
      let list: DetailedItem[] = [];
      try {
        const url = email ? `/api/payments?email=${encodeURIComponent(email)}` : `/api/payments`;
        const res = await fetch(url, { cache: "no-store" });
        if (res.ok) {
          const j = await res.json();
          list = (j?.items || []).map((r: any) => ({
            type: String(r.type).toLowerCase() === "trip" ? "trip" : "hotel",
            amountUSD: typeof r.amount_usd === "number" ? r.amount_usd : Number(r.amount_usd),
            date: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
            destination: r.destination ?? null,
            hotel: r.hotel ?? null,
            nights: typeof r.nights === "number" ? r.nights : r.nights ? Number(r.nights) : null,
            ref: r.ref ?? null,
          }));
        }
      } catch {}
      // En caso de fallo, usa el estado actual como respaldo
      if (!list.length && items.length) {
        list = items.map((i) => ({ type: i.type, amountUSD: i.amountUSD, date: i.date, destination: null, hotel: null, nights: null, ref: null }));
      }

      // 3) Calcular totales y preparar PDF detallado
      const currencyPdf = (n?: number) => (typeof n === "number" ? n.toLocaleString("en-US", { style: "currency", currency: "USD" }) : "-");
      const fmtDate = (ms?: number) => {
        if (!ms) return "";
        const d = new Date(ms);
        return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
      };

      const totalTripDoc = list.filter((i) => i.type === "trip").reduce((s, i) => s + (i.amountUSD || 0), 0);
      const totalHotelDoc = list.filter((i) => i.type === "hotel").reduce((s, i) => s + (i.amountUSD || 0), 0);
      const countTripDoc = list.filter((i) => i.type === "trip").length;
      const countHotelDoc = list.filter((i) => i.type === "hotel").length;

      // Resumen por destino
      const byDestination = new Map<string, { totalTrip: number; totalHotel: number; count: number }>();
      for (const it of list) {
        const dest = (it.destination || "-").trim();
        const entry = byDestination.get(dest) || { totalTrip: 0, totalHotel: 0, count: 0 };
        if (it.type === "trip") entry.totalTrip += it.amountUSD || 0;
        if (it.type === "hotel") entry.totalHotel += it.amountUSD || 0;
        entry.count += 1;
        byDestination.set(dest, entry);
      }
      const destRows = Array.from(byDestination.entries()).map(([dest, v]) => [
        dest,
        currencyPdf(v.totalTrip),
        currencyPdf(v.totalHotel),
        currencyPdf(v.totalTrip + v.totalHotel),
        String(v.count),
      ]);

      // Resumen por hotel
      const byHotel = new Map<string, { destination: string; hotel: string; total: number; count: number; nights: number }>();
      for (const it of list) {
        if (it.type !== "hotel") continue;
        const dest = (it.destination || "-").trim();
        const hot = (it.hotel || "-").trim();
        const key = `${dest}|||${hot}`;
        const entry = byHotel.get(key) || { destination: dest, hotel: hot, total: 0, count: 0, nights: 0 };
        entry.total += it.amountUSD || 0;
        entry.count += 1;
        entry.nights += typeof it.nights === "number" ? it.nights : 0;
        byHotel.set(key, entry);
      }
      const hotelRows = Array.from(byHotel.values()).map((v) => [v.destination, v.hotel, currencyPdf(v.total), String(v.count), String(v.nights)]);

      // Resumen mensual
      const byMonth = new Map<string, { totalTrip: number; totalHotel: number }>();
      for (const it of list) {
        const d = new Date(it.date || Date.now());
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const entry = byMonth.get(key) || { totalTrip: 0, totalHotel: 0 };
        if (it.type === "trip") entry.totalTrip += it.amountUSD || 0;
        if (it.type === "hotel") entry.totalHotel += it.amountUSD || 0;
        byMonth.set(key, entry);
      }
      const monthRows = Array.from(byMonth.entries()).sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([m, v]) => [m, currencyPdf(v.totalTrip), currencyPdf(v.totalHotel), currencyPdf(v.totalTrip + v.totalHotel)]);

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      pdf.setFontSize(16);
      pdf.text("Reporte detallado de gastos", 14, 15);
      const now = new Date();
      pdf.setFontSize(10);
      pdf.text(
        `Generado: ${now.toLocaleString()}${email ? ` | Usuario: ${email}` : ""}`,
        14,
        22
      );

      autoTable(pdf, {
        head: [["Tipo", "Total (USD)", "Transacciones"]],
        body: [
          ["Viaje", currencyPdf(totalTripDoc), String(countTripDoc)],
          ["Hotel", currencyPdf(totalHotelDoc), String(countHotelDoc)],
        ],
        startY: 28,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [15, 23, 42], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 247, 250] },
      });

      // Resumen por destino
      const startDestY = (pdf as any).lastAutoTable?.finalY ? (pdf as any).lastAutoTable.finalY + 8 : 36;
      autoTable(pdf, {
        head: [["Destino", "Viaje (USD)", "Hotel (USD)", "Total (USD)", "Transacciones"]],
        body: destRows,
        startY: startDestY,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [51, 65, 85], textColor: 255 },
        columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" } },
      });

      // Resumen por hotel
      const startHotelY = (pdf as any).lastAutoTable?.finalY ? (pdf as any).lastAutoTable.finalY + 8 : startDestY + 8;
      autoTable(pdf, {
        head: [["Destino", "Hotel", "Total (USD)", "Transacciones", "Noches"]],
        body: hotelRows,
        startY: startHotelY,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [51, 65, 85], textColor: 255 },
        columnStyles: { 2: { halign: "right" }, 4: { halign: "right" } },
      });

      // Resumen mensual
      const startMonthY = (pdf as any).lastAutoTable?.finalY ? (pdf as any).lastAutoTable.finalY + 8 : startHotelY + 8;
      autoTable(pdf, {
        head: [["Mes", "Viaje (USD)", "Hotel (USD)", "Total (USD)"]],
        body: monthRows,
        startY: startMonthY,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [71, 85, 105], textColor: 255 },
        columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" } },
      });

      // Detalle de transacciones
      const startDetailY = (pdf as any).lastAutoTable?.finalY ? (pdf as any).lastAutoTable.finalY + 8 : startMonthY + 8;
      const detailRows = list.map((i) => [
        i.ref || "-",
        i.type === "trip" ? "Viaje" : "Hotel",
        i.destination || "-",
        i.hotel || (i.type === "trip" ? "-" : (i.hotel || "-")),
        typeof i.nights === "number" ? String(i.nights) : "-",
        currencyPdf(i.amountUSD),
        fmtDate(i.date),
      ]);
      autoTable(pdf, {
        head: [["Ref", "Tipo", "Destino", "Hotel", "Noches", "Monto (USD)", "Fecha"]],
        body: detailRows,
        startY: startDetailY,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [15, 23, 42], textColor: 255 },
        columnStyles: { 5: { halign: "right" } },
      });

      // ===== Página de gráficos =====
      const chartToImage = async (config: any, width = 800, height = 400) => {
        return new Promise<string>((resolve) => {
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve("");
          const chart = new Chart(ctx, config);
          // Asegurar render
          setTimeout(() => {
            try {
              const url = canvas.toDataURL("image/png");
              chart.destroy();
              resolve(url);
            } catch {
              resolve("");
            }
          }, 50);
        });
      };

      // Preparar datos para gráficos
      const compLabels = ["Viaje", "Hotel"];
      const compValues = [
        list.filter((i) => i.type === "trip").reduce((s, i) => s + (i.amountUSD || 0), 0),
        list.filter((i) => i.type === "hotel").reduce((s, i) => s + (i.amountUSD || 0), 0),
      ];
      const compColors = ["#0ea5e9", "#22c55e"];

      const monthMap2 = new Map<string, number>();
      for (const it of list) {
        const d = new Date(it.date || Date.now());
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        monthMap2.set(key, (monthMap2.get(key) || 0) + (it.amountUSD || 0));
      }
      const mLabels = Array.from(monthMap2.keys()).sort((a, b) => (a < b ? -1 : 1));
      const mValues = mLabels.map((k) => monthMap2.get(k) || 0);

      const destMap2 = new Map<string, number>();
      for (const it of list) {
        const dest = (it.destination || "-").trim();
        destMap2.set(dest, (destMap2.get(dest) || 0) + (it.amountUSD || 0));
      }
      const destTop = Array.from(destMap2.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
      const dLabels = destTop.map(([d]) => d);
      const dValues = destTop.map(([, v]) => v);

      pdf.addPage();
      pdf.setFontSize(12);
      pdf.text("Gasto mensual", 14, 18);
      const monthImg = await chartToImage({
        type: "bar",
        data: { labels: mLabels, datasets: [{ label: "USD", data: mValues, backgroundColor: "#0ea5e9" }] },
        options: { responsive: false, plugins: { legend: { display: false } }, scales: { y: { ticks: { callback: (v: any) => v } } } },
      }, 900, 380);
      if (monthImg) pdf.addImage(monthImg, "PNG", 10, 22, 190, 80);

      pdf.text("Distribución por tipo", 14, 110);
      const compImg = await chartToImage({
        type: "doughnut",
        data: { labels: compLabels, datasets: [{ data: compValues, backgroundColor: compColors }] },
        options: { responsive: false, plugins: { legend: { position: "right" } } },
      }, 700, 350);
      if (compImg) pdf.addImage(compImg, "PNG", 10, 114, 190, 80);

      if (dLabels.length) {
        pdf.addPage();
        pdf.text("Top destinos", 14, 18);
        const destImg = await chartToImage({
          type: "bar",
          data: { labels: dLabels, datasets: [{ label: "USD", data: dValues, backgroundColor: "#22c55e" }] },
          options: { responsive: false, plugins: { legend: { display: false } }, indexAxis: "y" },
        }, 900, 380);
        if (destImg) pdf.addImage(destImg, "PNG", 10, 22, 190, 80);
      }

      const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
        now.getDate()
      ).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
      pdf.save(`reporte-detallado-${datePart}.pdf`);
    } catch (e) {
      console.error("Error al exportar documento PDF", e);
    } finally {
      setExportingDoc(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <FileBarChart className="w-6 h-6 text-slate-700" />
          <h1 className="text-2xl font-semibold text-slate-900">Reportes</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportDocPDF}
            disabled={exportingDoc}
            data-export-ignore="true"
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 text-white px-4 py-2 hover:bg-slate-800 disabled:opacity-50"
          >
            <FileDown className="w-4 h-4" />
            {exportingDoc ? "Generando..." : "Descargar PDF"}
          </button>
          <button
            type="button"
            onClick={handleExportPDF}
            disabled={exporting}
            data-export-ignore="true"
            className="inline-flex items-center gap-2 rounded-lg bg-slate-100 text-slate-900 px-4 py-2 hover:bg-slate-200 disabled:opacity-50"
          >
            Captura
          </button>
        </div>
      </div>

      <div ref={reportRef} data-export-root="true" className="space-y-6">
        <p className="text-slate-600">Resumen de métricas y totales.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="text-slate-500">Pagos de viaje</div>
            <div className="mt-2 text-2xl font-bold text-slate-900">{currency(totalTrip)}</div>
            <div className="text-sm text-slate-600">Transacciones: {countTrip}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="text-slate-500">Reservas de hotel</div>
            <div className="mt-2 text-2xl font-bold text-slate-900">{currency(totalHotel)}</div>
            <div className="text-sm text-slate-600">Transacciones: {countHotel}</div>
          </div>
        </div>

        {/* Gráficos de seguimiento */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="text-slate-900 font-semibold mb-3">Distribución por tipo</div>
            {typeValues.every((v) => v === 0) ? (
              <div className="text-slate-600">Sin datos.</div>
            ) : (
              <Doughnut
                data={{ labels: typeLabels, datasets: [{ data: typeValues, backgroundColor: typeColors }] }}
                options={{ plugins: { legend: { position: "bottom" } } }}
              />
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="text-slate-900 font-semibold mb-3">Gasto mensual</div>
            {monthLabels.length === 0 ? (
              <div className="text-slate-600">Sin datos.</div>
            ) : (
              <Bar
                data={{ labels: monthLabels, datasets: [{ label: "USD", data: monthValues, backgroundColor: "#0ea5e9" }] }}
                options={{ plugins: { legend: { display: false } } }}
              />
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="text-slate-900 font-semibold mb-3">Top destinos</div>
          {destLabels.length === 0 ? (
            <div className="text-slate-600">Sin datos.</div>
          ) : (
            <Bar
              data={{ labels: destLabels, datasets: [{ label: "USD", data: destValues, backgroundColor: "#22c55e" }] }}
              options={{ plugins: { legend: { display: false } }, indexAxis: "y" }}
            />
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="text-slate-900 font-semibold mb-3">Últimas transacciones</div>
          {items.length === 0 ? (
            <div className="text-slate-600">Sin datos aún.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="text-left text-slate-700">
                    <th className="px-3 py-2">Ref</th>
                    <th className="px-3 py-2">Tipo</th>
                    <th className="px-3 py-2">Destino</th>
                    <th className="px-3 py-2">Hotel</th>
                    <th className="px-3 py-2">Noches</th>
                    <th className="px-3 py-2">Monto (USD)</th>
                    <th className="px-3 py-2">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {items.slice(-10).reverse().map((i, idx) => (
                    <tr key={idx} className="border-t border-slate-200">
                      <td className="px-3 py-2 text-slate-700">{i.ref || "-"}</td>
                      <td className="px-3 py-2 text-slate-700">{i.type === "trip" ? "Viaje" : "Hotel"}</td>
                      <td className="px-3 py-2 text-slate-700">{i.destination || "-"}</td>
                      <td className="px-3 py-2 text-slate-700">{i.hotel || (i.type === "trip" ? "-" : i.hotel || "-")}</td>
                      <td className="px-3 py-2 text-slate-700">{typeof i.nights === "number" ? i.nights : "-"}</td>
                      <td className="px-3 py-2 text-slate-900 font-medium">{currency(i.amountUSD)}</td>
                      <td className="px-3 py-2 text-slate-500 text-sm">{i.date ? new Date(i.date).toLocaleString() : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}