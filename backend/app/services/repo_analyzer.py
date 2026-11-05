import os
import json
from pathlib import Path
from typing import Dict, List, Any, Optional

IGNORED_DIRS = {
    ".git", ".svn", ".hg", "node_modules", "venv", ".venv", "env",
    "__pycache__", ".pytest_cache", ".mypy_cache", "dist", "build",
    "coverage", ".next", ".nuxt", "target", ".idea", ".vscode", "bin", "obj"
}

IGNORED_EXTENSIONS = {
    ".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg", ".webp",
    ".mp4", ".mov", ".avi", ".mp3", ".wav",
    ".zip", ".tar", ".gz", ".7z", ".rar",
    ".exe", ".dll", ".so", ".dylib", ".bin", ".iso",
    ".pdf", ".doc", ".docx", ".xls", ".xlsx",
    ".pyc", ".pyo", ".pyd", ".class", ".jar", ".war",
    ".lock", ".map", ".min.js", ".min.css"
}

LANGUAGE_MAP = {
    ".py": "Python",
    ".js": "JavaScript",
    ".jsx": "React (JS)",
    ".ts": "TypeScript",
    ".tsx": "React (TS)",
    ".html": "HTML",
    ".css": "CSS",
    ".scss": "SCSS",
    ".go": "Go",
    ".rs": "Rust",
    ".java": "Java",
    ".cpp": "C++",
    ".c": "C",
    ".cs": "C#",
    ".php": "PHP",
    ".rb": "Ruby",
    ".swift": "Swift",
    ".kt": "Kotlin",
    ".sql": "SQL",
    ".sh": "Shell",
    ".yaml": "YAML",
    ".yml": "YAML",
    ".json": "JSON",
    ".md": "Markdown"
}

FRAMEWORK_SIGNATURES = [
    ("FastAPI", ["fastapi"], ["main.py", "app.py"]),
    ("Flask", ["flask"], ["app.py", "wsgi.py"]),
    ("Django", ["django"], ["manage.py", "settings.py"]),
    ("React", ["react", "react-dom"], ["src/App.jsx", "src/App.tsx", "src/index.js"]),
    ("Next.js", ["next"], ["next.config.js", "next.config.mjs", "pages/_app.tsx", "app/page.tsx"]),
    ("Vue.js", ["vue"], ["src/App.vue"]),
    ("Express", ["express"], ["server.js", "app.js", "index.js"]),
    ("NestJS", ["@nestjs/core"], ["src/main.ts"]),
    ("Tailwind CSS", ["tailwindcss"], ["tailwind.config.js", "tailwind.config.ts"]),
    ("SQLAlchemy", ["sqlalchemy"], []),
    ("Prisma", ["@prisma/client", "prisma"], ["prisma/schema.prisma"]),
    ("PostgreSQL", ["psycopg2", "asyncpg", "pg"], []),
    ("MongoDB", ["pymongo", "mongoose", "motor"], []),
    ("Docker", [], ["Dockerfile", "docker-compose.yml", "docker-compose.yaml"]),
    ("Spring Boot", ["org.springframework.boot"], ["pom.xml", "build.gradle"]),
]

class RepoAnalyzer:
    @staticmethod
    def is_text_file(filepath: Path) -> bool:
        if filepath.suffix.lower() in IGNORED_EXTENSIONS:
            return False
        return True

    @staticmethod
    def scan_directory(root_path: Path) -> Dict[str, Any]:
        """
        Recursively scans repo directory, calculates stats, detects tech stack,
        and builds clean file tree.
        """
        if not root_path.exists():
            raise FileNotFoundError(f"Directory {root_path} does not exist.")

        file_tree = []
        languages: Dict[str, int] = {}
        detected_tech = set()
        file_count = 0
        total_size = 0
        readme_content = ""
        key_files = {}

        for root, dirs, files in os.walk(root_path):
            # Prune ignored directories in-place
            dirs[:] = [d for d in dirs if d not in IGNORED_DIRS and not d.startswith(".")]

            rel_root = os.path.relpath(root, root_path)
            if rel_root == ".":
                rel_root = ""

            for filename in files:
                filepath = Path(root) / filename
                rel_path = (Path(rel_root) / filename).as_posix() if rel_root else filename

                # Check if ignored extension
                ext = filepath.suffix.lower()
                if ext in IGNORED_EXTENSIONS:
                    continue

                try:
                    file_size = filepath.stat().st_size
                except Exception:
                    file_size = 0

                file_count += 1
                total_size += file_size

                # Count languages
                lang = LANGUAGE_MAP.get(ext, "Other")
                languages[lang] = languages.get(lang, 0) + 1

                # Check README
                if filename.lower() in ["readme.md", "readme.txt", "readme"]:
                    try:
                        readme_content = filepath.read_text(encoding="utf-8", errors="ignore")[:20000]
                    except Exception:
                        pass

                # Store key manifest files
                if filename in ["package.json", "requirements.txt", "pyproject.toml", "Cargo.toml", "go.mod", "Dockerfile", "docker-compose.yml"]:
                    try:
                        key_files[filename] = filepath.read_text(encoding="utf-8", errors="ignore")[:10000]
                    except Exception:
                        pass

                file_tree.append({
                    "path": rel_path,
                    "name": filename,
                    "size": file_size,
                    "extension": ext,
                    "language": lang
                })

        # Detect Frameworks from manifests and file paths
        tech_stack = RepoAnalyzer._detect_tech(key_files, file_tree)

        return {
            "file_count": file_count,
            "total_size": total_size,
            "languages": languages,
            "tech_stack": tech_stack,
            "file_tree": file_tree,
            "readme_content": readme_content,
            "key_files": key_files
        }

    @staticmethod
    def _detect_tech(key_files: Dict[str, str], file_tree: List[Dict[str, Any]]) -> List[str]:
        detected = set()
        tree_paths = {f["path"] for f in file_tree}

        # Check package.json
        if "package.json" in key_files:
            try:
                pkg_data = json.loads(key_files["package.json"])
                deps = {**pkg_data.get("dependencies", {}), **pkg_data.get("devDependencies", {})}
                for dep in deps:
                    if dep in ["react", "react-dom"]:
                        detected.add("React")
                    elif dep == "next":
                        detected.add("Next.js")
                    elif dep == "vue":
                        detected.add("Vue.js")
                    elif dep == "express":
                        detected.add("Express")
                    elif dep in ["tailwindcss", "@tailwindcss/postcss"]:
                        detected.add("Tailwind CSS")
                    elif dep == "vite":
                        detected.add("Vite")
                    elif dep in ["typescript"]:
                        detected.add("TypeScript")
                    elif dep in ["@prisma/client", "prisma"]:
                        detected.add("Prisma")
                    elif dep in ["pg", "postgres"]:
                        detected.add("PostgreSQL")
                    elif dep in ["mongodb", "mongoose"]:
                        detected.add("MongoDB")
                    elif dep in ["redux", "@reduxjs/toolkit"]:
                        detected.add("Redux")
                    elif dep in ["zustand"]:
                        detected.add("Zustand")
            except Exception:
                pass

        # Check requirements.txt or pyproject.toml
        py_deps = key_files.get("requirements.txt", "") + "\n" + key_files.get("pyproject.toml", "")
        py_deps_lower = py_deps.lower()
        if "fastapi" in py_deps_lower:
            detected.add("FastAPI")
        if "flask" in py_deps_lower:
            detected.add("Flask")
        if "django" in py_deps_lower:
            detected.add("Django")
        if "sqlalchemy" in py_deps_lower:
            detected.add("SQLAlchemy")
        if "asyncpg" in py_deps_lower or "psycopg2" in py_deps_lower:
            detected.add("PostgreSQL")
        if "pymongo" in py_deps_lower or "motor" in py_deps_lower:
            detected.add("MongoDB")
        if "pydantic" in py_deps_lower:
            detected.add("Pydantic")
        if "pytest" in py_deps_lower:
            detected.add("Pytest")

        # Check Dockerfile
        if "Dockerfile" in key_files or "docker-compose.yml" in key_files:
            detected.add("Docker")

        # Fallback path checks
        for name, req_deps, req_files in FRAMEWORK_SIGNATURES:
            for rf in req_files:
                if any(p.endswith(rf) for p in tree_paths):
                    detected.add(name)

        return sorted(list(detected))
