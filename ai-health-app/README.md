# 3-Tier AI Health Application

This is a complete, 3-tier wellness companion featuring a Next.js App Router frontend, Express middleware, and a FastAPI machine learning microservice.

---

## 🏗️ Architecture & Data Flow

```
[Next.js Chat UI]  <--->  [Express Backend]  <--->  [Gemini 2.5 API]
                             | (intercepts functionCall)
                             v
                         [FastAPI Service] (loads .pkl models)
```

1. **User Query**: User posts a message in the chat portal (e.g., *"Assess my PCOS risk"*).
2. **Gemini Decoupling**: Express forwards the chat history to Gemini with tool definitions enabled.
3. **Function Routing**: Gemini decides if the query needs ML classification.
   - If yes: Emits tool call `predict_pcos(weight, cycle_regularity, acne_severity)`.
   - If no: Answers directly in natural language.
4. **Local Intercept**: Express catches the tool call, makes a POST request to FastAPI on `http://localhost:8000/predict/pcos`.
5. **Inference**: FastAPI loads the local `pcos.pkl` model, scores the request, and returns JSON.
6. **Synthesis**: Express feeds the prediction back as a tool response to Gemini, which synthesizes a clean, compassionate summary for the user.

---

## 📡 API Contracts & Payloads

### 1. FastAPI (Port 8000)
- **POST `/predict/cycle`**
  - **Request Schema**:
    ```json
    {
      "last_period_date": "2026-06-15",
      "cycle_length_avg": 28
    }
    ```
  - **Response Schema**:
    ```json
    {
      "status": "success",
      "days_since_last_period": 25,
      "is_regular": 1,
      "probability_regular": 0.88,
      "days_until_next_period": 3
    }
    ```

- **POST `/predict/pcos`**
  - **Request Schema**:
    ```json
    {
      "weight": 62.5,
      "cycle_regularity": 0,
      "acne_severity": 7
    }
    ```
  - **Response Schema**:
    ```json
    {
      "status": "success",
      "has_pcos": 1,
      "probability_pcos": 0.74
    }
    ```

### 2. Express Backend (Port 3001)
- **POST `/api/chat`**
  - **Request Schema**:
    ```json
    {
      "sessionId": "user_email@example.com",
      "message": "My last period was on 2026-06-15 and average cycle is 28. Predict my next period."
    }
    ```
  - **Response Schema**:
    ```json
    {
      "reply": "Your next period is due in approximately 3 days...",
      "history": [...]
    }
    ```

---

## 🚀 Setup & Launch Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+

### Setup Environment
Create a `.env` file in the `backend/` directory:
```env
PORT=3001
ML_SERVICE_URL=http://localhost:8000
GEMINI_API_KEY=your_actual_gemini_api_key
```

### Starting the Application

#### On Windows (PowerShell):
```powershell
./start.ps1
```

#### On Linux / macOS (Bash):
```bash
chmod +x start.sh
./start.sh
```

---

## 🔍 How to Test
1. Access the web interface at `http://localhost:3002`.
2. Fill out the Sign-Up form. Once submitted, you will be redirected straight to the `/dashboard` chat portal.
3. Test a standard query: *"Hello, what is SAKHI?"* (Gemini will answer directly).
4. Test a cycle prediction: *"My last period was 10 days ago. Average cycle is 28. When is my next cycle?"* (Express will fetch the FastAPI result and output a synthesized text response).
