# 澳門培正中學 Coding Club 競賽部榮譽牆

全端網站，用於展示澳門培正中學 Coding Club 競賽部的活動公告、獲獎記錄與活動相簿。後端直接透過飛書開放平臺 API 讀取多維表格數據，無需額外傳統資料庫。

## 技術棧

- 後端：Python 3.12 + FastAPI + Pydantic v2 + httpx
- 前端：React 19 + Vite + Tailwind CSS v4 + React Router + Lucide React
- 資料來源：飛書多維表格（Feishu Base）

## 專案結構

```
Puiching_CodingClub/
├── backend/
│   ├── app/
│   │   ├── config.py
│   │   ├── feishu.py
│   │   ├── main.py
│   │   └── routers/
│   │       ├── auth.py
│   │       ├── awards.py
│   │       ├── events.py
│   │       └── photos.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/client.js
│   │   ├── components/
│   │   ├── pages/
│   │   └── styles/
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
├── .gitignore
└── README.md
```

## 環境變數

### 後端

複製 `backend/.env.example` 為 `backend/.env`，並填入：

| 變數 | 說明 |
|------|------|
| `FEISHU_APP_ID` | 飛書應用 ID |
| `FEISHU_APP_SECRET` | 飛書應用密鑰 |
| `FEISHU_BASE_TOKEN` | 多維表格 token |
| `ADMIN_USERNAME` | 管理員帳號（預設 admin） |
| `ADMIN_PASSWORD_HASH` | bcrypt 雜湊後的管理員密碼 |
| `JWT_SECRET` | JWT 簽署密鑰 |
| `FRONTEND_ORIGIN` | 前端網址，用於 CORS |
| `ALLOWED_ORIGINS` | 額外允許的跨域來源，以逗號分隔 |

產生管理員密碼雜湊：

```bash
python -c "from passlib.context import CryptContext; print(CryptContext(schemes=['bcrypt']).hash('your_password'))"
```

### 前端

複製 `frontend/.env.example` 為 `frontend/.env`：

| 變數 | 說明 |
|------|------|
| `VITE_API_URL` | 後端 API 根網址，開發時可留空並使用 Vite proxy |

## 本地開發

```bash
# 後端
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# 前端（另開終端）
cd frontend
npm install
npm run dev
```

若未配置飛書憑證，後端將回傳 `index.html` 中的模擬數據，方便介面開發與測試。

## 部署

### Docker

```bash
cd backend
docker build -t pcc-honor-wall-backend .
docker run -p 8000:8000 --env-file .env pcc-honor-wall-backend
```

### 生產環境注意事項

- 絕對不要將 `.env` 或真實憑證提交到版本控制。
- 後端 CORS 應限制為正式前端網址。
- 管理員密碼必須使用 bcrypt 雜湊。
- JWT 密鑰應使用夠長的隨機字串。
- 建議在反向代理（如 Nginx / Traefik）後方啟用 HTTPS，並設定 `Secure` cookie。
- `/api/auth/login` 已內建基於 IP 的速率限制，可依需求調整。

## 飛書多維表格欄位

### awards（獲獎記錄）

- `姓名`：文本
- `班級`：文本
- `競賽名稱`：文本
- `獎項`：文本
- `日期`：文本或日期
- `證書附件`：附件

### events（活動公告）

- `活動名稱` / `標題`：文本
- `狀態`：文本（例如「報名進行中」、「即將舉行」）
- `日期`：文本或日期
- `描述`：文本

### photos（活動相簿）

- `年份`：數字
- `標題`：文本
- `照片附件`：附件
- `顯示順序`：數字

## GitHub

目標倉庫：`git@github.com:tangent1231/Puiching_CodingClub.git`

本任務未執行 `git init` 或推送，請於本地自行初始化並推送。
