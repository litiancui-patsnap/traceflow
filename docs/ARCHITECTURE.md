# Architecture

代码架构图。与现有文档的分工:

| 文档 | 内容 |
|---|---|
| [`mermaid.md`](mermaid.md) | **业务流程图** —— 系统泳道、角色泳道、业务决策流 |
| [`TECH_DESIGN.md`](TECH_DESIGN.md) | 技术选型与组件的**文字**说明 |
| [`DB_SCHEMA.md`](DB_SCHEMA.md) | 表结构的**文字**说明 |
| **本文件** | **代码架构图** —— 分层、数据模型关系、AI 层测量点 |

---

## 1. 分层架构

```mermaid
flowchart TB
    subgraph FE["前端 · React 18 + TypeScript + Vite"]
        App["App.tsx"]
        RDP["RequirementDraftPanel.tsx<br/>需求起草面板"]
        SDE["ScenarioDraftEditor.tsx<br/>BDD 场景编辑器"]
        TDE["TaskDraftEditor.tsx<br/>任务拆解编辑器"]
        ApiTs["api.ts · types.ts<br/>display.ts · copy.ts"]
        App --> RDP
        App --> SDE
        App --> TDE
        App --> ApiTs
    end

    subgraph BE["后端 · FastAPI · app/main.py"]
        subgraph L1["① API 层 · app/api"]
            Router["router.py"]
            Routes["routes/ × 9<br/>health · requirements · scenarios · tasks<br/>acceptance_runs · test_summaries<br/>github_links · dashboard · ai"]
            Schemas["schemas/ × 8<br/>Pydantic 出入参校验"]
        end
        subgraph L2["② 领域层 · app/domain"]
            Svc["services/ × 7<br/>业务逻辑"]
            Repo["repositories/ × 6<br/>数据访问"]
            Models["models/ × 6<br/>SQLModel 表定义"]
        end
        subgraph L3["③ AI 层 · app/ai · 仅 395 行"]
            Prompts["prompts.py · 114 行<br/>三个 prompt 模板"]
            Client["client.py · 54 行<br/>OpenAI 兼容客户端"]
            AiSvc["services.py · 226 行<br/>调用 · 解析 · 归一化"]
        end
        subgraph L4["④ 基础设施 · app/core"]
            Config["config.py"]
            DB["database.py"]
        end
    end

    DBFile[("SQLite<br/>app.db")]
    LLM["OpenAI 兼容 API"]

    ApiTs -->|HTTP| Router
    Router --> Routes
    Routes --> Schemas
    Routes --> Svc
    Routes --> AiSvc
    Svc --> Repo
    Repo --> Models
    AiSvc --> Prompts
    AiSvc --> Client
    Models --> DB
    DB --> DBFile
    Client --> LLM

    style L3 fill:#fff3cd,stroke:#d39e00,stroke-width:3px
```

**要点:AI 层是独立的一层,不经过领域层和数据库。** `routes/ai.py` 直接调 `app/ai/services.py`,拿到草稿返回前端,由用户决定是否保存 —— 保存才走领域层落库。

这意味着 **AI 部分可以完全独立拎出来运行**,不需要数据库、不需要登录、不需要前端。

---

## 2. 数据模型关系

```mermaid
erDiagram
    REQUIREMENT ||--o{ SCENARIO : "1 : N"
    REQUIREMENT ||--o{ TASK : "1 : N"
    REQUIREMENT ||--o{ ACCEPTANCE_RUN : "1 : N"
    REQUIREMENT ||--o{ TEST_SUMMARY : "1 : N"
    REQUIREMENT ||--o{ GITHUB_LINK : "0 : N"
    SCENARIO ||--o{ TASK : "0 : N 可选关联"
    TASK ||--o{ GITHUB_LINK : "0 : N"

    REQUIREMENT {
        int id PK
        string title
        string raw_input "原始想法"
        string summary
        string business_value
        string acceptance_criteria "验收标准 · 单个字符串非数组"
        string design_links_json
        string status "draft"
        datetime created_at
        datetime updated_at
    }

    SCENARIO {
        int id PK
        int requirement_id FK
        string feature_name
        string scenario_title
        string given_text
        string when_text
        string then_text
        bool coverage_frontend "AI 自评 · 无校验"
        bool coverage_backend "AI 自评 · 无校验"
        bool coverage_app "AI 自评 · 无校验"
        string status "draft"
    }

    TASK {
        int id PK
        int requirement_id FK
        int scenario_id FK "可空"
        string title
        string description
        string task_type "backend/frontend/app/qa/product"
        string owner_name
        string status "todo"
    }

    ACCEPTANCE_RUN {
        int id PK
        int requirement_id FK
        string status "pending"
        string notes
        string recorded_by
    }

    TEST_SUMMARY {
        int id PK
        int requirement_id FK
        string source
        string result
        string summary
        string report_url
        datetime run_at
    }

    GITHUB_LINK {
        int id PK
        int requirement_id FK "与 task_id 二选一"
        int task_id FK "与 requirement_id 二选一"
        string link_type
        string url
        string label
    }
```

**要点:一切围绕 `Requirement`。** 五个子实体全部外键指向它;`Task` 可额外挂到某个 `Scenario`;`GitHubLink` 挂需求或挂任务,二选一。

> ⚠️ **文档与代码不一致**:`DB_SCHEMA.md` 第 2.7 节描述了 `ai_generation_records` 表,但 `app/domain/models/` 下只有上述 6 个模型,**该表未实现**。见下节。

---

## 3. AI 层与测量点

```mermaid
flowchart TB
    IN["输入<br/>title · summary · acceptance_criteria"]

    subgraph AI["app/ai · 395 行"]
        P["prompts.py<br/>build_scenario_prompt"]
        C["client.py<br/>OpenAI 兼容客户端"]
        S["services.py<br/>generate_scenario_draft<br/>_normalize_scenario_payload"]
        P --> C
        C --> S
    end

    LLM["OpenAI 兼容 API"]
    OUT["ScenarioDraftResponse<br/>feature_name<br/>scenarios: scenario_title · given_text<br/>when_text · then_text<br/>coverage_frontend/backend/app"]

    IN --> P
    C <-->|HTTP| LLM
    S --> OUT

    subgraph M["测量点"]
        M1["M1 结构合规率<br/>given/when/then 是否完整"]
        M2["M2 验收标准覆盖率<br/>对比 acceptance_criteria 漏了几条"]
        M3["M3 生成稳定性<br/>同需求跑 N 次的重合度"]
        M4["M4 冗余度<br/>场景两两相似度"]
        M5["M5 标签准确性<br/>coverage_* 自评是否属实"]
    end

    OUT --> M1
    OUT --> M2
    OUT --> M3
    OUT --> M4
    OUT --> M5

    style AI fill:#fff3cd,stroke:#d39e00,stroke-width:3px
    style M fill:#e7f5ff,stroke:#1971c2,stroke-width:2px
```

### 为什么这一层适合做质量评测

| 特性 | 说明 |
|---|---|
| **纯函数** | 输入文本 → 输出 JSON,不依赖数据库、登录、被测系统 |
| **体量极小** | 395 行,三个文件,全部可读 |
| **输出有结构** | Pydantic schema 约束,可机器判分 |
| **门槛低** | 一台笔记本 + 一个 API key 即可跑完整实验 |

### 已知的两个待验证点

**① `SCENARIO_SYSTEM_PROMPT` 有重复行**

`app/ai/prompts.py` 中,scenario 的 system prompt 里这一行出现了两次:

```
The source input may be Chinese or English. Understand both and respond in the same language as the user input.
```

requirement 和 task 的 prompt 均无此重复。可作为 A/B 实验变量。

**② `coverage_frontend / backend / app` 无任何校验**

三个布尔字段由模型自行填写,代码中没有任何地方验证其正确性。属于典型的"模型自评"未验证问题,对应上图 M5。

### 缺失的记录能力

`DB_SCHEMA.md` 设计但未实现的 `ai_generation_records` 表,正是评测工作所需的基础设施 —— 它能持久化每次 AI 调用的输入、输出和元数据,作为评测数据集的来源。若开展评测,建议优先补齐该表或以文件形式记录。
