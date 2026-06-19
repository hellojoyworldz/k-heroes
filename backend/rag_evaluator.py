import os
import json
import time
import random
from typing import List, Dict, Any, Optional
import numpy as np
from datetime import datetime
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LOG_FILE_PATH = os.path.join(BASE_DIR, "data", "processed", "rag_eval_logs.jsonl")

class RAGEvaluator:
    def __init__(self):
        openai_api_key = os.environ.get("OPENAI_API_KEY")
        if openai_api_key:
            self.client = OpenAI(api_key=openai_api_key)
        else:
            self.client = None

    def calculate_keyword_overlap(self, query: str, chunks: List[str]) -> float:
        """Query와 Combined Chunks 간의 Jaccard 유사도 기반 키워드 오버랩 계산"""
        if not query or not chunks:
            return 0.0
        
        # 간단한 토큰화 (특수기호 제거 및 소문자화)
        def clean_tokenize(text: str) -> set:
            for char in [".", ",", "?", "!", "(", ")", "[", "]", "-", "_"]:
                text = text.replace(char, " ")
            tokens = text.lower().split()
            # 한 글자 이하 토큰 및 불용어성 토큰 필터링
            return {t for t in tokens if len(t) > 1}

        query_tokens = clean_tokenize(query)
        chunks_tokens = set()
        for c in chunks:
            chunks_tokens.update(clean_tokenize(c))
            
        if not query_tokens:
            return 0.0
            
        intersection = query_tokens.intersection(chunks_tokens)
        union = query_tokens.union(chunks_tokens)
        return float(len(intersection) / len(union)) if union else 0.0

    def evaluate_and_log(
        self,
        character_name: str,
        era_tag: str,
        query: str,
        retrieved_results: List[Dict[str, Any]],
        generated_ending: Optional[Dict[str, Any]] = None,
        latency_ms: float = 0.0,
        force_llm_eval: bool = False,
        sampling_rate: float = 0.10
    ) -> Dict[str, Any]:
        """RAG 요청 건에 대해 성능 평가 지표를 계산하고 로그 파일에 저장"""
        
        chunks_text = [r["chunk"] for r in retrieved_results]
        
        # 1. Rule-based 지표 계산
        avg_retrieval_score = float(np.mean([r["score"] for r in retrieved_results])) if retrieved_results else 0.0
        avg_rerank_score = float(np.mean([r["rerank_score"] for r in retrieved_results])) if retrieved_results else 0.0
        keyword_overlap = self.calculate_keyword_overlap(query, chunks_text)
        
        # 2. LLM-as-a-judge 평가 여부 결정 (샘플링 혹은 강제 실행)
        should_eval_llm = self.client is not None and (force_llm_eval or (random.random() < sampling_rate))
        
        context_relevance = None
        faithfulness = None
        relevance_reason = ""
        faithfulness_reason = ""
        
        if should_eval_llm and chunks_text:
            try:
                retrieved_context = "\n---\n".join(chunks_text)
                ending_str = json.dumps(generated_ending, ensure_ascii=False, indent=2) if generated_ending else "N/A"
                
                prompt = f"""You are an expert RAG auditor. Evaluate the quality of the retrieved context and the generated ending for a historical simulation game.

[Target Character]
Name: {character_name}
Era: {era_tag}

[Query/Scenario Details]
Query: {query}

[Retrieved Chunks]
{retrieved_context}

[Generated Ending]
{ending_str}

Evaluate:
1. context_relevance: Rate how relevant the retrieved chunks are to the query on a scale from 1 (completely irrelevant) to 5 (extremely relevant, containing precise details of the historical event/figure).
2. faithfulness: Check if the facts/statements in the generated ending are supported by the retrieved chunks. Rate from 0.0 (entirely hallucinated/unsupported) to 1.0 (fully grounded, every fact is present in the context).

Output your evaluation STRICTLY in JSON format:
{{
    "context_relevance": <int: 1-5>,
    "faithfulness": <float: 0.0-1.0>,
    "relevance_reason": "<brief explanation in Korean>",
    "faithfulness_reason": "<brief explanation in Korean>"
}}"""
                
                response = self.client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[{"role": "user", "content": prompt}],
                    response_format={"type": "json_object"}
                )
                
                eval_data = json.loads(response.choices[0].message.content)
                context_relevance = int(eval_data.get("context_relevance", 3))
                faithfulness = float(eval_data.get("faithfulness", 1.0))
                relevance_reason = eval_data.get("relevance_reason", "")
                faithfulness_reason = eval_data.get("faithfulness_reason", "")
                
            except Exception as e:
                print(f"[RAG EVAL] LLM Evaluation failed: {e}")
        
        log_entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "character_name": character_name,
            "era_tag": era_tag,
            "query": query,
            "latency_ms": latency_ms,
            "avg_retrieval_score": avg_retrieval_score,
            "avg_rerank_score": avg_rerank_score,
            "keyword_overlap": keyword_overlap,
            "llm_evaluated": should_eval_llm,
            "context_relevance": context_relevance,
            "faithfulness": faithfulness,
            "relevance_reason": relevance_reason,
            "faithfulness_reason": faithfulness_reason
        }
        
        # 3. JSONL 파일로 추가 저장
        try:
            os.makedirs(os.path.dirname(LOG_FILE_PATH), exist_ok=True)
            with open(LOG_FILE_PATH, "a", encoding="utf-8") as f:
                f.write(json.dumps(log_entry, ensure_ascii=False) + "\n")
        except Exception as e:
            print(f"[RAG EVAL] Failed to write log to file: {e}")
            
        return log_entry

def get_rag_statistics(limit: int = 200) -> Dict[str, Any]:
    """저장된 JSONL 로그 파일을 분석하여 평균 지표 및 통계 데이터 반환"""
    if not os.path.exists(LOG_FILE_PATH):
        return {
            "total_queries": 0,
            "avg_latency_ms": 0.0,
            "avg_retrieval_score": 0.0,
            "avg_rerank_score": 0.0,
            "avg_keyword_overlap": 0.0,
            "llm_evaluated_count": 0,
            "avg_context_relevance": None,
            "avg_faithfulness": None,
            "recent_logs": []
        }
        
    logs = []
    try:
        with open(LOG_FILE_PATH, "r", encoding="utf-8") as f:
            for line in f:
                if line.strip():
                    logs.append(json.loads(line))
    except Exception as e:
        print(f"[RAG EVAL] Error reading log file: {e}")
        
    recent_logs = logs[-limit:][::-1]
    
    total = len(logs)
    if total == 0:
        return {
            "total_queries": 0,
            "avg_latency_ms": 0.0,
            "avg_retrieval_score": 0.0,
            "avg_rerank_score": 0.0,
            "avg_keyword_overlap": 0.0,
            "llm_evaluated_count": 0,
            "avg_context_relevance": None,
            "avg_faithfulness": None,
            "recent_logs": []
        }
        
    # 통계 계산
    avg_latency = float(np.mean([l["latency_ms"] for l in logs]))
    avg_retrieval = float(np.mean([l["avg_retrieval_score"] for l in logs]))
    avg_rerank = float(np.mean([l["avg_rerank_score"] for l in logs]))
    avg_overlap = float(np.mean([l["keyword_overlap"] for l in logs]))
    
    llm_logs = [l for l in logs if l.get("llm_evaluated")]
    llm_count = len(llm_logs)
    
    avg_relevance = None
    avg_faithfulness = None
    if llm_count > 0:
        avg_relevance = float(np.mean([l["context_relevance"] for l in llm_logs if l.get("context_relevance") is not None]))
        avg_faithfulness = float(np.mean([l["faithfulness"] for l in llm_logs if l.get("faithfulness") is not None]))
        
    return {
        "total_queries": total,
        "avg_latency_ms": round(avg_latency, 2),
        "avg_retrieval_score": round(avg_retrieval, 4),
        "avg_rerank_score": round(avg_rerank, 4),
        "avg_keyword_overlap": round(avg_overlap, 4),
        "llm_evaluated_count": llm_count,
        "avg_context_relevance": round(avg_relevance, 2) if avg_relevance is not None else None,
        "avg_faithfulness": round(avg_faithfulness, 2) if avg_faithfulness is not None else None,
        "recent_logs": recent_logs
    }
