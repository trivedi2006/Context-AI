import re
from typing import List
from app.models.schemas import Citation
from app.services.citation_service import CitationService
from app.services.intent_service import QueryIntent

class ResponseFormatter:
    DISCLAIMER_PATTERNS = [
        r"^according to (the|this) (uploaded |provided )?document,?\s*",
        r"^based on the (provided|retrieved) (context|text),?\s*",
        r"^the (uploaded |retrieved )?(document|text|chunk) (states|mentions|indicates) (that )?\s*",
        r"^as (mentioned|stated) in the (text|document),?\s*",
        r"^the (invoice number|date|salary|name|gst|amount|gstin) mentioned is\s*"
    ]

    @classmethod
    def sanitize_response(cls, text: str, intent: str = QueryIntent.GENERAL_QA) -> str:
        """
        Removes repetitive conversational filler and disclaimers.
        For single-value intents, extracts strictly the target value.
        """
        if not text:
            return text

        clean_text = text.strip()

        # If model indicates not found, normalize to canonical phrase
        if any(phrase in clean_text.lower() for phrase in ["not found", "couldn't find", "cannot find", "unable to find"]):
            return "Not found in the uploaded document."

        # Strip disclaimers
        for pattern in cls.DISCLAIMER_PATTERNS:
            clean_text = re.sub(pattern, "", clean_text, flags=re.IGNORECASE).strip()

        # 1. Single Value Intents: Extract exact value string
        if intent in [QueryIntent.SINGLE_VALUE, QueryIntent.WHEN_DATE, QueryIntent.HOW_MANY, QueryIntent.AMOUNT]:
            lines = [l.strip() for l in clean_text.splitlines() if l.strip()]
            if lines:
                first_line = lines[0]
                # Split on copula verbs ("is", "was", "on") to isolate target value
                parts = re.split(r"\b(?:is|was|are|were|on)\b", first_line, flags=re.IGNORECASE)
                if len(parts) >= 2:
                    candidate = parts[-1].strip().rstrip(".")
                    if candidate:
                        return candidate
                return first_line.rstrip(".")

        # Capitalize first letter of sentences if needed
        if clean_text and clean_text[0].islower():
            clean_text = clean_text[0].upper() + clean_text[1:]

        return clean_text

    @classmethod
    def format_final_answer(cls, text: str, citations: List[Citation], intent: str = QueryIntent.GENERAL_QA) -> str:
        """
        Formats response based on user intent classification.
        For single-value questions, omits footer source citations to keep output clean and concise.
        """
        clean_text = cls.sanitize_response(text, intent=intent)

        if "not found" in clean_text.lower():
            return "Not found in the uploaded document."

        # Omit source footers for single-value/name/date/amount queries
        if intent in [QueryIntent.SINGLE_VALUE, QueryIntent.WHO_NAME, QueryIntent.WHEN_DATE, QueryIntent.HOW_MANY, QueryIntent.AMOUNT]:
            return clean_text

        sources_markdown = CitationService.format_sources_markdown(citations)
        if sources_markdown and "### Sources" not in clean_text:
            return f"{clean_text}\n\n{sources_markdown}"

        return clean_text
