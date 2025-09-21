import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";

export default function GameTrenMagnetico() {
  const rootRef = useRef<HTMLDivElement | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  type Emitter = { x: number; y: number; hue: number; key: string };
  const emittersRef = useRef<Record<string, Emitter>>({});

  const fitCanvas = () => {
    const c = canvasRef.current;
    if (!c) return;
    c.width = window.innerWidth;
    c.height = window.innerHeight;
  };

  function startAnim() {
    if (rafRef.current) return;
    const c = canvasRef.current!;
    const ctx = c.getContext("2d")!;
    const draw = () => {
      const now = performance.now();
      ctx.clearRect(0, 0, c.width, c.height);

      const emitters = Object.values(emittersRef.current);
      if (emitters.length) {
        const period = 1600;      
        const maxR = 180;         
        const ringGap = 26;       
        const baseAlpha = 0.38;

        for (const em of emitters) {
          const t = (now % period) / period; 
          const baseR = t * maxR;

          for (let k = 0; k < 8; k++) {
            const r = baseR - k * ringGap;
            if (r <= 10 || r >= maxR) continue;
            const alpha = baseAlpha * (0.65 + 0.35 * Math.sin((r / ringGap) * Math.PI));
            ctx.beginPath();
            ctx.arc(em.x, em.y, r, 0, Math.PI * 2);
            ctx.strokeStyle = `hsla(${em.hue}, 90%, 60%, ${alpha})`;
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        }
      }

      if (Object.keys(emittersRef.current).length) {
        rafRef.current = requestAnimationFrame(draw);
      } else {
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(draw);
  }

  function ensureAnim() {
    if (!rafRef.current && Object.keys(emittersRef.current).length) {
      startAnim();
    }
  }

  function addEmitter(key: string, x: number, y: number, hue = 205) {
    emittersRef.current[key] = { x, y, hue, key };
    ensureAnim();
  }
  function removeEmitter(key: string) {
    delete emittersRef.current[key];
  }
  function removeAllEmitters() {
    emittersRef.current = {};
  }

  useEffect(() => {
    fitCanvas();
    window.addEventListener("resize", fitCanvas);
    return () => window.removeEventListener("resize", fitCanvas);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const config: (null | { left: string; right: string; el: HTMLElement })[] = [
      null,
      null,
      null,
      null,
    ];

    const bank = root.querySelector<HTMLDivElement>("#bank")!;
    const slots = Array.from(root.querySelectorAll<HTMLDivElement>(".slot"));
    const couples = [0, 1, 2].map((i) =>
      root.querySelector<HTMLDivElement>(`#cpl-${i}`)!
    );
    const coupleLoco = root.querySelector<HTMLDivElement>("#cpl-loco")!; 
    const loco = root.querySelector<HTMLDivElement>("#loco")!;
    const toast = root.querySelector<HTMLDivElement>("#toast")!;
    const trainArea = root.querySelector<HTMLDivElement>("#trainArea")!;
    const btnCheck = root.querySelector<HTMLButtonElement>("#btnCheck")!;
    const btnReset = root.querySelector<HTMLButtonElement>("#btnReset")!;
    const btnHelp = root.querySelector<HTMLButtonElement>("#btnHelp")!;
    const btnNext = root.querySelector<HTMLButtonElement>("#btnNext")!;

    let prevLocoOk = false;
    const prevCoupleOk = [false, false, false];

    function msg(html: string, ms = 2200) {
      toast.innerHTML = html;
      toast.style.display = "block";
      type MsgFn = typeof msg & { _t?: ReturnType<typeof setTimeout> };
      clearTimeout((msg as MsgFn)._t);
      (msg as MsgFn)._t = setTimeout(() => (toast.style.display = "none"), ms);
    }

    /* Utilidades de giro */
    function setPoleClass(el: HTMLElement, v: string) {
      el.textContent = v;
      el.classList.toggle("n", v === "N");
      el.classList.toggle("s", v === "S");
    }
    function flipCarElement(carEl: HTMLElement) {
      const L = carEl.dataset.left!;
      const R = carEl.dataset.right!;
      carEl.dataset.left = R;
      carEl.dataset.right = L;
      const poles = carEl.querySelectorAll<HTMLElement>(".pole"); 
      setPoleClass(poles[0], carEl.dataset.left!);
      setPoleClass(poles[1], carEl.dataset.right!);
    }

    
    function polarityOkForSlot(
      carData: { left: string; right: string },
      pos: number
    ): boolean {
      if (pos === 0) {
        const locoRight = loco.dataset.right!;
        return carData.left !== locoRight;
      }
      const leftNeigh = config[pos - 1];
      if (leftNeigh) {
        return carData.left !== leftNeigh.right;
      }
      return true;
    }

    function getCenter(el: HTMLElement) {
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }

    function refreshCouplers() {
      let locoOk = false;
      if (config[0]) {
        locoOk = config[0].left !== loco.dataset.right!;
        coupleLoco.className = "couple " + (locoOk ? "ok" : "bad");
        coupleLoco.textContent = locoOk ? "✔" : "✖";
      } else {
        coupleLoco.className = "couple";
        coupleLoco.textContent = "•";
      }
      if (!prevLocoOk && locoOk) {
        const { x, y } = getCenter(coupleLoco);
        addEmitter("cpl-loco", x, y, 15); 
      } else if (prevLocoOk && !locoOk) {
        removeEmitter("cpl-loco");
      }
      prevLocoOk = locoOk;

      
      for (let i = 1; i < config.length; i++) {
        const idx = i - 1; 
        let ok = false;
        if (config[i - 1] && config[i]) {
          ok = config[i]!.left !== config[i - 1]!.right;
          couples[idx].className = "couple " + (ok ? "ok" : "bad");
          couples[idx].textContent = ok ? "✔" : "✖";
        } else {
          couples[idx].className = "couple";
          couples[idx].textContent = "•";
        }
        const key = `cpl-${idx}`;
        if (!prevCoupleOk[idx] && ok) {
          const { x, y } = getCenter(couples[idx]);
          addEmitter(key, x, y, 205);
        } else if (prevCoupleOk[idx] && !ok) {
          removeEmitter(key);
        }
        prevCoupleOk[idx] = ok;
      }
    }

    function setSlotDragStyle(
      slot: HTMLElement,
      style: "drag-ok" | "drag-bad" | null
    ) {
      slot.classList.remove("drag-ok", "drag-bad");
      if (style) slot.classList.add(style);
    }

    function placeCarInSlot(carEl: HTMLElement, slot: HTMLElement) {
      const pos = Number(slot.getAttribute("data-pos"));
      const carData = { left: carEl.dataset.left!, right: carEl.dataset.right!, el: carEl };

      const prev = slot.querySelector<HTMLElement>(".car");
      if (prev) {
        prev.setAttribute("draggable", "true");
        (prev.style as CSSStyleDeclaration).cursor = "grab";
        bank.appendChild(prev);
      }

    
      slot.innerHTML = "";
      carEl.setAttribute("draggable", "false");
      (carEl.style as CSSStyleDeclaration).cursor = "default";
      slot.appendChild(carEl);
      slot.classList.add("filled");

      config[pos] = carData;
      setSlotDragStyle(slot, null);
      refreshCouplers();
    }

    function clearSlots() {
 
      slots.forEach((slot, i) => {
        const inside = slot.querySelector<HTMLElement>(".car");
        if (inside) {
          inside.setAttribute("draggable", "true");
          (inside.style as CSSStyleDeclaration).cursor = "grab";
          bank.appendChild(inside);
        }
        slot.classList.remove("filled", "drag-ok", "drag-bad");
        slot.textContent = String(4 - i); 
      });
      for (let i = 0; i < config.length; i++) config[i] = null;

    
      removeAllEmitters();
      prevLocoOk = false;
      prevCoupleOk[0] = prevCoupleOk[1] = prevCoupleOk[2] = false;


      coupleLoco.className = "couple";
      coupleLoco.textContent = "•";
      couples.forEach((c) => {
        c.className = "couple";
        c.textContent = "•";
      });
    }

    function noGaps() {
      let gap = false;
      for (let i = 0; i < config.length; i++) {
        if (config[i] == null) {
          gap = true;
        } else if (gap) {
          return false;
        }
      }
      return true;
    }

    function allCouplersOK() {
      if (!config[0]) return false;
      if (config[0]!.left === loco.dataset.right!) return false;
      for (let i = 1; i < config.length; i++) {
        if (config[i] && config[i - 1]) {
          if (config[i]!.left === config[i - 1]!.right) return false;
        }
      }
      return true;
    }

    
    let dragging: HTMLElement | null = null;

    const onBankDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement | null;
      const car = target?.closest(".car") as HTMLElement | null;
      if (!car) return;
      dragging = car;
      e.dataTransfer?.setData("text/plain", "car");
    };
    const onBankDragEnd = () => {
      dragging = null;
    };
    bank.addEventListener("dragstart", onBankDragStart);
    bank.addEventListener("dragend", onBankDragEnd);

    
    const onBankDblClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const car = target?.closest(".car") as HTMLElement | null;
      if (!car) return;
      flipCarElement(car);
    };
    bank.addEventListener("dblclick", onBankDblClick);

    
    const onContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const car = target?.closest(".car") as HTMLElement | null;
      if (!car) return;
      e.preventDefault();
      flipCarElement(car);
      const slot = car.closest(".slot") as HTMLElement | null;
      if (slot) {
        const pos = Number(slot.getAttribute("data-pos"));
        if (config[pos]) {
          config[pos]!.left = car.dataset.left!;
          config[pos]!.right = car.dataset.right!;
          refreshCouplers();
        }
      }
    };
    root.addEventListener("contextmenu", onContextMenu);

  
    slots.forEach((slot) => {
      const over = (e: DragEvent) => {
        if (!dragging) return;
        e.preventDefault();
        const pos = Number(slot.getAttribute("data-pos"));
        const temp = { left: dragging!.dataset.left!, right: dragging!.dataset.right! };
        setSlotDragStyle(slot, polarityOkForSlot(temp, pos) ? "drag-ok" : "drag-bad");
      };
      const leave = () => setSlotDragStyle(slot, null);
      const drop = (e: DragEvent) => {
        if (!dragging) return;
        e.preventDefault();
        const pos = Number(slot.getAttribute("data-pos"));
        const temp = { left: dragging!.dataset.left!, right: dragging!.dataset.right! };
        if (!polarityOkForSlot(temp, pos)) {
          setSlotDragStyle(slot, "drag-bad");
          msg("❌ Acople inválido: deben juntarse polos opuestos (N–S).", 1600);
          setTimeout(() => setSlotDragStyle(slot, null), 400);
          return;
        }
        placeCarInSlot(dragging!, slot);
      };
      const dbl = () => {
        const inside = slot.querySelector<HTMLElement>(".car");
        if (inside) {
          inside.setAttribute("draggable", "true");
          (inside.style as CSSStyleDeclaration).cursor = "grab";
          bank.appendChild(inside);
          const i = Number(slot.getAttribute("data-pos"));
          config[i] = null;
          slot.classList.remove("filled");
          slot.textContent = String(4 - i);
          refreshCouplers();
        }
      };

      slot.addEventListener("dragover", over);
      slot.addEventListener("dragleave", leave);
      slot.addEventListener("drop", drop);
      slot.addEventListener("dblclick", dbl);

      type SlotDiv = HTMLDivElement & { _cleanup?: () => void };
      (slot as SlotDiv)._cleanup = () => {
        slot.removeEventListener("dragover", over);
        slot.removeEventListener("dragleave", leave);
        slot.removeEventListener("drop", drop);
        slot.removeEventListener("dblclick", dbl);
      };
    });

    
    const onReset = () => {
      trainArea.classList.remove("moving");
      clearSlots();
      msg("🔄 Juego reiniciado.");
    };
    const onHelp = () => {
      msg(
        `📖 <b>Manual</b><br>
      1) La locomotora es S–N (izq–der).<br>
      2) Los vagones encajan solo con polos opuestos (N–S).<br>
      3) Doble clic en el <b>menú</b> para <b>girar</b> un vagón.<br>
      4) Clic derecho sobre un vagón en el <b>tren</b> para <b>girar</b> ahí mismo.<br>
      5) Doble clic en una casilla para quitar el vagón.<br>
      6) Completa de izquierda a derecha (4 → 1).`,
        6500
      );
    };
    const onCheck = () => {
      const count = config.filter(Boolean).length;
      if (count === 0) {
        msg("🚂 Aún no hay vagones conectados.", 1500);
        return;
      }
      if (!noGaps()) {
        msg("⚠️ Hay huecos entre vagones. Completa de izquierda a derecha (4 → 1).", 2200);
        return;
      }
      if (!allCouplersOK()) {
        msg("❌ Hay acoples incorrectos. Revisa los ✖️ (debe ser N–S).", 2200);
        refreshCouplers();
        return;
      }

  
  removeAllEmitters();
  refreshCouplers();
  msg(`✅ ¡Perfecto! ${count} vagón(es) correctamente acoplado(s). ¡En marcha! 🚂`, 2000);
  trainArea.classList.remove("moving");
  void (trainArea as HTMLDivElement).offsetWidth;
  trainArea.classList.add("moving");
  setTimeout(() => trainArea.classList.remove("moving"), 3800);
    };
    const onNext = () => {
      msg("➡️ “Siguiente” aún no tiene acción. Dime qué debe hacer y lo programo.");
    };

    btnReset.addEventListener("click", onReset);
    btnHelp.addEventListener("click", onHelp);
    btnCheck.addEventListener("click", onCheck);
    btnNext.addEventListener("click", onNext);

    
    clearSlots();

    
    return () => {
      btnReset.removeEventListener("click", onReset);
      btnHelp.removeEventListener("click", onHelp);
      btnCheck.removeEventListener("click", onCheck);
      btnNext.removeEventListener("click", onNext);
      bank.removeEventListener("dragstart", onBankDragStart);
      bank.removeEventListener("dragend", onBankDragEnd);
      bank.removeEventListener("dblclick", onBankDblClick);
      root.removeEventListener("contextmenu", onContextMenu);
      slots.forEach((s) =>
        (s as HTMLDivElement & { _cleanup?: () => void })._cleanup?.()
      );
      removeAllEmitters();
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  return (
    <div className="min-h-screen" ref={rootRef}>
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[5]" />

      <Link
        to="/"
        className="absolute top-4 left-4 z-50 px-3 py-1.5 rounded-lg bg-white/20 text-white font-bold hover:bg-white/30"
      >
        ← Menú
      </Link>

      
      <style>{`
*{margin:0;padding:0;box-sizing:border-box}
body{overflow:hidden}
.title{
  text-align:center;color:#fff;font-size:2rem;font-weight:700;
  padding:16px 20px;text-shadow:0 2px 8px rgba(0,0,0,.35)
}
.bg{
  position:fixed;inset:0;z-index:-1;
  background:linear-gradient(135deg,#2c3e50 0%,#3498db 100%);
}
.game{position:relative;width:100vw;height:calc(100vh - 70px)}

/* Panel de vagones */
.panel{
  position:absolute;left:24px;top:24px;
  background:rgba(255,255,255,.1);backdrop-filter:blur(10px);
  padding:12px 12px 16px;border-radius:14px;color:#fff;max-width:120px
}
.panel h3{font-size:14px;margin-bottom:8px}
.bank{display:flex;flex-direction:column;gap:10px;max-height:68vh;overflow:auto}
.car{
  width:88px;height:60px;border-radius:10px;
  background:linear-gradient(135deg,#f39c12,#e67e22);
  display:flex;align-items:center;justify-content:space-between;
  padding:0 8px;color:#fff;font-weight:700;cursor:grab;user-select:none;
  box-shadow:0 6px 14px rgba(0,0,0,.25);transition:transform .15s;
}
.car:active{cursor:grabbing;transform:scale(1.04)}
.pole{width:24px;height:24px;border-radius:999px;display:grid;place-items:center;font-size:12px;font-weight:800}
.pole.n{background:#e74c3c}.pole.s{background:#3498db}

/* Vía */
.rail{
  position:absolute;left:50%;transform:translateX(-50%);
  bottom:150px;width:80%;height:10px;border-radius:5px;
  background:linear-gradient(90deg,#7f8c8d,#95a5a6,#7f8c8d);
  box-shadow:0 3px 10px rgba(0,0,0,.35);
}
.sleepers{
  position:absolute;left:50%;transform:translateX(-50%);
  bottom:150px;width:80%;height:10px;pointer-events:none;
}
.sleepers::before{
  content:"";position:absolute;inset:-6px 0 0 0;height:6px;
  background:repeating-linear-gradient(90deg,#2c3e50 0 22px,transparent 22px 44px);
  opacity:.9
}

/* Tren: LOCO a la izquierda, SLOTS a la derecha (4,3,2,1) */
.train-area{
  position:absolute;
  left:90%;
  transform:translateX(-50%);
  bottom:180px;
  width:80%;
  display:flex;
  align-items:center;
  gap:8px;
}
.loco{
  width:130px;height:82px;border-radius:22px 12px 12px 12px;
  background:linear-gradient(135deg,#e74c3c,#c0392b);
  color:#fff;display:flex;align-items:center;justify-content:space-between;
  padding:0 10px;font-weight:800;position:relative;flex:0 0 auto;
  box-shadow:0 6px 16px rgba(0,0,0,.35)
}
.loco::before{
  content:"";position:absolute;top:-18px;left:18px;width:28px;height:28px;background:#34495e;border-radius:999px
}
.loco::after{
  content:"";position:absolute;top:-8px;right:10px;width:16px;height:36px;background:#2c3e50;border-radius:6px
}
.wheels{position:absolute;left:10px;right:10px;bottom:-14px;display:flex;justify-content:space-between}
.wheel{width:20px;height:20px;border-radius:999px;background:#2c3e50;border:3px solid #34495e}

.slots{display:flex;align-items:center;gap:8px;flex:1;min-height:82px}
.slot{
  width:96px;height:72px;border-radius:10px;border:3px dashed rgba(255,255,255,.55);
  display:grid;place-items:center;color:#fff;font-weight:800;
  background:rgba(255,255,255,.08);transition:all .18s ease;position:relative;
}
.slot.drag-ok{border-color:#27ae60;background:rgba(39,174,96,.12)}
.slot.drag-bad{border-color:#e74c3c;background:rgba(231,76,60,.12)}
.slot.filled{border-style:solid;border-color:#27ae60}

/* Indicadores de acople */
.couple{
  width:20px;height:20px;border-radius:999px;background:rgba(255,255,255,.22);
  display:grid;place-items:center;color:#fff;font-size:12px;font-weight:900;
  box-shadow:0 2px 8px rgba(0,0,0,.25)
}
.couple.ok{background:#27ae60}
.couple.bad{background:#e74c3c}

/* Controles */
.controls{
  position:absolute;left:50%;transform:translateX(-50%);bottom:24px;
  display:flex;gap:12px;flex-wrap:wrap;background:rgba(255,255,255,.1);
  padding:12px 14px;border-radius:14px;backdrop-filter:blur(10px)
}
.btn{border:none;border-radius:10px;padding:10px 16px;font-weight:800;color:#fff;cursor:pointer;transition:transform .12s, box-shadow .12s}
.btn:hover{transform:translateY(-1px);box-shadow:0 6px 14px rgba(0,0,0,.25)}
.check{background:#27ae60}.reset{background:#e74c3c}.help{background:#f39c12}.next{background:#3498db}

.toast{
  position:absolute;left:50%;top:14%;transform:translateX(-50%);
  background:#fff;color:#333;padding:16px 20px;border-radius:12px;
  box-shadow:0 12px 32px rgba(0,0,0,.35);display:none;max-width:560px;
  text-align:center;font-weight:700
}

/* Movimiento hacia la IZQUIERDA */
@keyframes moveLeft{from{transform:translateX(0)}to{transform:translateX(-420px)}}
.moving .loco, .moving .slots{animation:moveLeft 3.6s cubic-bezier(.29,.74,.27,.99)}
.moving .wheel{animation:spin 0.6s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}

.tip{
  position:absolute;left:50%;transform:translateX(-50%);
  top:84px;background:rgba(255,255,255,.92);padding:10px 16px;border-radius:10px;
  font-weight:800;color:#333;box-shadow:0 6px 18px rgba(0,0,0,.25)
}

@media (max-width:900px){
  .title{font-size:1.4rem}
  .panel{left:12px;top:12px}
  .car{transform:scale(.95);transform-origin:left top}
  .slot{transform:scale(.95)}
}
      `}</style>

      <div className="bg" />

      <div className="title">Conecta los vagones: polos opuestos se atraen (N–S)</div>

      <div className="game" id="game">
        <div className="tip">
          Arrastra un vagón a cada casilla. Si el acople es N–S, encaja. Luego pulsa “Comprobar”.
        </div>

        <div className="panel">
          <h3>Vagones</h3>
          <div className="bank" id="bank">
            <div className="car" draggable data-left="S" data-right="N">
              <span className="pole s">S</span><span>V</span><span className="pole n">N</span>
            </div>
            <div className="car" draggable data-left="S" data-right="N">
              <span className="pole s">S</span><span>V</span><span className="pole n">N</span>
            </div>
            <div className="car" draggable data-left="N" data-right="S">
              <span className="pole n">N</span><span>V</span><span className="pole s">S</span>
            </div>
            <div className="car" draggable data-left="S" data-right="N">
              <span className="pole s">S</span><span>V</span><span className="pole n">N</span>
            </div>
            <div className="car" draggable data-left="N" data-right="S">
              <span className="pole n">N</span><span>V</span><span className="pole s">S</span>
            </div>
            <div className="car" draggable data-left="S" data-right="N">
              <span className="pole s">S</span><span>V</span><span className="pole n">N</span>
            </div>
            <div className="car" draggable data-left="N" data-right="S">
              <span className="pole n">N</span><span>V</span><span className="pole s">S</span>
            </div>
          </div>
        </div>

        <div className="rail" />
        <div className="sleepers" />

        <div className="train-area" id="trainArea">
          <div className="loco" id="loco" data-left="S" data-right="N">
            <span className="pole s">S</span><span>LOCO</span><span className="pole n">N</span>
            <div className="wheels"><div className="wheel" /><div className="wheel" /><div className="wheel" /></div>
          </div>

          <div className="couple" id="cpl-loco">•</div>

          <div className="slots" id="slots">
            <div className="slot" data-pos="0">4</div>
            <div className="couple" id="cpl-0">•</div>
            <div className="slot" data-pos="1">3</div>
            <div className="couple" id="cpl-1">•</div>
            <div className="slot" data-pos="2">2</div>
            <div className="couple" id="cpl-2">•</div>
            <div className="slot" data-pos="3">1</div>
          </div>
        </div>

        <div className="controls">
          <button className="btn check" id="btnCheck">🧲 Comprobar</button>
          <button className="btn reset" id="btnReset">🔄 Reiniciar</button>
          <button className="btn help" id="btnHelp">📖 Manual</button>
          <button className="btn next" id="btnNext">➡️ Siguiente</button>
        </div>

        <div className="toast" id="toast" />
      </div>
    </div>
  );
}
