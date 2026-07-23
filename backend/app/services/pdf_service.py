import gc
import fitz  # PyMuPDF
from typing import List, Dict, Any, Generator
from app.core.logging import logger

class PDFService:
    @staticmethod
    def extract_pages_generator(file_bytes: bytes, filename: str) -> Generator[Dict[str, Any], None, None]:
        """
        Yields PDF pages one by one as dictionaries: {"page_number": int, "text": str, "total_pages": int}
        Immediately releases memory for each page to keep container RAM < 100 MB.
        """
        if not file_bytes:
            raise ValueError("Uploaded file is empty.")

        try:
            doc = fitz.open(stream=file_bytes, filetype="pdf")
        except Exception as e:
            logger.error(f"Failed to open PDF '{filename}': {str(e)}")
            raise ValueError(f"Invalid or corrupted PDF file: {str(e)}")

        if doc.is_encrypted:
            try:
                unlocked = doc.authenticate("")
                if not unlocked:
                    raise ValueError("PDF document is encrypted/password protected.")
            except Exception:
                raise ValueError("PDF document is encrypted/password protected.")

        total_pages = len(doc)
        if total_pages == 0:
            doc.close()
            raise ValueError("PDF document has 0 pages.")

        for page_idx in range(total_pages):
            page = doc.load_page(page_idx)
            text = page.get_text("text").strip()
            
            # Explicitly close page handle
            page = None
            
            yield {
                "page_number": page_idx + 1,
                "text": text,
                "total_pages": total_pages
            }

        doc.close()
        doc = None
        gc.collect()

    @staticmethod
    def extract_pages(file_bytes: bytes, filename: str) -> List[Dict[str, Any]]:
        """
        Helper returning full pages list for backward compatibility.
        """
        return list(PDFService.extract_pages_generator(file_bytes, filename))
