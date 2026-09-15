"use client";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, MicOff, PhoneOff, Video as VideoIcon, VideoOff, Volume2 } from "lucide-react";
import { api } from "@/lib/client";
import { Avatar, cn } from "@/components/ui";

type CallStatus = "ringing" | "active" | "ended" | "declined" | "missed";

interface CallData {
  id: number;
  type: "voice" | "video";
  status: CallStatus;
  offerSdp?: string | null;
  answerSdp?: string | null;
  callerCandidates?: unknown[];
  calleeCandidates?: unknown[];
  startedAt?: string | null;
}

interface OtherUser {
  id: number;
  name: string;
  avatarUrl?: string | null;
}

type UiPhase = "loading" | "ringing" | "active" | "ended" | "error";

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

/**
 * Browser-based voice/video calling over WebRTC.
 * Signaling (SDP offer/answer + ICE trickle) flows through the calls API using
 * light polling, so it works without a persistent socket server and can be
 * swapped for Socket.IO later without changing the UI.
 */
export function CallInterface({ callId }: { callId: number }) {
  const router = useRouter();
  const [phase, setPhase] = useState<UiPhase>("loading");
  const [error, setError] = useState("");
  const [other, setOther] = useState<OtherUser | null>(null);
  const [callType, setCallType] = useState<"voice" | "video">("voice");
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [seconds, setSeconds] = useState(0);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const roleRef = useRef<"caller" | "callee">("caller");
  const remoteSetRef = useRef(false);
  const appliedRemoteCandRef = useRef(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedRef = useRef(false);
  const finishedRef = useRef(false);
  const startedAtRef = useRef<number | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  const teardown = useCallback(() => {
    finishedRef.current = true;
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;
    try {
      pcRef.current?.getSenders().forEach((s) => s.track?.stop());
      pcRef.current?.close();
    } catch {}
    pcRef.current = null;
    localStream?.getTracks().forEach((t) => t.stop());
    setLocalStream(null);
    remoteStream?.getTracks().forEach((t) => t.stop());
    setRemoteStream(null);
  }, [localStream, remoteStream]);

  const endCall = useCallback(
    async (action: "end" | "decline" = "end") => {
      try {
        await api(`/api/calls/${callId}`, { method: "PATCH", body: JSON.stringify({ action }) });
      } catch {}
      teardown();
      setPhase("ended");
    },
    [callId, teardown],
  );

  /* ------------------------------- Setup flow ------------------------------ */
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const applyRemoteCandidates = async (call: CallData) => {
      const pc = pcRef.current;
      if (!pc || !remoteSetRef.current) return;
      const list = roleRef.current === "caller" ? call.calleeCandidates ?? [] : call.callerCandidates ?? [];
      for (; appliedRemoteCandRef.current < list.length; appliedRemoteCandRef.current++) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(list[appliedRemoteCandRef.current] as RTCIceCandidateInit));
        } catch {
          /* candidate may not apply after close */
        }
      }
    };

    const poll = async () => {
      try {
        const res = await api<{ call: CallData }>(`/api/calls/${callId}`);
        const call = res.call;

        if (call.status === "active" && startedAtRef.current === null && call.startedAt) {
          startedAtRef.current = new Date(call.startedAt).getTime();
        }

        // Caller: remote answer arrived.
        if (roleRef.current === "caller" && !remoteSetRef.current && call.answerSdp && pcRef.current) {
          await pcRef.current.setRemoteDescription({ type: "answer", sdp: call.answerSdp });
          remoteSetRef.current = true;
          setPhase("active");
        }
        // Either side still ringing (callee picked up, waiting on media)?
        if (roleRef.current === "callee" && remoteSetRef.current && phase !== "active") setPhase("active");

        await applyRemoteCandidates(call);

        if (["ended", "declined", "missed"].includes(call.status)) {
          teardown();
          setPhase("ended");
        }
      } catch {
        /* transient network error — keep polling */
      }
    };

    const start = async () => {
      try {
        const first = await api<{ call: CallData; other: OtherUser | null; role: "caller" | "callee" }>(`/api/calls/${callId}`);
        const call = first.call;
        setOther(first.other);
        setCallType(call.type);
        roleRef.current = first.role;

        if (["ended", "declined", "missed"].includes(call.status)) {
          setPhase("ended");
          return;
        }

        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: call.type === "video" });
        } catch {
          setError("We couldn't access your microphone/camera. Check browser permissions and try again.");
          setPhase("error");
          try {
            await api(`/api/calls/${callId}`, { method: "PATCH", body: JSON.stringify({ action: "end" }) });
          } catch {}
          return;
        }
        setLocalStream(stream);

        const pc = new RTCPeerConnection(RTC_CONFIG);
        pcRef.current = pc;
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        const remote = new MediaStream();
        setRemoteStream(remote);
        pc.ontrack = (event) => {
          event.streams[0]?.getTracks().forEach((t) => remote.addTrack(t));
        };
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            api(`/api/calls/${callId}`, {
              method: "PATCH",
              body: JSON.stringify({ action: "ice", candidate: event.candidate.toJSON() }),
            }).catch(() => {});
          }
        };
        pc.onconnectionstatechange = () => {
          if (pc.connectionState === "failed" && !finishedRef.current) {
            setError("The connection dropped. Please try calling again.");
            setPhase("error");
            teardown();
          }
        };

        if (first.role === "caller") {
          setPhase("ringing");
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          await api(`/api/calls/${callId}`, { method: "PATCH", body: JSON.stringify({ action: "offer", sdp: offer.sdp }) });
        } else {
          // Callee: answer the stored offer.
          if (!call.offerSdp) throw new Error("missing offer");
          await pc.setRemoteDescription({ type: "offer", sdp: call.offerSdp });
          remoteSetRef.current = true;
          await applyRemoteCandidates(call);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await api(`/api/calls/${callId}`, { method: "PATCH", body: JSON.stringify({ action: "answer", sdp: answer.sdp }) });
          setPhase("active");
          startedAtRef.current = Date.now();
        }

        pollRef.current = setInterval(poll, 1500);
      } catch {
        setError("This call is no longer available.");
        setPhase("error");
      }
    };

    start();
    return () => teardown();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callId]);

  /* Outgoing ring timeout (45s) */
  useEffect(() => {
    if (phase !== "ringing") return;
    const t = setTimeout(() => endCall("end"), 45_000);
    return () => clearTimeout(t);
  }, [phase, endCall]);

  /* Duration ticker */
  const effectiveStart = startedAtRef.current;
  useEffect(() => {
    if (phase !== "active") return;
    const base = startedAtRef.current ?? Date.now();
    setSeconds(Math.max(0, Math.floor((Date.now() - base) / 1000)));
    const t = setInterval(() => setSeconds(Math.max(0, Math.floor((Date.now() - base) / 1000))), 1000);
    return () => clearInterval(t);
  }, [phase, effectiveStart]);

  /* Attach media streams */
  useEffect(() => {
    if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream;
  }, [localStream, phase]);
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) remoteVideoRef.current.srcObject = remoteStream;
    if (remoteAudioRef.current && remoteStream) remoteAudioRef.current.srcObject = remoteStream;
  }, [remoteStream, phase]);

  const toggleMute = () => {
    localStream?.getAudioTracks().forEach((t) => (t.enabled = muted));
    setMuted(!muted);
  };
  const toggleCamera = () => {
    localStream?.getVideoTracks().forEach((t) => (t.enabled = cameraOff));
    setCameraOff(!cameraOff);
  };

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-slate-950 shadow-2xl">
      {/* Remote video layer */}
      <div className="relative aspect-[4/5] w-full sm:aspect-video">
        {callType === "video" && phase === "active" ? (
          <video ref={remoteVideoRef} autoPlay playsInline className="h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-[radial-gradient(ellipse_at_top,_rgba(37,99,235,0.35),_transparent_60%),radial-gradient(ellipse_at_bottom,_rgba(16,185,129,0.25),_transparent_60%)]">
            <div className="relative">
              <Avatar src={other?.avatarUrl} name={other?.name || "?"} size={110} className="rounded-[32px]" />
              {(phase === "ringing" || phase === "active") && (
                <span className="animate-ping-slow absolute inset-0 rounded-[32px] border-2 border-emerald-400/70" />
              )}
            </div>
            <div className="text-center">
              <p className="font-display text-2xl font-bold text-white">{other?.name || "Member"}</p>
              <p className="mt-1 text-sm font-medium text-slate-300">
                {phase === "loading" && "Setting up the call…"}
                {phase === "ringing" && "Ringing… waiting for them to pick up"}
                {phase === "active" && (callType === "voice" ? `${mm}:${ss} · Voice call` : "Connecting video…")}
                {phase === "ended" && "Call ended"}
                {phase === "error" && "Call failed"}
              </p>
            </div>
            {phase === "active" && callType === "voice" && (
              <div className="flex items-end gap-1.5" aria-hidden>
                {[0.9, 0.5, 1.1, 0.7, 1.3, 0.6, 1].map((d, i) => (
                  <span
                    key={i}
                    className="w-1.5 rounded-full bg-gradient-to-t from-blue-500 to-emerald-400"
                    style={{ height: 10 + (i % 3) * 8, animation: `typing-dot 1s ease-in-out ${d * 0.2}s infinite alternate` }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Local PiP */}
        {callType === "video" && localStream && !cameraOff && (
          <div className="absolute bottom-24 right-4 h-28 w-20 overflow-hidden rounded-2xl border-2 border-white/30 shadow-xl sm:bottom-6 sm:h-36 sm:w-28">
            <video ref={localVideoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
          </div>
        )}

        {/* Top status bar */}
        <div className="absolute left-0 right-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent p-4">
          <div className="flex items-center gap-2">
            <span className={cn("h-2 w-2 rounded-full", phase === "active" ? "bg-emerald-400" : phase === "ringing" ? "animate-pulse bg-amber-400" : "bg-slate-400")} />
            <span className="text-xs font-semibold uppercase tracking-widest text-white/80">
              {callType} call {phase === "active" && `· ${mm}:${ss}`}
            </span>
          </div>
          {phase === "active" && <Volume2 className="h-4 w-4 text-white/70" />}
        </div>

        {/* Controls */}
        {(phase === "ringing" || phase === "active") && (
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-4 bg-gradient-to-t from-black/70 to-transparent p-5">
            <button onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"} className={cn("flex h-12 w-12 items-center justify-center rounded-full backdrop-blur transition-all active:scale-90", muted ? "bg-white text-slate-900" : "bg-white/15 text-white hover:bg-white/25")}>
              {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>
            <button onClick={() => endCall("end")} aria-label="End call" className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-600 text-white shadow-[0_12px_32px_-8px_rgba(225,29,72,0.8)] transition-all hover:bg-rose-500 active:scale-90">
              <PhoneOff className="h-6 w-6" />
            </button>
            {callType === "video" ? (
              <button onClick={toggleCamera} aria-label={cameraOff ? "Turn camera on" : "Turn camera off"} className={cn("flex h-12 w-12 items-center justify-center rounded-full backdrop-blur transition-all active:scale-90", cameraOff ? "bg-white text-slate-900" : "bg-white/15 text-white hover:bg-white/25")}>
                {cameraOff ? <VideoOff className="h-5 w-5" /> : <VideoIcon className="h-5 w-5" />}
              </button>
            ) : (
              <div className="w-12" />
            )}
          </div>
        )}

        {/* Ended / error state */}
        {(phase === "ended" || phase === "error") && (
          <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 bg-gradient-to-t from-black/80 to-transparent p-6 pt-16 text-center">
            {phase === "error" && <p className="max-w-sm text-sm font-medium text-rose-300">{error}</p>}
            <button onClick={() => router.push("/dashboard/calls")} className="rounded-full bg-white px-6 py-2.5 text-sm font-bold text-slate-900 transition hover:bg-slate-200">
              Back to calls
            </button>
          </div>
        )}
      </div>

      {/* Hidden audio element for voice stream */}
      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />
    </div>
  );
}
