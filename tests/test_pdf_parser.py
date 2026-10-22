from io import BytesIO
import sys
from types import SimpleNamespace

from PIL import Image
import pytest
import pytesseract

from ingestion import pdf_parser


@pytest.fixture(autouse=True)
def reset_rapidocr_engine(monkeypatch):
    monkeypatch.setattr(pdf_parser, "_RAPID_OCR_ENGINE", None)


class FakeDocument:
    def __init__(self, pages):
        self.pages = pages
        self.closed = False

    def __iter__(self):
        return iter(self.pages)

    def close(self):
        self.closed = True


@pytest.fixture
def fake_pdf(monkeypatch, tmp_path):
    pdf_path = tmp_path / "sample.pdf"
    pdf_path.touch()
    pages = []
    document = FakeDocument(pages)
    monkeypatch.setattr(pdf_parser.pymupdf, "open", lambda _path: document)
    return pdf_path, pages, document


def test_digital_page_uses_text_without_ocr(fake_pdf, monkeypatch):
    pdf_path, pages, _document = fake_pdf
    pages.append(SimpleNamespace(get_text=lambda _kind: "A digital PDF page with useful content."))
    ocr_calls = []
    monkeypatch.setattr(pdf_parser, "_ocr_page", lambda page: ocr_calls.append(page) or "OCR text")

    result = pdf_parser.extract_text_from_pdf(pdf_path)

    assert result == [{
        "page_number": 1,
        "text": "A digital PDF page with useful content.",
        "extraction_method": "text",
    }]
    assert ocr_calls == []


def test_page_with_insufficient_text_attempts_ocr(fake_pdf, monkeypatch):
    pdf_path, pages, _document = fake_pdf
    page = SimpleNamespace(get_text=lambda _kind: "p1")
    pages.append(page)
    ocr_calls = []
    monkeypatch.setattr(pdf_parser, "_ocr_page", lambda seen_page: ocr_calls.append(seen_page) or "Recognized page text")

    result = pdf_parser.extract_text_from_pdf(pdf_path)

    assert ocr_calls == [page]
    assert result == [{
        "page_number": 1,
        "text": "Recognized page text",
        "extraction_method": "ocr",
    }]


def test_rapidocr_success_preserves_page_record_format_and_reuses_engine(fake_pdf, monkeypatch):
    pdf_path, pages, _document = fake_pdf
    pages.extend([
        SimpleNamespace(get_text=lambda _kind: ""),
        SimpleNamespace(get_text=lambda _kind: ""),
    ])
    state = {"constructed": 0, "called": 0}

    class FakePixmap:
        def tobytes(self, image_format):
            assert image_format == "png"
            output = BytesIO()
            Image.new("RGB", (2, 2), color="white").save(output, format="PNG")
            return output.getvalue()

    for page in pages:
        page.get_pixmap = lambda dpi: FakePixmap()

    class FakeEngine:
        def __init__(self):
            state["constructed"] += 1

        def __call__(self, _image):
            state["called"] += 1
            return SimpleNamespace(txts=[f"recognized {state['called']}", ""])

    monkeypatch.setitem(sys.modules, "rapidocr", SimpleNamespace(RapidOCR=FakeEngine))

    result = pdf_parser.extract_text_from_pdf(pdf_path)

    assert result == [
        {"page_number": 1, "text": "recognized 1", "extraction_method": "ocr"},
        {"page_number": 2, "text": "recognized 2", "extraction_method": "ocr"},
    ]
    assert state == {"constructed": 1, "called": 2}


def test_missing_rapidocr_uses_tesseract_fallback(fake_pdf, monkeypatch):
    pdf_path, pages, _document = fake_pdf
    pages.append(SimpleNamespace(get_text=lambda _kind: "", get_pixmap=lambda dpi: _fake_pixmap()))
    monkeypatch.setitem(sys.modules, "rapidocr", None)
    monkeypatch.setattr(pdf_parser, "_tesseract_ocr_image", lambda _image: "fallback text")

    result = pdf_parser.extract_text_from_pdf(pdf_path)

    assert result == [{
        "page_number": 1,
        "text": "fallback text",
        "extraction_method": "ocr",
    }]


def test_rapidocr_and_tesseract_fail_without_fabricating_text(fake_pdf, monkeypatch, caplog):
    pdf_path, pages, _document = fake_pdf
    pages.append(SimpleNamespace(get_text=lambda _kind: "", get_pixmap=lambda dpi: _fake_pixmap()))
    monkeypatch.setitem(sys.modules, "rapidocr", None)

    def fail_tesseract(_image):
        raise RuntimeError("Tesseract executable missing")

    monkeypatch.setattr(pdf_parser, "_tesseract_ocr_image", fail_tesseract)

    result = pdf_parser.extract_text_from_pdf(pdf_path)

    assert result == [{"page_number": 1, "text": "", "extraction_method": "ocr"}]
    assert "OCR failed on page 1" in caplog.text
    assert "Tesseract fallback is unavailable or failed" in caplog.text


def test_ocr_failure_returns_empty_page_and_continues(fake_pdf, monkeypatch):
    pdf_path, pages, document = fake_pdf
    pages.extend([
        SimpleNamespace(get_text=lambda _kind: ""),
        SimpleNamespace(get_text=lambda _kind: "This is enough digital text to avoid OCR."),
    ])

    def fail_ocr(_page):
        raise RuntimeError("Tesseract is unavailable")

    monkeypatch.setattr(pdf_parser, "_ocr_page", fail_ocr)

    result = pdf_parser.extract_text_from_pdf(pdf_path)

    assert result == [
        {"page_number": 1, "text": "", "extraction_method": "ocr"},
        {
            "page_number": 2,
            "text": "This is enough digital text to avoid OCR.",
            "extraction_method": "text",
        },
    ]
    assert document.closed


def test_page_records_preserve_existing_fields(fake_pdf):
    pdf_path, pages, _document = fake_pdf
    pages.append(SimpleNamespace(get_text=lambda _kind: "Existing parser content that exceeds threshold."))

    result = pdf_parser.extract_text_from_pdf(pdf_path)

    assert result[0]["page_number"] == 1
    assert result[0]["text"] == "Existing parser content that exceeds threshold."
    assert result[0]["extraction_method"] == "text"


def test_ocr_adapter_uses_configured_tesseract_path(monkeypatch, tmp_path):
    rendered_image = BytesIO()
    Image.new("RGB", (2, 2), color="white").save(rendered_image, format="PNG")

    class FakePixmap:
        def tobytes(self, image_format):
            assert image_format == "png"
            return rendered_image.getvalue()

    observed = {}

    class FakePage:
        def get_pixmap(self, dpi):
            observed["dpi"] = dpi
            return FakePixmap()

    def fake_image_to_string(image):
        observed["image_size"] = image.size
        observed["tesseract_cmd"] = pytesseract.pytesseract.tesseract_cmd
        return " OCR result "

    tesseract_path = str(tmp_path / "tesseract.exe")
    monkeypatch.setenv("TESSERACT_CMD", tesseract_path)
    monkeypatch.setattr(pytesseract, "image_to_string", fake_image_to_string)

    result = pdf_parser._ocr_page(FakePage())

    assert result == "OCR result"
    assert observed == {
        "dpi": 300,
        "image_size": (2, 2),
        "tesseract_cmd": tesseract_path,
    }


def _fake_pixmap():
    output = BytesIO()
    Image.new("RGB", (2, 2), color="white").save(output, format="PNG")

    class FakePixmap:
        def tobytes(self, image_format):
            assert image_format == "png"
            return output.getvalue()

    return FakePixmap()
