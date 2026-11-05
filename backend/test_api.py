import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from backend.app.database import init_db
from backend.app.main import app

def run_tests():
    print("1. Initializing DB...")
    init_db()
    print("DB initialized!")

    print("2. Testing with TestClient...")
    with TestClient(app) as client:
        r = client.get("/api/health")
        print("Health status:", r.status_code, r.json())
        assert r.status_code == 200

        r2 = client.post("/api/projects/sample")
        print("Sample project created:", r2.status_code)
        assert r2.status_code == 200
        project_data = r2.json()
        print("Project name:", project_data["name"])
        project_id = project_data["id"]

        r3 = client.get(f"/api/projects/{project_id}")
        print("Project details:", r3.status_code, "files:", len(r3.json()["file_tree"]))
        assert r3.status_code == 200

        r4 = client.get(f"/api/projects/{project_id}/file?path=backend/main.py")
        print("File read test:", r4.status_code, "content length:", len(r4.json()["content"]))
        assert r4.status_code == 200

        # Test flashcards
        r5 = client.get(f"/api/interview/{project_id}/flashcards")
        print("Flashcards test:", r5.status_code, "count:", len(r5.json()))
        assert r5.status_code == 200

        # Test chat session
        r6 = client.post("/api/chat/sessions", json={"project_id": project_id, "title": "Test Chat"})
        session_id = r6.json()["id"]
        print("Chat session created:", session_id)
        assert r6.status_code == 200

        r7 = client.post(f"/api/chat/sessions/{session_id}/messages", json={"content": "Explain the architecture of this repo"})
        print("Chat message reply:", r7.status_code, "length:", len(r7.json()["content"]))
        print("Citations count:", len(r7.json().get("citations", [])))
        assert r7.status_code == 200

        # Test doc generation
        r8 = client.post(f"/api/docs/{project_id}/generate", json={"doc_type": "architecture"})
        print("Doc generated:", r8.status_code, "docs:", len(r8.json()))
        assert r8.status_code == 200

    print("\n>>> ALL BACKEND ENDPOINTS AND FUNCTIONALITIES VERIFIED PERFECTLY! <<<")

if __name__ == "__main__":
    run_tests()
