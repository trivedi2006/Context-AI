import re
from enum import Enum
from typing import Dict, Any

class QueryIntent(str, Enum):
    DOCUMENT_SUMMARY = "document_summary"
    SECTION_SUMMARY = "section_summary"
    QUESTION_ANSWERING = "question_answering"
    DEFINITION = "definition"
    COMPARISON = "comparison"
    EXPLANATION = "explanation"
    LIST_EXTRACTION = "list_extraction"
    TABLE_EXTRACTION = "table_extraction"

class IntentService:
    @staticmethod
    def detect_intent(query: str) -> Dict[str, Any]:
        """
        Analyzes user query to detect intent and determine dynamic retrieval parameters.
        """
        q = query.strip().lower()

        # 1. Document Summary Intent
        summary_patterns = [
            r"\bsummariz(e|ation)\b", r"\boverview\b", r"\bmain idea\b",
            r"\babstract\b", r"\bthesis\b", r"\bexecutive summary\b",
            r"\bwhat is this document about\b", r"\bkey takeaways\b",
            r"\bexplain (this|the) document\b", r"\bconclusion\b"
        ]
        if any(re.search(pattern, q) for pattern in summary_patterns):
            return {
                "intent": QueryIntent.DOCUMENT_SUMMARY,
                "top_k": 100,
                "is_full_document": True
            }

        # 2. Comparison Intent
        comparison_patterns = [
            r"\bcompare\b", r"\bdifference\b", r"\bvs\.?\b",
            r"\bversus\b", r"\bpros and cons\b", r"\bsimilarities\b"
        ]
        if any(re.search(pattern, q) for pattern in comparison_patterns):
            return {
                "intent": QueryIntent.COMPARISON,
                "top_k": 8,
                "is_full_document": False
            }

        # 3. Explanation / Mechanism Intent
        explanation_patterns = [
            r"\bexplain\b", r"\bhow does\b", r"\bhow do\b",
            r"\bwhy does\b", r"\bwhy is\b", r"\bdescribe the process\b"
        ]
        if any(re.search(pattern, q) for pattern in explanation_patterns):
            return {
                "intent": QueryIntent.EXPLANATION,
                "top_k": 10,
                "is_full_document": False
            }

        # 4. List / Item Extraction Intent
        list_patterns = [
            r"\blist\b", r"\baction items\b", r"\bimportant dates\b",
            r"\bkey points\b", r"\binterview questions\b", r"\brecommendations\b"
        ]
        if any(re.search(pattern, q) for pattern in list_patterns):
            return {
                "intent": QueryIntent.LIST_EXTRACTION,
                "top_k": 10,
                "is_full_document": False
            }

        # 5. Definition Intent
        definition_patterns = [
            r"\bwhat is\b", r"\bdefine\b", r"\bmeaning of\b", r"\bdefinition of\b"
        ]
        if any(re.search(pattern, q) for pattern in definition_patterns):
            return {
                "intent": QueryIntent.DEFINITION,
                "top_k": 5,
                "is_full_document": False
            }

        # 6. Default Specific Question Answering
        return {
            "intent": QueryIntent.QUESTION_ANSWERING,
            "top_k": 5,
            "is_full_document": False
        }
