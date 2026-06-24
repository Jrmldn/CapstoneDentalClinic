"use client";

import { useEffect } from "react";

export default function Chatbot() {
  useEffect(() => {
    if (document.getElementById("df-messenger-script")) return;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://www.gstatic.com/dialogflow-console/fast/df-messenger/prod/v1/themes/df-messenger-default.css";
    document.head.appendChild(link);

    const style = document.createElement("style");
    style.id = "df-messenger-custom-styles";
    style.innerHTML = `
      df-messenger {
        z-index: 999;
        position: fixed;
        --df-messenger-font-color: #000;
        --df-messenger-font-family: Google Sans;
        --df-messenger-chat-background: #f3f6fc;
        --df-messenger-message-user-background: #d3e3fd;
        --df-messenger-message-bot-background: #fff;
        bottom: 16px;
        right: 16px;
      }
    `;
    document.head.appendChild(style);

    const script = document.createElement("script");
    script.id = "df-messenger-script";
    script.src = "https://www.gstatic.com/dialogflow-console/fast/df-messenger/prod/v1/df-messenger.js";
    script.async = true;
    document.body.appendChild(script);

    const dfMessenger = document.createElement("df-messenger");
    dfMessenger.setAttribute("location", "asia-southeast1");
    dfMessenger.setAttribute("project-id", "appointdent-chatbot");
    dfMessenger.setAttribute("agent-id", "21d227a5-51b2-4ebe-b0c5-2257426b7d80");
    dfMessenger.setAttribute("language-code", "en");
    dfMessenger.setAttribute("max-query-length", "-1");

    const chatBubble = document.createElement("df-messenger-chat-bubble");
    chatBubble.setAttribute("chat-title", "Appointdent");

    dfMessenger.appendChild(chatBubble);
    document.body.appendChild(dfMessenger);

    return () => {
      link.remove();
      style.remove();
      script.remove();
      dfMessenger.remove();
    };
  }, []);

  return null;
}