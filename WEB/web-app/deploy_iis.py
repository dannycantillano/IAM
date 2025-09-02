# deploy_iis.py
# Copia/ despliegue de dist/ a IIS con soporte de backup y exclusiones.
import argparse
import os
import sys
import shutil
from datetime import datetime
from pathlib import Path
import fnmatch
import subprocess
from typing import List, Optional

DEFAULT_SRC = Path("dist")
DEFAULT_DEST = Path(r"C:\inetpub\wwwroot\IAMWEB_QA")

def eprint(*a): print(*a, file=sys.stderr)

def ts() -> str:
    return datetime.now().strftime("%Y%m%d_%H%M%S")

def validate_paths(src: Path, dest: Path):
    if not src.exists() or not src.is_dir():
        eprint(f"ERROR: No existe la carpeta de origen: {src}")
        sys.exit(1)
    if not (src / "index.html").exists():
        eprint(f"ADVERTENCIA: {src}/index.html no existe. ¿Ejecutaste npm run build?")
    dest.parent.mkdir(parents=True, exist_ok=True)

def backup_dest_dircopy(dest: Path, backup_root: Path) -> Path:
    backup_root.mkdir(parents=True, exist_ok=True)
    backup_dir = backup_root / f"{dest.name}_bak_{ts()}"
    print(f"Creando respaldo (copia de carpeta) en: {backup_dir}")
    shutil.copytree(dest, backup_dir)
    return backup_dir

def backup_dest_zip(dest: Path, backup_root: Path) -> Path:
    backup_root.mkdir(parents=True, exist_ok=True)
    zip_base = backup_root / f"{dest.name}_bak_{ts()}"
    zip_path = shutil.make_archive(str(zip_base), "zip", root_dir=dest)
    print(f"Creando respaldo ZIP en: {zip_path}")
    return Path(zip_path)

def _match_any(name: str, patterns: List[str]) -> bool:
    return any(fnmatch.fnmatch(name, pat) for pat in patterns)

def copy_update(src: Path, dest: Path, exclude_files: List[str], exclude_dirs: List[str]):
    """
    Copia incremental con exclusiones. Las exclusiones se comparan por nombre (no ruta completa).
    """
    dest.mkdir(parents=True, exist_ok=True)
    for root, dirs, files in os.walk(src):
        # Filtrado de carpetas
        dirs[:] = [d for d in dirs if not _match_any(d, exclude_dirs)]
        rel = Path(root).relative_to(src)
        dest_root = dest / rel
        dest_root.mkdir(parents=True, exist_ok=True)

        for f in files:
            if _match_any(f, exclude_files):
                continue
            s = Path(root) / f
            d = dest_root / f
            try:
                if not d.exists() or s.stat().st_mtime > d.stat().st_mtime or s.stat().st_size != d.stat().st_size:
                    shutil.copy2(s, d)
            except PermissionError:
                eprint(f"✖ Permiso denegado copiando: {s} → {d}")
                raise

def remove_extraneous(src: Path, dest: Path, exclude_files: List[str], exclude_dirs: List[str]):
    """
    Borra en destino lo que no exista en origen, respetando exclusiones.
    """
    for root, dirs, files in os.walk(dest, topdown=False):
        rel = Path(root).relative_to(dest)
        src_root = src / rel

        # Archivos
        for f in files:
            if _match_any(f, exclude_files):
                continue
            dfile = Path(root) / f
            sfile = src_root / f
            if not sfile.exists():
                try:
                    dfile.unlink(missing_ok=True)
                except PermissionError:
                    eprint(f"✖ Permiso denegado eliminando archivo: {dfile}")
                    raise

        # Directorios
        for dname in dirs:
            if _match_any(dname, exclude_dirs):
                continue
            ddir = Path(root) / dname
            sdir = src_root / dname
            if not sdir.exists():
                try:
                    shutil.rmtree(ddir, ignore_errors=False)
                except Exception as ex:
                    # Si falla por ACL, al menos intenta con ignore_errors
                    shutil.rmtree(ddir, ignore_errors=True)

def run_robocopy(src: Path, dest: Path, mirror: bool, excludes_files: List[str], excludes_dirs: List[str]):
    """
    Ejecuta Robocopy con /MIR o /E y exclusiones de archivos (/XF) y carpetas (/XD).
    Códigos Robocopy: 0-7 = OK; >=8 = error.
    """
    args = ["robocopy", str(src), str(dest)]
    args += ["/MIR" if mirror else "/E", "/R:1", "/W:1", "/NFL", "/NDL", "/NP", "/NJH", "/NJS", "/MT"]
    if excludes_files:
        args += ["/XF"] + excludes_files
    if excludes_dirs:
        args += ["/XD"] + excludes_dirs

    print("Ejecutando:", " ".join(args))
    rc = subprocess.call(args)
    if rc >= 8:
        raise RuntimeError(f"robocopy falló con código {rc}")
    else:
        print(f"robocopy completado (código {rc})")

def main():
    parser = argparse.ArgumentParser(description="Deploy de dist/ a IIS con backup y exclusiones")
    parser.add_argument("--src", type=Path, default=DEFAULT_SRC, help="Carpeta origen (build), p.ej. dist")
    parser.add_argument("--dest", type=Path, default=DEFAULT_DEST, help=r"Carpeta destino IIS, p.ej. C:\inetpub\wwwroot\IAMWEB_QA")
    parser.add_argument("--mirror", action="store_true", help="Reflejar: borra en destino lo que no existe en origen")
    parser.add_argument("--backup", action="store_true", help="Crear respaldo del destino antes de copiar")
    parser.add_argument("--backup-dir", type=Path, default=None, help="Dónde guardar el backup (mejor fuera de wwwroot)")
    parser.add_argument("--zip-backup", action="store_true", help="Respaldo en ZIP (si no, copia de carpeta)")
    parser.add_argument("--robocopy", action="store_true", help="Usar Robocopy (Windows) en lugar de copia Python")
    parser.add_argument("--exclude", action="append", default=[], help="Patrones de archivos a excluir (ej: config.js, *.map, *.config). Repetible.")
    parser.add_argument("--exclude-dir", action="append", default=[], help="Carpetas a excluir (ej: .git, node_modules, vendor). Repetible.")
    args = parser.parse_args()

    src = args.src.resolve()
    dest = args.dest.resolve()

    print(f"Origen: {src}")
    print(f"Destino: {dest}")
    print(f"Opciones: mirror={args.mirror}, backup={args.backup}, zip_backup={args.zip_backup}, robocopy={args.robocopy}")
    print(f"Excluye archivos: {args.exclude}")
    print(f"Excluye carpetas: {args.exclude_dir}")

    validate_paths(src, dest)

    # Backup (si existe destino)
    if args.backup and dest.exists():
        try:
            backup_root = args.backup_dir.resolve() if args.backup_dir else dest.parent
            if args.zip_backup:
                backup_dest_zip(dest, backup_root)
            else:
                backup_dest_dircopy(dest, backup_root)
        except PermissionError:
            eprint("✖ Sin permisos para crear el backup. Ejecuta como Administrador o usa --backup-dir fuera de C:\\inetpub")
            sys.exit(2)

    # Copia/Sync
    try:
        if args.robocopy and os.name == "nt":
            run_robocopy(src, dest, args.mirror, args.exclude, args.exclude_dir)
        else:
            copy_update(src, dest, args.exclude, args.exclude_dir)
            if args.mirror:
                remove_extraneous(src, dest, args.exclude, args.exclude_dir)
        print("✔ Deploy completado con éxito.")
        sys.exit(0)
    except PermissionError:
        eprint("✖ Error de permisos al copiar. Ejecuta la consola como Administrador o asigna permisos NTFS.")
        sys.exit(2)
    except Exception as ex:
        eprint("✖ Error durante el deploy:", ex)
        sys.exit(2)

if __name__ == "__main__":
    main()



# py deploy_iis.py --mirror --backup --robocopy
#  py deploy_iis.py --mirror --backup --exclude *.config

# Se debe dar permisos al usuario que sale en el comando whoami a la arpeta de wwwroot para qeu funcione