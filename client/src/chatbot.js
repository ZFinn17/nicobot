// =============================================
// NicoBot Client — chatbot.js (Template Mode)
// =============================================

const API_BASE = '/api';

function getSessionId() {
  let sid = sessionStorage.getItem('nicobot_session');
  if (!sid) {
    sid = 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    sessionStorage.setItem('nicobot_session', sid);
  }
  return sid;
}

const state = { sessionId: getSessionId(), isLoading: false };

// ---- Bubble bot — reply dari server sudah HTML, langsung inject ----
function createBotBubble(htmlContent, isTyping = false) {
  const wrapper = document.createElement('div');
  wrapper.className = 'flex items-start gap-2 message-enter';

  const avatar = document.createElement('div');
  avatar.className = 'w-8 h-8 rounded-full bg-blue-950 flex items-center justify-center flex-shrink-0 mt-1';
  avatar.innerHTML = '<i class="fa-solid fa-robot text-yellow-400 text-xs"></i>';

  const bubble = document.createElement('div');
  bubble.className = 'nicobot-bubble-bot';

  if (isTyping) {
    wrapper.id = 'nicobot-typing';
    bubble.innerHTML = `<span class="nicobot-typing-dots"><span></span><span></span><span></span></span>`;
  } else {
    // Reply dari server sudah HTML — langsung set innerHTML
    bubble.innerHTML = htmlContent;
  }

  wrapper.appendChild(avatar);
  wrapper.appendChild(bubble);
  return wrapper;
}

// ---- Bubble user ----
function createUserBubble(text) {
  const wrapper = document.createElement('div');
  wrapper.className = 'flex justify-end message-enter';
  const bubble = document.createElement('div');
  bubble.className = 'nicobot-bubble-user';
  bubble.textContent = text;
  wrapper.appendChild(bubble);
  return wrapper;
}

function scrollToBottom(el) {
  el.scrollTop = el.scrollHeight;
}

// ---- Load quick replies ----
async function loadQuickReplies(container) {
  try {
    const res = await fetch(`${API_BASE}/quick-replies`);
    const replies = await res.json();
    container.innerHTML = '';
    replies.forEach((r) => {
      const btn = document.createElement('button');
      btn.className = 'nicobot-quick-btn';
      btn.textContent = r.label;
      btn.addEventListener('click', () => {
        container.style.display = 'none';
        sendMessage(r.message || r.label);
      });
      container.appendChild(btn);
    });
  } catch {
    container.innerHTML = '<p style="font-size:0.75rem;color:rgba(255,255,255,0.35);padding:0 4px">Gagal memuat pilihan.</p>';
  }
}

// ---- Kirim pesan ----
async function sendMessage(text) {
  if (state.isLoading || !text.trim()) return;

  const messagesEl = document.getElementById('nicobot-messages');
  const inputEl    = document.getElementById('nicobot-input');
  const sendBtn    = document.getElementById('nicobot-send');
  const quickEl    = document.getElementById('nicobot-quick-replies');

  messagesEl.appendChild(createUserBubble(text));
  if (inputEl) inputEl.value = '';
  if (quickEl) quickEl.style.display = 'none';
  scrollToBottom(messagesEl);

  state.isLoading = true;
  if (sendBtn) sendBtn.disabled = true;
  messagesEl.appendChild(createBotBubble('', true));
  scrollToBottom(messagesEl);

  // Delay natural 400ms
  await new Promise(r => setTimeout(r, 400));

  try {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, sessionId: state.sessionId }),
    });

    const data = await res.json();
    document.getElementById('nicobot-typing')?.remove();

    if (data.error) {
      messagesEl.appendChild(createBotBubble(`<p>⚠️ ${data.error}</p>`));
    } else {
      messagesEl.appendChild(createBotBubble(data.reply));
      if (data.intent === 'fallback' && quickEl) {
        quickEl.style.display = 'flex';
        loadQuickReplies(quickEl);
      }
    }
  } catch {
    document.getElementById('nicobot-typing')?.remove();
    messagesEl.appendChild(createBotBubble('<p>Tidak bisa terhubung ke server. Pastikan server NicoBot sudah berjalan. 🔌</p>'));
  } finally {
    state.isLoading = false;
    if (sendBtn) sendBtn.disabled = false;
    scrollToBottom(messagesEl);
  }
}

// ---- Reset ----
async function resetSession() {
  try {
    await fetch(`${API_BASE}/reset-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: state.sessionId }),
    });
  } catch {}

  sessionStorage.removeItem('nicobot_session');
  state.sessionId = getSessionId();
  state.isLoading = false;

  const messagesEl = document.getElementById('nicobot-messages');
  const inputEl    = document.getElementById('nicobot-input');
  const sendBtn    = document.getElementById('nicobot-send');
  const quickEl    = document.getElementById('nicobot-quick-replies');

  if (messagesEl) {
    messagesEl.innerHTML = '';
    messagesEl.appendChild(createBotBubble('<p>Halo! 👋 Saya <strong>NicoBot</strong>, asisten resmi SMK ICB Cinta Niaga.</p><p class="mt-2">Silakan pilih topik atau ketik pertanyaanmu! 😊</p>'));
  }
  if (inputEl) { inputEl.disabled = false; inputEl.placeholder = 'Ketik pertanyaanmu...'; }
  if (sendBtn) sendBtn.disabled = false;
  if (quickEl) { quickEl.style.display = 'flex'; loadQuickReplies(quickEl); }
}

// ---- Init ----
export function initChatbot() {
  const messagesEl = document.getElementById('nicobot-messages');
  const inputEl    = document.getElementById('nicobot-input');
  const sendBtn    = document.getElementById('nicobot-send');
  const resetBtn   = document.getElementById('nicobot-reset');
  const quickEl    = document.getElementById('nicobot-quick-replies');

  if (!messagesEl) { console.warn('NicoBot: #nicobot-messages tidak ditemukan.'); return; }

  messagesEl.appendChild(createBotBubble('<p>Halo! 👋 Saya <strong>NicoBot</strong>, asisten resmi SMK ICB Cinta Niaga.</p><p class="mt-2">Silakan pilih topik di bawah atau ketik pertanyaanmu! 😊</p>'));

  if (quickEl) loadQuickReplies(quickEl);

  sendBtn?.addEventListener('click', () => sendMessage(inputEl?.value.trim() ?? ''));
  inputEl?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(inputEl.value.trim()); }
  });
  resetBtn?.addEventListener('click', resetSession);
}