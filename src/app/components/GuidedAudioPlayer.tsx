import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, SkipBack, SkipForward } from "lucide-react";

interface GuidedAudioPlayerProps {
  src?: string;
  onStart?: () => void | Promise<void>;
  disabled?: boolean;
  title?: string;
}

export function GuidedAudioPlayer({
  src,
  onStart,
  disabled = false,
  title = "Sesion guiada",
}: GuidedAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePause = () => setIsPlaying(false);
    const handlePlay = () => setIsPlaying(true);
    const handleEnded = () => setIsPlaying(false);
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration || 0);

    audio.addEventListener("pause", handlePause);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [src]);

  useEffect(() => {
    if (src && audioRef.current) {
      audioRef.current.load();
      audioRef.current.play().catch(() => {});
    }
  }, [src]);

  const handleStart = async () => {
    if (disabled) {
      return;
    }

    if (!src && onStart) {
      await onStart();
      return;
    }

    if (audioRef.current) {
      try {
        await audioRef.current.play();
      } catch {
        if (onStart) {
          await onStart();
        }
      }
    }
  };

  const togglePlayPause = async () => {
    if (disabled || !audioRef.current) {
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      return;
    }

    await handleStart();
  };

  const jumpBy = (seconds: number) => {
    if (!audioRef.current) {
      return;
    }

    audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime + seconds);
  };

  const restart = () => {
    if (!audioRef.current) {
      return;
    }

    audioRef.current.currentTime = 0;
    audioRef.current.pause();
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const formatTime = (value: number) => {
    if (!Number.isFinite(value) || value < 0) {
      return "0:00";
    }

    const minutes = Math.floor(value / 60);
    const seconds = Math.floor(value % 60)
      .toString()
      .padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="rounded-[28px] border border-[rgba(0,0,0,0.08)] bg-[#FCFCFA] p-5">
      <p
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: "10px",
          fontWeight: 500,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#AAA",
          marginBottom: "6px",
        }}
      >
        Reproduciendo
      </p>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h3
            style={{
              fontFamily: "Cormorant Garamond, serif",
              fontSize: "24px",
              lineHeight: 1.1,
              color: "#0A0A0A",
              marginBottom: "6px",
            }}
          >
            {title}
          </h3>
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "12px",
              color: "#999",
            }}
          >
            {disabled
              ? "Preparando audio..."
              : src
                ? "Listo para escuchar"
                : "Toca comenzar para cargar el audio"}
          </p>
        </div>

        <button
          onClick={restart}
          disabled={!src || disabled}
          className="shrink-0 rounded-full border border-[rgba(0,0,0,0.08)] bg-white px-4 py-2 text-[#222] disabled:opacity-40"
          style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 500 }}
        >
          Reiniciar
        </button>
      </div>

      <div className="mb-2">
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={1}
          value={currentTime}
          disabled={!src || disabled}
          onChange={(e) => {
            if (!audioRef.current) return;
            const nextTime = Number(e.target.value);
            audioRef.current.currentTime = nextTime;
            setCurrentTime(nextTime);
          }}
          className="w-full accent-black disabled:opacity-40"
          style={{ height: "4px" }}
        />
      </div>

      <div className="mb-5 flex items-center justify-between">
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "12px",
            color: "#888",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {formatTime(currentTime)}
        </p>

        <div className="mx-3 h-[3px] flex-1 overflow-hidden rounded-full bg-[rgba(0,0,0,0.06)]">
          <div
            className="h-full rounded-full bg-[#0A0A0A] transition-[width]"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "12px",
            color: "#888",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {formatTime(duration)}
        </p>
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => jumpBy(-10)}
          disabled={!src || disabled}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-[rgba(0,0,0,0.08)] bg-white text-[#111] disabled:opacity-40"
        >
          <SkipBack size={18} strokeWidth={1.8} />
        </button>

        <button
          onClick={togglePlayPause}
          disabled={disabled}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-[#0A0A0A] text-white disabled:opacity-60"
        >
          {!src ? (
            <Play size={24} fill="currentColor" strokeWidth={1.8} />
          ) : isPlaying ? (
            <Pause size={24} fill="currentColor" strokeWidth={1.8} />
          ) : (
            <Play size={24} fill="currentColor" strokeWidth={1.8} />
          )}
        </button>

        <button
          onClick={() => jumpBy(10)}
          disabled={!src || disabled}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-[rgba(0,0,0,0.08)] bg-white text-[#111] disabled:opacity-40"
        >
          <SkipForward size={18} strokeWidth={1.8} />
        </button>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2 text-[#777]">
        <RotateCcw size={14} strokeWidth={1.8} />
        <button
          onClick={restart}
          disabled={!src || disabled}
          className="disabled:opacity-40"
          style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 500 }}
        >
          Volver a empezar
        </button>
      </div>

      <audio ref={audioRef} src={src} preload="metadata" className="hidden" />
    </div>
  );
}
