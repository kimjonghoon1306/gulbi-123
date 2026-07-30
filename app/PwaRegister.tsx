"use client";
import { useEffect, useState } from "react";

/**
 * 온종일팜 PWA 업데이트 배너 — 온캐치 방식 + 무한반복 차단.
 * 업데이트를 한 번 누르면 sessionStorage 플래그로 이 탭에선 배너를 더 안 띄움
 * (강제 새로고침으로 콘텐츠는 네트워크 우선 최신이라, SW가 waiting이어도 실사용 최신).
 */
export default function PwaRegister() {
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reg, setReg] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    let reloaded = false;
    let active = true;

    // 이미 이 탭에서 업데이트를 눌렀으면 배너를 다시 띄우지 않음(무한반복 방지)
    const alreadyTried = () => { try { return !!sessionStorage.getItem("pwa_upd"); } catch { return false; } };
    const markShow = () => { if (!active || alreadyTried()) return; setShow(true); };

    const hardReload = () => {
      const url = new URL(window.location.href);
      url.searchParams.set("_update", Date.now().toString());
      window.location.replace(url.toString());
    };

    const watchInstalling = (r: ServiceWorkerRegistration, worker: ServiceWorker | null) => {
      if (!worker) return;
      const check = () => {
        if (!active) return;
        if ((worker.state === "installed" || r.waiting) && navigator.serviceWorker.controller) {
          setReg(r); markShow();
        }
      };
      worker.addEventListener("statechange", check);
      check();
    };

    const inspect = async (r?: ServiceWorkerRegistration) => {
      const current = r ?? (await navigator.serviceWorker.getRegistration("/").catch(() => undefined));
      if (!current || !active) return;
      setReg(current);
      if (current.waiting && navigator.serviceWorker.controller) { markShow(); return; }
      watchInstalling(current, current.installing);
      await current.update().catch(() => {});
      if (!active) return;
      if (current.waiting && navigator.serviceWorker.controller) markShow();
      watchInstalling(current, current.installing);
    };

    const onLoad = () => {
      navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" })
        .then((r) => {
          if (!active) return;
          r.addEventListener("updatefound", () => watchInstalling(r, r.installing));
          void inspect(r);
        })
        .catch(() => {});
    };

    const checkVisible = () => { if (document.visibilityState === "visible") void inspect(); };
    const onCtrl = () => { if (reloaded) return; reloaded = true; hardReload(); };

    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad);
    document.addEventListener("visibilitychange", checkVisible);
    window.addEventListener("focus", checkVisible);
    window.addEventListener("pageshow", checkVisible);
    window.addEventListener("online", checkVisible);
    navigator.serviceWorker.addEventListener("controllerchange", onCtrl);
    const poll = window.setInterval(() => void inspect(), 20_000);

    return () => {
      active = false;
      window.removeEventListener("load", onLoad);
      document.removeEventListener("visibilitychange", checkVisible);
      window.removeEventListener("focus", checkVisible);
      window.removeEventListener("pageshow", checkVisible);
      window.removeEventListener("online", checkVisible);
      navigator.serviceWorker.removeEventListener("controllerchange", onCtrl);
      window.clearInterval(poll);
    };
  }, []);

  const doUpdate = async () => {
    setBusy(true);
    try { sessionStorage.setItem("pwa_upd", String(Date.now())); } catch { /* noop */ }
    const forceReload = () => {
      const url = new URL(window.location.href);
      url.searchParams.set("_update", Date.now().toString());
      window.location.replace(url.toString());
    };
    const r = reg ?? (await navigator.serviceWorker.getRegistration());
    if (r?.waiting) {
      r.waiting.postMessage({ type: "SKIP_WAITING" });
      setTimeout(forceReload, 2000); // controllerchange 안 와도 강제 새로고침
    } else {
      forceReload();
    }
  };

  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 100,
        display: "flex", alignItems: "center", gap: 12,
        maxWidth: 480, margin: "0 auto", padding: "12px 16px",
        background: "linear-gradient(135deg,#16a34a,#12833c)", color: "#fff",
        boxShadow: "0 -6px 20px rgba(0,0,0,.2)",
        userSelect: "none", WebkitUserSelect: "none",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 15 }}>🆕 새 버전이 나왔어요!</div>
        <div style={{ fontSize: 12, opacity: 0.9 }}>업데이트하면 최신 기능을 쓸 수 있어요</div>
      </div>
      <button
        onClick={doUpdate}
        disabled={busy}
        style={{
          flex: "0 0 auto", background: "#fff", color: "#16a34a",
          border: "none", borderRadius: 999, padding: "10px 20px",
          fontWeight: 900, fontSize: 15, cursor: "pointer", opacity: busy ? 0.6 : 1,
          WebkitTapHighlightColor: "transparent", touchAction: "manipulation",
        }}
      >
        {busy ? "업데이트 중…" : "업데이트"}
      </button>
    </div>
  );
}
