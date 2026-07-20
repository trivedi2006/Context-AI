import re
from typing import List
from app.models.schemas import Citation
from app.services.citation_service import CitationService

class ResponseFormatter:
    DISCLAIMER_PATTERNS = [
        r"due to (the )?limited context,?",
        r"based on the provided context,?",
        r"the retrieved chunks (state|indicate|mention),?",
        r"according to the provided (context|text|document),?",
        r"the uploaded document states,?",
        r"as mentioned in the context,?"
    ]

    @classmethod
    def sanitize_response(cls, text: str) -> str:
        """
        Removes repetitive defensive AI disclaimers from the generated output.
        """
        if not text:
            return text

        clean_text = text
        for pattern in cls.DISCLAIMER_PATTERNS:
            clean_text = re.sub(pattern, "", clean_text, flags=re.IGNORECASE)

        # Capitalize first letter of sentences if disclaimer stripping uncapitalized them
        clean_text = clean_text.strip()
        if clean_text and clean_text[0].islower():
            clean_text = clean_text[0].upper() + clean_text[1:]

        return clean_text

    @classmethod
    def format_final_answer(cls, text: str, citations: List[Citation]) -> str:
        """
        Formats response with clean markdown section headers and appended sources list.
        """
        clean_text = cls.sanitize_response(text)

        # If answer says absent, ensure exact canonical phrase
        if "couldn't find" in clean_text.lower() or "cannot find" in clean_text.lower():
            return "I couldn't find that information in the uploaded document."

        sources_markdown = CitationService.format_sources_markdown(citations)

        if sources_markdown and "### Sources" not in clean_text:
            return f"{clean_text}\n\n{sources_markdown}"

        return clean_text
