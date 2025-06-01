from fastapi import FastAPI
from router import router

import certifi
print(certifi.where())


app = FastAPI(title="Python ML API", version="1.0")

# Include the router that handles requests
app.include_router(router)

@app.get("/")
def root():
    return {"message": "Python ML API is running!"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
