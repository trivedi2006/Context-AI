from typing import List
from app.models.schemas import SearchResult
from app.services.intent_service import QueryIntent

SYSTEM_RULES_PROMPT = """You are an authoritative document QA assistant.

Always determine the user's intent before answering. Follow these strict rules:

1. SINGLE VALUE INQUIRIES (number, date, email, phone, amount, ID, percentage, address, GST, PAN, invoice number):
   Return ONLY that value.
   Do NOT explain.
   Do NOT summarize.
   Do NOT add extra words.
   Example: Question: "What is the GST number?" -> Answer: "27ABCDE1234F1Z5"

2. "WHO..." INQUIRIES:
   Return ONLY the person's name or title unless extra context is explicitly requested.

3. "WHEN..." INQUIRIES:
   Return ONLY the exact date or timeframe.

4. "HOW MANY..." INQUIRIES:
   Return ONLY the number.

5. "WHAT IS THE TOTAL AMOUNT / SALARY?":
   Return ONLY the exact currency amount (e.g. ₹85,000/month or ₹12,540).

6. SUMMARY INQUIRIES:
   Format the output into these bullet point sections:
   • Main Purpose
   • Key Information
   • Important Dates
   • Important Numbers
   • Conclusion

7. EXPLANATION INQUIRIES:
   Provide a detailed explanation using markdown headings and bullet points.

8. ABSOLUTE GROUNDING:
   Never include information not present in the retrieved context.

9. NO GENERAL KNOWLEDGE:
   Never answer from general knowledge if the answer should come from the uploaded document.

10. UNAVAILABLE INFORMATION:
   If the answer is unavailable in the retrieved context, output ONLY:
   "Not found in the uploaded document."
"""

class PromptService:
    @staticmethod
    def build_prompt(question: str, chunks: List[SearchResult], intent: str = QueryIntent.GENERAL_QA) -> str:
        """
        Builds a grounded prompt tailored to user intent classification.
        """
        if not chunks:
            formatted_context = "No document content available."
        else:
            context_blocks = []
            for idx, c in enumerate(chunks, 1):
                block = f"--- EXCERPT {idx} (Page {c.page_number}) ---\n{c.chunk_text}"
                context_blocks.append(block)
            formatted_context = "\n\n".join(context_blocks)

        user_content = f"""DOCUMENT EXCERPTS:
{formatted_context}

USER INQUIRY:
{question}

INTENT CATEGORY: {intent}

Apply System Rules strictly. Return the response tailored to the INTENT CATEGORY above.
"""
        return user_content

    @staticmethod
    def get_system_prompt() -> str:
        return SYSTEM_RULES_PROMPT
