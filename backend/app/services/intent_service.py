import re
from enum import Enum
from typing import Dict, Any, List

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
    LIST = "list"
    RANKING = "ranking"
    ELIGIBILITY = "eligibility"
    CONTACT_INFO = "contact_info"
    TIMELINE_DATES = "timeline_dates"
    EXTRACTION = "extraction"
    DEFINITION = "definition"
    RECOMMENDATION = "recommendation"
    TRANSLATION = "translation"
    GENERAL_QA = "general_qa"

class IntentService:
    @staticmethod
    def detect_intent(query: str) -> Dict[str, Any]:
        """
        Analyzes user query to detect intent, category, and dynamic retrieval parameters.
        """
        q = query.strip().lower()

        # 1. Ranking & Top / Best Intent (e.g. "top 5 scholarship", "best scholarship", "highest salary")
        if re.search(r"\b(top|best|highest|maximum|max|largest|ranked|ranking|leading)\b", q):
            return {
                "intent": QueryIntent.RANKING,
                "top_k": 12,
                "is_full_document": False
            }

        # 2. Eligibility & Application Intent (e.g. "can I apply", "who can apply", "eligibility", "criteria")
        if re.search(r"\b(can i apply|who can apply|eligibility|eligible|criteria|qualification|requirements|prerequisites|allowed to apply)\b", q):
            return {
                "intent": QueryIntent.ELIGIBILITY,
                "top_k": 8,
                "is_full_document": False
            }

        # 3. List & Extraction Intent (e.g. "list of...", "extract all...", "scholarship names")
        if re.search(r"\b(list|names of|all|extract|show all|give me all)\b", q):
            return {
                "intent": QueryIntent.LIST,
                "top_k": 10,
                "is_full_document": False
            }

        # 4. Contact Information Intent
        if re.search(r"\b(contact|email|phone|website|address|url|portal|where to apply|helpline|support)\b", q):
            return {
                "intent": QueryIntent.CONTACT_INFO,
                "top_k": 5,
                "is_full_document": False
            }

        # 5. Timeline & Deadline Intent
        if re.search(r"\b(deadline|last date|closing date|due date|schedule|timeline|important dates|when to apply)\b", q):
            return {
                "intent": QueryIntent.TIMELINE_DATES,
                "top_k": 6,
                "is_full_document": False
            }

        # 6. Comparison Intent
        if any(re.search(pattern, q) for pattern in [r"\bcompare\b", r"\bdifference\b", r"\bvs\.?\b", r"\bversus\b", r"\bpros and cons\b", r"\bwhich one\b"]):
            return {
                "intent": QueryIntent.COMPARISON,
                "top_k": 8,
                "is_full_document": False
            }

        # 7. Single Value (Invoice, GST, PAN, Aadhaar, Email, Phone, ID)
        single_value_patterns = [
            r"\binvoice (number|no|\#)\b", r"\bgst(in)? (number|no|\#)?\b",
            r"\bpan (number|no|\#|card)?\b", r"\baadhaar (number|no|\#)?\b",
            r"\bemail( address)?\b", r"\bphone( number)?\b", r"\baccount (number|no)\b",
            r"\bpercentage\b", r"\bregistration (number|no)\b"
        ]
        if any(re.search(pattern, q) for pattern in single_value_patterns):
            return {
                "intent": QueryIntent.SINGLE_VALUE,
                "top_k": 4,
                "is_full_document": False
            }

        # 8. Who / Name Intent
        if q.startswith("who ") or re.search(r"\bwho (is|was|signed|authored|created|wrote|managed)\b", q):
            return {
                "intent": QueryIntent.WHO_NAME,
                "top_k": 4,
                "is_full_document": False
            }

        # 9. When / Date Intent
        if q.startswith("when ") or re.search(r"\b(when|what date|date of|signed on|effective date)\b", q):
            return {
                "intent": QueryIntent.WHEN_DATE,
                "top_k": 4,
                "is_full_document": False
            }

        # 10. How many / Count Intent
        if q.startswith("how many ") or re.search(r"\b(how many|total number of|count of|page count|number of pages)\b", q):
            return {
                "intent": QueryIntent.HOW_MANY,
                "top_k": 6,
                "is_full_document": False
            }

        # 11. Amount / Salary Intent
        if re.search(r"\b(total amount|employee salary|cost|price|fee|remuneration|grand total|net amount|maximum amount)\b", q):
            return {
                "intent": QueryIntent.AMOUNT,
                "top_k": 6,
                "is_full_document": False
            }

        # 12. Document Summary Intent
        summary_patterns = [
            r"\bsummaris(e|ation)\b", r"\bsummariz(e|ation)\b", r"\boverview\b", r"\bmain idea\b",
            r"\babstract\b", r"\bexecutive summary\b", r"\bwhat is this\b", r"\bwhat is the pdf\b",
            r"\bwhat is this document about\b", r"\bkey takeaways\b", r"\bconclusion\b", r"\bexplain this\b"
        ]
        if any(re.search(pattern, q) for pattern in summary_patterns):
            return {
                "intent": QueryIntent.SUMMARY,
                "top_k": 100,
                "is_full_document": True
            }

        # 13. Step-by-Step / Process Intent
        if any(re.search(pattern, q) for pattern in [r"\bsteps\b", r"\bhow to\b", r"\bprocedure\b", r"\binstructions\b"]):
            return {
                "intent": QueryIntent.STEP_BY_STEP,
                "top_k": 6,
                "is_full_document": False
            }

        # 14. Explanation Intent
        if any(re.search(pattern, q) for pattern in [r"\bexplain\b", r"\bdescribe\b", r"\bwhy does\b", r"\bwhy is\b"]):
            return {
                "intent": QueryIntent.EXPLANATION,
                "top_k": 6,
                "is_full_document": False
            }

        # Default General QA
        return {
            "intent": QueryIntent.GENERAL_QA,
            "top_k": 6,
            "is_full_document": False
        }

    @staticmethod
    def expand_query(question: str, intent: str) -> List[str]:
        """
        Generates semantic query expansions to maximize hybrid vector + BM25 keyword recall.
        """
        q = question.strip()
        queries = [q]

        q_lower = q.lower()

        if intent in [QueryIntent.RANKING, QueryIntent.LIST]:
            if "scholarship" in q_lower:
                queries.extend(["scholarship", "financial aid", "grant", "award", "scholarship scheme", "education support"])
            elif "salary" in q_lower or "pay" in q_lower:
                queries.extend(["employee salary", "compensation", "remuneration", "payroll"])
            elif "item" in q_lower or "product" in q_lower:
                queries.extend(["item description", "product list", "pricing"])

        elif intent == QueryIntent.ELIGIBILITY:
            queries.extend(["eligibility criteria", "qualification requirements", "who can apply", "prerequisites"])

        elif intent == QueryIntent.TIMELINE_DATES:
            queries.extend(["application deadline", "last date to apply", "closing date", "important dates"])

        elif intent == QueryIntent.CONTACT_INFO:
            queries.extend(["official website", "contact email", "helpline number", "portal url"])

        return list(dict.fromkeys(queries))
