import uuid
from typing import List, Dict, Any
from app.models.schemas import ChunkMetadata
from app.core.logging import logger

class ChunkService:
    def __init__(self, chunk_size: int = 700, chunk_overlap: int = 140):
        # 600-800 tokens ~ 2400-3200 chars; setting chunk_size in characters (~2800 chars)
        self.chunk_size_chars = chunk_size * 4
        self.chunk_overlap_chars = chunk_overlap * 4
        self.separators = ["\n\n", "\n# ", "\n## ", "\n### ", "\n- ", "\n", ". ", " "]

    def _split_text(self, text: str) -> List[str]:
        """
        Context-aware splitting preserving paragraphs, headings, tables, and bullet lists.
        Never splits paragraphs in the middle unless paragraph length exceeds max limit.
        """
        if not text:
            return []

        chunks: List[str] = []
        paragraphs = text.split("\n\n")
        current_chunk: List[str] = []
        current_length = 0

        for para in paragraphs:
            para_clean = para.strip()
            if not para_clean:
                continue

            para_len = len(para_clean)

            # If adding this paragraph exceeds target chunk size and current_chunk is not empty:
            if current_length + para_len > self.chunk_size_chars and current_chunk:
                chunk_str = "\n\n".join(current_chunk).strip()
                if chunk_str:
                    chunks.append(chunk_str)

                # Maintain overlap from trailing paragraphs
                overlap_length = 0
                overlap_chunk: List[str] = []
                for p in reversed(current_chunk):
                    if overlap_length + len(p) <= self.chunk_overlap_chars:
                        overlap_chunk.insert(0, p)
                        overlap_length += len(p)
                    else:
                        break
                current_chunk = overlap_chunk
                current_length = overlap_length

            # If single paragraph is exceptionally large, split on line or sentence boundaries
            if para_len > self.chunk_size_chars:
                sub_lines = para_clean.split("\n")
                for line in sub_lines:
                    if current_length + len(line) > self.chunk_size_chars and current_chunk:
                        chunk_str = "\n".join(current_chunk).strip()
                        if chunk_str:
                            chunks.append(chunk_str)
                        current_chunk = []
                        current_length = 0
                    current_chunk.append(line)
                    current_length += len(line)
            else:
                current_chunk.append(para_clean)
                current_length += para_len

        if current_chunk:
            final_str = "\n\n".join(current_chunk).strip()
            if final_str:
                chunks.append(final_str)

        return chunks

    def create_chunks(self, pages_data: List[Dict[str, Any]], filename: str) -> List[ChunkMetadata]:
        """
        Splits extracted PDF pages into context-aware chunks with metadata preserved.
        """
        all_chunks: List[ChunkMetadata] = []
        global_chunk_count = 0

        for page in pages_data:
            page_num = page["page_number"]
            page_text = page["text"]
            if not page_text or not page_text.strip():
                continue

            raw_chunks = self._split_text(page_text)
            for idx, text in enumerate(raw_chunks):
                global_chunk_count += 1
                chunk_id = f"{uuid.uuid4().hex[:12]}_{page_num}_{idx}"
                all_chunks.append(ChunkMetadata(
                    chunk_id=chunk_id,
                    document_name=filename,
                    page_number=page_num,
                    source=filename,
                    chunk_text=text
                ))

        logger.info(f"Created {len(all_chunks)} context-aware chunks (700-token target) for '{filename}'")
        return all_chunks
