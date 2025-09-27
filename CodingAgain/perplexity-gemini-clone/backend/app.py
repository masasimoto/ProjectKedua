# backend/app.py
import os
from dotenv import load_dotenv
# Muat environment variables dari file .env
load_dotenv()
from flask import Flask, request, jsonify
from flask_cors import CORS
from services.gemini_service import get_gemini_response

app = Flask(__name__)
# Mengizinkan request dari frontend (localhost:port_frontend)
CORS(app)

@app.route('/api/chat', methods=['POST'])
def chat():
    """
    Endpoint untuk menerima prompt dari user,
    mengirimkannya ke Gemini, dan mengembalikan respons.
    """
    try:
        data = request.json
        prompt = data.get('prompt')

        if not prompt:
            return jsonify({"error": "Prompt tidak boleh kosong"}), 400

        # Panggil service Gemini untuk mendapatkan respons
        # Logika kompleks ada di gemini_service.py (SRP)
        response_text = get_gemini_response(prompt)

        return jsonify({"response": response_text})

    except Exception as e:
        # Penanganan error yang baik
        print(f"Error pada endpoint /api/chat: {e}")
        return jsonify({"error": "Terjadi kesalahan pada server"}), 500

if __name__ == '__main__':
    # Ambil port dari environment variable atau default ke 5000
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, port=port)
