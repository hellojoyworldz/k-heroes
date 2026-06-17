import pickle
import numpy as np
import os
from openai import OpenAI
from rank_bm25 import BM25Okapi
from dotenv import load_dotenv

load_dotenv()

class InMemoryHistoryRAG:
    def __init__(self, db_pickle_path):
        self.client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
        
        # 1. 파일 로드 (없을 경우 원본 PDF로부터 자동 빌드 수행)
        if not os.path.exists(db_pickle_path):
            print(f"[RAG] DB 파일({db_pickle_path})이 존재하지 않아 자동 빌드를 수행합니다...")
            base_dir = os.path.dirname(db_pickle_path)
            raw_pdf_path = os.path.join(base_dir, "..", "raw", "고등학교_국사_(7차_교육과정).pdf")
            
            # 파일명 NFD/NFC 정규화 차이 등으로 인해 경로가 없을 경우를 대비하여 폴더 스캔
            if not os.path.exists(raw_pdf_path):
                raw_dir = os.path.join(base_dir, "..", "raw")
                if os.path.exists(raw_dir):
                    for fname in os.listdir(raw_dir):
                        if "국사" in fname and fname.endswith(".pdf"):
                            raw_pdf_path = os.path.join(raw_dir, fname)
                            break
                            
            if os.path.exists(raw_pdf_path):
                from history_pdf_db_builder import build_db
                os.makedirs(os.path.dirname(db_pickle_path), exist_ok=True)
                build_db(raw_pdf_path, db_pickle_path)
            else:
                raise FileNotFoundError(f"인메모리 RAG DB 파일 및 원본 PDF 파일을 찾을 수 없습니다: {db_pickle_path}")
            
        with open(db_pickle_path, "rb") as f:
            data = pickle.load(f)
            
        self.chunks = data["chunks"]
        self.embeddings = data["embeddings"] # shape: (N, Embedding_Dim)
        
        # 2. 키워드 검색용 BM25 인덱스 생성
        tokenized_corpus = [doc.split(" ") for doc in self.chunks]
        self.bm25 = BM25Okapi(tokenized_corpus)
        print(f"[RAG] 국사 교과서 {len(self.chunks)}개 청크 인메모리 로드 및 인덱싱 완료.")

    def _get_query_embedding(self, query):
        response = self.client.embeddings.create(
            input=[query],
            model="text-embedding-3-small"
        )
        return np.array(response.data[0].embedding, dtype=np.float32)

    def retrieve(self, query, top_k=3, similarity_threshold=0.30):
        """Sparse(BM25) + Dense(Cosine) 하이브리드 검색 및 스코어링"""
        # A. Dense Vector Similarity 계산 (NumPy 행렬 내적 연산)
        q_emb = self._get_query_embedding(query)
        # L2 정규화가 되어있는 text-embedding 특성상 내적(dot product)이 곧 코사인 유사도
        cosine_scores = np.dot(self.embeddings, q_emb)
        
        # B. Sparse BM25 키워드 점수 계산
        tokenized_query = query.split(" ")
        bm25_scores = self.bm25.get_scores(tokenized_query)
        
        # C. 하이브리드 가중치 결합 (점수 정규화 후 7:3 합산)
        # 단순 가중합 방식으로 구현
        max_bm25 = max(bm25_scores) if max(bm25_scores) > 0 else 1.0
        normalized_bm25 = np.array(bm25_scores) / max_bm25
        
        hybrid_scores = (cosine_scores * 0.7) + (normalized_bm25 * 0.3)
        
        # D. 정렬 및 스코어 필터링
        top_indices = np.argsort(hybrid_scores)[::-1]
        
        results = []
        for idx in top_indices:
            cos_score = float(cosine_scores[idx])
            # 최소 신뢰도 유사도(Threshold) 미만이면 배제하여 RAG의 정확성 담보
            if cos_score < similarity_threshold:
                continue
                
            results.append({
                "chunk": self.chunks[idx],
                "score": cos_score,
                "hybrid_score": float(hybrid_scores[idx])
            })
            if len(results) >= top_k:
                break
                
        return results

# 싱글톤 인스턴스 전역 관리 (실제 배포 시 임포트하여 사용)
_rag_instance = None

def get_rag_instance(db_path="./backend/data/processed/history_db.pkl"):
    global _rag_instance
    if _rag_instance is None:
        _rag_instance = InMemoryHistoryRAG(db_path)
    return _rag_instance
