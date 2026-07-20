import fitz  # PyMuPDF
from typing import List, Dict, Any
from app.core.logging import logger

class PDFService:
    @staticmethod
    def extract_pages(file_bytes: bytes, filename: str) -> List[Dict[str, Any]]:
        """
        Parses a PDF from byte stream preserving 1-indexed page numbers.
        Returns a list of dicts: [{"page_number": int, "text": str}]
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
                # Try authenticating with empty password
                unlocked = doc.authenticate("")
                if not unlocked:
                    raise ValueError("PDF document is encrypted/password protected.")
            except Exception:
                raise ValueError("PDF document is encrypted/password protected.")

        total_pages = len(doc)
        if total_pages == 0:
            raise ValueError("PDF document has 0 pages.")

        pages_data = []
        for page_idx in range(total_pages):
            page = doc.load_page(page_idx)
            text = page.get_text("text").strip()
            # Preserve page numbers as 1-indexed
            pages_data.append({
                "page_number": page_idx + 1,
                "text": text
            })

        doc.close()
        logger.info(f"Extracted {len(pages_data)} pages from '{filename}'")
        return pages_data
