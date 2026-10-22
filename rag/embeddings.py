from threading import Lock

from sentence_transformers import SentenceTransformer


_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
_MODEL = None
_MODEL_LOCK = Lock()


def _get_model():
    global _MODEL
    if _MODEL is None:
        with _MODEL_LOCK:
            if _MODEL is None:
                print("Loading embedding model...")
                _MODEL = SentenceTransformer(_MODEL_NAME)
                print("Embedding model loaded.")
    return _MODEL


class EmbeddingModel:
    def __init__(self):
        self.model = _get_model()

    def encode(self, texts):
        """
        Convert text into numerical embeddings.
        """
        return self.model.encode(
            texts,
            convert_to_numpy=True,
            normalize_embeddings=True
        )


if __name__ == "__main__":

    embedding_model = EmbeddingModel()

    sample_text = [
        "The system provides personalized travel recommendations."
    ]

    embeddings = embedding_model.encode(sample_text)

    print("Embedding generated successfully.")
    print("Embedding shape:", embeddings.shape)
    print("First 10 values:")
    print(embeddings[0][:10])