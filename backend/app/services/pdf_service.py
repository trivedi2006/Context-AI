import gc
import fitz  # PyMuPDF
from typing import List, Dict, Any, Generator
from app.utils.logging import logger

class PDFService:
    @staticmethod
    def extract_pages_generator(file_bytes: bytes, filename: str) -> Generator[Dict[str, Any], None, None]:
        """
        Yields document pages one by one as dictionaries: {"page_number": int, "text": str, "total_pages": int}
        Supports PDF, DOCX, and TXT files with memory optimization.
        """
        if not file_bytes:
            raise ValueError("Uploaded file is empty.")

        ext = filename.lower().split('.')[-1]

        # 1. Plain Text File (.txt)
        if ext == 'txt':
            text_content = file_bytes.decode('utf-8', errors='ignore').strip()
            yield {
                "page_number": 1,
                "text": text_content,
                "total_pages": 1
            }
            return

        # 2. DOCX File (.docx)
        if ext == 'docx':
            try:
                import io
                import docx
                doc_obj = docx.Document(io.BytesIO(file_bytes))
                full_text = "\n".join([p.text for p in doc_obj.paragraphs if p.text.strip()])
                yield {
                    "page_number": 1,
                    "text": full_text,
                    "total_pages": 1
                }
                return
            except Exception as e:
                logger.warning(f"DOCX extraction fallback for '{filename}': {str(e)}")

        # 3. PDF File (.pdf)
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
            
            # Scanned PDF Fallback: if text is empty, extract text blocks or drawing text
            if not text:
                blocks = page.get_text("blocks")
                text = "\n".join([b[4].strip() for b in blocks if len(b) > 4 and b[4].strip()])
            
            page = None
            
            yield {
                "page_number": page_idx + 1,
                "text": text if text else f"[Scanned page {page_idx + 1} content]",
                "total_pages": total_pages
            }

        doc.close()
        doc = None
        gc.collect()

    @staticmethod
    def extract_pages(file_bytes: bytes, filename: str) -> List[Dict[str, Any]]:
        return list(PDFService.extract_pages_generator(file_bytes, filename))
