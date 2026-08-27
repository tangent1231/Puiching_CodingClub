# 培正 Coding Club 資源中心

全端網站，用於展示澳門培正中學 Coding Club 及相關社團的活動公告、獲獎記錄、活動相簿與學習資源。數據直接透過飛書開放平臺 API 讀取多維表格，無需額外傳統資料庫；後端以 Supabase Edge Functions 實現，前端部署於 Vercel。

## 線上網址

- 前端：https://frontend-eight-ecru-54.vercel.app/
- 後台登入：`https://frontend-eight-ecru-54.vercel.app/admin/login`

## 技術棧

- 後端：Supabase Edge Functions（Deno / TypeScript）
- 前端：React 19 + Vite + Tailwind CSS v4 + React Router + Lucide React
- 身份驗證：Supabase Auth
- 資料來源：飛書多維表格（Feishu Base）
- 部署：Vercel（前端）+ Supabase CLI（Edge Functions）

## 專案結構

```
Puiching_CodingClub/
├── .github/
│   └── workflows/
│       └── deploy.yml          # 自動部署 Supabase Edge Functions
├── supabase/
│   ├── config.toml             # Supabase CLI 設定
│   ├── .env.local.example      # Edge Functions 本地環境變數範例
│   └── functions/
│       ├── _shared/
│       │   ├── auth.ts         # Supabase Auth JWT 驗證
│       │   ├── cors.ts         # CORS 輔助
│       │   └── feishu.ts       # 飛書 API 輔助
│       ├── events/index.ts     # GET /events
│       ├── awards/index.ts     # GET /awards?q=xxx
│       ├── photos/index.ts     # GET /photos
│       ├── certificate/index.ts # GET /certificate
│       └── admin-login/index.ts # POST /admin-login
├── frontend/
│   ├── src/
│   │   ├── api/client.js       # Edge Functions 呼叫封裝
│   │   ├── lib/supabase.js     # Supabase 用戶端初始化
│   │   ├── components/         # 頁面區塊元件
│   │   └── pages/              # 頁面元件
│   ├── .env.example            # 前端環境變數範例
│   ├── package.json
│   └── vercel.json
├── fake-data/                  # 本地開發假資料 CSV
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

## 更新與部署機制

本專案採用 **GitHub + Vercel + Supabase** 自動化部署流程：

1. **前端**：推送至 `main` 分支後，Vercel 會自動拉取最新程式碼並執行 `npm run build`，完成後自動上線。
2. **後端 Edge Functions**：推送至 `main` 分支後，GitHub Actions 會自動呼叫 Supabase CLI 部署所有 Edge Functions。
3. **飛書資料**：網站內容來自飛書多維表格，修改表格資料後無需重新部署，網站會在下次請求時自動讀取最新數據。

### 手動部署 Edge Functions

若 GitHub Actions 不可用，可手動部署：

```bash
supabase link --project-ref <your-project-ref>
supabase secrets set --env-file supabase/.env.local
supabase functions deploy
```

### 只部署單一 Function

```bash
supabase functions deploy awards
```

### 強制刷新前端

Vercel 會自動處理快取，若發現內容未更新，可嘗試：
- 在瀏覽器按 `Ctrl + Shift + R`（Windows）或 `Cmd + Shift + R`（macOS）強制重新整理。
- 在 Vercel Dashboard 手動觸發 Redeploy。

## 飛書多維表格欄位

### awards（獲獎記錄）

> 注意：目前實際欄位名稱為 `姓名 2`，後端會優先讀取該欄位並兼容 `姓名`。

- `姓名 2`：文本（學生姓名）
- `班級`：文本
- `競賽名稱`：文本
- `獎項`：文本
- `獲獎日期`：日期
- `證書附件`：附件（可下載）

### events（活動公告）

- `標題`：文本
- `狀態`：文本（可留空，系統會根據日期自動判斷：報名進行中 / 即將舉行 / 已結束）
- `活動日期`：日期
- `报名截止日期`：日期
- `描述`：文本
- `链接`：文本（詳情連結）

### photos（活動相簿）

- `年份`：數字
- `標題`：文本
- `照片时间`：日期（顯示於照片下方）
- `照片附件`：附件（可上傳多張，前端會以輪播方式顯示）
- `显示顺序`：數字

## 學習資源

前端「學習資源」區塊目前為靜態清單，收錄以下網站：

- [OI Wiki](https://oi-wiki.org/)
- [洛谷](https://www.luogu.com.cn/)
- [Codeforces](https://codeforces.com/)
- [QOJ](https://qoj.ac/contests)

如需新增或移除資源，請修改 `frontend/src/components/Resources.jsx`。

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
| `/functions/v1/photos/image` | GET | 代理飛書照片附件 |
| `/functions/v1/certificate?recordId=xxx` | GET | 下載證書附件 |
| `/functions/v1/admin-login` | POST | Supabase Auth 登入包裝端點 |

## GitHub

倉庫：`git@github.com:tangent1231/Puiching_CodingClub.git`

推送至 `main` 分支即可觸發 Vercel 與 GitHub Actions 自動部署。
