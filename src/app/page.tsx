import React from 'react';
import Link from "next/link";
import { Globe, MapPin, Star, TrendingUp, Users, Camera, SlidersHorizontal, ArrowRight, CheckCircle2, Shield, Zap, Award } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header profesional y limpio */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-50 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-900">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-semibold text-slate-900">TravelSmart</span>
          </div>
          <nav className="hidden gap-8 md:flex items-center">
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Características
            </a>
            <a href="#process" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Proceso
            </a>
            <a href="#testimonials" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Casos de éxito
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="rounded-lg border-2 border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50 hover:border-slate-300 transition-colors">
              Iniciar sesión
            </Link>
            <Link href="/login" className="rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors">
              Comenzar
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-8">
        {/* Hero minimalista y profesional */}
        <section className="pt-20 pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-sm font-medium text-slate-700 mb-6">
                <Award className="w-4 h-4 text-slate-600" />
                Sistema de recomendación inteligente
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold text-slate-900 leading-tight mb-6">
                Decisiones de viaje
                <span className="block text-slate-600">basadas en datos</span>
              </h1>
              <p className="text-xl text-slate-600 leading-relaxed mb-8 max-w-xl">
                Algoritmos avanzados que analizan sus preferencias y combinan información en tiempo real para optimizar cada aspecto de su viaje.
              </p>
              
              {/* Trust indicators profesionales */}
              <div className="flex flex-wrap gap-6 mb-10 text-slate-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-medium">Sin registro requerido</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-medium">Resultados en 2 minutos</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-medium">100% gratuito</span>
                </div>
              </div>

              <div className="flex gap-4">
                <Link href="/login" className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-8 py-4 text-base font-semibold text-white hover:bg-slate-800 transition-colors shadow-sm">
                  Iniciar análisis
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link href="/docs" className="inline-flex items-center gap-2 rounded-lg border-2 border-slate-200 bg-white px-8 py-4 text-base font-semibold text-slate-900 hover:border-slate-300 hover:bg-slate-50 transition-colors">
                  Aprender más
                </Link>
              </div>
            </div>

            {/* Visual data representation */}
            <div className="relative">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">200+ Destinos</div>
                        <div className="text-xs text-slate-500">Analizados y verificados</div>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">98%</div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center">
                        <Users className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">10,000+ Usuarios</div>
                        <div className="text-xs text-slate-500">Recomendaciones generadas</div>
                      </div>
                    </div>
                    <TrendingUp className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center">
                        <Star className="w-6 h-6 text-amber-600" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">5,000+ Hoteles</div>
                        <div className="text-xs text-slate-500">Base de datos actualizada</div>
                      </div>
                    </div>
                    <Shield className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-slate-900 rounded-2xl -z-10"></div>
            </div>
          </div>
        </section>

        {/* Stats bar elegante */}
        <section className="py-16 border-y border-slate-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              {value:"200+", label:"Destinos globales"},
              {value:"5,000+", label:"Opciones hoteleras"},
              {value:"98%", label:"Tasa de satisfacción"},
              {value:"3", label:"Fuentes de datos"}
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl font-bold text-slate-900 mb-2">{stat.value}</div>
                <div className="text-sm font-medium text-slate-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Features con diseño corporativo */}
        <section id="features" className="py-24">
          <div className="text-center mb-16">
            <div className="inline-block text-sm font-semibold text-slate-600 mb-3 tracking-wide uppercase">
              Características principales
            </div>
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Sistema integral de recomendaciones
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Tecnología avanzada que procesa múltiples variables para entregar resultados precisos y personalizados
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: TrendingUp,
                title: "Análisis predictivo",
                description: "Algoritmos que procesan preferencias individuales y datos históricos para generar recomendaciones con alta precisión.",
                metrics: "98% de precisión"
              },
              {
                icon: Camera,
                title: "Contenido visual verificado",
                description: "Galerías curadas con imágenes de alta calidad desde fuentes profesionales verificadas y actualizadas.",
                metrics: "3 fuentes API"
              },
              {
                icon: SlidersHorizontal,
                title: "Filtrado inteligente",
                description: "Sistema de filtros multidimensional que permite refinar resultados por precio, calificación y categoría.",
                metrics: "Tiempo real"
              }
            ].map((feature) => (
              <div key={feature.title} className="group border border-slate-200 rounded-xl p-8 hover:border-slate-300 hover:shadow-lg transition-all duration-300 bg-white">
                <div className="flex items-center justify-center w-14 h-14 rounded-lg bg-slate-900 mb-6 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-slate-600 leading-relaxed mb-4">
                  {feature.description}
                </p>
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Zap className="w-4 h-4" />
                  {feature.metrics}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Process timeline profesional */}
        <section id="process" className="py-24 bg-slate-50 -mx-8 px-8 rounded-3xl">
          <div className="text-center mb-16">
            <div className="inline-block text-sm font-semibold text-slate-600 mb-3 tracking-wide uppercase">
              Metodología
            </div>
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Proceso de tres etapas
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Sistema optimizado para entregar recomendaciones precisas de manera eficiente
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-0 right-0 h-0.5 bg-slate-200"></div>
            
            {[
              {
                step: "01",
                title: "Recopilación de datos",
                description: "Cuestionario estructurado que captura preferencias de viaje, presupuesto, clima deseado y actividades de interés.",
                duration: "2 minutos"
              },
              {
                step: "02",
                title: "Procesamiento inteligente",
                description: "Análisis mediante algoritmos que consultan múltiples APIs y bases de datos para generar el perfil óptimo.",
                duration: "Instantáneo"
              },
              {
                step: "03",
                title: "Resultados accionables",
                description: "Recomendaciones priorizadas con enlaces directos, filtros avanzados y opciones de comparación detallada.",
                duration: "Interactivo"
              }
            ].map((item) => (
              <div key={item.step} className="relative bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
                <div className="absolute -top-6 left-8 w-12 h-12 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {item.step}
                </div>
                <div className="mt-4">
                  <h3 className="text-xl font-semibold text-slate-900 mb-3">
                    {item.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed mb-4">
                    {item.description}
                  </p>
                  <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-500">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    {item.duration}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials corporativos */}
        <section id="testimonials" className="py-24">
          <div className="text-center mb-16">
            <div className="inline-block text-sm font-semibold text-slate-600 mb-3 tracking-wide uppercase">
              Casos de éxito
            </div>
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Resultados verificados
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote: "La precisión de las recomendaciones superó nuestras expectativas. Encontramos opciones que no habíamos considerado y optimizamos nuestro presupuesto.",
                author: "Ana María Torres",
                role: "Directora de Operaciones",
                company: "TechCorp",
                rating: 5
              },
              {
                quote: "Sistema robusto con interfaz intuitiva. Los filtros y la calidad de las imágenes facilitaron significativamente el proceso de decisión.",
                author: "Luis Rodríguez",
                role: "Gerente de Proyectos",
                company: "Innovation Labs",
                rating: 5
              },
              {
                quote: "Implementación eficiente que reduce el tiempo de planificación. Las recomendaciones son consistentes y bien fundamentadas.",
                author: "Carla Pérez",
                role: "Consultora de Viajes",
                company: "Global Travel",
                rating: 5
              }
            ].map((testimonial) => (
              <div key={testimonial.author} className="border border-slate-200 rounded-xl p-8 bg-white hover:border-slate-300 hover:shadow-md transition-all duration-300">
                <div className="flex gap-1 mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-700 leading-relaxed mb-8">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center gap-4 pt-6 border-t border-slate-200">
                  <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-white font-semibold">
                    {testimonial.author.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{testimonial.author}</div>
                    <div className="text-sm text-slate-600">{testimonial.role}</div>
                    <div className="text-xs text-slate-500">{testimonial.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA profesional */}
        <section className="py-20 mb-24">
          <div className="rounded-2xl bg-slate-900 p-12 lg:p-16 text-center">
            <div className="max-w-3xl mx-auto">
              <h3 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                Comience su análisis de viaje
              </h3>
              <p className="text-lg text-slate-300 mb-8">
                Complete el cuestionario estructurado y reciba recomendaciones personalizadas basadas en algoritmos avanzados
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/questionnaire" className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-8 py-4 text-base font-semibold text-slate-900 hover:bg-slate-100 transition-colors">
                  Iniciar cuestionario
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link href="/docs" className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-white/20 px-8 py-4 text-base font-semibold text-white hover:bg-white/10 transition-colors">
                  Documentación técnica
                </Link>
              </div>
              <p className="text-sm text-slate-400 mt-6">
                Sin registro requerido • Resultados en 2 minutos • Completamente gratuito
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer corporativo */}
      <footer className="border-t border-slate-200 py-12">
        <div className="mx-auto max-w-7xl px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-900">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <span className="text-lg font-semibold text-slate-900">TravelSmart</span>
            </div>
            <div className="text-sm text-slate-600">
              © 2025 TravelSmart. Sistema de recomendación de viajes basado en datos.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}