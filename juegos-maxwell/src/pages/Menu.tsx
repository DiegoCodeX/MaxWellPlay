import { Link } from "react-router-dom";

type Card = {
  id: number;
  title: string;
  desc: string;
  icon: string;
  formula: string;
  to: string;
  grad: string; // tailwind gradient
};

const cards: Card[] = [
  {
    id: 1,
    title: "Ley de Gauss – Campo Eléctrico",
    desc:
      "Frota globos para cargarlos y acércalos a papelitos. Observa la atracción por polarización.",
    icon: "🎈",
    formula: "∮E⋅dA = Q/ε₀",
    to: "/juegos/carga-electrica",
    grad: "from-orange-400 to-orange-600",
  },
  {
    id: 2,
    title: "Ley de Gauss – Campo Magnético",
    desc:
      "Explora cómo las líneas de campo magnético siempre se cierran: no hay monopolos.",
    icon: "🧲",
    formula: "∮B⋅dA = 0",
    to: "/juegos/gauss-magnetico",
    grad: "from-yellow-300 to-pink-400",
  },
  {
    id: 3,
    title: "Ley de Faraday – Inducción",
    desc:
      "Movimiento → cambio de flujo → fem inducida. Genera electricidad con una dinamo.",
    icon: "⚙️",
    formula: "ε = − dΦ/dt",
    to: "/juegos/faraday",
    grad: "from-teal-400 to-emerald-400",
  },
  {
    id: 4,
    title: "Ley de Ampère–Maxwell",
    desc:
      "Corriente y campo desplazamiento generan B. Visualiza la relación I ↔ B.",
    icon: "🌀",
    formula: "∮B⋅dl = μ₀(I + ε₀ dΦE/dt)",
    to: "/juegos/ampere-maxwell",
    grad: "from-sky-400 to-cyan-400",
  },
  {
    id: 5,
    title: "Red WiFi en Acción (Ondas EM)",
    desc:
      "Ensambla un router y observa la propagación de ondas EM al encender el WiFi.",
    icon: "📡",
    formula: "λ = c / f",
    to: "/juegos/red-wifi",
    grad: "from-violet-400 to-fuchsia-500",
  },
];

export default function Menu() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-indigo-400 to-purple-700 text-white">
      {/* partículas de fondo muy livianas */}
      <div className="pointer-events-none absolute inset-0 opacity-30">
        {Array.from({ length: 50 }).map((_, i) => (
          <span
            key={i}
            className="absolute w-1 h-1 bg-white/70 rounded-full animate-[float_6s_ease-in-out_infinite]"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 6}s`,
              animationDuration: `${4 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      <header className="text-center py-10 px-4 relative">
        <h1 className="text-3xl md:text-5xl font-extrabold drop-shadow">
          Ecuaciones de Maxwell y Ondas Electromagnéticas
        </h1>
        <p className="opacity-90 mt-3">
          Explora las fuerzas fundamentales del universo con juegos interactivos
        </p>
      </header>

      <main className="relative max-w-6xl mx-auto px-4 pb-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <article
              key={c.id}
              className={`group relative rounded-2xl h-64 shadow-xl overflow-hidden transition
                          hover:-translate-y-1 hover:shadow-2xl bg-gradient-to-br ${c.grad}`}
            >
              {/* número */}
              <div className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/25 backdrop-blur flex items-center justify-center font-extrabold">
                {c.id}
              </div>

              {/* icono central */}
              <div className="absolute inset-0 grid place-items-center text-6xl opacity-30 group-hover:opacity-10 transition">
                {c.icon}
              </div>

              {/* fórmula arriba derecha */}
              <div className="absolute top-3 right-4 text-sm opacity-70 font-mono">
                {c.formula}
              </div>

              {/* info al hover */}
              <div className="absolute inset-0 p-6 flex flex-col justify-center text-center opacity-0 translate-y-4
                              group-hover:opacity-100 group-hover:translate-y-0 transition">
                <h3 className="text-lg font-extrabold drop-shadow">{c.title}</h3>
                <p className="mt-2 text-white/95">{c.desc}</p>

                <div className="mt-4">
                  <Link
                    to={c.to}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/25 backdrop-blur
                               hover:bg-white/35 font-bold"
                    aria-label={`Jugar ${c.title}`}
                  >
                    ▶ Play
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>

      {/* keyframes locales */}
      <style>{`
        @keyframes float {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
