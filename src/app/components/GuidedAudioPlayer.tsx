import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, SkipBack, SkipForward } from "lucide-react";
import { motion } from "motion/react";

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
  const ambienceRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePause = () => {
      setIsPlaying(false);
      ambienceRef.current?.pause();
    };
    const handlePlay = () => {
      setIsPlaying(true);
      syncAmbienceToVoice();
      ambienceRef.current?.play().catch(() => {});
    };
    const handleEnded = () => {
      setIsPlaying(false);
      ambienceRef.current?.pause();
      if (ambienceRef.current) {
        ambienceRef.current.currentTime = 0;
      }
    };
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
      syncAmbienceToVoice();
      audioRef.current.play().catch(() => {});
      ambienceRef.current?.play().catch(() => {});
    }
  }, [src]);

  useEffect(() => {
    if (ambienceRef.current) {
      ambienceRef.current.volume = 0.03;
      ambienceRef.current.loop = true;
      // Ambience track from CDN
      if (ambienceRef.current) ambienceRef.current.src = "https://sztefmznsleedqythllo.supabase.co/storage/v1/object/public/audio/handpan-soundscape-432hz.mp3";
    }
  }, []);

  const syncAmbienceToVoice = () => {
    const voice = audioRef.current;
    const ambience = ambienceRef.current;

    if (!voice || !ambience) {
      return;
    }

    if (Number.isFinite(ambience.duration) && ambience.duration > 0) {
      ambience.currentTime = voice.currentTime % ambience.duration;
    } else {
      ambience.currentTime = 0;
    }
  };

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
        syncAmbienceToVoice();
        await audioRef.current.play();
        await ambienceRef.current?.play().catch(() => {});
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
      ambienceRef.current?.pause();
      return;
    }

    await handleStart();
  };

  const jumpBy = (seconds: number) => {
    if (!audioRef.current) {
      return;
    }

    audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime + seconds);
    syncAmbienceToVoice();
  };

  const restart = () => {
    if (!audioRef.current) {
      return;
    }

    audioRef.current.currentTime = 0;
    audioRef.current.pause();
    ambienceRef.current?.pause();
    ambienceRef.current && (ambienceRef.current.currentTime = 0);
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
          fontFamily: "var(--font-sans-ui)",
          fontSize: "10px",
          fontWeight: 500,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--ink-soft)",
          marginBottom: "6px",
        }}
      >
        Reproduciendo
      </p>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h3
            style={{
              fontFamily: "var(--font-serif-display)",
              fontSize: "24px",
              lineHeight: 1.1,
              color: "var(--ink-strong)",
              marginBottom: "6px",
            }}
          >
            {title}
          </h3>
          <p
            style={{
              fontFamily: "var(--font-sans-ui)",
              fontSize: "12px",
              color: "var(--ink-subtle)",
            }}
          >
            {disabled ? (
              <span className="flex items-center gap-2">
                <span>Generando audio</span>
                <span className="flex gap-[3px] items-center">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="inline-block w-[3px] h-[3px] rounded-full bg-[var(--ink-subtle)]"
                      animate={{ opacity: [0.2, 1, 0.2] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </span>
              </span>
            ) : src ? (
              "Listo para escuchar"
            ) : (
              "Tocá comenzar para cargar el audio"
            )}
          </p>
        </div>

        <button
          onClick={restart}
          disabled={!src || disabled}
          className="shrink-0 rounded-full border border-[rgba(0,0,0,0.08)] bg-white px-4 py-2 text-[var(--ink-strong)] disabled:opacity-40"
          style={{ fontFamily: "var(--font-sans-ui)", fontSize: "12px", fontWeight: 500 }}
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
            syncAmbienceToVoice();
          }}
          className="w-full accent-black disabled:opacity-40"
          style={{ height: "4px" }}
        />
      </div>

      <div className="mb-5 flex items-center justify-between">
        <p
          style={{
            fontFamily: "var(--font-sans-ui)",
            fontSize: "12px",
            color: "var(--ink-subtle)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {formatTime(currentTime)}
        </p>

        <div className="mx-3 h-[3px] flex-1 overflow-hidden rounded-full bg-[rgba(0,0,0,0.06)]">
          <div
            className="h-full rounded-full bg-[var(--ink-strong)] transition-[width]"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p
          style={{
            fontFamily: "var(--font-sans-ui)",
            fontSize: "12px",
            color: "var(--ink-subtle)",
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
          className="flex h-12 w-12 items-center justify-center rounded-full border border-[rgba(0,0,0,0.08)] bg-white text-[var(--ink-strong)] disabled:opacity-40"
        >
          <SkipBack size={18} strokeWidth={1.8} />
        </button>

        <button
          onClick={togglePlayPause}
          disabled={disabled}
          className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[var(--ink-strong)] text-white"
        >
          {disabled ? (
            <>
              <motion.span
                className="absolute inset-0 rounded-full border-2 border-white/30"
                animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.svg
                width="22"
                height="22"
                viewBox="0 0 22 22"
                fill="none"
                animate={{ rotate: 360 }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
              >
                <circle cx="11" cy="11" r="9" stroke="white" strokeWidth="2" strokeOpacity="0.2" />
                <path d="M11 2a9 9 0 0 1 9 9" stroke="white" strokeWidth="2" strokeLinecap="round" />
              </motion.svg>
            </>
          ) : !src || !isPlaying ? (
            <Play size={24} fill="currentColor" strokeWidth={1.8} />
          ) : (
            <Pause size={24} fill="currentColor" strokeWidth={1.8} />
          )}
        </button>

        <button
          onClick={() => jumpBy(10)}
          disabled={!src || disabled}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-[rgba(0,0,0,0.08)] bg-white text-[var(--ink-strong)] disabled:opacity-40"
        >
          <SkipForward size={18} strokeWidth={1.8} />
        </button>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2 text-[var(--ink-muted)]">
        <RotateCcw size={14} strokeWidth={1.8} />
        <button
          onClick={restart}
          disabled={!src || disabled}
          className="disabled:opacity-40"
          style={{ fontFamily: "var(--font-sans-ui)", fontSize: "12px", fontWeight: 500 }}
        >
          Volver a empezar
        </button>
      </div>

      <audio ref={audioRef} src={src} preload="metadata" className="hidden" />
      <audio ref={ambienceRef} preload="none" className="hidden" />
    </div>
  );
}
