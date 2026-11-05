import os
import shutil
import zipfile
from pathlib import Path
from typing import Optional
from fastapi import UploadFile

class LocalRepoService:
    @staticmethod
    async def extract_uploaded_zip(upload_file: UploadFile, target_dir: Path) -> str:
        """
        Safely extracts an uploaded zip file into target_dir.
        Handles nested root folders automatically and prevents zip slip attacks.
        """
        target_dir.mkdir(parents=True, exist_ok=True)
        temp_zip_path = target_dir / "_temp_upload.zip"

        try:
            with open(temp_zip_path, "wb") as f:
                content = await upload_file.read()
                f.write(content)

            with zipfile.ZipFile(temp_zip_path, "r") as z:
                # Check root directory prefix if all files reside in a single top folder
                namelist = z.namelist()
                top_dirs = {name.split("/")[0] for name in namelist if "/" in name}
                prefix = ""
                if len(top_dirs) == 1 and all(name.startswith(list(top_dirs)[0] + "/") or name == list(top_dirs)[0] + "/" for name in namelist):
                    prefix = list(top_dirs)[0] + "/"

                resolved_target = target_dir.resolve()

                for member in z.infolist():
                    if member.is_dir():
                        continue
                    
                    filename = member.filename
                    if prefix and filename.startswith(prefix):
                        filename = filename[len(prefix):]
                    
                    if not filename:
                        continue

                    dest_path = (target_dir / filename).resolve()
                    # Security check: prevent zip slip
                    if not str(dest_path).startswith(str(resolved_target)):
                        continue

                    dest_path.parent.mkdir(parents=True, exist_ok=True)
                    with z.open(member) as source_file, open(dest_path, "wb") as dest_file:
                        dest_file.write(source_file.read())

            return str(target_dir)
        finally:
            if temp_zip_path.exists():
                try:
                    temp_zip_path.unlink()
                except Exception:
                    pass

    @staticmethod
    def link_or_copy_local_path(source_path_str: str, target_dir: Path) -> str:
        """
        Copies files from a local directory on disk into storage/repos/{project_id}.
        Skips large binary/ignored directories.
        """
        source_path = Path(source_path_str).resolve()
        if not source_path.exists() or not source_path.is_dir():
            raise ValueError(f"Path '{source_path_str}' does not exist or is not a directory.")

        target_dir.mkdir(parents=True, exist_ok=True)

        ignored = {".git", "node_modules", "venv", ".venv", "__pycache__", "dist", "build"}

        for root, dirs, files in os.walk(source_path):
            dirs[:] = [d for d in dirs if d not in ignored and not d.startswith(".")]

            rel = os.path.relpath(root, source_path)
            dest_folder = target_dir if rel == "." else target_dir / rel
            dest_folder.mkdir(parents=True, exist_ok=True)

            for f in files:
                ext = Path(f).suffix.lower()
                if ext in {".png", ".jpg", ".zip", ".tar", ".mp4", ".exe", ".dll", ".so", ".class", ".pyc"}:
                    continue
                
                src_file = Path(root) / f
                dst_file = dest_folder / f
                try:
                    shutil.copy2(src_file, dst_file)
                except Exception:
                    pass

        return str(target_dir)
