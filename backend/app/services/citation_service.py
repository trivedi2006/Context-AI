from typing import List, Dict, Set
from app.models.schemas import Citation, SearchResult

class CitationService:
    @staticmethod
    def process_citations(chunks: List[SearchResult]) -> List[Citation]:
        """
        Deduplicates and sorts page citations numerically from retrieved chunks.
        """
        seen_pages: Set[int] = set()
        unique_citations: List[Citation] = []

        for c in chunks:
            if c.page_number not in seen_pages:
                seen_pages.add(c.page_number)
                unique_citations.append(Citation(
                    page_number=c.page_number,
                    source=c.source,
                    chunk_id=c.chunk_id,
                    excerpt=c.chunk_text[:180] + "..." if len(c.chunk_text) > 180 else c.chunk_text
                ))

        # Sort citations numerically by page number
        unique_citations.sort(key=lambda x: x.page_number)
        return unique_citations

    @staticmethod
    def format_sources_markdown(citations: List[Citation]) -> str:
        """
        Formats citations into clean, professional markdown sources list.
        """
        if not citations:
            return ""

        page_list = [f"- Page {c.page_number}" for c in citations]
        return "### Sources\n" + "\n".join(page_list)
