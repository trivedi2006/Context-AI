import re
from enum import Enum
from typing import Dict, Any

class QueryIntent(str, Enum):
    SINGLE_VALUE = "single_value"
    WHO_NAME = "who_name"
    WHEN_DATE = "when_date"
    HOW_MANY = "how_many"
    AMOUNT = "amount"
    YES_NO = "yes_no"
    SUMMARY = "summary"
    EXPLANATION = "explanation"
    COMPARISON = "comparison"
    STEP_BY_STEP = "step_by_step"
    GENERAL_QA = "general_qa"

class IntentService:
    @staticmethod
    def detect_intent(query: str) -> Dict[str, Any]:
        """
        Analyzes user query to detect intent, category, and dynamic retrieval parameters.
        """
        q = query.strip().lower()

        # 1. Single Value (Invoice, GST, PAN, Aadhaar, Email, Phone, ID)
        single_value_patterns = [
            r"\binvoice (number|no|\#)\b", r"\bgst(in)? (number|no|\#)?\b",
            r"\bpan (number|no|\#|card)?\b", r"\baadhaar (number|no|\#)?\b",
            r"\bemail( address)?\b", r"\bphone( number)?\b", r"\baccount (number|no)\b",
            r"\bpercentage\b", r"\bregistration (number|no)\b"
        ]
        if any(re.search(pattern, q) for pattern in single_value_patterns):
            return {
                "intent": QueryIntent.SINGLE_VALUE,
                "top_k": 3,
                "is_full_document": False
            }

        # 2. Who / Name Intent
        if q.startswith("who ") or re.search(r"\bwho (is|was|signed|authored|created|wrote|managed)\b", q):
            return {
                "intent": QueryIntent.WHO_NAME,
                "top_k": 3,
                "is_full_document": False
            }

        # 3. When / Date Intent
        if q.startswith("when ") or re.search(r"\b(when|what date|date of|signed on|effective date)\b", q):
            return {
                "intent": QueryIntent.WHEN_DATE,
                "top_k": 3,
                "is_full_document": False
            }

        # 4. How many / Count Intent
        if q.startswith("how many ") or re.search(r"\b(how many|total number of|count of)\b", q):
            return {
                "intent": QueryIntent.HOW_MANY,
                "top_k": 3,
                "is_full_document": False
            }

        # 5. Amount / Salary Intent
        if re.search(r"\b(total amount|employee salary|cost|price|fee|remuneration|grand total|net amount)\b", q):
            return {
                "intent": QueryIntent.AMOUNT,
                "top_k": 3,
                "is_full_document": False
            }

        # 6. Yes/No Intent
        if q.startswith(("is ", "are ", "was ", "were ", "do ", "does ", "did ", "can ", "could ", "has ", "have ", "should ")):
            return {
                "intent": QueryIntent.YES_NO,
                "top_k": 3,
                "is_full_document": False
            }

        # 7. Document Summary Intent
        summary_patterns = [
            r"\bsummariz(e|ation)\b", r"\boverview\b", r"\bmain idea\b",
            r"\babstract\b", r"\bexecutive summary\b", r"\bwhat is this document about\b",
            r"\bkey takeaways\b", r"\bconclusion\b"
        ]
        if any(re.search(pattern, q) for pattern in summary_patterns):
            return {
                "intent": QueryIntent.SUMMARY,
                "top_k": 100,
                "is_full_document": True
            }

        # 8. Comparison Intent
        if any(re.search(pattern, q) for pattern in [r"\bcompare\b", r"\bdifference\b", r"\bvs\.?\b", r"\bversus\b", r"\bpros and cons\b"]):
            return {
                "intent": QueryIntent.COMPARISON,
                "top_k": 6,
                "is_full_document": False
            }

        # 9. Step-by-Step / Process Intent
        if any(re.search(pattern, q) for pattern in [r"\bsteps\b", r"\bhow to\b", r"\bprocedure\b", r"\binstructions\b"]):
            return {
                "intent": QueryIntent.STEP_BY_STEP,
                "top_k": 5,
                "is_full_document": False
            }

        # 10. Explanation Intent
        if any(re.search(pattern, q) for pattern in [r"\bexplain\b", r"\bdescribe\b", r"\bwhy does\b", r"\bwhy is\b"]):
            return {
                "intent": QueryIntent.EXPLANATION,
                "top_k": 4,
                "is_full_document": False
            }

        # 11. General Question Answering (Default)
        return {
            "intent": QueryIntent.GENERAL_QA,
            "top_k": 4,
            "is_full_document": False
        }
