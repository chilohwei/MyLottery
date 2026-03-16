"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { DEFAULT_RECIPIENT_AVATAR, type LotteryConfig, type Gift, type LotteryTheme } from "@/types/lottery";

type Phase = "intro" | "slides" | "wheel" | "result";

const THEME_PRESETS: Record<
  LotteryTheme,
  { background: string; confettiColors: string[]; tone: "light" | "dark" }
> = {
  warm: {
    background: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
    confettiColors: ["#fed6e3", "#a8edea", "#ffeaa7", "#c0aede", "#f9a8d4"],
    tone: "light",
  },
  sunset: {
    background: "linear-gradient(135deg, #f5e6cc 0%, #e8dff5 50%, #a8edea 100%)",
    confettiColors: ["#ffd7a8", "#ffb4a2", "#e5b3ff", "#a8edea", "#ffeaa7"],
    tone: "light",
  },
  ocean: {
    background: "linear-gradient(145deg, #c7f0ff 0%, #d8fff4 45%, #e3f3ff 100%)",
    confettiColors: ["#7dd3fc", "#67e8f9", "#86efac", "#c4b5fd", "#a8edea"],
    tone: "light",
  },
  night: {
    background: "linear-gradient(145deg, #0f172a 0%, #1e1b4b 45%, #312e81 100%)",
    confettiColors: ["#f9a8d4", "#a5b4fc", "#67e8f9", "#fde68a", "#c4b5fd"],
    tone: "dark",
  },
  forest: {
    background: "linear-gradient(145deg, #0f2a22 0%, #123a2f 45%, #1d5a45 100%)",
    confettiColors: ["#86efac", "#a7f3d0", "#67e8f9", "#fde68a", "#c4b5fd"],
    tone: "dark",
  },
  candy: {
    background: "linear-gradient(145deg, #ffd6f0 0%, #ffe7a3 45%, #c7f0ff 100%)",
    confettiColors: ["#ff8ec7", "#ffd166", "#7dd3fc", "#c4b5fd", "#86efac"],
    tone: "light",
  },
  minimal: {
    background: "linear-gradient(145deg, #f6f8fb 0%, #eef2f7 50%, #e5ebf3 100%)",
    confettiColors: ["#cbd5e1", "#94a3b8", "#c4b5fd", "#93c5fd", "#a7f3d0"],
    tone: "light",
  },
  gold: {
    background: "linear-gradient(145deg, #3a1f0f 0%, #7a4a1f 45%, #c08a3d 100%)",
    confettiColors: ["#fde68a", "#f59e0b", "#fca5a5", "#c4b5fd", "#a7f3d0"],
    tone: "dark",
  },
};
const ENTRANCE_CONFETTI_X_ORIGINS = [
  0.14, 0.22, 0.3, 0.38, 0.46, 0.54, 0.62, 0.7, 0.78, 0.86,
];
const ENTRANCE_CONFETTI_EXTRA_X_ORIGINS = [0.18, 0.34, 0.5, 0.66, 0.82];
const SpinWheel = dynamic(() => import("@/components/shared/spin-wheel").then((m) => m.SpinWheel), { ssr: false });
const SlotMachine = dynamic(() => import("@/components/shared/slot-machine").then((m) => m.SlotMachine), { ssr: false });
const FlipCards = dynamic(() => import("@/components/shared/flip-cards").then((m) => m.FlipCards), { ssr: false });
const BlindBox = dynamic(() => import("@/components/shared/blind-box").then((m) => m.BlindBox), { ssr: false });
const ScratchCard = dynamic(() => import("@/components/shared/scratch-card").then((m) => m.ScratchCard), { ssr: false });
type ConfettiFn = (opts?: Record<string, unknown>) => void;
type ScopedConfetti = { (opts?: Record<string, unknown>): void; reset: () => void };

interface LotteryViewProps {
  config: LotteryConfig;
  title: string;
  interactive?: boolean;
  autoPlay?: boolean;
  hideTitle?: boolean;
  /** Use real device safe-area insets instead of fixed phone-frame padding */
  safeArea?: boolean;
  /** When provided, draw results are persisted to prize_logs via API */
  lotteryId?: string;
  /** Force show replay control for preview/debug usage */
  showReplayControl?: boolean;
}

export function LotteryView({
  config,
  title,
  interactive = false,
  autoPlay = false,
  hideTitle = false,
  safeArea = false,
  lotteryId,
  showReplayControl = false,
}: LotteryViewProps) {
  const padTop = safeArea ? "pt-[max(env(safe-area-inset-top,20px),20px)]" : "pt-[40px]";
  const padBottom = safeArea ? "pb-[max(env(safe-area-inset-bottom,16px),16px)]" : "pb-[28px]";
  const pad = `${padTop} ${padBottom}`;
  const gifts = config.gifts ?? [];
  const slides = config.slides ?? [];
  const hasGifts = gifts.length > 0;
  const showPrizeList = config.showPrizeList ?? false;
  const allowRetry = config.allowRetry ?? false;
  const gameType = config.gameType ?? "wheel";
  const theme = config.theme ?? "warm";
  const themePreset = THEME_PRESETS[theme];
  const isDarkTheme = themePreset.tone === "dark";

  const [phase, setPhase] = useState<Phase>(autoPlay ? "intro" : "wheel");
  const [showPhoto, setShowPhoto] = useState(!autoPlay);
  const [showTitle, setShowTitle] = useState(!autoPlay);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [slideVisible, setSlideVisible] = useState(false);
  const [result, setResult] = useState<Gift | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const confettiRef = useRef<ConfettiFn | null>(null);
  const confettiReadyRef = useRef(false);
  const syncConfettiCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const targetW = Math.max(1, Math.floor(rect.width * dpr));
    const targetH = Math.max(1, Math.floor(rect.height * dpr));
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;
    import("canvas-confetti").then((mod) => {
      if (cancelled) return;
      const create = (mod.default as unknown as { create: (canvas?: HTMLCanvasElement, opts?: Record<string, unknown>) => ScopedConfetti }).create;
      if (canvasRef.current) {
        syncConfettiCanvasSize();
        confettiRef.current = create(canvasRef.current, { resize: true, useWorker: true });
        requestAnimationFrame(() => {
          if (!cancelled) syncConfettiCanvasSize();
        });
      } else {
        confettiRef.current = mod.default as unknown as ConfettiFn;
      }
      confettiReadyRef.current = true;
    }).catch((err) => { console.error("load confetti failed", err); });
    return () => {
      cancelled = true;
      mountedRef.current = false;
      const fn = confettiRef.current as ScopedConfetti | null;
      fn?.reset?.();
    };
  }, [syncConfettiCanvasSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => {
      syncConfettiCanvasSize();
    });
    observer.observe(canvas);
    syncConfettiCanvasSize();
    return () => observer.disconnect();
  }, [syncConfettiCanvasSize]);

  const recipientPhoto = config.recipientPhoto || DEFAULT_RECIPIENT_AVATAR;

  const clearTimer = () => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  };

  const fireConfetti = useCallback((opts?: Record<string, unknown>) => {
    if (!mountedRef.current || !confettiReadyRef.current || !confettiRef.current) return;
    confettiRef.current({
      particleCount: 72,
      spread: 62,
      origin: { y: 0.5 },
      colors: themePreset.confettiColors,
      ...opts,
    } as Record<string, unknown>);
  }, [themePreset]);

  const fireEntranceConfetti = useCallback(() => {
    if (!mountedRef.current || !confettiReadyRef.current || !confettiRef.current) return;
    ENTRANCE_CONFETTI_X_ORIGINS.forEach((originX, i) => {
      window.setTimeout(() => {
        if (!mountedRef.current) return;
        fireConfetti({
          particleCount: 18,
          angle: 90,
          spread: 44,
          startVelocity: 12 + Math.random() * 7,
          gravity: 0.95,
          drift: (Math.random() - 0.5) * 0.6,
          ticks: 320,
          scalar: 0.95 + Math.random() * 0.25,
          origin: {
            x: originX,
            y: -0.08 + Math.random() * 0.08,
          },
        });
      }, i * 55);
    });

    ENTRANCE_CONFETTI_EXTRA_X_ORIGINS.forEach((originX, i) => {
      window.setTimeout(() => {
        if (!mountedRef.current) return;
        fireConfetti({
          particleCount: 12,
          angle: 90,
          spread: 36,
          startVelocity: 11 + Math.random() * 5,
          gravity: 0.98,
          drift: (Math.random() - 0.5) * 0.5,
          ticks: 300,
          scalar: 0.9 + Math.random() * 0.2,
          origin: {
            x: originX,
            y: -0.06 + Math.random() * 0.05,
          },
        });
      }, 90 + i * 70);
    });
  }, [fireConfetti]);

  const typeSlide = useCallback((text: string, onDone: () => void) => {
    let idx = 0;
    setTypedText("");
    setSlideVisible(true);
    const typeNext = () => {
      if (!mountedRef.current) return;
      if (idx <= text.length) {
        setTypedText(text.slice(0, idx));
        idx++;
        timerRef.current = setTimeout(typeNext, 55 + Math.random() * 25);
      } else {
        timerRef.current = setTimeout(() => {
          if (!mountedRef.current) return;
          setSlideVisible(false);
          timerRef.current = setTimeout(onDone, 500);
        }, 1000);
      }
    };
    timerRef.current = setTimeout(typeNext, 300);
  }, []);

  const runSlides = useCallback((idx: number) => {
    if (!mountedRef.current) return;
    if (idx >= slides.length) {
      fireEntranceConfetti();
      timerRef.current = setTimeout(() => {
        if (!mountedRef.current) return;
        setPhase("wheel");
      }, 1450);
      return;
    }
    setCurrentSlide(idx);
    typeSlide(slides[idx], () => runSlides(idx + 1));
  }, [slides, typeSlide, fireEntranceConfetti]);

  const transitionFromIntro = useCallback(() => {
    if (slides.length > 0) {
      setPhase("slides");
      runSlides(0);
    } else {
      fireEntranceConfetti();
      timerRef.current = setTimeout(() => {
        if (!mountedRef.current) return;
        setPhase("wheel");
      }, 1450);
    }
  }, [slides, runSlides, fireEntranceConfetti]);

  const runIntro = useCallback(() => {
    clearTimer();
    setPhase("intro");
    setShowPhoto(false);
    setShowTitle(false);
    setCurrentSlide(0);
    setTypedText("");
    setSlideVisible(false);
    setResult(null);

    timerRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      setShowPhoto(true);
      timerRef.current = setTimeout(() => {
        if (!mountedRef.current) return;
        setShowTitle(true);
        timerRef.current = setTimeout(() => {
          if (!mountedRef.current) return;
          transitionFromIntro();
        }, 1500);
      }, recipientPhoto ? 800 : 300);
    }, 400);
  }, [recipientPhoto, transitionFromIntro]);

  useEffect(() => {
    if (autoPlay) runIntro();
    return clearTimer;
  }, [autoPlay, runIntro]);

  const handleResult = useCallback((gift: Gift, opts?: { inline?: boolean }) => {
    setResult(gift);
    fireConfetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    if (!opts?.inline) {
      setPhase("result");
    }
    if (lotteryId) {
      fetch(`/api/lottery/${lotteryId}/draw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prize: gift.id,
          prize_text: gift.text,
          prize_icon: gift.icon,
        }),
      }).catch((err) => {
        console.error("Failed to log prize", err);
      });
    }
  }, [fireConfetti, lotteryId]);

  return (
    <div className="flex flex-col h-full relative overflow-hidden" style={{ background: themePreset.background }}>
      <canvas ref={canvasRef} className="absolute inset-0 z-[60] h-full w-full pointer-events-none" />

      {/* ── INTRO ── */}
      <div className={cn(
        `absolute inset-0 z-30 flex flex-col items-center justify-center px-8 ${pad} transition-all duration-700`,
        phase === "intro" ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        <div className={cn("mb-5 transition-all duration-1000", showPhoto ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-6 scale-90")}>
          <img src={recipientPhoto} alt="" loading="eager" decoding="async" className="w-24 h-24 rounded-full object-cover ring-4 ring-white/50 shadow-lg bg-white/50" />
        </div>
        {!hideTitle ? (
          <h1 className={cn(
            "text-xl font-bold text-center leading-snug transition-all duration-700",
            isDarkTheme ? "text-white" : "text-foreground",
            showTitle ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            {title || "✨ 抽奖活动 ✨"}
          </h1>
        ) : null}
        {(config.senderName || config.senderAvatar) ? (
          <div className={cn("flex items-center gap-1.5 mt-2 transition-all duration-500", showTitle ? "opacity-100" : "opacity-0")}>
            {config.senderAvatar ? <img src={config.senderAvatar} alt="" loading="lazy" decoding="async" className="w-5 h-5 rounded-full object-cover ring-1 ring-white/40 bg-white/50" /> : null}
            {config.senderName ? (
              <p className={cn("text-xs", isDarkTheme ? "text-white/80" : "text-muted-foreground")}>
                来自 {config.senderName}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* ── SLIDES ── */}
      <div className={cn(
        `absolute inset-0 z-20 flex items-center justify-center px-10 ${pad} transition-all duration-500`,
        phase === "slides" ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        <p className={cn(
          "text-base text-center leading-relaxed whitespace-pre-line transition-all duration-500",
          isDarkTheme ? "text-white/90" : "text-foreground/70",
          slideVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        )}>
          {typedText}
          {phase === "slides" && slideVisible && typedText.length < (slides[currentSlide]?.length ?? 0) && (
            <span className={cn("inline-block w-[2px] h-[1em] align-middle ml-0.5 animate-pulse", isDarkTheme ? "bg-white/60" : "bg-foreground/40")} />
          )}
        </p>
      </div>

      {/* ── GAME ── */}
      <div className={cn(
        "absolute z-10 flex flex-col transition-all duration-700",
        `inset-0 ${pad}`,
        phase === "wheel" || phase === "result" ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        {!hideTitle ? (
          <div className="pt-2 pb-1 px-6 text-center shrink-0">
            <h2 className={cn("text-base font-bold tracking-tight", isDarkTheme ? "text-white" : "text-foreground")}>
              {title || "抽奖活动"}
            </h2>
            <p className={cn("text-[10px] mt-0.5", isDarkTheme ? "text-white/75" : "text-muted-foreground")}>
              {config.senderName ? `来自 ${config.senderName}` : " "}
              {showPrizeList && hasGifts ? ` · 共 ${gifts.length} 项奖品` : ""}
            </p>
          </div>
        ) : (
          <div className="pt-1 shrink-0" />
        )}

        <div className="flex-1 min-h-0 flex items-center justify-center px-6 py-2">
          {hasGifts ? (
            <GameRenderer
              gameType={gameType}
              gifts={gifts}
              showPrizeList={showPrizeList}
              allowRetry={allowRetry}
              interactive={interactive && phase === "wheel"}
              highContrastText={isDarkTheme}
              onResult={handleResult}
            />
          ) : (
            <div className="text-center space-y-2">
              <div className="w-28 h-28 rounded-full border-[3px] border-dashed border-foreground/10 flex items-center justify-center mx-auto">
                <span className="text-2xl">🎁</span>
              </div>
              <p className="text-[11px] text-foreground/35">添加奖品后显示互动内容</p>
            </div>
          )}
        </div>
      </div>

      {/* ── RESULT ── */}
      {phase === "result" && result && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={allowRetry ? () => setPhase("wheel") : undefined}
        >
          <div className="bg-background rounded-3xl p-6 text-center space-y-2.5 max-w-[240px] mx-4 shadow-2xl animate-in zoom-in-95 fade-in duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="text-4xl">{result.icon}</div>
            <div>
              <p className="text-[10px] text-muted-foreground">🎉 恭喜获得</p>
              <h3 className="text-base font-bold mt-0.5">{result.text}</h3>
            </div>
            {allowRetry ? (
              <button className="w-full rounded-full bg-primary py-2 text-sm font-medium text-primary-foreground mt-1 hover:bg-primary/90 transition-colors cursor-pointer" onClick={() => setPhase("wheel")}>
                再来一次
              </button>
            ) : (
              <p className="text-[11px] text-muted-foreground mt-2">感谢参与</p>
            )}
          </div>
        </div>
      )}

      {/* ── Replay ── */}
      {interactive && (allowRetry || showReplayControl) && (phase === "wheel" || phase === "result") && (
        <button
              className={cn(
                "absolute bottom-8 right-4 z-40 text-xs transition-colors backdrop-blur-sm rounded-full px-3 py-1.5 border shadow-sm cursor-pointer",
                isDarkTheme
                  ? "text-white/80 hover:text-white bg-black/25 border-white/30"
                  : "text-foreground/50 hover:text-foreground/75 bg-white/45 border-white/60"
              )}
          onClick={runIntro}
        >
          ↻ 重播
        </button>
      )}
    </div>
  );
}

type ResultCallback = (gift: Gift, opts?: { inline?: boolean }) => void;

function GameRenderer({
  gameType,
  gifts,
  showPrizeList,
  allowRetry,
  interactive,
  highContrastText,
  onResult,
}: {
  gameType: LotteryConfig["gameType"];
  gifts: Gift[];
  showPrizeList: boolean;
  allowRetry: boolean;
  interactive: boolean;
  highContrastText: boolean;
  onResult: ResultCallback;
}) {
  switch (gameType) {
    case "slots":
      return <SlotMachine gifts={gifts} allowRetry={allowRetry} interactive={interactive} highContrastText={highContrastText} onResult={onResult} />;
    case "cards":
      return <FlipCards gifts={gifts} showPrizeList={showPrizeList} allowRetry={allowRetry} interactive={interactive} highContrastText={highContrastText} onResult={onResult} />;
    case "blindbox":
      return <BlindBox gifts={gifts} showPrizeList={showPrizeList} allowRetry={allowRetry} interactive={interactive} highContrastText={highContrastText} onResult={onResult} />;
    case "scratch":
      return <ScratchCard gifts={gifts} showPrizeList={showPrizeList} allowRetry={allowRetry} interactive={interactive} highContrastText={highContrastText} onResult={onResult} />;
    case "wheel":
    default:
      return <SpinWheel gifts={gifts} allowRetry={allowRetry} interactive={interactive} onResult={onResult} />;
  }
}
