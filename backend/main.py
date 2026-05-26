from fastapi import FastAPI
from router import region 

app = FastAPI()

# 라우터 등록
app.include_router(region.router)

# 서버 가동 시점에 전역 캐시 로드 가동
@app.on_event("startup")
async def startup_event():
    region.load_regions_to_memory()

@app.get("/")
def root():
    return {"status": "running", "message": "역사 교육 시뮬레이터 백엔드 정상 구동 중"}
