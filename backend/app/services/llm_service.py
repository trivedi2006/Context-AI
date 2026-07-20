from typing import AsyncGenerator, Dict, Any, List
from groq import AsyncGroq, Groq
from app.core.config import settings
from app.core.logging import logger, log_execution_time

class LLMService:
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        self.model_name = settings.GROQ_MODEL_NAME

        if self.api_key:
            self.async_client = AsyncGroq(api_key=self.api_key)
            self.sync_client = Groq(api_key=self.api_key)
        else:
            self.async_client = None
            self.sync_client = None
            logger.warning("GROQ_API_KEY not configured. LLM Service will fail if invoked.")

    async def check_health(self) -> bool:
        if not self.async_client:
            return False
        try:
            # Simple lightweight request to check Groq API availability
            models = await self.async_client.models.list()
            return True
        except Exception as e:
            logger.error(f"Groq API health check failed: {str(e)}")
            return False

    async def generate_response_stream(
        self,
        system_prompt: str,
        user_prompt: str
    ) -> AsyncGenerator[str, None]:
        """
        Streams response tokens asynchronously from Groq API.
        """
        if not self.async_client:
            yield "Error: Groq API key is missing. Please configure GROQ_API_KEY."
            return

        with log_execution_time(f"Groq stream request using model {self.model_name}"):
            try:
                stream = await self.async_client.chat.completions.create(
                    model=self.model_name,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    temperature=0.1,  # Low temperature to prevent hallucination
                    max_tokens=1024,
                    stream=True
                )

                async for chunk in stream:
                    content = chunk.choices[0].delta.content
                    if content:
                        yield content
            except Exception as e:
                logger.error(f"Groq generation streaming error: {str(e)}")
                yield f"\n[Error communicating with Groq LLM API: {str(e)}]"
