#!/usr/bin/env python3
"""Скачивает фото товаров с публичных папок Яндекс.Диска и готовит веб-версии.

Оригиналы -> content/raw/<категория>/<путь как на Диске>
Веб-версии -> public/catalog/<категория>/<путь как на Диске>/<имя>.webp

Изображения: поворот по EXIF, длинная сторона <= 1600px, WebP q=82.
Видео: только скачивается, без конвертации.

Запуск:
    .venv/bin/python scripts/fetch_catalog.py            # всё целиком
    .venv/bin/python scripts/fetch_catalog.py --only свечи
    .venv/bin/python scripts/fetch_catalog.py --report   # только показать статистику
"""

from __future__ import annotations

import argparse
import io
import json
import os
import sys
import time
from collections import Counter
from pathlib import Path

import requests
from PIL import Image, ImageOps

import pillow_heif

pillow_heif.register_heif_opener()

API = "https://cloud-api.yandex.net/v1/disk/public/resources"
PAGE = 200

REPO = Path(__file__).resolve().parent.parent
RAW = REPO / "content" / "raw"
WEB = REPO / "public" / "catalog"

SOURCES = {
    "gypsum": "https://disk.yandex.ru/d/Ksxqdhh9LCZOaw",
    "candles": "https://disk.yandex.ru/d/qeRK2OjHrQgUlA",
    "soap": "https://disk.yandex.ru/d/H_yBwo6MfOuWmA",
}

# русские псевдонимы для --only
ALIASES = {"гипс": "gypsum", "свечи": "candles", "мыло": "soap"}

IMAGE_EXT = {".jpg", ".jpeg", ".png", ".heic", ".heif", ".webp", ".tif", ".tiff", ".bmp"}
VIDEO_EXT = {".mp4", ".mov", ".avi", ".mkv", ".webm", ".m4v", ".3gp"}

MAX_SIDE = 1600
QUALITY = 82

session = requests.Session()
session.headers["User-Agent"] = "candles-soap-catalog/1.0"


def api_list(public_key: str, path: str = "/") -> list[dict]:
    """Возвращает содержимое одной папки, разворачивая пагинацию."""
    items: list[dict] = []
    offset = 0
    while True:
        params = {"public_key": public_key, "limit": PAGE, "offset": offset}
        if path and path != "/":
            params["path"] = path
        data = request_json(API, params)
        emb = data.get("_embedded") or {}
        batch = emb.get("items", [])
        items.extend(batch)
        total = emb.get("total", len(items))
        offset += len(batch)
        if not batch or offset >= total:
            return items


class BlockedError(RuntimeError):
    """Хост запрещён политикой прокси — повторять бессмысленно."""


def check_blocked(exc: Exception) -> None:
    """Отличает запрет прокси (403/407 на CONNECT) от обычного сетевого сбоя."""
    text = str(exc)
    if "Tunnel connection failed: 403" in text or "Tunnel connection failed: 407" in text:
        raise BlockedError(
            "Выход в сеть на cloud-api.yandex.net / downloader.disk.yandex.ru закрыт "
            "политикой прокси (403 на CONNECT). Нужно добавить эти хосты в allowlist "
            "окружения — повторные попытки не помогут."
        ) from exc


def request_json(url: str, params: dict) -> dict:
    """GET с ретраями на сетевые ошибки и 5xx/429."""
    delay = 2
    last = None
    for attempt in range(5):
        try:
            r = session.get(url, params=params, timeout=60)
            if r.status_code in (429, 500, 502, 503, 504):
                last = f"HTTP {r.status_code}"
            else:
                r.raise_for_status()
                return r.json()
        except requests.RequestException as exc:
            check_blocked(exc)
            last = str(exc)
        if attempt < 4:
            time.sleep(delay)
            delay *= 2
    raise RuntimeError(f"не удалось получить {url}: {last}")


def walk(public_key: str, path: str = "/", prefix: str = "") -> list[tuple[str, dict]]:
    """Рекурсивно обходит папку. Возвращает [(относительный путь папки, item), ...]."""
    found: list[tuple[str, dict]] = []
    for item in api_list(public_key, path):
        name = item.get("name", "")
        if item.get("type") == "dir":
            child_path = item.get("path") or f"{path.rstrip('/')}/{name}"
            child_prefix = f"{prefix}/{name}" if prefix else name
            found.extend(walk(public_key, child_path, child_prefix))
        elif item.get("type") == "file":
            found.append((prefix, item))
    return found


def download(item: dict, dest: Path) -> bool:
    """Скачивает файл, если его ещё нет с тем же размером. True — если качали."""
    size = item.get("size")
    if dest.exists() and size is not None and dest.stat().st_size == size:
        return False

    url = item.get("file")
    if not url:
        raise RuntimeError(f"у файла {item.get('name')} нет прямой ссылки (поле file)")

    dest.parent.mkdir(parents=True, exist_ok=True)
    tmp = dest.with_suffix(dest.suffix + ".part")
    delay = 2
    for attempt in range(5):
        try:
            with session.get(url, stream=True, timeout=300) as r:
                r.raise_for_status()
                with open(tmp, "wb") as fh:
                    for chunk in r.iter_content(1 << 20):
                        fh.write(chunk)
            tmp.replace(dest)
            return True
        except requests.RequestException as exc:
            tmp.unlink(missing_ok=True)
            check_blocked(exc)
            if attempt == 4:
                raise RuntimeError(f"не скачался {item.get('name')}: {exc}") from exc
            time.sleep(delay)
            delay *= 2
    return False


def make_web_version(src: Path, dest: Path) -> bool:
    """EXIF-поворот, ресайз до MAX_SIDE, WebP q=82. True — если файл пересобран."""
    if dest.exists() and dest.stat().st_mtime >= src.stat().st_mtime:
        return False

    with Image.open(src) as im:
        im = ImageOps.exif_transpose(im)

        has_alpha = im.mode in ("RGBA", "LA") or (
            im.mode == "P" and "transparency" in im.info
        )
        im = im.convert("RGBA" if has_alpha else "RGB")

        long_side = max(im.size)
        if long_side > MAX_SIDE:
            scale = MAX_SIDE / long_side
            new_size = (max(1, round(im.width * scale)), max(1, round(im.height * scale)))
            im = im.resize(new_size, Image.LANCZOS)

        dest.parent.mkdir(parents=True, exist_ok=True)
        im.save(dest, "WEBP", quality=QUALITY, method=6)
    return True


def unique_dest(base: Path) -> Path:
    """Разводит коллизии, когда foo.jpg и foo.png дают один foo.webp."""
    if not base.exists():
        return base
    stem, suffix, parent = base.stem, base.suffix, base.parent
    n = 2
    while (candidate := parent / f"{stem}-{n}{suffix}").exists():
        n += 1
    return candidate


def process_category(category: str, public_key: str, stats: dict) -> None:
    print(f"\n=== {category} ===", flush=True)
    files = walk(public_key)
    print(f"найдено файлов: {len(files)}", flush=True)

    taken: set[Path] = set()
    for rel_dir, item in files:
        name = item["name"]
        ext = Path(name).suffix.lower()
        raw_path = RAW / category / rel_dir / name if rel_dir else RAW / category / name

        downloaded = download(item, raw_path)
        folder = rel_dir or "."
        stats[category]["folders"][folder] += 1

        if ext in IMAGE_EXT:
            web_base = (WEB / category / rel_dir / name if rel_dir else WEB / category / name)
            web_path = web_base.with_suffix(".webp")
            if web_path in taken:
                web_path = unique_dest(web_path)
            taken.add(web_path)
            try:
                make_web_version(raw_path, web_path)
                stats[category]["images"] += 1
            except Exception as exc:  # битый файл не должен ронять весь прогон
                stats[category]["failed"].append(f"{rel_dir}/{name}: {exc}")
                print(f"  ! не сконвертировался {name}: {exc}", flush=True)
        elif ext in VIDEO_EXT:
            stats[category]["videos"] += 1
        else:
            stats[category]["other"] += 1

        if downloaded:
            print(f"  + {rel_dir + '/' if rel_dir else ''}{name}", flush=True)


def new_stats() -> dict:
    return {
        c: {"images": 0, "videos": 0, "other": 0, "failed": [], "folders": Counter()}
        for c in SOURCES
    }


def report(stats: dict) -> str:
    lines = ["", "=" * 60, "ИТОГО", "=" * 60]
    grand = 0
    for category, s in stats.items():
        total = s["images"] + s["videos"] + s["other"]
        grand += total
        lines.append(f"\n{category}: {total} файлов "
                     f"(изображений {s['images']}, видео {s['videos']}, прочее {s['other']})")
        for folder, n in sorted(s["folders"].items()):
            label = "корень папки" if folder == "." else folder
            lines.append(f"    {label}: {n}")
        for err in s["failed"]:
            lines.append(f"    ! {err}")
    lines.append(f"\nВсего: {grand} файлов")
    return "\n".join(lines)


def scan_disk() -> dict:
    """Собирает статистику по уже скачанному — для --report без сети."""
    stats = new_stats()
    for category in SOURCES:
        root = RAW / category
        if not root.exists():
            continue
        for path in sorted(root.rglob("*")):
            if not path.is_file() or path.name.endswith(".part"):
                continue
            rel_dir = str(path.parent.relative_to(root)).replace(os.sep, "/")
            stats[category]["folders"][rel_dir] += 1
            ext = path.suffix.lower()
            if ext in IMAGE_EXT:
                stats[category]["images"] += 1
            elif ext in VIDEO_EXT:
                stats[category]["videos"] += 1
            else:
                stats[category]["other"] += 1
    return stats


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", help="одна категория: гипс/свечи/мыло или gypsum/candles/soap")
    ap.add_argument("--report", action="store_true", help="только статистика по скачанному")
    args = ap.parse_args()

    if args.report:
        print(report(scan_disk()))
        return 0

    targets = dict(SOURCES)
    if args.only:
        key = ALIASES.get(args.only.lower(), args.only.lower())
        if key not in SOURCES:
            print(f"неизвестная категория: {args.only}", file=sys.stderr)
            return 2
        targets = {key: SOURCES[key]}

    stats = new_stats()
    try:
        for category, public_key in targets.items():
            process_category(category, public_key, stats)
    except BlockedError as exc:
        print(f"\nОСТАНОВЛЕНО: {exc}", file=sys.stderr)
        return 3

    summary = report({k: v for k, v in stats.items() if k in targets})
    print(summary)
    (REPO / "content" / "catalog-report.txt").write_text(summary.strip() + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    sys.exit(main())
