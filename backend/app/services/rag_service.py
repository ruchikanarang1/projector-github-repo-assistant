import os
import re
from pathlib import Path
from typing import List, Dict, Any, Tuple

class RAGService:
    @staticmethod
    def chunk_file(rel_path: str, content: str, max_lines: int = 60, overlap: int = 15) -> List[Dict[str, Any]]:
        """
        Chunks code file into overlapping windows while retaining line numbers.
        """
        lines = content.splitlines()
        if not lines:
            return []

        chunks = []
        total_lines = len(lines)
        start = 0

        while start < total_lines:
            end = min(start + max_lines, total_lines)
            chunk_text = "\n".join(lines[start:end])
            
            chunks.append({
                "file": rel_path,
                "line_start": start + 1,
                "line_end": end,
                "content": chunk_text
            })

            if end >= total_lines:
                break
            start += max_lines - overlap

        return chunks

    @staticmethod
    def search_codebase(repo_dir: Path, query: str, top_k: int = 6) -> Tuple[str, List[Dict[str, Any]]]:
        """
        Searches all code files in repo_dir using ranked keyword and path relevance.
        Returns a formatted context prompt string and structured citations list.
        """
        if not repo_dir.exists():
            return "No repository files found.", []

        # Tokenize query
        terms = [t.lower() for t in re.findall(r"\w+", query) if len(t) > 2]
        if not terms:
            terms = [query.lower()]

        scored_chunks: List[Tuple[float, Dict[str, Any]]] = []

        # Walk textual files
        for root, dirs, files in os.walk(repo_dir):
            dirs[:] = [d for d in dirs if not d.startswith(".") and d not in {"node_modules", "venv", "dist", "build", "__pycache__"}]
            
            for file in files:
                ext = Path(file).suffix.lower()
                if ext in {".png", ".jpg", ".zip", ".tar", ".pyc", ".class", ".dll", ".exe", ".pdf"}:
                    continue

                full_path = Path(root) / file
                rel_path = full_path.relative_to(repo_dir).as_posix()

                try:
                    content = full_path.read_text(encoding="utf-8", errors="ignore")
                except Exception:
                    continue

                chunks = RAGService.chunk_file(rel_path, content)
                for chunk in chunks:
                    score = 0.0
                    chunk_lower = chunk["content"].lower()
                    path_lower = rel_path.lower()

                    # Scoring logic
                    for term in terms:
                        # Path match bonus (e.g. searching "auth" matches "auth.py" heavily)
                        if term in path_lower:
                            score += 5.0
                        # Exact frequency count in chunk
                        term_count = chunk_lower.count(term)
                        if term_count > 0:
                            score += min(term_count * 1.5, 6.0)

                    # Boost README, configs, entry points
                    if rel_path.lower() in ["readme.md", "main.py", "app.py", "index.ts", "app.jsx", "server.js"]:
                        score += 1.0

                    if score > 0:
                        scored_chunks.append((score, chunk))

        # Sort by score descending
        scored_chunks.sort(key=lambda x: x[0], reverse=True)
        top_chunks = [item[1] for item in scored_chunks[:top_k]]

        if not top_chunks:
            # Fallback to README or entry files if no direct keyword match
            top_chunks = RAGService._get_fallback_chunks(repo_dir)

        # Build formatted context and citations
        context_parts = []
        citations = []

        for chunk in top_chunks:
            context_parts.append(
                f"### File: {chunk['file']} (Lines {chunk['line_start']}-{chunk['line_end']})\n"
                f"```\n{chunk['content']}\n```"
            )
            citations.append({
                "file": chunk["file"],
                "line_start": chunk["line_start"],
                "line_end": chunk["line_end"],
                "snippet": "\n".join(chunk["content"].splitlines()[:5])  # First 5 lines preview
            })

        return "\n\n".join(context_parts), citations

    @staticmethod
    def _get_fallback_chunks(repo_dir: Path) -> List[Dict[str, Any]]:
        """Returns primary files (README, entry points) when query has no specific keyword match."""
        candidates = ["README.md", "readme.md", "package.json", "requirements.txt", "main.py", "server.js", "src/App.jsx", "src/main.tsx"]
        chunks = []
        for cand in candidates:
            p = repo_dir / cand
            if p.exists() and p.is_file():
                try:
                    text = p.read_text(encoding="utf-8", errors="ignore")
                    c = RAGService.chunk_file(cand, text, max_lines=50)
                    if c:
                        chunks.append(c[0])
                except Exception:
                    pass
        return chunks[:4]
