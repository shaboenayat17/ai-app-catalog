"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";
import {
  CATEGORIES,
  CATEGORY_META,
  type AIApp,
  type Category,
} from "@/lib/types";
import {
  USE_CASES,
  getUseCaseById,
  type UseCase,
  type MinimumStack,
  type MinimumStackApp,
  type StackBadge,
} from "@/lib/usecases";
import { AppDrawer } from "./AppDrawer";
import { useSavedStacks } from "@/hooks/useSavedStacks";

const CANVAS_ID = "workflow-canvas";
const NODE_W = 168;
const NODE_H = 92;
const MIN_NODE_W = 240;
const MIN_NODE_H = 156;

interface Node {
  appId: string;
  x: number;
  y: number;
}

interface Props {
  apps: AIApp[];
}

function encodeNodes(nodes: Node[]): string {
  return nodes
    .map((n) => `${n.appId}:${Math.round(n.x)}:${Math.round(n.y)}`)
    .join(",");
}

function decodeNodes(raw: string | null, apps: AIApp[]): Node[] {
  if (!raw) return [];
  const known = new Set(apps.map((a) => a.id));
  return raw
    .split(",")
    .map((part) => {
      const [appId, x, y] = part.split(":");
      const xn = Number(x);
      const yn = Number(y);
      if (!known.has(appId) || Number.isNaN(xn) || Number.isNaN(yn)) return null;
      return { appId, x: xn, y: yn };
    })
    .filter((n): n is Node => n !== null);
}

function defaultLayout(appIds: string[]): Node[] {
  const n = appIds.length;
  // Circular layout for small sets — visually inviting
  if (n <= 5) {
    const radius = n <= 3 ? 140 : 200;
    const centerX = 320;
    const centerY = 220;
    return appIds.map((id, i) => {
      const angle = (i / Math.max(n, 1)) * Math.PI * 2 - Math.PI / 2;
      return {
        appId: id,
        x: centerX + Math.cos(angle) * radius - NODE_W / 2,
        y: centerY + Math.sin(angle) * radius - NODE_H / 2,
      };
    });
  }
  // Grid layout — 3 rows for 7+ nodes so they fit horizontally
  const rows = n >= 7 ? 3 : 2;
  const cols = Math.ceil(n / rows);
  const colSpacing = 180;
  const rowSpacing = 170;
  const startX = 40;
  const startY = 40;
  return appIds.map((id, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    return {
      appId: id,
      x: startX + col * colSpacing,
      y: startY + row * rowSpacing,
    };
  });
}

function layoutForUseCase(uc: UseCase): Node[] {
  if (uc.stages) {
    return uc.stages.flatMap((s) =>
      s.apps.map((a) => ({ appId: a.id, x: a.x, y: a.y })),
    );
  }
  return defaultLayout(uc.appIds);
}

function minStackLayout(stack: MinimumStack): Node[] {
  const n = stack.apps.length;
  if (n === 1) {
    return [{ appId: stack.apps[0].appId, x: 220, y: 240 }];
  }
  if (n === 2) {
    return [
      { appId: stack.apps[0].appId, x: 50, y: 240 },
      { appId: stack.apps[1].appId, x: 360, y: 240 },
    ];
  }
  return stack.apps.map((a, i) => ({
    appId: a.appId,
    x: 30 + i * 280,
    y: 240,
  }));
}

export function WorkflowCanvas({ apps }: Props) {
  const router = useRouter();
  const params = useSearchParams();

  const initialUseCaseId = params.get("useCase");
  const initialMinMode = params.get("min") === "1";
  const [selectedUseCaseId, setSelectedUseCaseId] = useState<string | null>(
    initialUseCaseId,
  );
  const [minStackMode, setMinStackMode] = useState<boolean>(initialMinMode);

  const [nodes, setNodes] = useState<Node[]>(() => {
    const fromParams = decodeNodes(params.get("nodes"), apps);
    if (fromParams.length) return fromParams;
    const uc = getUseCaseById(initialUseCaseId);
    if (!uc) return [];
    if (initialMinMode && uc.minimumStack) return minStackLayout(uc.minimumStack);
    return layoutForUseCase(uc);
  });

  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [pulse, setPulse] = useState<{ id: string; key: number } | null>(null);
  const [paletteQuery, setPaletteQuery] = useState("");
  const [paletteCat, setPaletteCat] = useState<Category | "all">("all");
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const triggerPulse = (id: string) => {
    setPulse({ id, key: Date.now() });
    window.setTimeout(() => {
      setPulse((p) => (p && p.key && p.id === id ? null : p));
    }, 1700);
  };

  const nodesOnCanvas = useMemo(
    () => new Set(nodes.map((n) => n.appId)),
    [nodes],
  );

  // Sync URL
  useEffect(() => {
    const qs = new URLSearchParams();
    if (selectedUseCaseId) qs.set("useCase", selectedUseCaseId);
    if (minStackMode) qs.set("min", "1");
    if (nodes.length) qs.set("nodes", encodeNodes(nodes));
    const s = qs.toString();
    router.replace(`/workflow${s ? `?${s}` : ""}`, { scroll: false });
  }, [nodes, selectedUseCaseId, minStackMode, router]);

  const selectedUseCase = getUseCaseById(selectedUseCaseId);
  const minStack = minStackMode ? selectedUseCase?.minimumStack ?? null : null;
  const stackAppMap = useMemo(() => {
    const map = new Map<string, MinimumStackApp>();
    if (minStack) {
      for (const a of minStack.apps) map.set(a.appId, a);
    }
    return map;
  }, [minStack]);

  const toggleMinMode = () => {
    if (!selectedUseCase) return;
    const next = !minStackMode;
    setMinStackMode(next);
    setSelectedAppId(null);
    if (next && selectedUseCase.minimumStack) {
      setNodes(minStackLayout(selectedUseCase.minimumStack));
    } else {
      setNodes(layoutForUseCase(selectedUseCase));
    }
  };

  const filteredPalette = useMemo(() => {
    const q = paletteQuery.trim().toLowerCase();
    return apps.filter((a) => {
      if (paletteCat !== "all" && a.category !== paletteCat) return false;
      if (q) {
        const hay = `${a.name} ${a.description}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [apps, paletteQuery, paletteCat]);

  const onCaseSelect = (id: string) => {
    if (!id) {
      setSelectedUseCaseId(null);
      setMinStackMode(false);
      return;
    }
    const uc = getUseCaseById(id);
    if (!uc) return;
    setSelectedUseCaseId(id);
    if (minStackMode && uc.minimumStack) {
      setNodes(minStackLayout(uc.minimumStack));
    } else {
      setNodes(layoutForUseCase(uc));
    }
    setSelectedAppId(null);
  };

  const addNodeAtCenter = (appId: string) => {
    setNodes((prev) => {
      if (prev.some((n) => n.appId === appId)) return prev;
      // place near center, with slight offset based on count
      const offset = prev.length * 18;
      return [...prev, { appId, x: 320 + offset, y: 200 + offset }];
    });
  };

  const removeNode = (appId: string) => {
    setNodes((prev) => prev.filter((n) => n.appId !== appId));
    if (selectedAppId === appId) setSelectedAppId(null);
  };

  const clearCanvas = () => {
    setNodes([]);
    setSelectedAppId(null);
    setSelectedUseCaseId(null);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const canvasRef = useRef<HTMLDivElement | null>(null);

  const onDragStart = (e: DragStartEvent) => setActiveDragId(String(e.active.id));

  const onDragEnd = (e: DragEndEvent) => {
    const id = String(e.active.id);
    setActiveDragId(null);
    if (id.startsWith("palette:")) {
      const appId = id.slice("palette:".length);
      if (e.over?.id === CANVAS_ID) {
        const overRect = e.over.rect;
        const draggedRect = e.active.rect.current.translated;
        if (overRect && draggedRect) {
          const x = draggedRect.left - overRect.left + draggedRect.width / 2 - NODE_W / 2;
          const y = draggedRect.top - overRect.top + draggedRect.height / 2 - NODE_H / 2;
          setNodes((prev) => {
            if (prev.some((n) => n.appId === appId)) return prev;
            return [...prev, { appId, x: Math.max(8, x), y: Math.max(8, y) }];
          });
        } else {
          addNodeAtCenter(appId);
        }
      }
    } else if (id.startsWith("node:")) {
      const appId = id.slice("node:".length);
      setNodes((prev) =>
        prev.map((n) =>
          n.appId === appId
            ? { ...n, x: Math.max(0, n.x + e.delta.x), y: Math.max(0, n.y + e.delta.y) }
            : n,
        ),
      );
    }
  };

  // Build compatibility lines: unique unordered pairs where one lists the other
  const lines = useMemo(() => {
    const out: Array<{ a: Node; b: Node; color: string }> = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const appA = apps.find((x) => x.id === a.appId);
        const appB = apps.find((x) => x.id === b.appId);
        if (!appA || !appB) continue;
        if (
          appA.compatibleWith.includes(b.appId) ||
          appB.compatibleWith.includes(a.appId)
        ) {
          out.push({ a, b, color: CATEGORY_META[appA.category].hex });
        }
      }
    }
    return out;
  }, [nodes, apps]);

  const selectedApp = selectedAppId
    ? apps.find((a) => a.id === selectedAppId) ?? null
    : null;

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  const { save: saveStack } = useSavedStacks();
  const [savedFlash, setSavedFlash] = useState(false);
  const handleSaveStack = () => {
    if (nodes.length === 0) return;
    const title = selectedUseCase
      ? `${selectedUseCase.label}${minStackMode ? " (min)" : ""}`
      : `Custom stack (${nodes.length} apps)`;
    saveStack({
      title,
      appIds: nodes.map((n) => n.appId),
      useCaseId: selectedUseCaseId,
      minMode: minStackMode,
    });
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1800);
  };

  const draggingApp = (() => {
    if (!activeDragId) return null;
    const [, ...rest] = activeDragId.split(":");
    const appId = rest.join(":");
    return apps.find((a) => a.id === appId) ?? null;
  })();

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      {/* Top toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-bg-card/70 px-3 py-3 backdrop-blur sm:px-4">
        <label className="flex items-center gap-2 text-xs text-muted">
          <span className="hidden sm:inline">Use case</span>
          <select
            onChange={(e) => onCaseSelect(e.target.value)}
            value={selectedUseCaseId ?? ""}
            className="rounded-md border border-border bg-bg px-3 py-2 text-sm text-white outline-none transition hover:border-accent/40 focus:border-accent/60"
          >
            <option value="">— Pick a workflow —</option>
            {USE_CASES.map((u) => (
              <option key={u.id} value={u.id}>
                {u.emoji} {u.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={toggleMinMode}
          disabled={!selectedUseCase || !selectedUseCase.minimumStack}
          aria-pressed={minStackMode}
          title={
            !selectedUseCase
              ? "Pick a use case first"
              : minStackMode
              ? "Switch back to the full stack"
              : "Show the leanest possible stack"
          }
          className={clsx(
            "press inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
            minStackMode
              ? "border-emerald-400/60 bg-emerald-500/15 text-emerald-100 shadow-[0_0_18px_rgba(52,211,153,0.25)]"
              : "border-border bg-bg-card text-muted-strong hover:border-accent/40 hover:text-white",
            (!selectedUseCase || !selectedUseCase.minimumStack) &&
              "cursor-not-allowed opacity-40 hover:border-border hover:text-muted-strong",
          )}
        >
          <span aria-hidden>{minStackMode ? "💰" : "🧰"}</span>
          {minStackMode ? "Minimum Stack" : "Full Stack"}
        </button>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted">{nodes.length} on canvas · {lines.length} links</span>
          <button
            onClick={handleSaveStack}
            disabled={nodes.length === 0}
            className={clsx(
              "press inline-flex min-h-[36px] items-center rounded-md border px-3 text-xs transition",
              savedFlash
                ? "border-emerald-400/60 bg-emerald-500/15 text-emerald-100"
                : "border-border bg-bg-card text-muted-strong hover:border-accent/40 hover:text-white",
              nodes.length === 0 && "cursor-not-allowed opacity-40",
            )}
          >
            {savedFlash ? "💾 Saved!" : "💾 Save stack"}
          </button>
          <button
            onClick={share}
            className="press inline-flex min-h-[36px] items-center rounded-md border border-border bg-bg-card px-3 text-xs text-muted-strong hover:border-accent/40 hover:text-white"
          >
            {copied ? "Link copied!" : "Share"}
          </button>
          <button
            onClick={clearCanvas}
            className="press inline-flex min-h-[36px] items-center rounded-md border border-border bg-bg-card px-3 text-xs text-muted-strong hover:border-rose-400/40 hover:text-white"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
        {/* Palette */}
        <aside className="rounded-xl border border-border bg-bg-card/70 p-3">
          <input
            type="search"
            value={paletteQuery}
            onChange={(e) => setPaletteQuery(e.target.value)}
            placeholder="Search apps to drag…"
            className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-white placeholder:text-muted outline-none focus:border-accent/60"
          />
          <div className="mt-2 flex flex-wrap gap-1">
            <CatChip
              label="all"
              active={paletteCat === "all"}
              onClick={() => setPaletteCat("all")}
            />
            {CATEGORIES.map((c) => {
              const m = CATEGORY_META[c];
              return (
                <button
                  key={c}
                  onClick={() => setPaletteCat(c)}
                  className={clsx(
                    "press inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] transition",
                    paletteCat === c ? m.pillActive : m.pillIdle,
                  )}
                  title={c}
                >
                  <span aria-hidden>{m.emoji}</span>
                </button>
              );
            })}
          </div>
          <ul className="mt-3 max-h-[60vh] space-y-1.5 overflow-y-auto pr-1">
            {filteredPalette.map((a) => (
              <PaletteItem key={a.id} app={a} onAdd={addNodeAtCenter} />
            ))}
            {filteredPalette.length === 0 && (
              <li className="px-2 py-4 text-center text-xs text-muted">
                No apps match.
              </li>
            )}
          </ul>
        </aside>

        {/* Canvas */}
        <div className="relative">
          {minStackMode && minStack && selectedUseCase ? (
            <SavingsBanner
              minStack={minStack}
              fullCount={selectedUseCase.appIds.length}
            />
          ) : (
            selectedUseCase?.steps &&
            selectedUseCase.steps.length > 0 && (
              <StepIndicator useCase={selectedUseCase} />
            )
          )}
          <CanvasDroppable
            canvasRef={canvasRef}
            onBackgroundClick={() => setSelectedAppId(null)}
          >
            <div className="absolute inset-0 canvas-grid" />
            {/* SVG lines layer */}
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full"
              aria-hidden
            >
              {lines.map(({ a, b, color }, i) => {
                const aSize = stackAppMap.has(a.appId)
                  ? { w: MIN_NODE_W, h: MIN_NODE_H }
                  : { w: NODE_W, h: NODE_H };
                const bSize = stackAppMap.has(b.appId)
                  ? { w: MIN_NODE_W, h: MIN_NODE_H }
                  : { w: NODE_W, h: NODE_H };
                const x1 = a.x + aSize.w / 2;
                const y1 = a.y + aSize.h / 2;
                const x2 = b.x + bSize.w / 2;
                const y2 = b.y + bSize.h / 2;
                const pathId = `wf-line-${i}`;
                return (
                  <g key={i}>
                    <path
                      id={pathId}
                      d={`M ${x1} ${y1} L ${x2} ${y2}`}
                      stroke={color}
                      strokeWidth={minStackMode ? 3 : 1.6}
                      strokeOpacity={minStackMode ? 0.75 : 0.55}
                      fill="none"
                    />
                    <circle r={minStackMode ? 4.5 : 3.2} fill={color}>
                      <animateMotion dur="2.4s" repeatCount="indefinite">
                        <mpath href={`#${pathId}`} />
                      </animateMotion>
                    </circle>
                  </g>
                );
              })}
            </svg>

            {/* Nodes */}
            {nodes.map((node) => {
              const app = apps.find((a) => a.id === node.appId);
              if (!app) return null;
              const stackApp = stackAppMap.get(node.appId) ?? null;
              return (
                <CanvasNode
                  key={node.appId}
                  node={node}
                  app={app}
                  selected={selectedAppId === node.appId}
                  pulseKey={pulse?.id === node.appId ? pulse.key : null}
                  minMode={minStackMode && stackApp !== null}
                  badges={stackApp?.badges ?? null}
                  onClick={() => setSelectedAppId(node.appId)}
                  onRemove={() => removeNode(node.appId)}
                />
              );
            })}

            {nodes.length === 0 && (
              <div className="pointer-events-none absolute inset-0 grid place-items-center px-6 text-center text-sm text-muted">
                <div className="max-w-md">
                  <p className="text-base font-medium text-white">Build your AI stack</p>
                  <p className="mt-1">
                    Pick a use case, or drag apps from the left onto the canvas.
                    Compatible apps will auto-connect with glowing lines.
                  </p>
                </div>
              </div>
            )}
          </CanvasDroppable>

        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {draggingApp ? <DragGhost app={draggingApp} /> : null}
      </DragOverlay>

      <AppDrawer
        app={selectedApp}
        apps={apps}
        nodesOnCanvas={nodesOnCanvas}
        selectedUseCase={selectedUseCase}
        minStackApp={
          minStackMode && selectedAppId
            ? stackAppMap.get(selectedAppId) ?? null
            : null
        }
        onClose={() => setSelectedAppId(null)}
        onSwitchTo={(id) => setSelectedAppId(id)}
        onAddToCanvas={(id) => addNodeAtCenter(id)}
        onPulse={(id) => triggerPulse(id)}
      />
    </DndContext>
  );
}

function CanvasDroppable({
  children,
  canvasRef,
  onBackgroundClick,
}: {
  children: React.ReactNode;
  canvasRef: React.MutableRefObject<HTMLDivElement | null>;
  onBackgroundClick?: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: CANVAS_ID });
  return (
    <div
      ref={(el) => {
        setNodeRef(el);
        canvasRef.current = el;
      }}
      onClick={onBackgroundClick}
      className={clsx(
        "relative h-[640px] overflow-hidden rounded-xl border bg-bg/60 transition",
        isOver ? "border-accent/60 shadow-glow" : "border-border",
      )}
    >
      {children}
    </div>
  );
}

function CanvasNode({
  node,
  app,
  selected,
  pulseKey,
  minMode,
  badges,
  onClick,
  onRemove,
}: {
  node: Node;
  app: AIApp;
  selected: boolean;
  pulseKey: number | null;
  minMode: boolean;
  badges: StackBadge[] | null;
  onClick: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: `node:${app.id}` });
  const m = CATEGORY_META[app.category];
  const w = minMode ? MIN_NODE_W : NODE_W;
  const h = minMode ? MIN_NODE_H : NODE_H;
  const showLoop = minMode && badges !== null && badges.length > 1;

  return (
    <div
      ref={setNodeRef}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "absolute",
        left: node.x,
        top: node.y,
        width: w,
        height: h,
        transform: CSS.Translate.toString(transform),
        zIndex: selected ? 20 : 10,
        ...(selected
          ? { boxShadow: `0 0 0 2px ${m.hex}, 0 0 28px ${m.hex}66` }
          : {}),
      }}
      className={clsx(
        "rounded-xl border bg-bg-elevated p-3 text-left shadow-lift animate-fade-in-up",
        !isDragging && "transition-all duration-300 ease-out",
        selected ? "border-transparent" : "border-border hover:border-accent/40",
        isDragging && "opacity-80 cursor-grabbing",
      )}
    >
      {pulseKey !== null && (
        <span
          key={pulseKey}
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-xl animate-pulse-ring"
          style={{ ["--pulse-color" as string]: `${m.hex}b3` } as CSSProperties}
        />
      )}
      <div className="mb-1 flex items-start justify-between gap-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Drag ${app.name}`}
          className="cursor-grab text-muted hover:text-white active:cursor-grabbing"
        >
          <DragIcon />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label={`Remove ${app.name}`}
          className="text-muted hover:text-rose-400"
        >
          ×
        </button>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className="block w-full text-left"
      >
        <div className="flex items-center gap-2">
          <span aria-hidden className={clsx("grid h-7 w-7 place-items-center rounded-md text-sm", m.badge)}>
            {m.emoji}
          </span>
          <span className="text-sm font-semibold leading-tight text-white">
            {app.name}
          </span>
        </div>
        <p className="mt-1 truncate text-[10px] uppercase tracking-wider text-muted">
          {app.category}
        </p>
        {minMode && badges && badges.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {badges.map((b, i) => (
              <span
                key={i}
                className={clsx(
                  "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium",
                  m.badge,
                )}
              >
                <span aria-hidden>{b.emoji}</span>
                <span>{b.label}</span>
              </span>
            ))}
          </div>
        )}
      </button>
      {showLoop && (
        <span
          aria-hidden
          title={`Does ${badges?.length ?? 0} jobs in this stack`}
          className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full border-2 bg-bg-elevated"
          style={{ borderColor: m.hex, color: m.hex }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path
              d="M3 8a5 5 0 0 1 9-3"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M12 2.5V5.5H9"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M13 8a5 5 0 0 1-9 3"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              fill="none"
              opacity="0.5"
            />
            <path
              d="M4 13.5V10.5H7"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              opacity="0.5"
            />
          </svg>
        </span>
      )}
    </div>
  );
}

function PaletteItem({
  app,
  onAdd,
}: {
  app: AIApp;
  onAdd: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: `palette:${app.id}` });
  const m = CATEGORY_META[app.category];

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={clsx(
        "flex items-center gap-2 rounded-md border border-border bg-bg-card px-2 py-1.5 transition hover:border-accent/40",
        isDragging && "opacity-40",
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Drag ${app.name} to canvas`}
        className="cursor-grab text-muted hover:text-white active:cursor-grabbing"
      >
        <DragIcon />
      </button>
      <span aria-hidden className={clsx("grid h-6 w-6 place-items-center rounded text-sm", m.badge)}>
        {m.emoji}
      </span>
      <button
        type="button"
        onClick={() => onAdd(app.id)}
        className="flex-1 truncate text-left text-xs text-white hover:text-accent"
        title={`Add ${app.name}`}
      >
        {app.name}
      </button>
    </li>
  );
}

function CatChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "press inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] transition",
        active
          ? "border-accent/60 bg-accent/15 text-white"
          : "border-border bg-bg-card text-muted hover:border-accent/40 hover:text-white",
      )}
    >
      {label}
    </button>
  );
}

function DragGhost({ app }: { app: AIApp }) {
  const m = CATEGORY_META[app.category];
  return (
    <div className={clsx("flex items-center gap-2 rounded-xl border bg-bg-elevated px-3 py-2 shadow-lift", m.badge)}>
      <span aria-hidden>{m.emoji}</span>
      <span className="text-sm font-medium text-white">{app.name}</span>
    </div>
  );
}

function DragIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
      <circle cx="4" cy="3" r="1" fill="currentColor" />
      <circle cx="4" cy="7" r="1" fill="currentColor" />
      <circle cx="4" cy="11" r="1" fill="currentColor" />
      <circle cx="10" cy="3" r="1" fill="currentColor" />
      <circle cx="10" cy="7" r="1" fill="currentColor" />
      <circle cx="10" cy="11" r="1" fill="currentColor" />
    </svg>
  );
}

function parseDollarRange(s: string): [number, number] {
  // Matches "$0–$20/mo" or "$10/mo" etc.
  const m = s.match(/\$(\d+)(?:[\s–—\-]+\$?(\d+))?/);
  if (!m) return [0, 0];
  const min = +m[1];
  const max = m[2] ? +m[2] : min;
  return [min, max];
}

function totalCostRange(minStack: MinimumStack): string {
  let lo = 0;
  let hi = 0;
  for (const a of minStack.apps) {
    const [l, h] = parseDollarRange(a.monthlyCost);
    lo += l;
    hi += h;
  }
  if (lo === hi) return `$${lo}/mo`;
  return `$${lo}–$${hi}/mo`;
}

function SavingsBanner({
  minStack,
  fullCount,
}: {
  minStack: MinimumStack;
  fullCount: number;
}) {
  const [open, setOpen] = useState(false);
  const minCount = minStack.apps.length;
  const saved = Math.max(0, fullCount - minCount);
  const total = totalCostRange(minStack);
  return (
    <div className="relative mb-3 flex flex-wrap items-start justify-between gap-3 rounded-xl border border-emerald-400/40 bg-gradient-to-br from-emerald-500/15 via-bg-card to-teal-500/10 px-4 py-3 animate-fade-in-up">
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold text-emerald-100">
          <span aria-hidden>💰</span>
          Minimum Stack — {minCount} {minCount === 1 ? "app" : "apps"}, covers all steps
          <span className="rounded-full bg-emerald-500/25 px-2 py-0.5 text-[11px] font-bold text-emerald-100">
            Total: {total}
          </span>
        </p>
        <p className="mt-0.5 text-xs text-emerald-200/80">
          vs Full Stack ({fullCount} apps) — using {saved} fewer{" "}
          {saved === 1 ? "app" : "apps"}
        </p>
        {minStack.note && (
          <p className="mt-1 text-xs italic text-emerald-100/80">
            {minStack.note}
          </p>
        )}
      </div>
      <div className="relative shrink-0">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="press rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-medium text-emerald-100 transition hover:bg-emerald-500/25"
        >
          Why these apps?
        </button>
        {open && (
          <div
            role="dialog"
            className="absolute right-0 top-full z-30 mt-2 w-72 rounded-lg border border-border bg-bg-elevated p-3 text-xs leading-relaxed text-muted-strong shadow-lift animate-scale-in"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                Selection criteria
              </span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="text-muted hover:text-white"
              >
                ×
              </button>
            </div>
            <p>{minStack.rationale}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StepIndicator({ useCase }: { useCase: UseCase }) {
  const steps = useCase.steps ?? [];
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-accent/30 bg-gradient-to-r from-accent/10 via-bg-card to-cyan-500/10 px-3 py-2 animate-fade-in-up">
      <span className="flex items-center gap-1.5 pr-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
        <span aria-hidden>{useCase.emoji}</span>
        {useCase.label}
      </span>
      <div className="h-3 w-px bg-border" />
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-1.5">
        {steps.map((step, i) => (
          <li key={i} className="flex items-center gap-1">
            {i > 0 && (
              <svg
                aria-hidden
                width="10"
                height="10"
                viewBox="0 0 10 10"
                className="text-muted"
              >
                <path
                  d="M3 1l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-bg-card/80 px-2.5 py-0.5 text-xs">
              <span className="font-mono text-[10px] text-accent">{i + 1}</span>
              <span className="text-white">{step}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
