const cache = new Map();

chrome.runtime.onMessage.addListener(async (msg, sender) => {
  if (!msg || msg.type !== "classify") return;
  const { url, title, description } = msg.payload || {};
  const keyData = await chrome.storage.local.get([
    "geminiApiKey",
    "aiBlockingEnabled",
    "focusMode",
  ]);
  // Khi dùng AI mode theo topic (coding python...), chỉ listener bên dưới xử lý
  if (keyData.focusMode === "ai") return;
  if (!keyData.aiBlockingEnabled || !keyData.geminiApiKey) return;

  const cacheKey = url;
  const hit = cache.get(cacheKey);
  const now = Date.now();
  if (hit && now - hit.t < 60_000) {
    chrome.tabs.sendMessage(sender.tab.id, {
      type: "classification",
      payload: hit.v,
    });
    return;
  }

  try {
    const label = await classifyWithGemini({
      url,
      title,
      description,
      key: keyData.geminiApiKey,
    });
    const payload = { url, label, confidence: 0.8 };
    cache.set(cacheKey, { t: now, v: payload });
    chrome.tabs.sendMessage(sender.tab.id, { type: "classification", payload });
  } catch (e) {
    // Swallow to avoid noisy background errors
  }
});

async function classifyWithGemini({ url, title, description, key }) {
  const endpoint =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
  const prompt = `Classify this page as work_or_study or entertainment. Return just one word.\nURL: ${url}\nTITLE: ${title}\nDESCRIPTION: ${description}`;
  const res = await fetch(`${endpoint}?key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });
  if (!res.ok) throw new Error("Gemini API error");
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const normalized = /work|study/i.test(text) ? "work" : "entertainment";
  return normalized;
}

// NEW: Classify page by user's focus topic using Gemini AI
// NEW: Dynamic Model Selection
// NEW: Robust Model Discovery with Fallback
let cachedGeminiModel = null;

async function getBestGeminiModel(apiKey) {
  // Check memory cache first
  if (cachedGeminiModel) return cachedGeminiModel;

  // Check persistent storage
  const { geminiModelCache } = await chrome.storage.local.get(['geminiModelCache']);
  if (geminiModelCache) {
    cachedGeminiModel = geminiModelCache;
    return geminiModelCache;
  }

  // Discovery via listing
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (res.ok) {
      const data = await res.json();
      const models = data.models || [];
      const found = models.find(m => m.name.includes('gemini-1.5-flash'))?.name.replace('models/', '')
        || models.find(m => m.name.includes('gemini-pro'))?.name.replace('models/', '')
        || models[0]?.name.replace('models/', '');

      if (found) {
        await chrome.storage.local.set({ geminiModelCache: found });
        cachedGeminiModel = found;
        return found;
      }
    }
  } catch (e) { }

  // Fallback to the most universal name
  return "gemini-1.5-flash";
}

async function classifyByTopicWithGemini({
  url, title, description, focusTopic, key
}) {
  const cleanKey = key.trim();

  // 1. Prompt Definition (Must be inside scope)
  const prompt = `
YOU ARE A PRODUCTIVITY AI SPECIALIST.
USER OBJECTIVE: Learning and focusing on "${focusTopic}".

YOUR TASK: Evaluate if the current web page is HELPFUL, RELATED, or a NECESSARY STEP for the user's objective.

INPUT DATA:
- Focus Topic: "${focusTopic}"
- Page Title: "${title}"
- Page URL: ${url}
- Page Description: "${description}"

CRITICAL CLASSIFICATION RULES:
1. SEMANTIC BREADTH: If the focus topic is "learning code" or similar, any programming language (C++, Java, Python, etc.), framework, library, tool, or technical concept is RELATED.
2. RESEARCH & TOOLS: Search results, AI tools (ChatGPT, Gemini), and documentation (Wikipedia, MDN) are ALWAYS RELATED.
3. CONTEXTUAL OVERLAP: If the page helps the user reach their goal or provides background knowledge, mark as RELATED.
4. UNRELATED DEFINITION: Only return UNRELATED for content that is PURELY entertainment (Gameplay, Esports, Trailers, Music Videos) and definitely lacks educational value.
5. NO FALSE POSITIVES: When in doubt, return RELATED.

OUTPUT FORMAT (JSON ONLY, NO OTHER TEXT):
{"verdict":"RELATED|UNRELATED","reason":"Giải thích ngắn gọn bằng tiếng Việt (tối đa 15 từ)"}
`;

  // 2. Discovery with fallback
  const modelId = await getBestGeminiModel(cleanKey);

  // Fallback Chain for Endpoints/Models
  const endpoints = [
    `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent`
  ];

  let lastError = null;

  for (const endpoint of endpoints) {
    try {
      console.log(`[AI] Attempting ${endpoint}...`);
      const res = await fetch(`${endpoint}?key=${encodeURIComponent(cleanKey)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0, maxOutputTokens: 100, topP: 0.1 }
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        lastError = err?.error?.message || `HTTP ${res.status}`;
        if (lastError.includes("not found") || lastError.includes("not supported")) {
          continue;
        }
        throw new Error(lastError);
      }

      const data = await res.json();
      return handleParsedResponse(data, title);
    } catch (e) {
      lastError = e.message;
      if (lastError.includes("not found") || lastError.includes("not supported")) continue;
      throw e;
    }
  }

  throw new Error(lastError || "Tất cả các mô hình AI đều không phản hồi.");
}

// Sub-helper for parsing response
function handleParsedResponse(data, title) {
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    return { verdict: "RELATED", reason: "AI không thể phản hồi (Mặc định cho phép)" };
  }

  let result = { verdict: "RELATED", reason: "Phân tích nội dung (Mặc định)" };
  let cleanText = text.replace(/```json|```/gi, "").trim();
  const startIdx = cleanText.indexOf('{');
  const endIdx = cleanText.lastIndexOf('}');

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const jsonCandidate = cleanText.slice(startIdx, endIdx + 1);
    try {
      result = JSON.parse(jsonCandidate);
    } catch (e) {
      if (jsonCandidate.toUpperCase().includes('"VERDICT":"UNRELATED"')) {
        result = { verdict: "UNRELATED", reason: "Phân tích không liên quan" };
      }
    }
  } else if (text.toUpperCase().includes('UNRELATED')) {
    result = { verdict: "UNRELATED", reason: "AI nhận định không liên quan" };
  }

  const verdict = String(result.verdict || "").toUpperCase().trim() === "UNRELATED" ? "UNRELATED" : "RELATED";
  const reason = result.reason || "BẠN ĐANG KHÔNG TẬP TRUNG";
  return { verdict, reason };
}

// ---------------- AI Focus modes (Pure AI Driven) ----------------
const AI_MOCK_RESULTS = { RELATED: 'RELATED', UNRELATED: 'UNRELATED' };

// Mock result is only used if API fails or is missing
function mockFallback(topic, title) {
  return { verdict: 'RELATED', reason: 'Không thể kết nối AI - Mặc định cho phép để bảo đảm trải nghiệm' };
}

chrome.runtime.onInstalled.addListener(async () => {
  const defaults = {
    focusMode: 'manual', // 'manual' | 'ai'
    currentFocusTopic: 'Focus',
    geminiApiKey: '', // NEW: Gemini API key for AI mode
    blockedDomains: ['facebook.com', 'tiktok.com'],
    allowedDomains: [],
    blockedGroups: getDefaultBlockedGroups(),
    warnMinutes: 5,
    hardBlockMinutes: 5,
    sessionBlocked: {},
  };
  const existing = await chrome.storage.local.get(Object.keys(defaults));
  const toSet = {};
  for (const k of Object.keys(defaults)) if (existing[k] === undefined) toSet[k] = defaults[k];
  if (Object.keys(toSet).length) await chrome.storage.local.set(toSet);
  // migrate legacy blockedDomains into Custom group
  if (Array.isArray(existing.blockedDomains) && existing.blockedDomains.length) {
    const groups = existing.blockedGroups || getDefaultBlockedGroups();
    groups.Custom = groups.Custom || { enabled: true, items: [] };
    for (const d of existing.blockedDomains) if (d) groups.Custom.items.push(String(d).toLowerCase());
    await chrome.storage.local.set({ blockedGroups: groups, blockedDomains: [] });
  }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab || !tab.active) return;
  const { focusMode, allowedDomains, blockedGroups, sessionBlocked } = await chrome.storage.local.get([
    'focusMode', 'allowedDomains', 'blockedGroups', 'sessionBlocked'
  ]);
  const url = tab.url || '';

  // If already session-blocked, redirect immediately
  if (sessionBlocked && sessionBlocked[url]) {
    try { await chrome.tabs.update(tabId, { url: chrome.runtime.getURL('extension/blocked.html') }); } catch (e) { }
    return;
  }

  if (focusMode === 'manual') {
    if (isAllowedUrl(url, allowedDomains || [])) return;
    const mergedBlocked = mergeBlockedDomains(blockedGroups || {});
    if (isBlockedByDomain(url, mergedBlocked)) {
      try { await chrome.tabs.update(tabId, { url: chrome.runtime.getURL('extension/blocked.html') }); } catch (e) { }
    }
    return;
  }

  // NOTE: AI classification is now ONLY handled via messages from content.js
  // to avoid redundant triggers and metadata race conditions.
});

// Helper to unify classification (PURE AI)
async function getClassification({ tabId, url, title, description, topic, geminiApiKey }) {
  const titleClean = (title || '').trim();
  const titleLow = titleClean.toLowerCase();
  const topicLow = (topic || '').toLowerCase();
  const uObj = new URL(url);
  const host = uObj.hostname.toLowerCase();
  const path = uObj.pathname.toLowerCase();

  // 1. MASSIVE HARDCODED RULES (Highest Priority - 0 Latency, 0 Quota)

  // A. ENTERTAINMENT DETECTION (Immediate UNRELATED - Protect Quota)
  const entertainmentKeywords = [
    'official m/v', 'official mv', 'music video', 'official video', 'lyric video',
    'phim ca nhạc', 'trailer', 'teaser', 'gameplay', 'walkthrough game', 'esports',
    'tập full', 'vietsub', 'thuyết minh', 'phim hành động', 'hài kịch', 'livestream game',
    'prod.', 'ft.', 'feat.', 'remix', 'cover', 'lyrics', 'karaoke', 'album', 'ca sĩ',
    'sáng tác', 'trình bày', 'vlog giải trí', 'hài hước', 'funny', 'mv', 'm/v'
  ];

  // Specific check for Vietnamese music patterns like "Lạc Trôi - Sơn Tùng M-TP"
  const isMusicPattern = (titleLow.includes('-') || titleLow.includes('|')) &&
    (titleLow.includes('official') || titleLow.includes('audio') || titleLow.includes('m/v') || titleLow.includes('mv'));

  const isEntertainment = entertainmentKeywords.some(kw => titleLow.includes(kw)) || isMusicPattern;
  if (isEntertainment) {
    console.log('[Rule] Entertainment match:', titleClean);
    return { verdict: 'UNRELATED', reason: 'Nội dung âm nhạc/giải trí (Bộ lọc tự động)' };
  }

  // B. Trusted Educational Platforms & Research Tools (Always RELATED)
  const trustedDomains = [
    'stackoverflow.com', 'github.com', 'wikipedia.org', 'w3schools.com', 'mdn.mozilla.org',
    'coursera.org', 'udemy.com', 'edx.org', 'khanacademy.org', 'medium.com', 'dev.to',
    'chatgpt.com', 'claude.ai', 'perplexity.ai', 'gemini.google.com', 'poe.com',
    'duolingo.com', 'memrise.com', 'quizlet.com', 'notion.so'
  ];
  if (trustedDomains.some(d => host === d || host.endsWith('.' + d))) {
    return { verdict: 'RELATED', reason: 'Nền tảng giáo dục/công cụ tra cứu tin cậy' };
  }

  // C. Comprehensive Keyword Database (Multi-Domain)
  const isStudyTopic = topicLow.includes('học') || topicLow.includes('learn') ||
    topicLow.includes('code') || topicLow.includes('study') ||
    topicLow.includes('tập');

  if (isStudyTopic || topicLow.length > 2) {
    const educationalKeywords = [
      // IT & Programming
      'tutorial', 'coding', 'programming', 'developer', 'software', 'api', 'database', 'sql', 'python', 'java',
      'javascript', 'html', 'css', 'react', 'nodejs', 'backend', 'frontend', 'github', 'git', 'algorithm',
      'lập trình', 'code', 'hướng dẫn', 'cấu trúc dữ liệu', 'mạng máy tính', 'cloud', 'aws', 'docker', 'web dev',

      // AI & Data Science
      'ai', 'machine learning', 'artificial intelligence', 'data science', 'neural network', 'deep learning',
      'trí tuệ nhân tạo', 'dữ liệu', 'big data', 'pandas', 'numpy', 'tensorflow', 'pytorch', 'prompt engineering',

      // Business & Marketing
      'marketing', 'seo', 'ads', 'business', 'finance', 'kinh doanh', 'tài chính', 'đầu tư', 'investment',
      'marketing plan', 'thị trường', 'sales', 'management', 'quản trị', 'startup', 'khởi nghiệp',

      // Design & Creative
      'design', 'ui', 'ux', 'photoshop', 'figma', 'illustrator', 'thiết kế', 'đồ họa', 'typography', 'branding',

      // Academic & Languages
      'tiếng anh', 'english', 'ielts', 'toeic', 'toefl', 'vocabulary', 'grammar', 'math', 'toán', 'vật lý', 'physics',
      'chemistry', 'hóa học', 'history', 'lịch sử', 'biology', 'sinh học', 'science', 'khoa học', 'ngu pháp',

      // General Learning
      'lesson', 'course', 'class', 'lecture', 'academy', 'university', 'college', 'tự học', 'bài giảng',
      'khóa học', 'kiến thức', 'tóm tắt', 'educational', 'giảng dạy', 'phát triển bản thân', 'self improvement',
      'nâng cao', 'cơ bản', 'vlog học tập', 'study with me', 'productivity', 'tập trung'
    ];

    const hasMatch = educationalKeywords.some(kw => titleLow.includes(kw) || url.toLowerCase().includes(kw));

    if (hasMatch) {
      // Extra check: If topic is mentioned in title/url, it's definitely related
      if (titleLow.includes(topicLow) || url.toLowerCase().includes(topicLow)) {
        return { verdict: 'RELATED', reason: 'Nội dung khớp trực tiếp với chủ đề: ' + topic };
      }
      return { verdict: 'RELATED', reason: 'Nhận diện nội dung giáo dục/học thuật' };
    }
  }

  // 2. Standardize URL & Cache Check
  let cleanUrl = url;
  try {
    const u = new URL(url);
    const vid = u.searchParams.get('v');
    if (vid) cleanUrl = `${u.origin}${u.pathname}?v=${vid}`;
    else cleanUrl = `${u.origin}${u.pathname}`;
  } catch (e) { }

  const cacheKey = `ai_${cleanUrl}_${topic}`;
  const now = Date.now();
  const hit = cache.get(cacheKey);

  if (hit && now - hit.t < 300_000) {
    console.log('[AI] Using cached result for:', cleanUrl);
    return { verdict: hit.v, reason: hit.r };
  }

  // 3. YouTube generic loading check
  if (titleClean.toLowerCase() === 'youtube' && (url.includes('youtube.com') || url.includes('youtu.be'))) {
    return { verdict: 'RELATED', reason: 'Đang đợi dữ liệu...' };
  }

  // 4. Gemini API Call (Only if rules didn't catch it)
  if (geminiApiKey && geminiApiKey.trim().length > 10) {
    try {
      // Get supplementary description if missing
      let finalDesc = description;
      try {
        const response = await chrome.tabs.sendMessage(tabId, { type: 'getPageInfo' });
        if (response?.description) finalDesc = response.description;
      } catch (e) { }

      const result = await classifyByTopicWithGemini({
        url: cleanUrl, title, description: finalDesc, focusTopic: topic, key: geminiApiKey
      });

      console.log(`[AI] Success for "${title}":`, result.verdict);
      cache.set(cacheKey, { t: now, v: result.verdict, r: result.reason });
      return result;
    } catch (e) {
      console.error('[AI] Gemini Connection Failed:', e.message);
      return { verdict: 'RELATED', reason: `Lỗi kết nối AI: ${e.message}` };
    }
  }

  return { verdict: 'RELATED', reason: 'Chưa cấu hình API Key hoặc Key không hợp lệ.' };
}

// Clear cache when topic or API key changes to avoid stale results
chrome.storage.onChanged.addListener((changes) => {
  if (changes.currentFocusTopic || changes.geminiApiKey) {
    console.log('[AI] Settings changed, clearing cache.');
    cache.clear();
  }
});

// Also enforce on navigation commits and tab activation
chrome.webNavigation?.onCommitted?.addListener(async (details) => {
  try {
    if (details.frameId !== 0) return;
    const tabId = details.tabId;
    const url = details.url || '';
    const { focusMode, allowedDomains, blockedGroups } = await chrome.storage.local.get(['focusMode', 'allowedDomains', 'blockedGroups']);
    console.log('[FG] onCommitted', { tabId, url, focusMode });
    if (focusMode !== 'manual') return;
    if (isAllowedUrl(url, allowedDomains || [])) return;
    const mergedBlocked = mergeBlockedDomains(blockedGroups || {});
    if (isBlockedByDomain(url, mergedBlocked)) {
      console.log('[FG] manual block matched (onCommitted) → redirect');
      try { await chrome.tabs.update(tabId, { url: chrome.runtime.getURL('extension/blocked.html') }); } catch (e) { console.warn('[FG] redirect fail', e); }
    }
  } catch { }
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  try {
    const tab = await chrome.tabs.get(tabId);
    const url = tab.url || '';
    const { focusMode, allowedDomains, blockedGroups } = await chrome.storage.local.get(['focusMode', 'allowedDomains', 'blockedGroups']);
    console.log('[FG] onActivated', { tabId, url, focusMode });
    if (focusMode !== 'manual') return;
    if (isAllowedUrl(url, allowedDomains || [])) return;
    const mergedBlocked = mergeBlockedDomains(blockedGroups || {});
    if (isBlockedByDomain(url, mergedBlocked)) {
      console.log('[FG] manual block matched (onActivated) → redirect');
      try { await chrome.tabs.update(tabId, { url: chrome.runtime.getURL('extension/blocked.html') }); } catch (e) { console.warn('[FG] redirect fail', e); }
    }
  } catch { }
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  const info = parseAlarmName(alarm.name);
  if (!info) return;
  const { type, tabId, url } = info;
  try {
    const tab = await chrome.tabs.get(tabId);
    if (!tab || tab.url !== url) return; // user navigated away
  } catch { return; }

  if (type === 'warn') {
    // Show warning notification and schedule hard block
    try { await chrome.notifications.create(undefined, { type: 'basic', title: 'Stay on task', message: 'This page seems off-topic. You will be blocked in 5 minutes if you stay.', iconUrl: 'icon.png' }); } catch { }
    const hardName = alarmName('hard', tabId, url);
    await chrome.alarms.clear(hardName);
    const mins = await getNumber('hardBlockMinutes', 5);
    await chrome.alarms.create(hardName, { delayInMinutes: mins });
  }

  if (type === 'hard') {
    // Block for the rest of the focus session (store sessionBlocked)
    const data = await chrome.storage.local.get(['sessionBlocked']);
    const sessionBlocked = data.sessionBlocked || {};
    sessionBlocked[url] = true;
    await chrome.storage.local.set({ sessionBlocked });
    try { await chrome.tabs.update(tabId, { url: chrome.runtime.getURL('extension/blocked.html') }); } catch { }
  }
});

function isBlockedByDomain(url, blockedDomains) {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    return blockedDomains.some(d => host === d || host.endsWith('.' + d));
  } catch { return false; }
}

function isAllowedUrl(url, allowedList) {
  try {
    if (!allowedList || !allowedList.length) return false;
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    const log = (...args) => { try { console.log('[FG] allowCheck', ...args); } catch { } };
    for (const entry of allowedList) {
      if (!entry) continue;
      // Support object { name, url }
      let raw = entry;
      if (typeof entry === 'object') raw = entry.url || entry.host || '';
      let e = String(raw).trim();
      try {
        // If entry is a full URL, compare as prefix
        if (/^https?:\/\//i.test(e)) {
          if (url.startsWith(e)) return true;
          // If allowed URL has a specific video id (?v=...), allow any variant with same v regardless of extra params
          const eu = new URL(e);
          const ev = eu.searchParams.get('v');
          const elist = eu.searchParams.get('list');
          if (ev && host === eu.hostname.replace(/^www\./, '')) {
            const uv = u.searchParams.get('v');
            if (uv && uv === ev) { log('match by video id', { ev, uv }); return true; }
          }
          // If allowed URL has a playlist id (?list=...), allow any URL with same list on same host
          if (elist && host === eu.hostname.replace(/^www\./, '')) {
            const ulist = u.searchParams.get('list');
            if (ulist && ulist === elist) { log('match by playlist id', { elist, ulist }); return true; }
          }
          // Support youtu.be short links by video id
          if (/^youtu\.be$/i.test(eu.hostname)) {
            const shortId = (eu.pathname || '').replace(/^\//, '');
            const uv = u.searchParams.get('v');
            if (shortId && uv && uv === shortId && /youtube\.com$/.test(host)) { log('match by youtu.be id', { shortId, uv }); return true; }
          }
        } else {
          // Treat as host allow
          const eh = e.replace(/^www\./, '');
          if (host === eh || host.endsWith('.' + eh)) { log('match by host', { host, eh }); return true; }

          // Treat bare playlist id (e.g., RD..., PL...) as allow-by-list for YouTube hosts
          if (/^(RD|PL|LL|OL)[A-Za-z0-9_-]+$/.test(eh)) {
            if (/youtube\.com$/.test(host)) {
              const ulist = u.searchParams.get('list');
              if (ulist && ulist === eh) { log('match by bare playlist id', { eh, ulist }); return true; }
            }
          }

          // If entry is a YouTube path without protocol, try to parse v/list from it
          if (/youtube\.com/i.test(e)) {
            const query = e.split('?')[1] || '';
            const sp = new URLSearchParams(query);
            const ev = sp.get('v');
            const elist = sp.get('list');
            if (/youtube\.com$/.test(host)) {
              const uv = u.searchParams.get('v');
              const ulist = u.searchParams.get('list');
              if (ev && uv && ev === uv) { log('match by path video id', { ev, uv }); return true; }
              if (elist && ulist && elist === ulist) { log('match by path playlist id', { elist, ulist }); return true; }
            }
          }
        }
      } catch { }
    }
    return false;
  } catch { return false; }
}

function alarmName(type, tabId, url) {
  return `focus_${type}_${tabId}_${url}`;
}
function parseAlarmName(name) {
  const m = /^focus_(warn|hard)_(\d+)_(.*)$/.exec(name);
  if (!m) return null;
  return { type: m[1], tabId: Number(m[2]), url: m[3] };
}
async function getNumber(key, def) {
  const v = (await chrome.storage.local.get([key]))[key];
  return typeof v === 'number' && !Number.isNaN(v) ? v : def;
}
async function clearAllAlarmsForTab(tabId, url) {
  await chrome.alarms.clear(alarmName('warn', tabId, url));
  await chrome.alarms.clear(alarmName('hard', tabId, url));
}

// Merge base blocked domains with enabled groups
function mergeBlockedDomains(groups) {
  const set = new Set();
  try {
    for (const key of Object.keys(groups || {})) {
      const g = groups[key];
      if (!g || g.enabled !== true || !Array.isArray(g.items)) continue;
      for (const d of g.items) {
        if (!d) continue;
        // support string or object { name, host, enabled }
        if (typeof d === 'string') { set.add(String(d).toLowerCase()); continue; }
        if (typeof d === 'object') {
          if (d.enabled === false) continue;
          const host = (d.host || d.url || '').toLowerCase();
          if (host) set.add(host);
        }
      }
    }
  } catch { }
  return Array.from(set);
}

function getDefaultBlockedGroups() {
  return {
    AI: {
      enabled: false, items: [
        'chat.openai.com', 'claude.ai', 'perplexity.ai', 'poe.com', 'gemini.google.com'
      ]
    },
    SocialMedia: {
      enabled: false, items: [
        'facebook.com', 'instagram.com', 'tiktok.com', 'web.whatsapp.com', 'messenger.com', 'web.telegram.org', 'x.com', 'reddit.com', 'discord.com', 'snapchat.com', 'pinterest.com', 'linkedin.com', 'threads.net', 'wechat.com', 'qq.com', 'vk.com', 'line.me', 'tumblr.com'
      ]
    },
    Entertainment: {
      enabled: false, items: [
        'youtube.com', 'netflix.com', 'twitch.tv', 'primevideo.com', 'disneyplus.com', 'hulu.com', 'vimeo.com', 'soundcloud.com', 'spotify.com', 'crunchyroll.com', 'hbomax.com', 'tv.apple.com'
      ]
    },
    News: {
      enabled: false, items: [
        'cnn.com', 'bbc.com', 'nytimes.com', 'theguardian.com', 'washingtonpost.com', 'wsj.com', 'bloomberg.com', 'reuters.com', 'foxnews.com', 'nbcnews.com', 'cnbc.com', 'abcnews.go.com', 'apnews.com', 'aljazeera.com'
      ]
    },
    Shopping: {
      enabled: false, items: [
        'amazon.com', 'ebay.com', 'walmart.com', 'bestbuy.com', 'shopee.vn', 'lazada.vn', 'taobao.com', 'aliexpress.com', 'etsy.com', 'target.com'
      ]
    },
    Email: {
      enabled: false, items: [
        'mail.google.com', 'outlook.com', 'mail.yahoo.com', 'proton.me'
      ]
    },
  };
}

// Handler for content script classification requests (shows toasts)
chrome.runtime.onMessage.addListener(async (msg, sender) => {
  try {
    if (!msg || msg.type !== "classify") return;
    const { url, title, description } = msg.payload || {};
    const tabId = sender.tab?.id;
    if (!tabId) return;

    const { focusMode, currentFocusTopic, geminiApiKey } = await chrome.storage.local.get([
      "focusMode", "currentFocusTopic", "geminiApiKey"
    ]);

    console.log('[AI] Classification Request Received', {
      focusMode,
      hasKey: !!geminiApiKey,
      topic: currentFocusTopic
    });

    if (focusMode !== 'ai') return;

    console.log('[AI] Starting classification', { topic: currentFocusTopic, url, title: title.slice(0, 50) });

    const result = await getClassification({
      tabId,
      url,
      title,
      description,
      topic: currentFocusTopic,
      geminiApiKey
    });

    console.log('[AI] Final Result for Tab:', tabId, result.verdict);

    if (result.verdict === 'UNRELATED') {
      showUnrelatedNotification(title || 'Trang web', result.reason);
    }

    console.log('[AI] Dispatching message to tab:', tabId, { type: "classification", label: result.verdict });
    chrome.tabs.sendMessage(tabId, {
      type: "classification",
      payload: { url, label: result.verdict, reason: result.reason, confidence: 1.0 }
    }).catch((e) => {
      console.warn('[AI] sendMessage to tab failed. Is content script loaded?', e.message);
    });
  } catch (err) {
    console.error('[AI] Fatal error in onMessage:', err);
  }
});

function showUnrelatedNotification(pageTitle, reason) {
  try {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: '/vite.svg',
      title: '⚠️ Phát hiện nội dung không liên quan',
      message: `${pageTitle}\nLý do: ${reason || 'Không rõ'}`,
      priority: 2
    });
  } catch (e) {
    console.warn('[AI] Notification failed', e);
  }
}
