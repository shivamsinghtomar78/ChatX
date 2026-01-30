# Render deployment entry point
# This file re-exports the Flask app from api_server for compatibility
# with Render's default gunicorn command: gunicorn app:app

from api_server import app

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
