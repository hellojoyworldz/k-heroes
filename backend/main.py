from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from router import character
import data_manager

app = FastAPI()

# CORS 설정 추가
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(character.router)

# 서버 가동 시점에 전역 캐시 로드 가동
@app.on_event("startup")
async def startup_event():
    data_manager.load_regions_to_memory()

@app.get("/")
def root():
    return {"status": "running", "message": "백엔드 정상 구동 중"}
