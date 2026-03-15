"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import type { LotteryConfig, Gift } from "@/types/lottery";

type Phase = "intro" | "slides" | "wheel" | "result";

const CONFETTI_COLORS = ["#fed6e3", "#a8edea", "#ffeaa7", "#c0aede", "#f9a8d4"];
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
}

export function LotteryView({
  config,
  title,
  interactive = false,
  autoPlay = false,
  hideTitle = false,
  safeArea = false,
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
  const scopedConfettiRef = useRef<ScopedConfetti | null>(null);
  const baseConfettiRef = useRef<ConfettiFn | null>(null);
  const confettiCreateRef = useRef<((canvas?: HTMLCanvasElement, opts?: Record<string, unknown>) => ScopedConfetti) | null>(null);

  const ensureConfetti = useCallback(async () => {
    if (!baseConfettiRef.current || !confettiCreateRef.current) {
      const mod = await import("canvas-confetti");
      baseConfettiRef.current = mod.default as unknown as ConfettiFn;
      confettiCreateRef.current = (mod.default as unknown as { create: (canvas?: HTMLCanvasElement, opts?: Record<string, unknown>) => ScopedConfetti }).create;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (canvasRef.current && !scopedConfettiRef.current) {
      void ensureConfetti().then(() => {
        if (!canvasRef.current || !confettiCreateRef.current) return;
        scopedConfettiRef.current = confettiCreateRef.current(canvasRef.current, { resize: true, useWorker: true });
      }).catch((error) => {
        console.error("load confetti failed", error);
      });
    }
    return () => { scopedConfettiRef.current?.reset(); };
  }, [ensureConfetti]);

  const recipientPhoto = config.recipientPhoto || "";

  const clearTimer = () => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  };

  const fireConfetti = useCallback((opts?: Record<string, unknown>) => {
    void ensureConfetti().then(() => {
      const fire = scopedConfettiRef.current ?? baseConfettiRef.current;
      fire?.({ particleCount: 100, spread: 70, origin: { y: 0.5 }, colors: CONFETTI_COLORS, ...opts } as Record<string, unknown>);
    }).catch((error) => {
      console.error("fire confetti failed", error);
    });
  }, [ensureConfetti]);

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
      fireConfetti({ particleCount: 120, spread: 80 });
      timerRef.current = setTimeout(() => {
        if (!mountedRef.current) return;
        setPhase("wheel");
      }, 800);
      return;
    }
    setCurrentSlide(idx);
    typeSlide(slides[idx], () => runSlides(idx + 1));
  }, [slides, typeSlide, fireConfetti]);

  const transitionFromIntro = useCallback(() => {
    if (slides.length > 0) {
      setPhase("slides");
      runSlides(0);
    } else {
      fireConfetti();
      timerRef.current = setTimeout(() => {
        if (!mountedRef.current) return;
        setPhase("wheel");
      }, 800);
    }
  }, [slides, runSlides, fireConfetti]);

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
  }, [fireConfetti]);

  return (
    <div className="flex flex-col h-full gradient-warm relative overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 z-[60] pointer-events-none" />

      {/* ── INTRO ── */}
      <div className={cn(
        `absolute inset-0 z-30 flex flex-col items-center justify-center px-8 ${pad} transition-all duration-700`,
        phase === "intro" ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        {recipientPhoto ? (
          <div className={cn("mb-5 transition-all duration-1000", showPhoto ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-6 scale-90")}>
            <img src={recipientPhoto} alt="" loading="eager" decoding="async" className="w-24 h-24 rounded-full object-cover ring-4 ring-white/50 shadow-lg bg-white/50" />
          </div>
        ) : null}
        {!hideTitle ? (
          <h1 className={cn("text-xl font-bold text-foreground text-center leading-snug transition-all duration-700", showTitle ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
            {title || "✨ 抽奖活动 ✨"}
          </h1>
        ) : null}
        {(config.senderName || config.senderAvatar) ? (
          <div className={cn("flex items-center gap-1.5 mt-2 transition-all duration-500", showTitle ? "opacity-100" : "opacity-0")}>
            {config.senderAvatar ? <img src={config.senderAvatar} alt="" loading="lazy" decoding="async" className="w-5 h-5 rounded-full object-cover ring-1 ring-white/40 bg-white/50" /> : null}
            {config.senderName ? <p className="text-xs text-muted-foreground">来自 {config.senderName}</p> : null}
          </div>
        ) : null}
      </div>

      {/* ── SLIDES ── */}
      <div className={cn(
        `absolute inset-0 z-20 flex items-center justify-center px-10 ${pad} transition-all duration-500`,
        phase === "slides" ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        <p className={cn("text-base text-foreground/70 text-center leading-relaxed whitespace-pre-line transition-all duration-500", slideVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2")}>
          {typedText}
          {phase === "slides" && slideVisible && typedText.length < (slides[currentSlide]?.length ?? 0) && (
            <span className="inline-block w-[2px] h-[1em] bg-foreground/40 align-middle ml-0.5 animate-pulse" />
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
            <h2 className="text-base font-bold tracking-tight text-foreground">{title || "抽奖活动"}</h2>
            <p className="text-[10px] text-muted-foreground mt-0.5">
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
      {interactive && allowRetry && (phase === "wheel" || phase === "result") && (
        <button
              className="absolute bottom-8 right-4 z-40 text-xs text-foreground/60 hover:text-foreground/80 transition-colors bg-white/70 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/80 shadow-sm cursor-pointer"
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
  onResult,
}: {
  gameType: LotteryConfig["gameType"];
  gifts: Gift[];
  showPrizeList: boolean;
  allowRetry: boolean;
  interactive: boolean;
  onResult: ResultCallback;
}) {
  switch (gameType) {
    case "slots":
      return <SlotMachine gifts={gifts} allowRetry={allowRetry} interactive={interactive} onResult={onResult} />;
    case "cards":
      return <FlipCards gifts={gifts} showPrizeList={showPrizeList} allowRetry={allowRetry} interactive={interactive} onResult={onResult} />;
    case "blindbox":
      return <BlindBox gifts={gifts} showPrizeList={showPrizeList} allowRetry={allowRetry} interactive={interactive} onResult={onResult} />;
    case "scratch":
      return <ScratchCard gifts={gifts} showPrizeList={showPrizeList} allowRetry={allowRetry} interactive={interactive} onResult={onResult} />;
    case "wheel":
    default:
      return <SpinWheel gifts={gifts} allowRetry={allowRetry} interactive={interactive} onResult={onResult} />;
  }
}
