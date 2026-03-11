import { createSignal, createEffect, Show, type Component } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { showToast } from "../lib/toast";
import { isNative } from "../lib/capacitor";

const Verify: Component = () => {
  const { session, profile, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();

  // Auth guard: must be logged in with a profile
  createEffect(() => {
    if (loading()) return;
    if (!session()) {
      navigate("/landing", { replace: true });
    } else if (!profile()) {
      navigate("/onboarding", { replace: true });
    } else if (profile()!.verified) {
      navigate("/", { replace: true });
    }
  });

  const [step, setStep] = createSignal<"intro" | "capture" | "uploading" | "done">("intro");
  const [selfieUrl, setSelfieUrl] = createSignal<string | null>(null);

  let videoRef: HTMLVideoElement | undefined;
  let canvasRef: HTMLCanvasElement | undefined;
  let stream: MediaStream | null = null;

  const startCamera = async () => {
    setStep("capture");
    try {
      if (isNative) {
        // On native, use Capacitor Camera plugin
        const { Camera, CameraResultType, CameraSource } = await import("@capacitor/camera");
        const photo = await Camera.getPhoto({
          quality: 80,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Camera,
          direction: (await import("@capacitor/camera")).CameraDirection.Front,
          width: 600,
          height: 600,
        });
        if (photo.dataUrl) {
          setSelfieUrl(photo.dataUrl);
          await uploadSelfie(photo.dataUrl);
        } else {
          setStep("intro");
        }
      } else {
        // On web, use getUserMedia
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 600, height: 600 },
        });
        if (videoRef) {
          videoRef.srcObject = stream;
          await videoRef.play();
        }
      }
    } catch {
      showToast("Camera access denied");
      setStep("intro");
    }
  };

  const capturePhoto = () => {
    if (!videoRef || !canvasRef) return;
    const ctx = canvasRef.getContext("2d");
    if (!ctx) return;
    canvasRef.width = videoRef.videoWidth;
    canvasRef.height = videoRef.videoHeight;
    // Mirror the selfie
    ctx.translate(canvasRef.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(videoRef, 0, 0);
    const dataUrl = canvasRef.toDataURL("image/jpeg", 0.85);
    setSelfieUrl(dataUrl);
    stopCamera();
    uploadSelfie(dataUrl);
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      stream = null;
    }
  };

  const uploadSelfie = async (dataUrl: string) => {
    const p = profile();
    if (!p) return;
    setStep("uploading");

    try {
      // Convert data URL to blob
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const path = `${p.id}/selfie-verification.jpg`;

      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(path, blob, { upsert: true, contentType: "image/jpeg" });

      if (uploadErr) {
        showToast("Upload failed");
        setStep("intro");
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const selfiePublicUrl = urlData.publicUrl + "?t=" + Date.now();

      // Store verification record
      await supabase.from("verification_requests").insert({
        user_id: p.id,
        selfie_url: selfiePublicUrl,
        status: "pending",
      });

      // Mark user as verified (in a production app, this would be admin-approved)
      await supabase.from("users").update({ verified: true }).eq("id", p.id);

      await refreshProfile();
      setStep("done");
      showToast("You're verified!", "success");
    } catch {
      showToast("Verification failed");
      setStep("intro");
    }
  };

  const retake = () => {
    setSelfieUrl(null);
    setStep("intro");
  };

  return (
    <>
      <div class="onboarding-header">
        <img src="/icon.png" alt="Friendly" class="onboarding-header-icon" />
        <span class="onboarding-header-name">Friendly</span>
      </div>

      <div class="content" style="display:flex;flex-direction:column;align-items:center;padding-top:20px">
        <Show when={step() === "intro"}>
          <div class="verify-intro">
            <div class="verify-icon-circle">
              <svg viewBox="0 0 24 24" width="48" height="48" fill="var(--primary)">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
              </svg>
            </div>
            <h2 style="margin:16px 0 8px;text-align:center">Verify Your Identity</h2>
            <p style="color:var(--text-secondary);text-align:center;font-size:14px;line-height:1.5;max-width:300px">
              Take a selfie to verify you're a real person. This earns you a verified badge and builds trust with other members.
            </p>

            <div class="verify-steps">
              <div class="verify-step">
                <div class="verify-step-num">1</div>
                <span>Face the camera straight on</span>
              </div>
              <div class="verify-step">
                <div class="verify-step-num">2</div>
                <span>Make sure your face is well-lit</span>
              </div>
              <div class="verify-step">
                <div class="verify-step-num">3</div>
                <span>Remove sunglasses or hats</span>
              </div>
            </div>

            <button class="landing-cta" style="margin-top:24px;max-width:300px" onClick={startCamera}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
                <path d="M12 15.2a3.2 3.2 0 100-6.4 3.2 3.2 0 000 6.4z"/>
                <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
              </svg>
              Take Selfie
            </button>

          </div>
        </Show>

        <Show when={step() === "capture"}>
          <div class="verify-camera">
            <div class="verify-viewfinder">
              <video ref={videoRef} autoplay playsinline muted class="verify-video" />
              <div class="verify-face-guide" />
            </div>
            <button class="verify-capture-btn" onClick={capturePhoto}>
              <div class="verify-capture-inner" />
            </button>
          </div>
        </Show>

        <Show when={step() === "uploading"}>
          <div style="display:flex;flex-direction:column;align-items:center;gap:16px;padding-top:40px">
            <div class="loading-spinner" />
            <p style="color:var(--text-secondary);font-size:14px">Verifying your photo...</p>
          </div>
        </Show>

        <Show when={step() === "done"}>
          <div style="display:flex;flex-direction:column;align-items:center;gap:16px;padding-top:40px">
            <div class="verify-icon-circle" style="background:rgba(52,199,89,0.12)">
              <svg viewBox="0 0 24 24" width="48" height="48" fill="#34C759">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
              </svg>
            </div>
            <h2>Verified!</h2>
            <p style="color:var(--text-secondary);text-align:center;font-size:14px;line-height:1.5">
              Your profile now has a verified badge. Other users can see that you're a real person.
            </p>
            <button class="landing-cta" style="max-width:300px;margin-top:8px" onClick={() => navigate("/", { replace: true })}>
              Start Exploring
            </button>
          </div>
        </Show>

        <canvas ref={canvasRef} style="display:none" />
      </div>
    </>
  );
};

export default Verify;
