import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Clock, MoreVertical, Orbit, PlusCircle, Rocket, Satellite, Globe, Telescope } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Niklas uppgifter – Dagens to-do" },
      { name: "description", content: "En rymdinspirerad att-göra-lista för dagens uppgifter." },
      { property: "og:title", content: "Niklas uppgifter" },
      { property: "og:description", content: "En rymdinspirerad att-göra-lista för dagens uppgifter." },
    ],
  }),
  component: App,
});

type Task = { id: string; title: string; desc: string; priority: number; color: string; done: boolean };
type Screen = "list" | "form" | "edit";

const COLORS = ["oklch(0.55 0.15 250)", "oklch(0.62 0.22 25)", "oklch(0.75 0.14 185)", "oklch(0.8 0.16 75)", "oklch(0.78 0.1 10)"];
const PRIOS = [Rocket, Satellite, Orbit, Globe];
const PLANETS = ["oklch(0.45 0.12 250)", "oklch(0.45 0.06 50)", "oklch(0.75 0.06 220)", "oklch(0.7 0.18 50)", "oklch(0.35 0.1 260)", "oklch(0.75 0.06 20)", "oklch(0.85 0.03 20)", "oklch(0.75 0.18 55)"];
const KEY = "niklas-tasks";

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [screen, setScreen] = useState<Screen>("list");
  const [editing, setEditing] = useState<Task | null>(null);
  const [day, setDay] = useState("");
  const [timerLeft, setTimerLeft] = useState(TIMER_START);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerStarted, setTimerStarted] = useState(false);

  useEffect(() => {
    try { setTasks(JSON.parse(localStorage.getItem(KEY) || "[]")); } catch {}
    setDay(new Date().toLocaleDateString("sv-SE", { weekday: "long" }).toUpperCase());
    setLoaded(true);
  }, []);
  useEffect(() => { if (loaded) localStorage.setItem(KEY, JSON.stringify(tasks)); }, [tasks, loaded]);

  const done = tasks.filter((t) => t.done).length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const allDone = tasks.length > 0 && done === tasks.length;
  const update = (id: string, p: Partial<Task>) => setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, ...p } : t)));

  const openForm = (t: Task | null) => { setEditing(t); setScreen("form"); };

  return (
    <div className="min-h-screen bg-space relative overflow-hidden flex flex-col items-center">
      <Rocket className="absolute -bottom-20 -left-10 size-[32rem] text-background opacity-25 pointer-events-none" strokeWidth={1.5} />
      <header className="bar w-full flex items-center justify-center gap-3 py-3 font-bold relative">
        <Telescope className="size-5 opacity-60" /> Niklas uppgifter <Telescope className="size-5 opacity-60 -scale-x-100" />
      </header>
      <main className="relative w-full max-w-md px-6 pb-12 flex flex-col items-center">
        <h1 className="mt-10 text-6xl font-bold text-navy tracking-wide">{day || "IDAG"}</h1>
        {screen !== "form" && (
          <>
            <div className="mt-6 size-16 rounded-full border-4 border-navy grid place-items-center text-sm font-bold text-navy"
              style={{ background: `conic-gradient(var(--navy-light) ${pct * 3.6}deg, transparent 0)` }}>
              <span className="bg-sun rounded-full size-11 grid place-items-center">{pct}%</span>
            </div>
            <Planets pct={pct} />
          </>
        )}

        {screen === "list" && allDone && (
          <>
            <div className="bar mt-12 w-full py-6 text-center text-2xl font-bold shadow-lg">Du är klar. Bra jobbat!</div>
            <BarButton className="mt-24" onClick={() => setTasks([])}><ArrowLeft className="size-4" /> TILLBAKA</BarButton>
          </>
        )}

        {screen === "list" && !allDone && tasks.length === 0 && (
          <BarButton className="mt-16 w-full" onClick={() => openForm(null)}>Lägg till dagens uppgifter</BarButton>
        )}

        {screen === "list" && !allDone && tasks.length > 0 && (
          <div className="w-full mt-8 space-y-3">
            <div className="bar flex justify-between items-center px-3 py-3 text-sm font-bold">
              Dagens uppgifter
              <button aria-label="Lägg till" onClick={() => openForm(null)}><PlusCircle className="size-5" /></button>
            </div>
            {tasks.filter((t) => !t.done).map((t) => (
              <TaskRow key={t.id} t={t} onToggle={() => update(t.id, { done: true })} onMenu={() => { setEditing(t); setScreen("edit"); }} />
            ))}
            <Timer left={timerLeft} running={timerRunning} started={timerStarted}
              onStart={() => { setTimerStarted(true); setTimerRunning(true); }}
              onToggle={() => setTimerRunning((r) => !r)}
              onReset={() => { setTimerLeft(TIMER_START); setTimerRunning(false); setTimerStarted(false); }} />
            {done > 0 && (
              <>
                <div className="bar flex justify-between items-center px-3 py-3 text-sm font-bold">Avklarade uppgifter <Check className="size-5" /></div>
                {tasks.filter((t) => t.done).map((t) => (
                  <TaskRow key={t.id} t={t} onToggle={() => update(t.id, { done: false })} onMenu={() => { setEditing(t); setScreen("edit"); }} />
                ))}
              </>
            )}
            <div className="flex justify-center pt-6">
              <button onClick={() => setTasks((ts) => ts.filter((t) => !t.done))} className="bg-alert text-background text-sm font-bold px-5 py-2">Rensa uppgifter</button>
            </div>
          </div>
        )}

        {screen === "edit" && editing && (
          <div className="w-full mt-10 space-y-3">
            <div className="bar px-3 py-3 text-sm font-bold">Vad vill du göra?</div>
            {["Redigera rubrik", "Lägg till beskrivning", "Lägg till färgkod", "Prioritera uppgiften"].map((l) => (
              <button key={l} onClick={() => openForm(editing)} className="block w-full text-left bg-field text-navy text-sm font-semibold px-4 py-2">{l}</button>
            ))}
            <button onClick={() => { setTasks((ts) => ts.filter((t) => t.id !== editing.id)); setScreen("list"); }} className="block w-full text-left bg-field text-alert text-sm font-semibold px-4 py-2">Ta bort uppgiften</button>
            <div className="flex justify-center pt-8"><BarButton onClick={() => setScreen("list")}><ArrowLeft className="size-4" /> TILLBAKA</BarButton></div>
          </div>
        )}

        {screen === "form" && (
          <TaskForm initial={editing} onCancel={() => setScreen("list")} onSave={(t) => {
            setTasks((ts) => (ts.some((x) => x.id === t.id) ? ts.map((x) => (x.id === t.id ? t : x)) : [...ts, t]));
            setScreen("list");
          }} />
        )}
      </main>
    </div>
  );
}

function Planets({ pct }: { pct: number }) {
  return (
    <div className="bg-planets mt-4 w-full flex items-center gap-1 px-5 py-3 shadow-md">
      {PLANETS.map((c, i) => (
        <span key={i} className="size-6 rounded-full border border-foreground/30 transition-opacity"
          style={{ background: `radial-gradient(circle at 30% 30%, white -40%, ${c})`, opacity: pct >= (i / PLANETS.length) * 100 ? 1 : 0.45 }} />
      ))}
      <span className="ml-auto size-10 rounded-full" style={{ background: "radial-gradient(circle at 35% 35%, oklch(0.9 0.15 80), oklch(0.7 0.2 45))", boxShadow: "0 0 12px oklch(0.85 0.17 70)" }} />
    </div>
  );
}

function TaskRow({ t, onToggle, onMenu }: { t: Task; onToggle: () => void; onMenu: () => void }) {
  const P = PRIOS[t.priority];
  return (
    <div className="bg-field flex items-center gap-3 px-3 py-2 text-sm font-semibold text-navy" style={{ borderLeft: t.color ? `6px solid ${t.color}` : undefined }}>
      <button aria-label="Klar" onClick={onToggle} className="size-5 grid place-items-center bg-sun/40 shrink-0">{t.done && <Check className="size-4" />}</button>
      <div className="flex-1 min-w-0">
        <div className={t.done ? "line-through" : ""}>{t.title}</div>
        {t.desc && <div className="text-xs font-normal opacity-70 truncate">{t.desc}</div>}
      </div>
      {t.priority >= 0 && P && <P className="size-4" />}
      <button aria-label="Meny" onClick={onMenu}><MoreVertical className="size-4" /></button>
    </div>
  );
}

function TaskForm({ initial, onSave, onCancel }: { initial: Task | null; onSave: (t: Task) => void; onCancel: () => void }) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [desc, setDesc] = useState(initial?.desc ?? "");
  const [priority, setPriority] = useState(initial?.priority ?? -1);
  const [color, setColor] = useState(initial?.color ?? "");
  const field = "w-full bg-field text-navy text-sm px-3 py-2 outline-none placeholder:text-navy/50";
  return (
    <form className="w-full mt-10 space-y-3" onSubmit={(e) => {
      e.preventDefault();
      if (!title.trim()) return;
      onSave({ id: initial?.id ?? crypto.randomUUID(), done: initial?.done ?? false, title: title.trim(), desc, priority, color });
    }}>
      <div className="bar px-4 py-3 text-sm font-bold">{initial ? "Redigera uppgift" : "Lägg till en uppgift"}</div>
      <input autoFocus className={field} placeholder="Rubrik" value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea className={`${field} h-24 resize-none`} placeholder="Beskrivning" value={desc} onChange={(e) => setDesc(e.target.value)} />
      <div className={`${field} flex items-center justify-between`}>
        <span className="opacity-60">Prioritering</span>
        <div className="flex gap-2">{PRIOS.map((P, i) => (
          <button type="button" key={i} onClick={() => setPriority(priority === i ? -1 : i)} className={`p-1 rounded ${priority === i ? "bar" : ""}`}><P className="size-4" /></button>
        ))}</div>
      </div>
      <div className={`${field} flex items-center justify-between`}>
        <span className="opacity-60">Färgkod</span>
        <div className="flex gap-2">{COLORS.map((c) => (
          <button type="button" key={c} aria-label="Färg" onClick={() => setColor(color === c ? "" : c)} className={`size-4 rounded-full ${color === c ? "ring-2 ring-navy ring-offset-1" : ""}`} style={{ background: c }} />
        ))}</div>
      </div>
      <div className="pt-16 space-y-3">
        <BarButton type="submit" className="w-full">{initial ? "Spara uppgift" : "Lägg till ny uppgift"} <ArrowRight className="size-4" /></BarButton>
        <BarButton type="button" className="w-full" onClick={onCancel}><ArrowLeft className="size-4" /> Tillbaka</BarButton>
      </div>
    </form>
  );
}

function BarButton({ className = "", ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...p} className={`bar flex items-center justify-center gap-2 px-10 py-3 text-sm font-bold shadow-md hover:brightness-125 transition ${className}`} />;
}
