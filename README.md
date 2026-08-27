# 澳門培正中學 Coding Club 競賽部榮譽牆

全端網站，用於展示澳門培正中學 Coding Club 競賽部的活動公告、獲獎記錄與活動相簿。數據直接透過飛書開放平臺 API 讀取多維表格，無需額外傳統資料庫；後端以 Supabase Edge Functions 實現，前端部署於 Vercel。

## 技術棧

- 後端：Supabase Edge Functions（Deno / TypeScript）
- 前端：React 19 + Vite + Tailwind CSS v4 + React Router + Lucide React
- 身份驗證：Supabase Auth
- 資料來源：飛書多維表格（Feishu Base）

## 關於舊版 Python FastAPI 後端

> 專案早期使用 Python 3.12 + FastAPI 作為後端。為了簡化部署、減少運維成本，並直接利用 Supabase 生態的身份驗證與無伺服器函式能力，後端已遷移至 Supabase Edge Functions。FastAPI 原始程式碼可從版本控制歷史中找回。

## 專案結構

```
Puiching_CodingClub/
├── supabase/
│   ├── config.toml                 # Supabase CLI 設定
│   ├── .env.local.example          # Edge Functions 本地環境變數範例
│   └── functions/
│       ├── _shared/
│       │   ├── auth.ts             # Supabase Auth JWT 驗證
│       │   ├── cors.ts             # CORS 輔助
│       │   └── feishu.ts           # 飛書 API 輔助
│       ├── events/index.ts         # GET /events
│       ├── awards/index.ts         # GET /awards?q=xxx
│       ├── photos/index.ts         # GET /photos
│       ├── certificate/index.ts    # GET /certificate
│       └── admin-login/index.ts    # POST /admin-login
├── frontend/
│   ├── src/
│   │   ├── api/client.js           # Edge Functions 呼叫封裝
│   │   ├── lib/supabase.js         # Supabase 用戶端初始化
│   │   ├── components/
│   │   └── pages/
│   ├── .env.example                # 前端環境變數範例
│   ├── package.json
│   └── vite.config.js
├── vercel.json
├── .gitignore
└── README.md
```

## 環境變數

### 前端

複製 `frontend/.env.example` 為 `frontend/.env.local`：

| 變數 | 說明 |
|------|------|
| `VITE_SUPABASE_URL` | Supabase 專案 URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase 專案 Anon Key |

### Supabase Edge Functions

複製 `supabase/.env.local.example` 為 `supabase/.env.local`：

| 變數 | 說明 |
|------|------|
| `SUPABASE_URL` | Supabase 專案 URL |
| `SUPABASE_ANON_KEY` | Supabase 專案 Anon Key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key（僅後端驗證 JWT 時使用） |
| `FEISHU_APP_ID` | 飛書應用 ID |
| `FEISHU_APP_SECRET` | 飛書應用密鑰 |
| `FEISHU_BASE_TOKEN` | 多維表格 token |

生產環境請使用 `supabase secrets set` 設定，切勿將真實憑證提交到版本控制。

## 本地開發

### 前置需求

- Node.js 18+
- Supabase CLI（安裝方式見[官方文件](https://supabase.com/docs/guides/cli)）

### 1. 安裝前端依賴

```bash
cd frontend
npm install
```

### 2. 啟動 Supabase 本地服務

```bash
supabase login
supabase start
supabase functions serve --env-file supabase/.env.local
```

### 3. 啟動前端開發伺服器

```bash
cd frontend
npm run dev
```

瀏覽器開啟 http://localhost:5173。

### 管理員帳號

後台使用 Supabase Auth。請在 Supabase Studio（本地為 http://localhost:54323）的 Authentication 頁面建立一個使用者，然後以前台登入頁面的電郵與密碼登入。

## 部署

### 部署 Edge Functions 到 Supabase

```bash
supabase link --project-ref <your-project-ref>
supabase secrets set --env-file supabase/.env.local
supabase functions deploy
```

### 部署前端到 Vercel

1. 在 Vercel 建立新專案，連結 Git 倉庫。
2. 設定環境變數：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. 使用既有 `vercel.json` 設定，Vercel 會自動執行 `cd frontend && npm install && npm run build` 並輸出 `frontend/dist`。
4. 設定 Supabase Auth 的 Site URL 與 Redirect URLs 為正式網址。

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

## 安全注意事項

- 絕對不要提交 `.env`、`.env.local`、Supabase Service Role Key、飛書 App Secret 或 JWT 密鑰到版本控制。
- 生產環境應在 Supabase Dashboard 限制 Edge Functions 的 CORS 來源。
- Service Role Key 只能用於後端驗證，不得暴露於前端。
- 管理員密碼應具備足夠強度，並啟用 Supabase Auth 的相關安全策略（如電郵驗證、密碼強度）。
- 憑證下載端點會檢查飛書附件權限；請確認飛書應用具備讀取多維表格與下載附件的權限。

## API 端點

| 端點 | 方法 | 說明 |
|------|------|------|
| `/functions/v1/events` | GET | 列出活動公告 |
| `/functions/v1/awards?q=xxx` | GET | 按學生姓名關鍵字搜尋獲獎記錄 |
| `/functions/v1/photos?year=xxxx` | GET | 列出活動相片（可選按年份篩選） |
| `/functions/v1/certificate?recordId=xxx` | GET | 下載證書附件 |
| `/functions/v1/admin-login` | POST | Supabase Auth 登入包裝端點 |

## GitHub

目標倉庫：`git@github.com:tangent1231/Puiching_CodingClub.git`

本任務未執行 `git init` 或推送，請於本地自行初始化並推送。
