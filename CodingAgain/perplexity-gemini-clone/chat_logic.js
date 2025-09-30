// chat_logic.js

document.addEventListener("DOMContentLoaded", () => {
  // selektor yang lebih spesifik berdasarkan struktur asli
  const chatInputArea = document.getElementById("ask-input");
  const submitButton = document.getElementById("chat-submit-button");
  const mainInputContainer = document.getElementById("main-input-container");

  // Elemen-elemen ini adalah bagian dari welcome screen yang akan disembunyikan
  const welcomeLogo = document.querySelector(".static.w-full.grow .mb-lg.bottom-0");
  const welcomeActions = document.querySelector(".static.w-full.grow .relative.w-full .mt-lg.absolute");
  const scrollableContainer = document.querySelector(".scrollable-container");

  if (!mainInputContainer || !chatInputArea || !submitButton || !welcomeLogo || !welcomeActions) {
    console.error("Satu atau lebih elemen penting tidak ditemukan. Struktur HTML mungkin berubah.");
    return;
  }

  // Variabel untuk menyimpan sesi chat
  // Alasan: Untuk melacak sesi percakapan saat ini di sisi klien.
  let currentSessionId = null;

  // --- SVG & KONTEN DINAMIS ---
  const voiceIconSVG = submitButton.innerHTML;
  const sendIconSVG = `
        <div class="flex items-center min-w-0 gap-two justify-center">
            <div class="flex shrink-0 items-center justify-center size-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 5l0 14"></path>
                    <path d="M18 11l-6 -6l-6 6"></path>
                </svg>
            </div>
        </div>`;

  // --- FUNGSI UTAMA ---
  const handleChatSubmit = async (event) => {
    event.preventDefault();
    const prompt = chatInputArea.innerText.trim();
    if (!prompt) return;

    if (!document.body.classList.contains("chat-active")) {
      transformUiForChat();
    }

    const chatContainer = document.getElementById("chat-container");
    const userMessageEl = appendUserMessage(prompt, chatContainer);
    chatInputArea.innerHTML = "";
    updateSubmitButtonIcon();

    userMessageEl.scrollIntoView({ behavior: "smooth", block: "center" });

    const aiMessageElement = appendAiMessageLoading(chatContainer);
    aiMessageElement.scrollIntoView({ behavior: "smooth", block: "center" });

    await streamAiResponse(prompt, aiMessageElement);
  };

  const transformUiForChat = () => {
    const chatAreaHTML = `<div id="main-chat-area" class="relative"><div id="chat-container"></div></div>`;
    scrollableContainer.insertAdjacentHTML("afterbegin", chatAreaHTML);

    // Beri class pada elemen spesifik untuk disembunyikan
    welcomeLogo.classList.add("welcome-logo");
    welcomeActions.classList.add("welcome-actions");

    document.body.classList.add("chat-active");
    addScrollButtons();
  };

  const updateSubmitButtonIcon = () => {
    const hasText = chatInputArea.innerText.trim() !== "";
    submitButton.innerHTML = hasText ? sendIconSVG : voiceIconSVG;
  };

  // --- FUNGSI PEMBANTU (HELPERS) ---
  const appendUserMessage = (prompt, container) => {
    const messageEl = document.createElement("div");
    messageEl.className = "message-bubble user";
    messageEl.innerHTML = `<div class="message-content"><p class="user-prompt-text">${prompt.replace(/\n/g, "<br>")}</p></div>`;
    container.appendChild(messageEl);
    return messageEl;
  };

  const appendAiMessageLoading = (container) => {
    const messageEl = document.createElement("div");
    messageEl.className = "message-bubble ai";
    messageEl.innerHTML = `
            <div class="message-content">
                <div class="loader-container">
                    <svg class="loader-svg" viewBox="0 0 101 116">
                        <defs><linearGradient id="loader-gradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#20808D;" /><stop offset="100%" style="stop-color:#091717;" /></linearGradient></defs>
                        <path d="M86.4325 6.53418L50.4634 36.9696H86.4325V6.53418Z M50.4625 36.9696L17.2603 6.53418V36.9696H50.4625Z M50.4634 1L50.4634 114.441 M83.6656 70.172L50.4634 36.9697V79.3026L83.6656 108.908V70.172Z M17.2603 70.172L50.4625 36.9697V78.4497L17.2603 108.908V70.172Z M3.42627 36.9697V81.2394H17.2605V70.172L50.4628 36.9697H3.42627Z M50.4634 36.9697L83.6656 70.172V81.2394H97.4999V36.9697L50.4634 36.9697Z"></path>
                    </svg>
                </div>
            </div>`;
    container.appendChild(messageEl);
    return messageEl;
  };

  const finalizeAiMessage = (element, fullText) => {
    const html = marked.parse(fullText);
    element.querySelector(".message-content").innerHTML = `<div class="prose">${html}</div>`;
    element.querySelectorAll("pre code").forEach(hljs.highlightElement);
  };

  // --- FITUR TOMBOL SCROLL ---
  const addScrollButtons = () => {
    const chatArea = document.getElementById("main-chat-area");
    const scrollContainerHTML = `
            <div class="scroll-arrows-container">
                <div id="scroll-up" class="scroll-arrow"><?xml version="1.0"?>
<svg height="24" viewBox="0 0 48 48" width="24" xmlns="http://www.w3.org/2000/svg">
  <path d="M14 28l10-10 10 10z" fill="white"/>
  <path d="M0 0h48v48h-48z" fill="none"/>
</svg>
</div>
                <div id="scroll-down" class="scroll-arrow"><?xml version="1.0"?>
<svg height="24" viewBox="0 0 48 48" width="24" xmlns="http://www.w3.org/2000/svg">
  <path d="M14 20l10 10 10-10z" fill="white"/>
  <path d="M0 0h48v48h-48z" fill="none"/>
</svg>
</div>
            </div>`;
    chatArea.insertAdjacentHTML("beforeend", scrollContainerHTML);

    const chatContainer = document.getElementById("chat-container");
    const scrollUpBtn = document.getElementById("scroll-up");
    const scrollDownBtn = document.getElementById("scroll-down");

    scrollUpBtn.addEventListener("click", () => chatContainer.scrollTo({ top: 0, behavior: "smooth" }));
    scrollDownBtn.addEventListener("click", () => chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: "smooth" }));

    chatContainer.addEventListener("scroll", () => {
      const { scrollTop, scrollHeight, clientHeight } = chatContainer;
      // Tampilkan tombol Up jika sudah scroll ke bawah
      scrollTop > 200 ? scrollUpBtn.classList.add("visible") : scrollUpBtn.classList.remove("visible");
      // Tampilkan tombol Down jika belum sampai paling bawah
      scrollHeight - scrollTop > clientHeight + 100 ? scrollDownBtn.classList.add("visible") : scrollDownBtn.classList.remove("visible");
    });
  };

  // --- PENAMBAHAN: Fungsi baru untuk menangani streaming dari backend ---
  const streamAiResponse = async (prompt, aiMessageElement) => {
    try {
      const response = await fetch("http://127.0.0.1:5000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Kirim prompt DAN session_id saat ini ke backend
        body: JSON.stringify({ prompt, session_id: currentSessionId }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      // --- PENAMBAHAN: Simpan session_id dari header ---
      // Alasan: Menyimpan ID sesi yang dikembalikan server untuk permintaan selanjutnya.
      const sessionIdFromHeader = response.headers.get("X-Session-Id");
      if (sessionIdFromHeader) {
        currentSessionId = sessionIdFromHeader;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponseText = "";
      const contentDiv = aiMessageElement.querySelector(".message-content");

      // Siapkan container kosong untuk teks yang akan datang
      contentDiv.innerHTML = '<div class="prose" style="white-space: pre-wrap;"></div>';
      const proseDiv = contentDiv.querySelector(".prose");

      // Loop untuk membaca stream
      while (true) {
        const { value, done } = await reader.read();
        if (done) break; // Keluar dari loop jika stream selesai

        const chunk = decoder.decode(value, { stream: true });
        fullResponseText += chunk;
        // Langsung tampilkan teks mentah ke layar
        proseDiv.innerText = fullResponseText;

        // Auto-scroll ke pesan terbaru
        const scrollContainer = document.querySelector(".scrollable-container");
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }

      // Setelah stream selesai, proses Markdown
      finalizeAiMessage(aiMessageElement, fullResponseText);
    } catch (error) {
      console.error("Streaming error:", error);
      finalizeAiMessage(aiMessageElement, "Maaf, terjadi kesalahan saat mengambil respons dari AI.");
    }
  };

  // --- INISIALISASI EVENT LISTENERS ---
  mainInputContainer.addEventListener("submit", handleChatSubmit);
  submitButton.addEventListener("click", handleChatSubmit);
  chatInputArea.addEventListener("input", updateSubmitButtonIcon);
  chatInputArea.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleChatSubmit(e);
    }
  });
});
