# backend/app.py

import os
from uuid import uuid4
from dotenv import load_dotenv
load_dotenv()
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from services.gemini_service import get_gemini_response_stream

app = Flask(__name__)
CORS(app, expose_headers=['X-Session-Id'])

@app.route('/api/chat', methods=['POST'])
def chat():
    """
    Endpoint ini sekarang mendukung streaming dan multi-turn.
    """
    try:
        data = request.json
        prompt = data.get('prompt')

        session_id = data.get('session_id') or str(uuid4())

        if not prompt:
            return jsonify({"error": "Prompt tidak boleh kosong"}), 400

        def generate():
            stream = get_gemini_response_stream(session_id, prompt)
            for chunk in stream:
                yield chunk

        response = Response(generate(), mimetype='text/plain')
        response.headers['X-Session-Id'] = session_id
        return response

    except Exception as e:
        print(f"Error pada endpoint /api/chat: {e}")
        return jsonify({"error": "Terjadi kesalahan pada server"}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, port=port)
