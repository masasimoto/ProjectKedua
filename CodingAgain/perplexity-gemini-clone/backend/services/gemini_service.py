# backend/services/gemini_service.py
import os
import google.generativeai as genai

# Konfigurasi Gemini API Key dari environment variable
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY tidak ditemukan di environment. Harap set di file .env")

genai.configure(api_key=GEMINI_API_KEY)

# Inisialisasi model Gemini Pro
model = genai.GenerativeModel('gemini-2.5-flash-lite')

def get_gemini_response(prompt: str) -> str:
    """
    Fungsi ini mengambil prompt string dan mengembalikan
    respons teks dari model Gemini.
    Ini adalah implementasi dasar, bisa dikembangkan untuk streaming, dll.
    """
    try:
        # Di sini Anda bisa menambahkan konteks, history chat, dll.
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Error saat berkomunikasi dengan Gemini: {e}")
        return "Maaf, terjadi masalah saat mencoba mendapatkan respons dari AI."