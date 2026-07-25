from typing import List, Optional
from app.models.schemas import SearchResult
from app.services.intent_service import QueryIntent

SYSTEM_RULES_PROMPT = """You are an authoritative document QA assistant.

Always determine the user's intent before answering. Follow these strict rules:

1. METADATA & PAGE COUNT INQUIRIES (e.g., "how many pages", "number of pages", "page count", "document name"):
   Answer directly using the DOCUMENT METADATA provided below.
   Example: Question: "How many pages are in the PDF?" -> Answer: "9 pages"

2. SINGLE VALUE INQUIRIES (number, date, email, phone, amount, ID, percentage, address, GST, PAN, invoice number):
   Return ONLY that value.
   Do NOT explain.
   Do NOT summarize.
   Do NOT add extra words.
   Example: Question: "What is the GST number?" -> Answer: "27ABCDE1234F1Z5"

3. "WHO..." INQUIRIES:
   Return ONLY the person's name or title unless extra context is explicitly requested.

4. "WHEN..." INQUIRIES:
   Return ONLY the exact date or timeframe.

5. "HOW MANY..." INQUIRIES:
   Return ONLY the specific number requested.

6. "WHAT IS THIS..." / SUMMARY INQUIRIES (e.g., "what is this", "summarise this", "overview"):
   Provide a concise overview of what the document is about based on the excerpts:
   • Main Purpose
   • Key Information & Highlights
   • Key Takeaways / Conclusion

7. EXPLANATION INQUIRIES:
   Provide a detailed explanation using markdown headings and bullet points.

8. ABSOLUTE GROUNDING:
   Base your answer strictly on the provided Document Excerpts and Document Metadata. Never invent details.

9. UNAVAILABLE INFORMATION:
   Only output "Not found in the uploaded document." if the inquiry cannot be answered from either the Document Excerpts or Document Metadata.
"""

class PromptService:
    @staticmethod
    def build_prompt(
        question: str,
        chunks: List[SearchResult],
        intent: str = QueryIntent.GENERAL_QA,
        doc_filename: Optional[str] = None,
        doc_page_count: Optional[int] = None
    ) -> str:
        """
        Builds a grounded prompt tailored to user intent classification with Document Metadata.
        """
        metadata_header = ""
        if doc_filename or doc_page_count:
            metadata_header = f"""DOCUMENT METADATA:
- Document Name: {doc_filename or 'Uploaded PDF'}
- Total Pages: {doc_page_count or 'Unknown'}
- Total Chunks Analyzed: {len(chunks)}
"""

        if not chunks:
            formatted_context = "No document chunk excerpts available."
        else:
            context_blocks = []
            for idx, c in enumerate(chunks, 1):
                block = f"--- EXCERPT {idx} (Page {c.page_number}) ---\n{c.chunk_text}"
                context_blocks.append(block)
            formatted_context = "\n\n".join(context_blocks)

        user_content = f"""{metadata_header}
DOCUMENT EXCERPTS:
{formatted_context}

USER INQUIRY:
{question}

INTENT CATEGORY: {intent}

Apply System Rules strictly. Return an accurate, grounded response for the USER INQUIRY above.
"""
        return user_content

    @staticmethod
    def get_system_prompt() -> str:
        return SYSTEM_RULES_PROMPT
