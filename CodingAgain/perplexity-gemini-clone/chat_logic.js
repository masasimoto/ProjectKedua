// chat_logic.js

document.addEventListener("DOMContentLoaded", () => {
  const chatInputArea = document.getElementById("ask-input");
  const submitButton = document.getElementById("chat-submit-button");
  const mainInputContainer = document.getElementById("main-input-container");
  const welcomeLogo = document.querySelector(".static.w-full.grow .mb-lg.bottom-0");
  const welcomeActions = document.querySelector(".static.w-full.grow .relative.w-full .mt-lg.absolute");
  const scrollableContainer = document.querySelector(".scrollable-container");
  const placeholder = document.querySelector('[aria-hidden="true"]');

  if (!mainInputContainer || !chatInputArea || !submitButton || !welcomeLogo || !welcomeActions || !placeholder) {
    console.error("Satu atau lebih elemen penting tidak ditemukan. Struktur HTML mungkin berubah.");
    return;
  }

  let currentUserMessageIndex = -1;
  let currentSessionId = null;

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

    userMessageEl.scrollIntoView({ behavior: "smooth", block: "end" });
    const aiMessageElement = appendAiMessageLoading(chatContainer);
    aiMessageElement.scrollIntoView({ behavior: "smooth", block: "end" });

    await streamAiResponse(prompt, aiMessageElement);
  };

  const transformUiForChat = () => {
    const chatAreaHTML = `<div id="main-chat-area" class="relative"><div id="chat-container"></div></div>`;
    scrollableContainer.insertAdjacentHTML("afterbegin", chatAreaHTML);

    welcomeLogo.classList.add("welcome-logo");
    welcomeActions.classList.add("welcome-actions");

    document.body.classList.add("chat-active");
    addScrollButtons();
  };

  const updateSubmitButtonIcon = () => {
    const hasText = chatInputArea.innerText.trim() !== "";
    submitButton.innerHTML = hasText ? sendIconSVG : voiceIconSVG;
  };

  const appendUserMessage = (prompt, container) => {
    const messageEl = document.createElement("div");
    messageEl.className = "message-bubble user";
    messageEl.innerHTML = `<div class="message-content"><p class="user-prompt-text">${prompt.replace(/\n/g, "<br>")}</p></div>`;
    container.appendChild(messageEl);
    createMessageToolbar(messageEl.querySelector(".message-content"));
    return messageEl;
  };

  const appendAiMessageLoading = (container) => {
    const messageEl = document.createElement("div");
    messageEl.className = "message-bubble ai";
    messageEl.innerHTML = `
        <div class="avatar-container">
            <svg class="loader-svg" viewBox="0 0 101 116">
                <defs><linearGradient id="loader-gradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#20808D;" /><stop offset="100%" style="stop-color:#091717;" /></linearGradient></defs>
                <path d="M86.4325 6.53418L50.4634 36.9696H86.4325V6.53418Z M50.4625 36.9696L17.2603 6.53418V36.9696H50.4625Z M50.4634 1L50.4634 114.441 M83.6656 70.172L50.4634 36.9697V79.3026L83.6656 108.908V70.172Z M17.2603 70.172L50.4625 36.9697V78.4497L17.2603 108.908V70.172Z M3.42627 36.9697V81.2394H17.2605V70.172L50.4628 36.9697H3.42627Z M50.4634 36.9697L83.6656 70.172V81.2394H97.4999V36.9697L50.4634 36.9697Z"></path>
            </svg>
        </div>
        <div class="message-content">
            </div>`;

    container.appendChild(messageEl);
    return messageEl;
  };

  const finalizeAiMessage = (element, fullText) => {
    const contentDiv = element.querySelector(".message-content");
    const html = marked.parse(fullText);
    element.querySelector(".message-content").innerHTML = `<div class="prose">${html}</div>`;
    element.querySelectorAll("pre code").forEach(hljs.highlightElement);
    enhanceCodeBlocks(element);
    createMessageToolbar(element.querySelector(".message-content"));

    const loaderSvg = element.querySelector(".loader-svg");
    if (loaderSvg) {
      loaderSvg.classList.remove("loader-svg");
      loaderSvg.classList.add("static-ai-logo");
    }
  };

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

    const navigateMessages = (direction) => {
      userMessages = Array.from(chatContainer.querySelectorAll(".message-bubble.user"));
      if (userMessages.length === 0) return;

      if (direction === "up") {
        if (currentUserMessageIndex <= 0) {
          currentUserMessageIndex = userMessages.length - 1;
        } else {
          currentUserMessageIndex--;
        }
      } else {
        if (currentUserMessageIndex < 0 || currentUserMessageIndex >= userMessages.length - 1) {
          currentUserMessageIndex = 0;
        } else {
          currentUserMessageIndex++;
        }
      }

      userMessages[currentUserMessageIndex].scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    };

    scrollUpBtn.addEventListener("click", () => navigateMessages("up"));
    scrollDownBtn.addEventListener("click", () => navigateMessages("down"));

    chatContainer.addEventListener("scroll", () => {
      const { scrollTop, scrollHeight, clientHeight } = chatContainer;
      scrollTop > 200 ? scrollUpBtn.classList.add("visible") : scrollUpBtn.classList.remove("visible");
      scrollHeight - scrollTop > clientHeight + 100 ? scrollDownBtn.classList.add("visible") : scrollDownBtn.classList.remove("visible");
    });
  };

  const streamAiResponse = async (prompt, aiMessageElement) => {
    try {
      const response = await fetch("http://127.0.0.1:5000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, session_id: currentSessionId }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const sessionIdFromHeader = response.headers.get("X-Session-Id");
      if (sessionIdFromHeader) {
        currentSessionId = sessionIdFromHeader;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponseText = "";
      const contentDiv = aiMessageElement.querySelector(".message-content");

      contentDiv.innerHTML = '<div class="prose"></div>';
      const proseDiv = contentDiv.querySelector(".prose");

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullResponseText += chunk;
        const renderedHtml = marked.parse(fullResponseText);
        proseDiv.innerHTML = renderedHtml;

        proseDiv.querySelectorAll("pre code").forEach((block) => {
          if (!block.classList.contains("hljs-added")) {
            hljs.highlightElement(block);
            block.classList.add("hljs-added");
          }
        });

        enhanceCodeBlocks(aiMessageElement);

        const chatContainer = document.getElementById("chat-container");
        if (chatContainer.scrollHeight - chatContainer.scrollTop <= chatContainer.clientHeight + 150) {
          chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: "smooth" });
        }
      }

      finalizeAiMessage(aiMessageElement, fullResponseText);
    } catch (error) {
      console.error("Streaming error:", error);
      finalizeAiMessage(aiMessageElement, "Maaf, terjadi kesalahan saat mengambil respons dari AI.");
    }
  };

  const enhanceCodeBlocks = (aiMessageElement) => {
    const codeBlocks = aiMessageElement.querySelectorAll("pre code");

    codeBlocks.forEach((block, index) => {
      if (block.parentElement.querySelector(".code-header")) {
        return;
      }

      const preElement = block.parentElement;
      const languageClass = Array.from(block.classList).find((cls) => cls.startsWith("language-"));
      const languageName = languageClass ? languageClass.replace("language-", "") : "code";

      const header = document.createElement("div");
      header.className = "code-header";

      const langSpan = document.createElement("span");
      langSpan.className = "code-language";
      langSpan.innerText = languageName;

      const actionsDiv = document.createElement("div");
      actionsDiv.className = "code-actions";

      const createButtonWithIcon = (svgString, text) => {
        const button = document.createElement("button");
        const textNode = document.createTextNode(` ${text}`);

        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgString, "image/svg+xml");
        const svgElement = svgDoc.documentElement;

        if (svgElement.previousSibling && svgElement.previousSibling.nodeType === 8) {
          svgElement.previousSibling.remove();
        }

        button.appendChild(svgElement);
        button.appendChild(textNode);
        return button;
      };

      const copyIconSVG = `<?xml version="1.0"?><svg width="14" height="14" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M21,8.94a1.31,1.31,0,0,0-.06-.27l0-.09a1.07,1.07,0,0,0-.19-.28h0l-6-6h0a1.07,1.07,0,0,0-.28-.19.32.32,0,0,0-.09,0A.88.88,0,0,0,14.05,2H10A3,3,0,0,0,7,5V6H6A3,3,0,0,0,3,9V19a3,3,0,0,0,3,3h8a3,3,0,0,0,3-3V18h1a3,3,0,0,0,3-3V9S21,9,21,8.94ZM15,5.41,17.59,8H16a1,1,0,0,1-1-1ZM15,19a1,1,0,0,1-1,1H6a1,1,0,0,1-1-1V9A1,1,0,0,1,6,8H7v7a3,3,0,0,0,3,3h5Zm4-4a1,1,0,0,1-1,1H10a1,1,0,0,1-1-1V5a1,1,0,0,1,1-1h3V7a3,3,0,0,0,3,3h3Z" fill="white"/></svg>`;
      const downloadIconSVG = `<?xml version="1.0"?><svg width="14" height="14" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M8,8a1,1,0,0,0,0,2H9A1,1,0,0,0,9,8Zm5,12H6a1,1,0,0,1-1-1V5A1,1,0,0,1,6,4h5V7a3,3,0,0,0,3,3h3v2a1,1,0,0,0,2,0V9s0,0,0-.06a1.31,1.31,0,0,0-.06-.27l0-.09a1.07,1.07,0,0,0-.19-.28h0l-6-6h0a1.07,1.07,0,0,0-.28-.19.29.29,0,0,0-.1,0A1.1,1.1,0,0,0,12.06,2H6A3,3,0,0,0,3,5V19a3,3,0,0,0,3,3h7a1,1,0,0,0,0-2ZM13,5.41,15.59,8H14a1,1,0,0,1-1-1ZM14,12H8a1,1,0,0,0,0,2h6a1,1,0,0,0,0-2Zm6.71,6.29a1,1,0,0,0-1.42,0l-.29.3V16a1,1,0,0,0-2,0v2.59l-.29-.3a1,1,0,0,0-1.42,1.42l2,2a1,1,0,0,0,.33.21.94.94,0,0,0,.76,0,1,1,0,0,0,.33-.21l2-2A1,1,0,0,0,20.71,18.29ZM12,18a1,1,0,0,0,0-2H8a1,1,0,0,0,0,2Z" fill="white"/></svg>`;
      const editIconSVG = `<?xml version="1.0"?><svg width="14" height="14" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M20.71,16.71l-2.42-2.42a1,1,0,0,0-1.42,0l-3.58,3.58a1,1,0,0,0-.29.71V21a1,1,0,0,0,1,1h2.42a1,1,0,0,0,.71-.29l3.58-3.58A1,1,0,0,0,20.71,16.71ZM16,20H15V19l2.58-2.58,1,1Zm-6,0H6a1,1,0,0,1-1-1V5A1,1,0,0,1,6,4h5V7a3,3,0,0,0,3,3h3v1a1,1,0,0,0,2,0V9s0,0,0-.06a1.31,1.31,0,0,0-.06-.27l0-.09a1.07,1.07,0,0,0-.19-.28h0l-6-6h0a1.07,1.07,0,0,0-.28-.19.32.32,0,0,0-.09,0L12.06,2H6A3,3,0,0,0,3,5V19a3,3,0,0,0,3,3h4a1,1,0,0,0,0-2ZM13,5.41,15.59,8H14a1,1,0,0,1-1-1ZM8,14h6a1,1,0,0,0,0-2H8a1,1,0,0,0,0,2Zm0-4H9A1,1,0,0,0,9,8H8a1,1,0,0,0,0,2Zm2,6H8a1,1,0,0,0,0,2h2a1,1,0,0,0,0-2Z" fill="white"/></svg>`;

      const copyButton = createButtonWithIcon(copyIconSVG, "Copy");
      copyButton.onclick = () => {
        navigator.clipboard.writeText(block.innerText);
        copyButton.textContent = "Copied!";
        setTimeout(() => {
          copyButton.textContent = "";
          const icon = new DOMParser().parseFromString(copyIconSVG, "image/svg+xml").documentElement;
          copyButton.appendChild(icon);
          copyButton.appendChild(document.createTextNode(" Copy"));
        }, 2000);
      };

      const downloadButton = createButtonWithIcon(downloadIconSVG, "Download");
      downloadButton.onclick = () => {
        const blob = new Blob([block.innerText], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${languageName}_snippet_${index + 1}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      };

      const editButton = createButtonWithIcon(editIconSVG, "Edit");

      actionsDiv.appendChild(copyButton);
      actionsDiv.appendChild(downloadButton);
      actionsDiv.appendChild(editButton);

      header.appendChild(langSpan);
      header.appendChild(actionsDiv);

      const container = document.createElement("div");
      container.className = "code-container";

      preElement.parentNode.insertBefore(container, preElement);

      container.appendChild(header);
      container.appendChild(preElement);
    });
  };

  const createMessageToolbar = (messageContentElement) => {
    const toolbar = document.createElement("div");
    toolbar.className = "message-toolbar";

    const copyBtn = document.createElement("button");
    copyBtn.innerHTML = `<?xml version="1.0"?><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M19,8H18V5a3,3,0,0,0-3-3H5A3,3,0,0,0,2,5V17a1,1,0,0,0,.62.92A.84.84,0,0,0,3,18a1,1,0,0,0,.71-.29l2.81-2.82H8v1.44a3,3,0,0,0,3,3h6.92l2.37,2.38A1,1,0,0,0,21,22a.84.84,0,0,0,.38-.08A1,1,0,0,0,22,21V11A3,3,0,0,0,19,8ZM8,11v1.89H6.11a1,1,0,0,0-.71.29L4,14.59V5A1,1,0,0,1,5,4H15a1,1,0,0,1,1,1V8H11A3,3,0,0,0,8,11Zm12,7.59-1-1a1,1,0,0,0-.71-.3H11a1,1,0,0,1-1-1V11a1,1,0,0,1,1-1h8a1,1,0,0,1,1,1Z" fill="white"/></svg>`;
    copyBtn.title = "Copy text";
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(messageContentElement.innerText);
    };

    const editBtn = document.createElement("button");
    editBtn.innerHTML = `<?xml version="1.0"?><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M18.5,5.5h-4a1,1,0,0,0,0,2h4a1,1,0,0,1,1,1v9.72l-1.57-1.45a1,1,0,0,0-.68-.27H8.5a1,1,0,0,1-1-1v-1a1,1,0,0,0-2,0v1a3,3,0,0,0,3,3h8.36l3,2.73a1,1,0,0,0,.68.27,1.1,1.1,0,0,0,.4-.08,1,1,0,0,0,.6-.92V8.5A3,3,0,0,0,18.5,5.5Zm-9.42,7H11.5a1,1,0,0,0,1-1V9.08a1,1,0,0,0-.29-.71L6.63,2.79a1,1,0,0,0-1.41,0L2.79,5.22a1,1,0,0,0,0,1.41l5.58,5.58A1,1,0,0,0,9.08,12.5ZM5.92,4.91,10.5,9.49v1h-1L4.91,5.92Z" fill="white"/></svg>`;
    editBtn.title = "Edit message";
    editBtn.onclick = () => {
      enableEditing(messageContentElement.parentElement);
    };

    toolbar.appendChild(copyBtn);
    toolbar.appendChild(editBtn);

    messageContentElement.insertAdjacentElement("afterend", toolbar);
  };

  const enableEditing = (messageBubble) => {
    const messageContent = messageBubble.querySelector(".message-content");
    const originalHTML = messageContent.innerHTML;
    const textToEdit = messageContent.innerText;

    messageContent.innerHTML = `
        <textarea class="edit-textarea">${textToEdit}</textarea>
        <div class="edit-actions">
            <button class="save-edit">Save & Submit</button>
            <button class="cancel-edit">Cancel</button>
        </div>
    `;

    const textarea = messageContent.querySelector(".edit-textarea");
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";

    messageContent.querySelector(".cancel-edit").onclick = () => {
      messageContent.innerHTML = originalHTML;
    };

    messageContent.querySelector(".save-edit").onclick = () => {
      const newPrompt = textarea.value.trim();
      if (newPrompt) {
        let nextMessage = messageBubble.nextElementSibling;
        while (nextMessage) {
          const toRemove = nextMessage;
          nextMessage = nextMessage.nextElementSibling;
          toRemove.remove();
        }

        messageBubble.querySelector(".user-prompt-text").innerHTML = newPrompt.replace(/\n/g, "<br>");

        const aiMessageElement = appendAiMessageLoading(messageBubble.parentElement);
        streamAiResponse(newPrompt, aiMessageElement);
      }
    };
  };

  mainInputContainer.addEventListener("submit", handleChatSubmit);
  submitButton.addEventListener("click", handleChatSubmit);
  chatInputArea.addEventListener("input", () => {
    updateSubmitButtonIcon();
    const hasText = chatInputArea.innerText.trim().length > 0;

    if (placeholder) {
      placeholder.style.display = hasText ? "none" : "block";
    }
  });

  chatInputArea.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleChatSubmit(e);
    }
  });
});
