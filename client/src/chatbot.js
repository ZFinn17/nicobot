// =============================================
// NicoBot Client — chatbot.js (Template Mode)
// =============================================

const API_BASE = '/api';
const ADMIN_WA = '081221049998';

function getSessionId() {
  let sid = sessionStorage.getItem('nicobot_session');
  if (!sid) {
    sid = 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    sessionStorage.setItem('nicobot_session', sid);
  }
  return sid;
}

const state = {
  sessionId: getSessionId(),
  isLoading: false,
};

// ---- Format teks: *bold* dan newline → <br> ----
function formatText(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}

// ---- Bubble bot ----
function createBotBubble(text, isTyping = false) {
  const wrapper = document.createElement('div');
  wrapper.className = 'flex items-start gap-2 message-enter';

  const avatar = document.createElement('div');
  avatar.className =
    'w-8 h-8 rounded-full bg-blue-950 flex items-center justify-center flex-shrink-0 mt-1';
  avatar.innerHTML = '<i class="fa-solid fa-robot text-yellow-400 text-xs"></i>';

  const bubble = document.createElement('div');
  bubble.className = 'nicobot-bubble-bot';

  if (isTyping) {
    wrapper.id = 'nicobot-typing';
    bubble.innerHTML = `<span class="nicobot-typing-dots"><span></span><span></span><span></span></span>`;
  } else {
    bubble.innerHTML = formatText(text);
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

// ---- Load quick replies dari server ----
async function loadQuickReplies(container) {
  try {
    const res = await fetch(`${API_BASE}/quick-replies`);
    const replies = await res.json();
    container.innerHTML = '';
    replies.forEach((r) => {
      const btn = document.createElement('button');
      btn.className = 'nicobot-quick-btn';
      btn.textContent = r.label;
      // Kirim 'message' (bukan label) supaya engine bisa cocokkan keyword
      btn.addEventListener('click', () => {
        container.style.display = 'none';
        sendMessage(r.message || r.label);
      });
      container.appendChild(btn);
    });
  } catch {
    container.innerHTML = '<p class="text-xs text-gray-400 px-1">Gagal memuat pilihan.</p>';
  }
}

// ---- Kirim pesan ke server ----
async function sendMessage(text) {
  if (state.isLoading || !text.trim()) return;

  const messagesEl = document.getElementById('nicobot-messages');
  const inputEl    = document.getElementById('nicobot-input');
  const sendBtn    = document.getElementById('nicobot-send');
  const quickEl    = document.getElementById('nicobot-quick-replies');

  // Tampilkan pesan user
  messagesEl.appendChild(createUserBubble(text));
  if (inputEl) inputEl.value = '';
  if (quickEl) quickEl.style.display = 'none';
  scrollToBottom(messagesEl);

  // Typing indicator
  state.isLoading = true;
  if (sendBtn) sendBtn.disabled = true;
  messagesEl.appendChild(createBotBubble('', true));
  scrollToBottom(messagesEl);

  // Simulasi delay supaya terasa natural (400ms)
  await new Promise(r => setTimeout(r, 400));

  try {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        sessionId: state.sessionId,
      }),
    });

    const data = await res.json();
    document.getElementById('nicobot-typing')?.remove();

    if (data.error) {
      messagesEl.appendChild(createBotBubble('⚠️ ' + data.error));
    } else {
      messagesEl.appendChild(createBotBubble(data.reply));

      // Kalau intent fallback, tunjukkan lagi quick replies
      if (data.intent === 'fallback') {
        if (quickEl) {
          quickEl.style.display = 'flex';
          loadQuickReplies(quickEl);
        }
      }
    }
  } catch {
    document.getElementById('nicobot-typing')?.remove();
    messagesEl.appendChild(
      createBotBubble('Tidak bisa terhubung ke server. Pastikan server NicoBot sudah berjalan. 🔌')
    );
  } finally {
    state.isLoading = false;
    if (sendBtn) sendBtn.disabled = false;
    scrollToBottom(messagesEl);
  }
}

// ---- Reset percakapan ----
async function resetSession() {
  try {
    await fetch(`${API_BASE}/reset-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: state.sessionId }),
    });
  } catch { /* silent */ }

  sessionStorage.removeItem('nicobot_session');
  state.sessionId = getSessionId();
  state.isLoading = false;

  const messagesEl = document.getElementById('nicobot-messages');
  const inputEl    = document.getElementById('nicobot-input');
  const sendBtn    = document.getElementById('nicobot-send');
  const quickEl    = document.getElementById('nicobot-quick-replies');

  if (messagesEl) {
    messagesEl.innerHTML = '';
    messagesEl.appendChild(createBotBubble(
      'Halo! 👋 Saya NicoBot, asisten resmi SMK ICB Cinta Niaga.\n\nAda yang bisa saya bantu? 😊'
    ));
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

  if (!messagesEl) {
    console.warn('NicoBot: elemen #nicobot-messages tidak ditemukan.');
    return;
  }

  // Pesan sambutan
  messagesEl.appendChild(createBotBubble(
    'Halo! 👋 Saya NicoBot, asisten resmi SMK ICB Cinta Niaga.\n\nSilakan pilih topik di bawah atau ketik pertanyaanmu! 😊'
  ));

  if (quickEl) loadQuickReplies(quickEl);

  sendBtn?.addEventListener('click', () => {
    sendMessage(inputEl?.value.trim() ?? '');
  });

  inputEl?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputEl.value.trim());
    }
  });

  resetBtn?.addEventListener('click', resetSession);
}