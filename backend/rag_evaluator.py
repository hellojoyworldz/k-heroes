import os
import json
import time
import random
from typing import List, Dict, Any, Optional
import numpy as np
from datetime import datetime
from openai import OpenAI
from dotenv import load_dotenv
from db.database import SessionLocal
from db.models import RAGEvalLog, GenerationMetricsLog

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LOG_FILE_PATH = os.path.join(BASE_DIR, "data", "logs", "rag_eval_logs.jsonl")

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
        
        # 3. JSONL 파일로 추가 저장 (로컬 백업용)
        try:
            os.makedirs(os.path.dirname(LOG_FILE_PATH), exist_ok=True)
            with open(LOG_FILE_PATH, "a", encoding="utf-8") as f:
                f.write(json.dumps(log_entry, ensure_ascii=False) + "\n")
        except Exception as e:
            print(f"[RAG EVAL] Failed to write log to file: {e}")

        # 4. Supabase DB에 저장
        try:
            db = SessionLocal()
            db_log = RAGEvalLog(
                character_name=character_name,
                era_tag=era_tag,
                query=query,
                latency_ms=latency_ms,
                avg_retrieval_score=avg_retrieval_score,
                avg_rerank_score=avg_rerank_score,
                keyword_overlap=keyword_overlap,
                llm_evaluated=should_eval_llm,
                context_relevance=context_relevance,
                faithfulness=faithfulness,
                relevance_reason=relevance_reason,
                faithfulness_reason=faithfulness_reason
            )
            db.add(db_log)
            db.commit()
        except Exception as e:
            print(f"[RAG EVAL] Failed to write log to Supabase: {e}")
        finally:
            db.close()
            
        return log_entry

    def evaluate_scenario_quality(
        self,
        character_name: str,
        rag_context: str,
        generated_json: Dict[str, Any],
        mode: str = "profile"
    ) -> Dict[str, Any]:
        """
        생성된 프로필 및 시나리오 텍스트가 RAG 데이터와 시대상에 일치하는지, 
        그리고 미화 및 주어 왜곡이 없는지, 시나리오 턴 간 개연성이 매끄러운지 평가하고 로그에 저장합니다.
        """
        if self.client is None:
            return {}
            
        json_str = json.dumps(generated_json, ensure_ascii=False, indent=2)
        
        prompt = f"""너는 역사 교육용 콘텐츠 및 게임의 고증 상태 및 시나리오 완성도를 심사하는 전문 역사 감사관이자 게임 시나리오 감수관이야.
제공된 [역사 자료 (RAG Context)]를 기준으로 생성된 [게임 데이터 JSON]의 고증 신뢰성, 역사 미화 여부, 그리고 시나리오 턴 간 스토리 흐름의 개연성을 엄격히 평가해 줘.

[대상 인물]
이름: {character_name}

[역사 자료 (RAG Context)]
{rag_context}

[게임 데이터 JSON ({mode})]
{json_str}

아래 5가지 지표에 대해 1점(매우 나쁨/심각한 왜곡 및 모순)부터 5점(매우 좋음/완벽한 고증 및 매끄러운 흐름)까지 정수 점수를 부여하고, 명확한 근거를 한국어로 작성해 줘.

1. facts_consistency (역사적 사실 정합성):
   - 평가 기준: RAG 컨텍스트에 없는 날조된 사건, 단체, 연도를 임의로 생성(Hallucination)했거나, RAG 내용과 모순되는 사실이 포함되어 있는지 여부.
   - 점수 가이드: 왜곡이 전혀 없고 모든 사실의 근거가 RAG에 존재하면 5점, 사소한 날조/추정은 3~4점, 심각한 왜곡이 있으면 1~2점.

2. glorification_bias (과오 미화도):
   - 평가 기준: 친일 행적, 실책, 무능, 패배, 독재 등 역사적으로 비판받는 부정적 행적에 대해 '비극적 고뇌', '어쩔 수 없는 시대적 선택', '내적 갈등' 등으로 변명하거나 미화하여 면죄부를 주는 감상적 서술이 포함되어 있는지 여부.
   - 점수 가이드: 객관적 팩트만 건조하게 명시하여 미화가 전혀 없으면 5점, 일부 옹호나 변명 뉘앙스가 섞여 있으면 2~3점, 심각하게 미화하여 포장했으면 1점.

3. actor_attribution (주어 귀속 적합성):
   - 평가 기준: 타인이나 선대가 주도한 업적(예: 흥선대원군의 경복궁 중건 등)을 대상 인물이 직접 한 행동인 것처럼 주어를 왜곡하여 기여도를 가로챘는지 여부.
   - 점수 가이드: 주어와 역할 관계가 RAG와 완벽하게 일치하면 5점, 모호하면 3~4점, 타인의 업적이 인물 본인의 업적으로 완전 날조되었으면 1~2점.

4. era_consistency (시대적/용어 정합성):
   - 평가 기준: 인물이 살아간 생몰년도를 벗어난 시점의 일화가 들어가 있거나, 당대에 존재할 수 없는 제도/개념/어휘(예: 조선시대 인물에게 '무신론자', '자유민주주의' 등의 서양 근대 철학 적용)가 투영되었는지 여부.
   - 점수 가이드: 시대적 정합성에 모순이 전혀 없고 어휘가 적절하면 5점, 사소한 시대어 오용은 3~4점, 명백한 연도/시대 오류는 1~2점.

5. story_flow_coherence (스토리 흐름 개연성):
   - 평가 기준: 각 시나리오의 턴(1턴 -> 2턴 -> 3턴) 간 스토리 흐름과 인과관계가 자연스러운지 평가. 특히 1턴에서 A(역사적)나 B(대체역사) 선택을 내린 후의 결과 텍스트(result_text)들이 2턴 상황(situation)으로 무리 없이 수렴하여 이어지는지, 2턴 결과들이 3턴 상황으로도 논리적 모순 없이 매끄럽게 연결되는지 여부.
   - 점수 가이드: 이전 턴의 선택 결과들이 다음 턴의 상황 도입부로 논리적 모순 없이 매우 자연스럽게 이어지며 전체적인 서사 완성도가 높으면 5점, 연결이 약간 작위적이거나 매끄럽지 못하면 3점, 앞뒤 내용에 명백한 설정 충돌이나 논리적 인과 관계 모순이 발생하면 1~2점.

출력은 반드시 다른 마크다운 텍스트 없이 아래 JSON 형식으로만 응답해:
{{
    "facts_consistency": <int: 1-5>,
    "facts_consistency_reason": "<채점 근거 한국어>",
    "glorification_bias": <int: 1-5>,
    "glorification_bias_reason": "<채점 근거 한국어>",
    "actor_attribution": <int: 1-5>,
    "actor_attribution_reason": "<채점 근거 한국어>",
    "era_consistency": <int: 1-5>,
    "era_consistency_reason": "<채점 근거 한국어>",
    "story_flow_coherence": <int: 1-5>,
    "story_flow_coherence_reason": "<채점 근거 한국어>"
}}"""

        # LLM 평가 수행
        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            eval_data = json.loads(response.choices[0].message.content)
        except Exception as e:
            print(f"[METRIC EVAL] LLM Evaluation failed: {e}")
            eval_data = {
                "facts_consistency": 3,
                "facts_consistency_reason": f"평가 오류: {e}",
                "glorification_bias": 3,
                "glorification_bias_reason": f"평가 오류: {e}",
                "actor_attribution": 3,
                "actor_attribution_reason": f"평가 오류: {e}",
                "era_consistency": 3,
                "era_consistency_reason": f"평가 오류: {e}",
                "story_flow_coherence": 3,
                "story_flow_coherence_reason": f"평가 오류: {e}"
            }
            
        # 평가 로그 취합 및 저장 (날짜별 분리)
        return self._write_metrics_log(character_name, mode, eval_data)

    def _write_metrics_log(self, character_name: str, mode: str, metrics: Dict[str, Any]) -> Dict[str, Any]:
        """평가 로그를 날짜별 metrics 파일에 JSONL 형식으로 기록"""
        date_str = datetime.now().strftime("%Y%m%d")
        filename = f"metrics_eval_logs_{date_str}.jsonl"
        METRICS_LOG_PATH = os.path.join(BASE_DIR, "data", "metrics", filename)
        log_entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "character_name": character_name,
            "mode": mode,
            "metrics": metrics
        }
        try:
            os.makedirs(os.path.dirname(METRICS_LOG_PATH), exist_ok=True)
            with open(METRICS_LOG_PATH, "a", encoding="utf-8") as f:
                f.write(json.dumps(log_entry, ensure_ascii=False) + "\n")
        except Exception as e:
            print(f"[METRIC EVAL] Failed to write log to file: {e}")

        # Supabase DB에 저장
        try:
            db = SessionLocal()
            db_log = GenerationMetricsLog(
                character_name=character_name,
                mode=mode,
                metrics=metrics
            )
            db.add(db_log)
            db.commit()
        except Exception as e:
            print(f"[METRIC EVAL] Failed to write log to Supabase: {e}")
        finally:
            db.close()
            
        return log_entry

    def evaluate_ending_quality(
        self,
        character_name: str,
        rag_context: str,
        generated_ending: Dict[str, Any],
        user_compiled_story: Optional[str] = None
    ) -> Dict[str, Any]:
        """사전 생성된 엔딩 텍스트가 RAG 데이터와 적합한지, 미화가 없는지, 유저의 선택 흐름과 개연성이 맞는지 평가"""
        if self.client is None:
            return {}
            
        ending_str = json.dumps(generated_ending, ensure_ascii=False, indent=2)
        user_story_context = f"\n[유저의 플레이 기록 및 선택 흐름]\n{user_compiled_story}\n" if user_compiled_story else ""
        
        prompt = f"""너는 역사 게임의 사전 빌드 엔딩을 심사하는 전문 역사 감사관이자 게임 시나리오 감수관이야.
제공된 [역사 자료 (RAG Context)] 및 [유저의 플레이 기록 및 선택 흐름]을 기준으로 생성된 [엔딩 데이터 JSON]의 고증 상태, 미화 여부 및 스토리 흐름의 개연성을 엄격히 평가해 줘.

[대상 인물]
이름: {character_name}

[역사 자료 (RAG Context)]
{rag_context}
{user_story_context}
[엔딩 데이터 JSON]
{ending_str}

아래 5가지 지표에 대해 1점(매우 나쁨/심각한 왜곡 및 모순)부터 5점(매우 좋음/완벽한 고증 및 매끄러운 흐름)까지 정수 점수를 부여하고, 명확한 채점 근거를 한국어로 작성해 줘.

1. facts_consistency (역사적 사실 정합성): RAG 자료와 대조했을 때 날조(Hallucination)되거나 왜곡된 팩트가 있는지 검증.
2. glorification_bias (과오 미화도): 행적이나 오류에 대한 합리화, 변명, 감정적 미화 뉘앙스가 포함되어 있는지 검증 (미화가 없으면 5점, 심각하면 1~2점).
3. actor_attribution (주어 귀속 적합성): 타인의 업적을 주인공 본인의 업적으로 왜곡 표기했는지 여부.
4. era_consistency (시대적/용어 정합성): 생몰년도를 벗어난 사건이나 당대에 불가능한 현대식 개념/단어가 투영되었는지 여부.
5. story_flow_coherence (스토리 흐름 개연성): 생성된 가상 분기 엔딩 텍스트(story_contents 및 title)가 [유저의 플레이 기록 및 선택 흐름]과 논리적으로 모순 없이 연결되는지 검증. 유저의 누적된 선택 결과에 따른 타당하고 설득력 있는 서사적 결말이면 5점, 선택들과 전혀 무관하거나 앞뒤 맥락이 깨지는 엉뚱한 결말이면 1~2점.

출력은 반드시 다른 마크다운 텍스트 없이 아래 JSON 형식으로만 응답해:
{{
    "facts_consistency": <int: 1-5>,
    "facts_consistency_reason": "<채점 근거 한국어>",
    "glorification_bias": <int: 1-5>,
    "glorification_bias_reason": "<채점 근거 한국어>",
    "actor_attribution": <int: 1-5>,
    "actor_attribution_reason": "<채점 근거 한국어>",
    "era_consistency": <int: 1-5>,
    "era_consistency_reason": "<채점 근거 한국어>",
    "story_flow_coherence": <int: 1-5>,
    "story_flow_coherence_reason": "<채점 근거 한국어>"
}}"""

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            eval_data = json.loads(response.choices[0].message.content)
        except Exception as e:
            print(f"[METRIC EVAL] Ending Evaluation failed: {e}")
            eval_data = {
                "facts_consistency": 3,
                "facts_consistency_reason": f"평가 오류: {e}",
                "glorification_bias": 3,
                "glorification_bias_reason": f"평가 오류: {e}",
                "actor_attribution": 3,
                "actor_attribution_reason": f"평가 오류: {e}",
                "era_consistency": 3,
                "era_consistency_reason": f"평가 오류: {e}",
                "story_flow_coherence": 3,
                "story_flow_coherence_reason": f"평가 오류: {e}"
            }
            
        return self._write_metrics_log(character_name, "ending_quality", eval_data)

    def evaluate_retrieved_context(
        self,
        character_name: str,
        query: str,
        retrieved_results: List[Dict[str, Any]],
        mode: str = "offline",
        sampling_rate: float = 0.10,
        force_eval: bool = False
    ) -> Optional[Dict[str, Any]]:
        """RAG로 검색된 원본 텍스트 청크들이 대상 인물과 시대상에 적합한지 평가"""
        print(f"[DEBUG RAG EVAL] evaluate_retrieved_context start for {character_name}, results_len={len(retrieved_results) if retrieved_results else 0}")
        if self.client is None:
            print("[DEBUG RAG EVAL] self.client is None!")
            return None
            
        # 런타임(online/simulation) 시에는 성능과 비용을 위해 샘플링 적용
        if mode != "offline" and not force_eval:
            if random.random() >= sampling_rate:
                return None
                
        chunks_text = []
        for r in retrieved_results:
            c = ""
            if isinstance(r, dict):
                c = r.get("chunk", r.get("summary", ""))
            else:
                c = getattr(r, "chunk", getattr(r, "summary", ""))
                if not c:
                    try:
                        c = r["chunk"]
                    except:
                        try:
                            c = r["summary"]
                        except:
                            pass
            if c:
                chunks_text.append(c)
                
        if not chunks_text:
            print("[DEBUG RAG EVAL] chunks_text is empty!")
            return None
            
        retrieved_context = "\n---\n".join(chunks_text)
        
        prompt = f"""너는 역사 RAG(Retrieval-Augmented Generation) 시스템의 검색 정확도를 평가하는 전문 역사학자야.
제시된 [대상 인물] 및 [검색 쿼리]에 대해, 실제 검색되어 나온 [검색된 텍스트 청크들]의 품질을 엄격히 평가해 줘.

[대상 인물]
이름: {character_name}

[검색 쿼리]
{query}

[검색된 텍스트 청크들]
{retrieved_context}

아래 3가지 지표에 대해 1점(매우 나쁨/불일치)부터 5점(매우 좋음/완벽한 검색)까지 정수 점수를 부여하고, 채점 근거를 한국어로 작성해 줘.

1. context_relevance (검색 컨텍스트 관련성): 검색 결과가 쿼리와 인물에 얼마나 부합하고 필요한 정보를 담고 있는가.
2. actor_attribution (주어 적합성/노이즈 방지): 검색 결과 중 대상 인물이 아닌 다른 인물의 일화나 업적이 섞여 들어왔는지 여부 (타인의 일화 비중이 높을수록 감점, 노이즈가 없으면 5점).
3. era_consistency (시대적 정합성): 대상 인물이 살았던 생몰 연도와 상관없는 엉뚱한 시기의 역사적 사실이 섞여 들어왔는지 여부.

출력은 반드시 다른 마크다운 텍스트 없이 아래 JSON 형식으로만 응답해:
{{
    "context_relevance": <int: 1-5>,
    "context_relevance_reason": "<채점 근거 한국어>",
    "actor_attribution": <int: 1-5>,
    "actor_attribution_reason": "<채점 근거 한국어>",
    "era_consistency": <int: 1-5>,
    "era_consistency_reason": "<채점 근거 한국어>"
}}"""

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            eval_data = json.loads(response.choices[0].message.content)
        except Exception as e:
            print(f"[METRIC EVAL] Retrieval Evaluation failed: {e}")
            eval_data = {
                "context_relevance": 3,
                "context_relevance_reason": f"평가 오류: {e}",
                "actor_attribution": 3,
                "actor_attribution_reason": f"평가 오류: {e}",
                "era_consistency": 3,
                "era_consistency_reason": f"평가 오류: {e}"
            }
            
        return self._write_metrics_log(character_name, f"retrieved_context_{mode}", eval_data)

    def evaluate_choice_balance(
        self,
        character_name: str,
        scenario_title: str,
        turn_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """생성된 시나리오 턴 내 선택지(A/B)의 매력 균형(딜레마)과 스탯 변동 밸런스 평가"""
        if self.client is None:
            return {}
            
        turn_str = json.dumps(turn_data, ensure_ascii=False, indent=2)
        
        prompt = f"""너는 역사 시뮬레이션 게임의 레벨 디자이너이자 게임 시나리오 감수관이야.
제공된 턴 정보 내의 두 선택지(Choice A, Choice B)의 기획 완성도를 엄격히 평가해 줘.

[대상 인물]
이름: {character_name}

[시나리오 제목]
{scenario_title}

[턴 및 선택지 데이터]
{turn_str}

아래 2가지 지표에 대해 1점(매우 나쁨)부터 5점(매우 좋음)까지 정수 점수를 부여하고, 채점 근거를 한국어로 작성해 줘.

1. dilemma_strength (딜레마 강도 / 매력도 균형):
   - 평가 기준: A 선택지와 B 선택지가 모두 각각의 가치나 논리를 지니고 있어 유저가 쉽게 한쪽을 고르지 못하고 고민할 만큼 균형을 이루고 있는가. 한쪽이 도덕적으로 너무 악하거나 터무니없어서 선택 가치가 없다면 감점.
2. stat_balance (스탯 영향도 적정성):
   - 평가 기준: 각 선택에 따라 변동되는 캐릭터 스탯(stats)이 극단적으로 쏠려 있지 않고 게임 밸런스 조절 및 타당한 결과를 제공하는지 여부.

출력은 반드시 다른 마크다운 텍스트 없이 아래 JSON 형식으로만 응답해:
{{
    "dilemma_strength": <int: 1-5>,
    "dilemma_strength_reason": "<채점 근거 한국어>",
    "stat_balance": <int: 1-5>,
    "stat_balance_reason": "<채점 근거 한국어>"
}}"""

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            eval_data = json.loads(response.choices[0].message.content)
        except Exception as e:
            print(f"[METRIC EVAL] Choice Balance Evaluation failed: {e}")
            eval_data = {
                "dilemma_strength": 3,
                "dilemma_strength_reason": f"평가 오류: {e}",
                "stat_balance": 3,
                "stat_balance_reason": f"평가 오류: {e}"
            }
            
        return self._write_metrics_log(character_name, "choice_balance", eval_data)

def get_rag_statistics(limit: int = 200) -> Dict[str, Any]:
    """저장된 Supabase DB 로그 데이터를 분석하여 평균 지표 및 통계 데이터 반환"""
    db = SessionLocal()
    try:
        from sqlalchemy import func
        
        # 1. 전체 쿼리 개수 조회
        total = db.query(func.count(RAGEvalLog.id)).scalar() or 0
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
            
        # 2. 전체 통계 계산 (평균)
        stats = db.query(
            func.avg(RAGEvalLog.latency_ms),
            func.avg(RAGEvalLog.avg_retrieval_score),
            func.avg(RAGEvalLog.avg_rerank_score),
            func.avg(RAGEvalLog.keyword_overlap)
        ).first()
        
        avg_latency = float(stats[0]) if stats[0] is not None else 0.0
        avg_retrieval = float(stats[1]) if stats[1] is not None else 0.0
        avg_rerank = float(stats[2]) if stats[2] is not None else 0.0
        avg_overlap = float(stats[3]) if stats[3] is not None else 0.0
        
        # 3. LLM 평가가 포함된 로그의 개수 및 통계 계산
        llm_count = db.query(func.count(RAGEvalLog.id)).filter(RAGEvalLog.llm_evaluated == True).scalar() or 0
        
        avg_relevance = None
        avg_faithfulness = None
        if llm_count > 0:
            llm_stats = db.query(
                func.avg(RAGEvalLog.context_relevance),
                func.avg(RAGEvalLog.faithfulness)
            ).filter(RAGEvalLog.llm_evaluated == True).first()
            
            avg_relevance = float(llm_stats[0]) if llm_stats[0] is not None else None
            avg_faithfulness = float(llm_stats[1]) if llm_stats[1] is not None else None
            
        # 4. 최근 로그 목록 조회
        recent_records = db.query(RAGEvalLog).order_by(RAGEvalLog.id.desc()).limit(limit).all()
        recent_logs = []
        for r in recent_records:
            recent_logs.append({
                "timestamp": r.timestamp.isoformat() + "Z" if r.timestamp else None,
                "character_name": r.character_name,
                "era_tag": r.era_tag,
                "query": r.query,
                "latency_ms": r.latency_ms,
                "avg_retrieval_score": r.avg_retrieval_score,
                "avg_rerank_score": r.avg_rerank_score,
                "keyword_overlap": r.keyword_overlap,
                "llm_evaluated": r.llm_evaluated,
                "context_relevance": r.context_relevance,
                "faithfulness": r.faithfulness,
                "relevance_reason": r.relevance_reason,
                "faithfulness_reason": r.faithfulness_reason
            })
            
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
    except Exception as e:
        print(f"[RAG EVAL] Error reading logs from Supabase: {e}")
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
    finally:
        db.close()
