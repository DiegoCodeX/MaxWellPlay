import { Routes, Route, Navigate } from "react-router-dom";
import Menu from "./pages/Menu";
import GameCargaElectrica from "./components/GameCargaElectrica";
import GameGaussMagnetico from "./components/GameGaussMagnetico";
import ExplicacionVideo from "./pages/ExplicacionVideo"; // ← NUEVO

function Placeholder({ title }: { title: string }) {
  return (
    <div className="min-h-screen grid place-items-center bg-slate-900 text-white">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold">{title}</h1>
        <a href="/" className="inline-block mt-6 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20">
          ← Volver al menú
        </a>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Menú principal */}
      <Route path="/" element={<Menu />} />

      {/* Juegos */}
      <Route path="/juegos/carga-electrica" element={<GameCargaElectrica />} />
      <Route path="/juegos/gauss-magnetico" element={<GameGaussMagnetico />} />
      <Route path="/juegos/faraday" element={<Placeholder title="Ley de Faraday – Inducción" />} />
      <Route path="/juegos/ampere-maxwell" element={<Placeholder title="Ley de Ampère–Maxwell" />} />
      <Route path="/juegos/red-wifi" element={<Placeholder title="Red WiFi en Acción" />} />

      {/* Video de explicación: vuelve al menú cuando termina */}
      <Route path="/explicacion" element={<ExplicacionVideo />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
