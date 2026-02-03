(function init() {
  console.log('[MindGard] Content script active');

  let debounceTimer;
  let lastCheckedUrl = "";
  let lastTitle = "";

  // Helper to compare URLs ignoring minor differences like timestamps
  function samePage(a, b) {
    if (!a || !b) return false;
    try {
      const u1 = new URL(a);
      const u2 = new URL(b);
      if (u1.origin !== u2.origin) return false;
      if (u1.pathname !== u2.pathname) return false;

      // For YouTube, just compare video ID
      const v1 = u1.searchParams.get("v");
      const v2 = u2.searchParams.get("v");
      if (v1 && v2) return v1 === v2;

      return u1.href === u2.href;
    } catch (e) {
      return a === b;
    }
  }

  function isVideoPage(url) {
    if (!url) return false;
    const u = url.toLowerCase();
    return u.includes('youtube.com/watch?v=') || u.includes('youtube.com/shorts/') || u.includes('youtu.be/');
  }

  function collect() {
    const url = location.href;
    let title = "";
    let desc = "";

    if (/youtube\.com|youtu\.be/i.test(location.hostname)) {
      const ytTitleEl = document.querySelector(".ytd-watch-metadata h1 yt-formatted-string, ytd-video-primary-info-renderer h1, #container h1 yt-formatted-string");
      title = ytTitleEl?.textContent?.trim() || document.title?.replace(/^\(\d+\)\s+/, "")?.trim() || "";

      const ytDescEl = document.querySelector("#description-inline #description-text, .ytd-video-secondary-info-renderer #description");
      desc = ytDescEl?.textContent?.trim() || "";
    } else {
      title = document.querySelector('meta[property="og:title"]')?.content?.trim() || document.title || "";
      desc = document.querySelector('meta[name="description"]')?.content?.trim() || "";
    }
    return { url, title, description: desc.slice(0, 1000) };
  }

  function requestClassify() {
    const url = location.href;
    if (!isVideoPage(url)) {
      lastCheckedUrl = "";
      return;
    }

    const currentTitle = (document.title || "").trim();

    // Skip if we already sent THIS specific title for THIS URL
    if (samePage(url, lastCheckedUrl) && lastTitle === currentTitle) return;

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (!samePage(location.href, url)) return;

      const payload = collect();
      const titleClean = (payload.title || "").trim();

      console.log("[MindGard] Sending classification for:", titleClean);
      lastCheckedUrl = url;
      lastTitle = titleClean;
      chrome.runtime.sendMessage({ type: "classify", payload });
    }, 1500);
  }

  // SPA Navigation hooks
  const _push = history.pushState;
  const _replace = history.replaceState;
  history.pushState = function () { _push.apply(this, arguments); requestClassify(); };
  history.replaceState = function () { _replace.apply(this, arguments); requestClassify(); };
  window.addEventListener('popstate', requestClassify);
  window.addEventListener('yt-navigate-finish', requestClassify);

  // Poll only when navigation events might be missed (rare)
  // No longer needed with robust navigation hooks

  // Message listeners
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'getPageInfo') {
      const { description } = collect();
      sendResponse({ description });
    }
  });

  console.log("[MindGard] Content Script Initialized - Waiting for classification messages...");

  chrome.runtime.onMessage.addListener((msg) => {
    if (!msg || msg.type !== "classification") return;

    console.log("[MindGard] Classification received:", msg.payload?.label);
    const { url, label, reason } = msg.payload || {};

    if (!samePage(url, location.href)) {
      console.log("[MindGard] Ignoring result for stale URL:", url, "current:", location.href);
      return;
    }

    const labelNorm = (label || "").toLowerCase().trim();
    console.log("[MindGard] Final Verdict Displaying:", labelNorm, "Reason:", reason);

    if (labelNorm === 'related') return;

    // Show warning box
    showMsgBox("MindGard - Nhắc nhở tập trung", "Bạn đang xem nội dung không liên quan.\nLý do: " + (reason || "Nội dung này có thể làm bạn xao nhãng."));
  });

  function showMsgBox(title, message) {
    console.log("[MindGard] Injecting Warning Modal to DOM...");
    if (document.getElementById("__mindgard_msgbox__")) return;
    const el = document.createElement("div");
    el.id = "__mindgard_msgbox__";
    el.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:2147483647;font-family:system-ui,-apple-system,sans-serif;backdrop-filter:blur(4px);";
    el.innerHTML = `
      <div style="background:#1e293b;color:#fff;border-radius:16px;padding:32px;max-width:420px;width:90%;border:1px solid rgba(255,255,255,0.1);box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);text-align:center;">
        <div style="font-size:48px;margin-bottom:16px;">⚠️</div>
        <div style="font-size:22px;font-weight:700;margin-bottom:12px;color:#fbbf24;">${title}</div>
        <div style="font-size:15px;line-height:1.6;opacity:0.9;white-space:pre-wrap;margin-bottom:24px;">${message}</div>
        
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <button id="__mindgard_msgbox_exit__" style="padding:14px;background:rgba(255,255,255,0.1);color:#fff;border:0;border-radius:10px;cursor:pointer;font-weight:600;font-size:14px;transition:0.2s;">Rời khỏi trang</button>
          <button id="__mindgard_msgbox_ok__" style="padding:14px;background:#2563eb;color:#fff;border:0;border-radius:10px;cursor:pointer;font-weight:600;font-size:14px;transition:0.2s;">Tôi vẫn muốn xem</button>
        </div>
      </div>
    `;

    // Handlers
    el.querySelector("#__mindgard_msgbox_ok__").onclick = () => el.remove();
    el.querySelector("#__mindgard_msgbox_exit__").onclick = () => {
      window.location.href = "https://www.google.com";
    };

    document.body.appendChild(el);
  }

  function showToast(text) {
    let el = document.getElementById("__focus_toast__");
    if (!el) {
      el = document.createElement("div");
      el.id = "__focus_toast__";
      el.style.cssText = "position:fixed;bottom:20px;right:20px;padding:12px 20px;background:#ef4444;color:white;border-radius:8px;z-index:2147483647;box-shadow:0 4px 6px rgba(0,0,0,0.1);font-family:system-ui;font-size:14px;";
      document.body.appendChild(el);
    }
    el.textContent = text;
    el.style.display = "block";
    setTimeout(() => { el.style.display = "none"; }, 5000);
  }

  function showBlockOverlay() {
    if (document.getElementById("__focus_block__")) return;
    const el = document.createElement("div");
    el.id = "__focus_block__";
    el.style.cssText = "position:fixed;inset:0;background:#0f172a;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:2147483647;font-family:system-ui;";
    el.innerHTML = '<h1 style="font-size:24px;font-weight:700;margin-bottom:10px;">Đã chặn nội dung</h1><p style="opacity:0.8;">Hãy quay lại làm việc để đạt được mục tiêu!</p>';
    document.body.appendChild(el);
  }

  // Visual dot initialization
  chrome.storage.local.get(["focusMode"]).then((local) => {
    if (local.focusMode === 'ai' && !document.getElementById('__mindgard_debug_dot__')) {
      const dot = document.createElement('div');
      dot.id = '__mindgard_debug_dot__';
      dot.style.cssText = `position:fixed;top:4px;left:4px;width:10px;height:10px;border-radius:50%;z-index:2147483647;pointer-events:none;border:1px solid white;background:#22c55e;`;
      document.body.appendChild(dot);
    }
  });

})();
