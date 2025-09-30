# backend/services/gemini_service.

import os
import google.generativeai as genai

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY tidak ditemukan di environment. Harap set di file .env")

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.5-flash-lite')

chat_sessions = {}

def get_gemini_response_stream(session_id: str, prompt: str):
    """
    FUNGSI BARU (Generator)
    Alasan: Fungsi ini mengelola riwayat chat dan mengembalikan respons
    secara streaming menggunakan 'yield' untuk setiap potongan teks.
    """
    try:
        if session_id not in chat_sessions:
            chat_sessions[session_id] = model.start_chat(history=[])

        chat = chat_sessions[session_id]
        response_stream = chat.send_message(prompt, stream=True)

        for chunk in response_stream:
            if hasattr(chunk, 'text'):
                yield chunk.text

    except Exception as e:
        print(f"Error saat berkomunikasi dengan Gemini: {e}")
        yield "Maaf, terjadi masalah saat mencoba mendapatkan respons dari AI."
