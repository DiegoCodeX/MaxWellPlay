import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

/** Utilidades */
type XY = { x: number; y: number };

type Balloon = {
  id: number;
  color: string;
  pos: XY; // posición relativa dentro del área central
  charged: boolean;
};

export default function GameCargaElectrica() {
  /** Refs a zonas físicas */
  const gameRef = useRef<HTMLDivElement | null>(null);
  const hairRef = useRef<HTMLDivElement | null>(null);
  const tableRef = useRef<HTMLDivElement | null>(null);
  const balloonsAreaRef = useRef<HTMLDivElement | null>(null);
  const electricFieldRef = useRef<HTMLDivElement | null>(null);

  /** Estado principal */
  const [balloons, setBalloons] = useState<Balloon[]>([
    { id: 1, color: "#e63946", pos: { x: 40, y: 40 }, charged: false },
    { id: 2, color: "#f77f00", pos: { x: 140, y: 40 }, charged: false },
    { id: 3, color: "#fcbf49", pos: { x: 240, y: 40 }, charged: false },
    { id: 4, color: "#06d6a0", pos: { x: 90, y: 160 }, charged: false },
  ]);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [offset, setOffset] = useState<XY>({ x: 0, y: 0 });
  const [feedback, setFeedback] = useState<null | { title: string; body: string }>(null);
  const [papersAttracted, setPapersAttractedState] = useState(false);

  const chargedCount = balloons.filter((b) => b.charged).length;

  /** Drag start */
  function handlePointerDown(e: React.PointerEvent, id: number) {
    const target = e.currentTarget as HTMLDivElement;
    const targetRect = target.getBoundingClientRect();
    // offset del puntero dentro del globo
    setOffset({ x: e.clientX - targetRect.left, y: e.clientY - targetRect.top });
    setDraggingId(id);
    target.setPointerCapture(e.pointerId);
  }

  /** Drag move */
  function handlePointerMove(e: React.PointerEvent, id: number) {
    if (draggingId !== id) return;
    const area = balloonsAreaRef.current;
    if (!area) return;

    const ar = area.getBoundingClientRect();
    // Sin clamp: permitimos que el globo salga visualmente del área
    const nx = e.clientX - ar.left - offset.x;
    const ny = e.clientY - ar.top - offset.y;

    setBalloons((prev) =>
      prev.map((b) => (b.id === id ? { ...b, pos: { x: nx, y: ny } } : b)),
    );

    // Chequeo de carga (intersección con cabello)
    maybeCharge(id, e.clientX, e.clientY);

    // Atracción de papelitos (distancia a mesa)
    updatePaperAttraction(id, e.clientX, e.clientY);
  }

  /** Drag end */
  function handlePointerUp(e: React.PointerEvent, id: number) {
    if (draggingId === id) setDraggingId(null);
    updatePaperAttraction(id, e.clientX, e.clientY);
  }

  /** Cargar globo si entra en el área del cabello */
  function maybeCharge(id: number, clientX: number, clientY: number) {
    const hair = hairRef.current;
    if (!hair) return;
    const hr = hair.getBoundingClientRect();
    const inside =
      clientX >= hr.left && clientX <= hr.right && clientY >= hr.top && clientY <= hr.bottom;

    if (inside) {
      setBalloons((prev) =>
        prev.map((b) => (b.id === id && !b.charged ? { ...b, charged: true } : b)),
      );
      // pequeña animación de “frotar” usando una clase temporal
      hair.classList.add("animate-[wiggle_0.5s_ease-in-out]");
      setTimeout(() => hair.classList.remove("animate-[wiggle_0.5s_ease-in-out]"), 520);
      // chispitas
      createSparks(clientX, clientY, 8);
    }
  }

  /** Mostrar/ocultar atracción de papelitos + líneas de campo */
  function updatePaperAttraction(id: number, clientX: number, clientY: number) {
    const b = balloons.find((x) => x.id === id);
    if (!b?.charged) {
      hideElectricField();
      setPapersAttractedState(false);
      return;
    }
    const table = tableRef.current;
    if (!table) return;
    const tr = table.getBoundingClientRect();
    const cx = tr.left + tr.width / 2;
    const cy = tr.top + tr.height / 2;
    const dist = Math.hypot(clientX - cx, clientY - cy);

    if (dist < 150) {
      setPapersAttractedState(true);
      showElectricField({ x: clientX, y: clientY }, { x: cx, y: cy });
    } else {
      setPapersAttractedState(false);
      hideElectricField();
    }
  }

  /** Campo eléctrico (líneas como divs) */
  function showElectricField(start: XY, end: XY) {
    const field = electricFieldRef.current;
    if (!field) return;
    field.innerHTML = "";
    field.classList.remove("opacity-0");
    field.classList.add("opacity-100");

    const n = 5;
    for (let i = 0; i < n; i++) {
      const sy = start.y + (i - (n - 1) / 2) * 10;
      const dx = end.x - start.x;
      const dy = end.y - sy;
      const len = Math.hypot(dx, dy);
      const ang = (Math.atan2(dy, dx) * 180) / Math.PI;

      const line = document.createElement("div");
      line.style.position = "absolute";
      line.style.left = `${start.x}px`;
      line.style.top = `${sy}px`;
      line.style.width = `${len}px`;
      line.style.height = "2px";
      line.style.background = "linear-gradient(90deg, transparent, #22c55e, transparent)";
      line.style.transformOrigin = "0 50%";
      line.style.transform = `rotate(${ang}deg)`;
      line.style.animation = "fieldPulse 1s infinite";
      field.appendChild(line);
    }
  }
  function hideElectricField() {
    const field = electricFieldRef.current;
    if (!field) return;
    field.classList.remove("opacity-100");
    field.classList.add("opacity-0");
    field.innerHTML = "";
  }

  /** Chispas (pequeños destellos que se desvanecen) */
  function createSparks(x: number, y: number, count: number) {
    if (!gameRef.current) return;
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const s = document.createElement("div");
        s.className =
          "w-1 h-1 rounded-full bg-yellow-300 opacity-100 animate-[sparkle_0.5s_ease-out_forwards]";
        s.style.position = "fixed";
        s.style.left = `${x + (Math.random() * 24 - 12)}px`;
        s.style.top = `${y + (Math.random() * 24 - 12)}px`;
        document.body.appendChild(s);
        setTimeout(() => s.remove(), 520);
      }, i * 80);
    }
  }

  /** Botones */
  function checkExperiment() {
    if (chargedCount > 0 && papersAttracted) {
      setFeedback({
        title: "¡Excelente! 🎉",
        body: `Has cargado ${chargedCount} globo(s) y observado la atracción eléctrica. Los objetos cargados atraen objetos neutros por polarización.`,
      });
    } else if (chargedCount > 0) {
      setFeedback({
        title: "Bien ⚡",
        body: "Ya cargaste globos. Ahora acércalos a los papelitos para ver la atracción.",
      });
    } else {
      setFeedback({
        title: "¡Inténtalo! 🎈",
        body: "Primero arrastra los globos hacia el cabello para cargarlos por fricción.",
      });
    }
  }

  function resetGame() {
    setBalloons((b) =>
      b.map((x, i) => ({
        ...x,
        charged: false,
        pos:
          i === 0
            ? { x: 40, y: 40 }
            : i === 1
            ? { x: 140, y: 40 }
            : i === 2
            ? { x: 240, y: 40 }
            : { x: 90, y: 160 },
      })),
    );
    hideElectricField();
    setPapersAttractedState(false);
    setFeedback(null);
  }

  function showManual() {
    setFeedback({
      title: "📖 Manual",
      body:
        "1) Frota los globos con el cabello (se cargan por fricción). 2) Los globos cargados brillan. 3) Acércalos a los papelitos para ver la atracción. 4) Las líneas verdes representan el campo eléctrico.",
    });
  }
  function showExplanation() {
    setFeedback({
      title: "🔬 Explicación científica",
      body:
        "Al frotar el globo, este gana electrones y queda con carga negativa. Por polarización, los papelitos (neutros) quedan atraídos. Las líneas verdes sugieren la dirección del campo eléctrico.",
    });
  }

  /** Animaciones keyframes (para Tailwind) */
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      @keyframes wiggle { 0%,100%{transform:translateX(-50%) scale(1)} 25%{transform:translateX(-50%) scale(1.08) rotate(-2deg)} 75%{transform:translateX(-50%) scale(1.08) rotate(2deg)} }
      @keyframes sparkle { 0%{opacity:1; transform:scale(1)} 100%{opacity:0; transform:scale(2)} }
      @keyframes fieldPulse { 0%,100%{opacity:.5} 50%{opacity:1} }
      @keyframes paperFloat { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div
      ref={gameRef}
      className="min-h-screen w-full relative flex flex-col bg-gradient-to-br from-indigo-400 to-purple-700 overflow-hidden"
    >
      <Link
        to="/"
        className="absolute top-4 left-4 z-50 px-3 py-1.5 rounded-lg bg-white/20 text-white font-bold hover:bg-white/30"
      >
        ← Menú
      </Link>
      {/* Título */}
      <div className="text-center text-white text-3xl md:text-4xl font-extrabold py-5 backdrop-blur-sm bg-white/10 shadow">
        Carga Eléctrica y Atracción de Objetos Ligeros
      </div>

      {/* Instrucción */}
      <div className="mx-auto mt-4 px-4 py-3 bg-white/90 rounded-lg font-semibold max-w-3xl text-center">
        Arrastra los globos hacia el cabello para cargarlos; luego acércalos a los
        papelitos para ver la atracción eléctrica.
      </div>

      {/* Zona de juego */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 p-6 relative">
        {/* Persona */}
        <div className="flex flex-col items-center">
          <div className="relative w-[120px] h-[200px] mb-3">
            {/* Cabello */}
            <div
              ref={hairRef}
              className="absolute left-1/2 -translate-x-1/2 top-0 w-20 h-[70px] rounded-[50px_50px_30px_30px] bg-amber-900 cursor-pointer"
              title="Frota aquí"
            />
            {/* cabeza */}
            <div className="absolute left-1/2 -translate-x-1/2 top-5 w-[50px] h-[50px] rounded-full bg-orange-300 z-[3]" />
            {/* cuerpo */}
            <div className="absolute left-1/2 -translate-x-1/2 top-[60px] w-[60px] h-[100px] bg-orange-300 rounded-[30px_30px_20px_20px]">
              <div className="absolute left-[5px] right-[5px] top-[10px] h-[60px] bg-pink-600 rounded-md" />
              <div className="absolute -left-[15px] right-[-15px] top-[20px] h-2 bg-orange-300 rounded" />
            </div>
          </div>
          <div className="text-white font-bold">Frota con el cabello</div>
        </div>

        {/* Globos (área central) */}
        <div
          ref={balloonsAreaRef}
          className="relative h-[320px] md:h-[380px] bg-white/10 rounded-xl border border-white/20 overflow-visible"
        >
          {balloons.map((b) => (
            <div
              key={b.id}
              onPointerDown={(e) => handlePointerDown(e, b.id)}
              onPointerMove={(e) => handlePointerMove(e, b.id)}
              onPointerUp={(e) => handlePointerUp(e, b.id)}
              className="absolute cursor-grab active:cursor-grabbing select-none"
              style={{ left: b.pos.x, top: b.pos.y, width: 60, height: 80 }}
            >
              <div
                className={`w-[60px] h-[80px] rounded-[50%_50%_50%_50%/60%_60%_40%_40%] transition-transform ${
                  draggingId === b.id ? "scale-105" : ""
                }`}
                style={{
                  background: b.color,
                  boxShadow: b.charged ? "0 0 20px rgba(255,255,0,0.8)" : "none",
                }}
                title={b.charged ? "Cargado" : "Arrástrame"}
              />
              {/* Hilo del globo */}
              <div className="w-[2px] h-5 bg-gray-800 mx-auto" />
            </div>
          ))}
        </div>

        {/* Mesa con papelitos */}
        <div className="flex flex-col items-center">
          <div className="relative w-[150px] h-[100px] bg-amber-800 rounded-lg mb-3 shadow-lg" ref={tableRef}>
            {/* patas */}
            <div className="absolute left-5 -bottom-10 w-2 h-10 bg-amber-900" />
            <div className="absolute right-5 -bottom-10 w-2 h-10 bg-amber-900" />

            {/* papelitos */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-[120px] flex flex-wrap gap-1 justify-center">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-[15px] h-[15px] bg-white rounded-sm transition-transform ${
                    papersAttracted ? "animate-[paperFloat_2s_ease-in-out_infinite]" : ""
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="text-white font-bold">Papelitos ligeros</div>
        </div>
      </div>

      {/* Campo eléctrico (overlay global) */}
      <div
        ref={electricFieldRef}
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300"
      />

      {/* Controles */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 bg-white/10 p-4 rounded-xl backdrop-blur-md">
        <button
          onClick={checkExperiment}
          className="px-4 py-2 rounded-lg font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition"
        >
          ⚡ Comprobar
        </button>
        <button
          onClick={resetGame}
          className="px-4 py-2 rounded-lg font-bold text-white bg-rose-500 hover:bg-rose-600 transition"
        >
          🔄 Reiniciar
        </button>
        <button
          onClick={showManual}
          className="px-4 py-2 rounded-lg font-bold text-white bg-amber-500 hover:bg-amber-600 transition"
        >
          📖 Manual
        </button>
        <button
          onClick={showExplanation}
          className="px-4 py-2 rounded-lg font-bold text-white bg-sky-500 hover:bg-sky-600 transition"
        >
          ➡️ Explicación
        </button>
      </div>

      {/* Modal feedback */}
      {feedback && (
        <div className="fixed inset-0 grid place-items-center p-4 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setFeedback(null)} />
          <div className="relative bg-white text-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-lg">
            <h3 className="text-xl font-extrabold mb-2">{feedback.title}</h3>
            <p className="mb-4">{feedback.body}</p>
            <div className="text-right">
              <button
                onClick={() => setFeedback(null)}
                className="px-4 py-2 rounded-lg font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
