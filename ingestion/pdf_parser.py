import logging
import os
from threading import Lock
from pathlib import Path

import pymupdf


logger = logging.getLogger(__name__)
MIN_MEANINGFUL_TEXT_CHARS = 20
try:
    OCR_DPI = int(os.environ.get("AUTOARCH_OCR_DPI", "300"))
except ValueError as error:
    raise RuntimeError("AUTOARCH_OCR_DPI must be a positive integer.") from error
if OCR_DPI <= 0:
    raise RuntimeError("AUTOARCH_OCR_DPI must be a positive integer.")

_RAPID_OCR_ENGINE = None
_RAPID_OCR_LOCK = Lock()
_OCR_PAGE_LOCK = Lock()


def _has_meaningful_text(text):
    return sum(character.isalnum() for character in text) >= MIN_MEANINGFUL_TEXT_CHARS


def _get_rapidocr_engine():
    """Load RapidOCR once per worker process, on the first OCR page only."""
    global _RAPID_OCR_ENGINE
    if _RAPID_OCR_ENGINE is None:
        with _RAPID_OCR_LOCK:
            if _RAPID_OCR_ENGINE is None:
                from rapidocr import RapidOCR

                _RAPID_OCR_ENGINE = RapidOCR()
    return _RAPID_OCR_ENGINE


def _rapid_ocr_image(image):
    result = _get_rapidocr_engine()(image)
    recognized_lines = getattr(result, "txts", None) or []
    return "\n".join(str(line).strip() for line in recognized_lines if str(line).strip())


def _tesseract_ocr_image(image):
    """Use the existing Tesseract adapter as a fallback when it is available."""
    import pytesseract

    tesseract_cmd = os.environ.get("TESSERACT_CMD")
    if tesseract_cmd:
        pytesseract.pytesseract.tesseract_cmd = tesseract_cmd
    return pytesseract.image_to_string(image).strip()


def _ocr_page(page):
    """OCR one page with cached RapidOCR, falling back to Tesseract if needed."""
    from io import BytesIO

    from PIL import Image

    # Keep rasterization and inference sequential across requests in this process;
    # each request otherwise retains a full page image alongside the OCR runtime.
    with _OCR_PAGE_LOCK:
        rendered_page = page.get_pixmap(dpi=OCR_DPI)
        with Image.open(BytesIO(rendered_page.tobytes("png"))) as image:
            rapid_error = None
            try:
                text = _rapid_ocr_image(image)
                if text:
                    return text
                rapid_error = RuntimeError("RapidOCR returned no text.")
            except Exception as error:
                rapid_error = error
            logger.warning("RapidOCR was unavailable or failed; trying Tesseract fallback: %s", rapid_error)

            try:
                text = _tesseract_ocr_image(image)
                if text:
                    return text
            except Exception as tesseract_error:
                rapid_status = (
                    "RapidOCR package or dependency is missing"
                    if isinstance(rapid_error, (ImportError, ModuleNotFoundError))
                    else f"RapidOCR failed ({type(rapid_error).__name__})"
                )
                raise RuntimeError(
                    f"{rapid_status}; Tesseract fallback is unavailable or failed "
                    f"({type(tesseract_error).__name__})."
                ) from tesseract_error

            raise RuntimeError(
                "RapidOCR returned no text and Tesseract fallback returned no text."
            )


def extract_text_from_pdf(pdf_path):
    """
    Extract text from a PDF while preserving page numbers.

    Pages with fewer than 20 alphanumeric text characters use RapidOCR. If that
    engine is unavailable or fails, the existing pytesseract adapter is attempted;
    Tesseract itself must be installed separately. On Windows, configure its path
    with TESSERACT_CMD.
    """

    pdf_path = Path(pdf_path)

    if not pdf_path.exists():
        raise FileNotFoundError(f"PDF not found: {pdf_path}")

    document = pymupdf.open(pdf_path)

    pages = []

    try:
        for page_number, page in enumerate(document, start=1):
            try:
                text = (page.get_text("text") or "").strip()
            except Exception as error:
                logger.warning("Text extraction failed on page %d: %s", page_number, error)
                text = ""

            extraction_method = "text"
            if not _has_meaningful_text(text):
                extraction_method = "ocr"
                try:
                    text = (_ocr_page(page) or "").strip()
                except Exception as error:
                    logger.warning("OCR failed on page %d: %s", page_number, error)
                    text = ""

            pages.append({
                "page_number": page_number,
                "text": text,
                "extraction_method": extraction_method,
            })
    finally:
        document.close()

    return pages


if __name__ == "__main__":

    project_root = Path(__file__).resolve().parent.parent
    from storage_paths import data_dir

    pdf_file = data_dir(project_root) / "documents" / "AUTOSAR_AP_EXP_SWArchitecture.pdf"

    pages = extract_text_from_pdf(pdf_file)

    print(f"Total pages extracted: {len(pages)}")

    for page in pages[:3]:

        print("\n" + "=" * 60)
        print(f"PAGE {page['page_number']}")
        print("=" * 60)

        if page["text"]:
            print(page["text"][:1000])
        else:
            print("[NO TEXT EXTRACTED]")
