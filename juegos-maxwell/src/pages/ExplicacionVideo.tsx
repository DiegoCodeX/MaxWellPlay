// src/pages/ExplicacionVideo.tsx
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function ExplicacionVideo() {
  const navigate = useNavigate();
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const onEnded = () => navigate("/", { replace: true }); // vuelve al Menú
    v.addEventListener("ended", onEnded);
    return () => v.removeEventListener("ended", onEnded);
  }, [navigate]);

  return (
    <div className="w-screen h-screen bg-black flex items-center justify-center">
      {/* Botón por si quieren saltar el video */}
      <button
        onClick={() => navigate("/", { replace: true })}
        className="absolute top-4 right-4 px-4 py-2 rounded-lg font-bold text-white bg-rose-600 hover:bg-rose-700"
      >
        Volver al menú
      </button>

      <video
        ref={ref}
        className="max-w-full max-h-full"
        controls
        autoPlay
      >
        <source src="/videos/explicacion-carga-electrica.mp4" type="video/mp4" />
        Tu navegador no soporta video HTML5.
      </video>
    </div>
  );
}
