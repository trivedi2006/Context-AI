import re
from typing import Dict, Any, Optional
from app.utils.logging import logger

class MetadataExtractor:
    # Regex patterns for common document entities
    PATTERNS = {
        "gst_number": r"\b\d{2}[A-Z]{5}\d{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}\b",
        "pan_number": r"\b[A-Z]{5}\d{4}[A-Z]{1}\b",
        "aadhaar_number": r"\b\d{4}\s?\d{4}\s?\d{4}\b",
        "invoice_number": r"\b(?:INV|INVOICE|REF|BILL)[-:\s#]*([A-Z0-9-]+)\b",
        "email": r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b",
        "phone": r"\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b",
        "amount": r"(?:₹|\$|EUR|USD|RS\.?)\s?[\d,]+(?:\.\d{2})?",
        "date": r"\b(?:\d{1,2}[-/\s]?(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[-/\s]?\d{2,4}|\d{1,2}[-/]\d{1,2}[-/]\d{2,4})\b"
    }

    @classmethod
    def extract_document_entities(cls, text: str) -> Dict[str, Any]:
        """
        Extracts structured entities from document text during ingestion.
        """
        entities = {}
        if not text:
            return entities

        # 1. Invoice Number
        inv_match = re.search(cls.PATTERNS["invoice_number"], text, re.IGNORECASE)
        if inv_match:
            entities["invoice_number"] = inv_match.group(0).strip()

        # 2. GST Number
        gst_match = re.search(cls.PATTERNS["gst_number"], text)
        if gst_match:
            entities["gst_number"] = gst_match.group(0).strip()

        # 3. PAN Number
        pan_match = re.search(cls.PATTERNS["pan_number"], text)
        if pan_match:
            entities["pan_number"] = pan_match.group(0).strip()

        # 4. Aadhaar Number
        aadhaar_match = re.search(cls.PATTERNS["aadhaar_number"], text)
        if aadhaar_match:
            entities["aadhaar_number"] = aadhaar_match.group(0).strip()

        # 5. Email
        email_match = re.search(cls.PATTERNS["email"], text)
        if email_match:
            entities["email"] = email_match.group(0).strip()

        # 6. Phone
        phone_match = re.search(cls.PATTERNS["phone"], text)
        if phone_match:
            entities["phone"] = phone_match.group(0).strip()

        # 7. Amount
        amount_match = re.search(cls.PATTERNS["amount"], text, re.IGNORECASE)
        if amount_match:
            entities["amount"] = amount_match.group(0).strip()

        # 8. Date
        date_match = re.search(cls.PATTERNS["date"], text, re.IGNORECASE)
        if date_match:
            entities["date"] = date_match.group(0).strip()

        logger.info(f"Extracted {len(entities)} structured document entities: {list(entities.keys())}")
        return entities

    @classmethod
    def match_entity_query(cls, question: str, entities: Dict[str, Any]) -> Optional[str]:
        """
        Directly matches specific single-value entity questions against pre-extracted metadata.
        Returns the entity string if found, avoiding LLM calls.
        """
        if not entities:
            return None

        q = question.lower().strip()

        if "invoice number" in q or "invoice no" in q or "bill number" in q:
            return entities.get("invoice_number")

        if "gst" in q or "gstin" in q or "gst number" in q:
            return entities.get("gst_number")

        if "pan" in q or "pan number" in q or "pan card" in q:
            return entities.get("pan_number")

        if "aadhaar" in q or "aadhar" in q:
            return entities.get("aadhaar_number")

        if "email" in q or "email address" in q:
            return entities.get("email")

        if "phone" in q or "contact number" in q or "mobile number" in q:
            return entities.get("phone")

        if "total amount" in q or "salary" in q or "grand total" in q or "net amount" in q:
            return entities.get("amount")

        return None
