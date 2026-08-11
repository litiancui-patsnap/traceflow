# Traceflow 代码审核与重构规划

审核日期:2026-08-11
规模:后端 6,652 行(73 py),前端 2,526 行(11 ts/tsx)
状态:MVP 可运行,但存在**架构债务**和**生产就绪度缺口**

---

## 执行摘要

### 当前定位判断

**这是一个为 AI 评测实验设计的最小原型,不是一个要推向生产的产品。**

理由:
- 无认证、无权限、无多租户 —— SQLite 单机应用
- 无日志、无监控、无错误追踪、无超时控制、无用量记录
- 无数据库迁移方案 —— schema 一改数据就丢
- 停更 3 个月,无 star,无用户

**建议:别往"完善产品"方向投入。** 应该:**保持轻量,专注实验**。

### 重构优先级

| 优先级 | 项 | 工作量 | 阻断实验吗 |
|---|---|---|---|
| **P0** | 修复分层倒置 | 2–3 小时 | ❌ 不阻断,但影响可测试性 |
| **P0** | 提取 `utc_now` 到 utils | 30 分钟 | ❌ |
| **P1** | AI 层加超时 + 用量记录 | 1–2 小时 | ⚠️ **评测实验需要用量数据** |
| P2 | Repository 抽基类 | 2 小时 | ❌ |
| P3 | 实现 `ai_generation_records` 表 | 3–4 小时 | ⚠️ **评测实验需要持久化调用记录** |
| ❌ 不做 | 加认证 / 迁移 / 监控 / CORS | 几天到几周 | ❌ **评测实验完全不需要** |

**如果只为评测实验做准备,只做 P0 + P1 + P3,一天内完成。** 其余债务不影响实验,暂不修。

---

## 🔴 严重问题(P0)

### 1. 分层倒置:领域层反向依赖 API 层

**违反了 DDD / Clean Architecture 的核心原则** —— 依赖箭头指反了。

```python
# ❌ 错误:domain/services/ 引用 api/schemas/
app/ai/services.py:12:              from app.api.schemas.ai import ...
app/domain/services/scenario.py:3: from app.api.schemas.scenarios import ScenarioCreate
app/domain/services/task.py:3:      from app.api.schemas.tasks import TaskCreate
# ... 全部 8 个 domain service 都这样
```

**后果:**
- 领域层绑死在 FastAPI 的 Pydantic schema 上,换框架得重写
- **测试领域逻辑时必须引入 API 层**,单元测试范围被污染
- 循环依赖风险(虽然当前没触发,但结构上已埋雷)

**正确的依赖方向:**

```
routes/ (API 层)  →  依赖  →  services/ (领域层)  →  依赖  →  repositories/
                                ↓
                            models/ (领域模型)
```

`schemas/` 应该只在 `routes/` 里,用来做 HTTP 边界的序列化/反序列化。`services/` 应该只依赖领域模型。

**修复方案:**

两种,按工作量排序:

#### 方案 A(推荐):schemas 移到 domain/,改名 dto

```
app/domain/dto/
  ├── requirement.py   # RequirementCreate/Update/Read
  ├── scenario.py
  └── ...

app/api/schemas/     # 改成只放 API 特有的 schema
  └── error.py       # HTTP 错误响应等
```

`services/` 接受 DTO,`routes/` 做 Pydantic schema → DTO 的适配。

**工作量:2–3 小时**(移文件 + 改 import + 跑测试)

#### 方案 B(更标准但更重):domain 只用纯领域对象

`services/` 接受字典或领域模型,`routes/` 把 Pydantic schema 转成字典再传。

**工作量:半天**(每个 service 方法都要改签名)

**当前状态下推荐 A** —— 快,而且对这个规模够用。

### 2. `utc_now()` 被重复定义 9 次

```python
# 9 个文件里同一个函数:
app/domain/models/requirement.py:6:  def utc_now() -> datetime: ...
app/domain/models/scenario.py:6:     def utc_now() -> datetime: ...
app/domain/repositories/scenario.py:8: def utc_now() -> datetime: ...
# ... 还有 6 处
```

**后果:**
- 测试时无法 mock 时间(每个文件一个函数,得 patch 9 次)
- 改时区逻辑要改 9 处

**修复:**

```python
# app/core/utils.py
from datetime import datetime, timezone

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

# 其他文件:
from app.core.utils import utc_now
```

**工作量:30 分钟**(全局替换 + 删重复)

---

## ⚠️ 中等问题(P1)

### 3. AI 层零容错能力

```python
# app/ai/client.py:25 — 直接调,无任何保护
response = self.client.chat.completions.create(
    model=self.model,
    messages=[...],
    response_format={"type": "json_object"},
    temperature=0.3,
)
```

**缺失:**
- ❌ **无超时** —— 模型卡住会永久挂起
- ❌ **无重试** —— 网络抖动直接失败
- ❌ **无用量记录** —— 不知道每次调用花了多少 token
- ❌ **无速率限制** —— 一个用户能把配额刷爆

**后果:**

对评测实验来说,**最要命的是没有用量记录**。你做实验时要算「跑一轮花了多少钱」,现在只能事后去 OpenAI Dashboard 手工查,而且查不到是哪个需求花的。

**修复(分两步):**

#### 步骤 1:加超时 + 用量提取(P1,必须做)

```python
# app/ai/client.py
response = self.client.chat.completions.create(
    model=self.model,
    messages=[...],
    response_format={"type": "json_object"},
    temperature=0.3,
    timeout=30.0,  # 🆕 30 秒超时
)

# 🆕 返回时带上 usage
return {
    "content": response.choices[0].message.content,
    "usage": {
        "prompt_tokens": response.usage.prompt_tokens,
        "completion_tokens": response.usage.completion_tokens,
        "total_tokens": response.usage.total_tokens,
    },
}
```

`services.py` 改成接收并记录这个 `usage`(见问题 5)。

#### 步骤 2:加重试(P2,不急)

用 `tenacity` 库,3 次指数退避。评测实验初期可以不做(手动重跑一次也行)。

**工作量:1–2 小时**(步骤 1)

### 4. Repository 大量重复代码

6 个 repository,每个都是同样的 5–6 个方法:

```python
# 每个都长这样:
def get(self, id: int) -> Model | None:
    return self.session.get(Model, id)

def create(self, obj: Model) -> Model:
    self.session.add(obj)
    self.session.commit()
    self.session.refresh(obj)
    return obj

# ... list_by_requirement / update / delete 全是模板代码
```

**修复:**

```python
# app/domain/repositories/base.py
from typing import Generic, TypeVar
from sqlmodel import Session, SQLModel, select

T = TypeVar("T", bound=SQLModel)

class BaseRepository(Generic[T]):
    def __init__(self, session: Session, model: type[T]):
        self.session = session
        self.model = model

    def get(self, id: int) -> T | None:
        return self.session.get(self.model, id)

    def create(self, obj: T) -> T:
        self.session.add(obj)
        self.session.commit()
        self.session.refresh(obj)
        return obj
    # ... update / delete / list_by_parent

# app/domain/repositories/scenario.py
class ScenarioRepository(BaseRepository[Scenario]):
    def __init__(self, session: Session):
        super().__init__(session, Scenario)
    # 只写特殊查询,通用的都继承
```

**工作量:2 小时**(但这不阻断任何实验,优先级 P2)

### 5. `ai_generation_records` 表未实现

`DB_SCHEMA.md` 第 2.7 节设计了它,但 `app/domain/models/` 下没有。

**这张表的用途:**

```sql
CREATE TABLE ai_generation_records (
  id INTEGER PRIMARY KEY,
  requirement_id INTEGER REFERENCES requirements(id),
  generation_type TEXT,  -- 'requirement' / 'scenario' / 'task'
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  model TEXT,
  latency_ms INTEGER,
  status TEXT,           -- 'success' / 'error'
  error_message TEXT,
  created_at TIMESTAMP
);
```

**为什么评测实验需要它:**

1. **成本追踪**:每个需求生成场景花了多少 token,能算出每轮实验的具体成本
2. **数据集来源**:它是天然的「每次调用的输入输出 + 元数据」存储,评测数据集可以直接从这里导出
3. **A/B 实验**:改了 prompt 想知道 token 用量变没变,需要历史数据对比

**修复:**

1. 创建 `app/domain/models/ai_generation_record.py`
2. `app/ai/services.py` 里每次调用后写一条记录
3. 加一个 `GET /ai/usage-stats` 接口,返回按需求/类型聚合的用量

**工作量:3–4 小时**

**优先级判断:**

- 如果你下周就要开始做评测实验 → **P1,必须做**
- 如果还在调研阶段 → P2,可以先手工记录

---

## ℹ️ 次要问题(P2–P3)

### 6. 零可观测性

| 缺失 | 后果 |
|---|---|
| 无日志 | 线上出问题无法回溯 |
| 无错误追踪(Sentry) | 用户报错了不知道堆栈 |
| 无监控 | 不知道多少人在用、哪个接口慢 |

**但对评测实验完全不需要** —— 你是唯一用户,出错了看终端就行。

**建议:暂不修。** 如果真要做产品,再用 `structlog` + Sentry + Prometheus。

### 7. 无数据库迁移

现在 schema 一变,只能删 `app.db` 重建 —— 数据全丢。

**修复:引入 Alembic。** 但这也是「产品化」才需要的,评测实验每次重跑都是新数据,无所谓。

**建议:暂不修。**

### 8. 无认证 / 无 CORS / 无权限

单机应用,`127.0.0.1:8000`,没这些也正常。

**建议:暂不修。** 除非你要把实验台部署到公网给别人用(不建议)。

### 9. AI 测试覆盖了什么

`tests/unit/test_ai_draft_service.py` 有 6 个测试,**全部用 `StubLLMClient` 喂固定 JSON**,不调真实模型。

测了:
- ✅ 解析逻辑(`_normalize_*` 函数能不能正确处理各种字段格式)
- ✅ 错误处理(JSON 不合规时抛 `AIDraftParsingError`)

**没测:**
- ❌ **真实 prompt 喂给真实模型,返回能不能用** ← 这正是评测实验要做的事

所以现有测试对评测实验**没有直接帮助**,但它们保证了「拿到 JSON 后的处理逻辑是对的」,这层不用你重测。

---

## ✅ 做得好的地方

### 1. AI 层架构清晰

395 行,三个文件,职责分明:
- `client.py`:只管调 API
- `prompts.py`:只管拼 prompt
- `services.py`:编排调用 + 解析 + 归一化

**这正是它适合做实验的原因** —— 要改 prompt,只改一个 114 行的文件;要换模型,只改 `config.py` 一行。

### 2. 前端极简

2,526 行,三个编辑器组件 + 一个主 App,无状态管理库、无复杂路由、无 GraphQL。

**评测实验完全不需要前端** —— 直接调后端 API 就行。这个前端唯一的价值是「给你一个界面随手测一下」,够用。

### 3. 测试覆盖存在

虽然 AI 层测的是 stub,但领域层和 API 层的测试(29 个用例,1,576 行)是真实跑 SQLite 的集成测试 —— 保证了「除了 AI 以外的管道是通的」。

**这意味着你做评测实验时,只需要关心 AI 输出质量,不用担心数据存不存得进去。**

---

## 重构路线图

### 路线 A:只为评测实验做准备(推荐)

**目标:一天内让项目能跑评测实验。**

| 步骤 | 做什么 | 工作量 |
|---|---|---|
| 1 | 提取 `utc_now` 到 `core/utils.py` | 30 分钟 |
| 2 | `ai/client.py` 加 `timeout=30` + 返回 `usage` | 1 小时 |
| 3 | 实现 `ai_generation_records` 表 + service 改成写记录 | 3 小时 |
| 4 | 写一个 `scripts/export_eval_dataset.py`,从记录表导出评测数据集 | 1 小时 |

**总计:5.5 小时,一个工作日。**

完成后你就有:**每次 AI 调用的完整记录(输入/输出/用量/耗时)**,可以直接开始做「BDD 场景覆盖率评测」实验。

**分层倒置(问题 1)暂不修** —— 它不阻断实验,而且如果你做完实验后这个项目就扔了,修它就是浪费。

### 路线 B:做成可维护的产品(不推荐)

| 步骤 | 工作量 |
|---|---|
| 路线 A 全部 | 5.5 小时 |
| 修复分层倒置(方案 A) | 2–3 小时 |
| Repository 抽基类 | 2 小时 |
| 引入 Alembic | 2 小时 |
| 加日志(`structlog`) | 2 小时 |
| 加认证(JWT) | 4–6 小时 |
| 加 CORS + 部署脚本 | 2 小时 |
| 改 SQLite → PostgreSQL | 3 小时 |
| **总计** | **23–26 小时,3–4 天** |

**而你说的「实用价值都不高」「没有用户」,意味着路线 B 的 18 小时是扔掉的。**

---

## 最终建议

### 如果你的目标是「用这个项目做评测实验出一条真发现」

**走路线 A,一天修完,立刻开始实验。** 其余债务完全不修 —— 评测实验不需要认证、不需要迁移、不需要监控。

实验做完、报告写完、简历更新完,这个项目的使命就达成了。到时候把 `benchmarks/` 目录和实验报告开源,代码本体扔着就行。

### 如果你的目标是「把它做成一个可以给别人用的产品」

**别做了。** 这个赛道(需求追溯工具)已经被 Jira / Linear / Azure DevOps / Notion 占满,一个 6.6K 行的 SQLite 单机应用没有任何竞争力。

**你的时间应该花在「产出别人没产出的发现」上,不是「做第 N 个需求管理工具」上。**

---

## 下一步

告诉我你的选择:

**选项 A:我要做评测实验**
→ 我给你写路线 A 的详细实施方案(具体改哪些文件、怎么改、怎么测)

**选项 B:我想先把代码清理干净**
→ 我先写问题 1(分层倒置)的重构 PR

**选项 C:我还在犹豫**
→ 我再给你算一笔账:做实验 vs 做产品的 ROI
