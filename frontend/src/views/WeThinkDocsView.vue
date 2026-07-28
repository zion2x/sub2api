<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import Icon from '@/components/icons/Icon.vue'
import { useAppStore } from '@/stores/app'
import { sanitizeUrl } from '@/utils/url'

const API_BASE_URL = 'https://api.wethink.cloud'
const DEFAULT_MODEL = 'claude-opus-5'

const language = ref<'en' | 'zh'>('en')
const isDark = ref(document.documentElement.classList.contains('dark'))
const activeSection = ref('quickstart')
const copiedCode = ref('')
const docsRoot = ref<HTMLElement | null>(null)
const appStore = useAppStore()

const siteName = computed(
  () => appStore.cachedPublicSettings?.site_name || appStore.siteName || 'WeThink'
)
const siteLogo = computed(() =>
  sanitizeUrl(appStore.cachedPublicSettings?.site_logo || appStore.siteLogo || '', {
    allowRelative: true,
    allowDataUrl: true
  })
)
const currentYear = new Date().getFullYear()

const requestSnippet = `curl ${API_BASE_URL}/v1/messages \\
  --header 'x-api-key: YOUR_API_KEY' \\
  --header 'anthropic-version: 2023-06-01' \\
  --header 'content-type: application/json' \\
  --data '{"model":"${DEFAULT_MODEL}","max_tokens":1024,"messages":[{"role":"user","content":"Hello, WeThink"}]}'`

const responseSnippet = `{"id":"msg_01WeThink","type":"message","model":"${DEFAULT_MODEL}","role":"assistant","content":[{"type":"text","text":"Hello! How can I help you today?"}],"stop_reason":"end_turn"}`

const english = {
  docs: 'Documentation',
  guide: 'GUIDE',
  quickstart: 'Quickstart',
  openConsole: 'Open console',
  language: 'Language',
  darkMode: 'Switch to dark mode',
  lightMode: 'Switch to light mode',
  title: 'Build with WeThink',
  intro:
    'A clean, compatible gateway for Claude workloads. Send your first message in minutes with the Anthropic Messages API.',
  productionReady: 'Production ready',
  lowLatency: 'Low latency routing',
  globalEndpoint: 'Global endpoint',
  endpointTitle: 'Endpoint',
  endpointIntro:
    'Use the WeThink gateway as a drop-in endpoint for your existing Anthropic SDK integration.',
  baseUrl: 'Base URL',
  defaultModel: 'Default model',
  protocol: 'Protocol',
  authTitle: 'Authentication',
  authIntro: 'Authenticate every request with an API key created in your WeThink console.',
  authNoteTitle: 'Keep your key private',
  authNote:
    'API keys should be stored in environment variables or a server-side secret manager. Never expose them in browser code or public repositories.',
  requestTitle: 'Send a request',
  requestIntro:
    'The gateway accepts the standard Messages API format. Set the model to claude-opus-5 to use the default WeThink route.',
  responseTitle: 'Read the response',
  responseIntro:
    'Responses follow the Anthropic Messages API shape, so your existing parsing logic works without changes.',
  errorsTitle: 'Errors',
  errorsIntro: 'Use the HTTP status and error type to decide whether a request can be retried.',
  status: 'STATUS',
  meaning: 'MEANING',
  action: 'NEXT STEP',
  copy: 'Copy',
  copied: 'Copied',
  apiStatus: 'API status',
  operational: 'All systems operational',
  onThisPage: 'ON THIS PAGE',
  footer: 'API documentation for the WeThink gateway'
}

const chinese = {
  docs: '文档',
  guide: '指南',
  quickstart: '快速开始',
  openConsole: '打开控制台',
  language: '语言',
  darkMode: '切换深色模式',
  lightMode: '切换浅色模式',
  title: '使用 WeThink 构建',
  intro: '为 Claude 工作负载打造的兼容型网关。基于 Anthropic Messages API，几分钟内即可发送第一条消息。',
  productionReady: '生产环境可用',
  lowLatency: '低延迟路由',
  globalEndpoint: '全球统一入口',
  endpointTitle: '接口地址',
  endpointIntro: '将 WeThink 网关作为现有 Anthropic SDK 集成的直接替换入口。',
  baseUrl: '基础 URL',
  defaultModel: '默认模型',
  protocol: '协议',
  authTitle: '身份验证',
  authIntro: '使用在 WeThink 控制台创建的 API Key 验证每个请求。',
  authNoteTitle: '请妥善保管 API Key',
  authNote: 'API Key 应存储在环境变量或服务端密钥管理器中。不要将其暴露在浏览器代码或公开代码仓库里。',
  requestTitle: '发送请求',
  requestIntro: '网关接受标准 Messages API 格式。将模型设置为 claude-opus-5，即可使用 WeThink 默认路由。',
  responseTitle: '读取响应',
  responseIntro: '响应遵循 Anthropic Messages API 结构，现有的解析逻辑无需修改即可继续使用。',
  errorsTitle: '错误处理',
  errorsIntro: '根据 HTTP 状态码和错误类型，判断请求是否可以重试。',
  status: '状态码',
  meaning: '含义',
  action: '下一步',
  copy: '复制',
  copied: '已复制',
  apiStatus: 'API 状态',
  operational: '所有系统运行正常',
  onThisPage: '本页目录',
  footer: 'WeThink 网关 API 文档'
}

const copy = computed(() => (language.value === 'zh' ? chinese : english))

const models = [
  { id: 'claude-opus-5', family: 'Claude', en: 'Complex reasoning and coding', zh: '复杂推理与编程' },
  { id: 'claude-sonnet-5', family: 'Claude', en: 'Fast coding and agents', zh: '快速编程与 Agent' },
  { id: 'gpt-5.6-terra', family: 'OpenAI', en: 'General purpose tasks', zh: '通用任务' },
  { id: 'gpt-5.5', family: 'OpenAI', en: 'Balanced speed and quality', zh: '速度与质量平衡' },
  { id: 'deepseek-v4-pro', family: 'Domestic', en: 'Reasoning at scale', zh: '大规模推理' },
  { id: 'kimi-k3', family: 'Domestic', en: 'Long context workflows', zh: '长上下文工作流' },
  { id: 'qwen3.7-max', family: 'Domestic', en: 'Multilingual applications', zh: '多语言应用' },
  { id: 'minimax-m3', family: 'Domestic', en: 'Writing and analysis', zh: '写作与分析' }
]

const sdkSections = [
  {
    id: 'python',
    index: '06',
    file: 'wethink.py',
    title: 'Python SDK',
    zhTitle: 'Python 接入',
    description: 'Use the official OpenAI Python client with the WeThink endpoint.',
    zhDescription: '使用官方 OpenAI Python 客户端接入 WeThink。',
    install: 'Requires Python 3.8+. Install with pip and keep the key server-side.',
    zhInstall: '需要 Python 3.8+，使用 pip 安装，并将 Key 保存在服务端。',
    note: 'The OpenAI client accepts a custom base_url, so no adapter is required.',
    zhNote: 'OpenAI 客户端支持自定义 base_url，无需额外适配器。',
    code: `from openai import OpenAI

client = OpenAI(api_key="YOUR_API_KEY", base_url="${API_BASE_URL}/v1")
response = client.chat.completions.create(
    model="${DEFAULT_MODEL}",
    messages=[{"role": "user", "content": "Hello"}],
)
print(response.choices[0].message.content)`
  },
  {
    id: 'nodejs',
    index: '07',
    file: 'wethink.mjs',
    title: 'Node.js SDK',
    zhTitle: 'Node.js 接入',
    description: 'Use the official JavaScript client in Node.js, serverless, or TypeScript apps.',
    zhDescription: '在 Node.js、Serverless 或 TypeScript 应用中使用官方 JavaScript 客户端。',
    install: 'Requires Node.js 18+. Configure the client once and reuse it.',
    zhInstall: '需要 Node.js 18+，建议初始化一次客户端并复用。',
    note: 'Do not ship the API key in browser bundles.',
    zhNote: '不要将 API Key 打包进浏览器代码。',
    code: `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.WETHINK_API_KEY,
  baseURL: "${API_BASE_URL}/v1",
});
const response = await client.chat.completions.create({
  model: "${DEFAULT_MODEL}",
  messages: [{ role: "user", content: "Hello" }],
});`
  },
  {
    id: 'curl',
    index: '08',
    file: 'request.sh',
    title: 'cURL',
    zhTitle: 'cURL 直接调用',
    description: 'Verify your key and endpoint with a raw HTTP request.',
    zhDescription: '使用原始 HTTP 请求验证 Key 和接口地址。',
    install: 'Replace YOUR_API_KEY with a key created in the console.',
    zhInstall: '将 YOUR_API_KEY 替换为控制台创建的 Key。',
    note: 'Use /v1/messages for Anthropic-compatible clients.',
    zhNote: 'Anthropic 兼容客户端请使用 /v1/messages。',
    code: `curl ${API_BASE_URL}/v1/messages \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "anthropic-version: 2023-06-01" \\
  -H "content-type: application/json" \\
  -d '{"model":"${DEFAULT_MODEL}","max_tokens":1024,"messages":[{"role":"user","content":"Hello"}]}'`
  },
  {
    id: 'go',
    index: '09',
    file: 'main.go',
    title: 'Go SDK',
    zhTitle: 'Go 接入',
    description: 'Use the OpenAI-compatible Go client for a lightweight backend integration.',
    zhDescription: '使用 OpenAI 兼容 Go 客户端完成轻量后端接入。',
    install: 'Requires Go 1.21+. Reuse one HTTP client to keep connections warm.',
    zhInstall: '需要 Go 1.21+，复用 HTTP 客户端以保持长连接。',
    note: 'Keep-alive reduces repeated DNS, TCP, and TLS handshakes.',
    zhNote: 'Keep-Alive 可以减少重复 DNS、TCP 和 TLS 握手。',
    code: `client := openai.NewClientWithConfig(openai.ClientConfig{
  APIKey: "YOUR_API_KEY",
  BaseURL: "${API_BASE_URL}/v1",
})
resp, err := client.CreateChatCompletion(ctx, openai.ChatCompletionRequest{
  Model: "${DEFAULT_MODEL}",
  Messages: []openai.ChatCompletionMessage{{Role: "user", Content: "Hello"}},
})`
  },
  {
    id: 'java',
    index: '10',
    file: 'WeThink.java',
    title: 'Java SDK',
    zhTitle: 'Java 接入',
    description: 'Configure the compatible client for Spring and backend services.',
    zhDescription: '为 Spring 服务和后端应用配置兼容客户端。',
    install: 'Set the endpoint and key in application configuration, then inject the client.',
    zhInstall: '在应用配置中设置接口地址和 Key，再注入客户端。',
    note: 'Use environment variables or a secret manager in production.',
    zhNote: '生产环境请使用环境变量或密钥管理器保存凭证。',
    code: `OpenAIClient client = OpenAIClient.builder()
    .apiKey(System.getenv("WETHINK_API_KEY"))
    .baseUrl("${API_BASE_URL}/v1")
    .build();
ChatCompletion completion = client.chat().completions().create(
    ChatCompletionCreateParams.builder().model("${DEFAULT_MODEL}").build());`
  }
]

const streamingSnippet = `from openai import OpenAI
client = OpenAI(api_key="YOUR_API_KEY", base_url="${API_BASE_URL}/v1")
stream = client.chat.completions.create(
    model="${DEFAULT_MODEL}",
    messages=[{"role": "user", "content": "Write a short story"}],
    stream=True,
)
for chunk in stream:
    print(chunk.choices[0].delta.content or "", end="", flush=True)`

const toolRows = [
  ['tools-cursor', 'Cursor', 'AI code editor', 'AI 编程编辑器'],
  ['tools-claudecode', 'Claude Code', 'Terminal coding assistant', '终端 AI 编程助手'],
  ['tools-cline', 'Cline', 'VS Code agent', 'VS Code Agent 插件'],
  ['tools-trae', 'TRAE', 'AI IDE', 'AI IDE'],
  ['tools-opencode', 'OpenCode', 'Open-source terminal coding', '开源终端 Coding'],
  ['tools-codex', 'Codex', 'OpenAI coding agent', 'OpenAI 编程代理'],
  ['tools-kilocli', 'Kilo CLI', 'Terminal coding tool', '终端编程工具'],
  ['tools-arkclaw', 'ArkClaw', 'Agent workspace', 'Agent 工作空间'],
  ['tools-kilocode', 'Kilo Code', 'VS Code coding agent', 'VS Code 编程代理'],
  ['tools-qwencode', 'Qwen Code', 'Qwen coding assistant', 'Qwen 编程助手'],
  ['tools-lingma', 'Tongyi Lingma', 'Alibaba coding assistant', '通义灵码'],
  ['tools-qoder', 'Qoder', 'AI development environment', 'AI 开发环境'],
  ['tools-cherry', 'Cherry Studio', 'Desktop AI client', '桌面 AI 客户端'],
  ['tools-chatbox', 'Chatbox', 'Desktop chat client', '桌面聊天客户端'],
  ['tools-openclaw', 'OpenClaw', 'Multi-model AI client', '多模型 AI 客户端'],
  ['tools-hermes', 'Hermes Agent', 'Automation agent', '自动化 AI Agent'],
  ['tools-coze', 'Coze', 'Bot and workflow builder', 'Bot 与工作流'],
  ['tools-openviking', 'OpenViking', 'Context database', '上下文数据库'],
  ['tools-dify', 'Dify', 'LLM application platform', 'LLM 应用平台'],
  ['tools-postman', 'Postman', 'API testing workspace', 'API 测试工作区']
] as const

const tools = toolRows.map(([id, name, en, zh]) => ({
  id,
  name,
  en,
  zh,
  steps: [
    {
      en: `Open ${name} settings and choose a custom or OpenAI-compatible provider.`,
      zh: `打开 ${name} 设置，选择自定义或 OpenAI 兼容供应商。`
    },
    {
      en: `Set Base URL to ${API_BASE_URL}/v1 and paste your WeThink API key.`,
      zh: `将 Base URL 设置为 ${API_BASE_URL}/v1，并粘贴 WeThink API Key。`
    },
    {
      en: `Set the model to ${DEFAULT_MODEL}, save, and send a test request.`,
      zh: `将模型设置为 ${DEFAULT_MODEL}，保存后发送一条测试请求。`
    }
  ]
}))

const performanceTips = [
  {
    enTitle: 'Enable streaming first',
    zhTitle: '优先开启流式输出',
    en: 'Streaming improves time-to-first-token and keeps long responses interactive.',
    zh: '流式输出可以降低首 Token 时间，让长文本生成保持交互性。'
  },
  {
    enTitle: 'Choose the right model',
    zhTitle: '选择合适的模型',
    en: `Use ${DEFAULT_MODEL} for difficult reasoning and coding; use a faster model for short, high-volume tasks.`,
    zh: `复杂推理和编程使用 ${DEFAULT_MODEL}；短文本和高并发任务选择更快的模型。`
  },
  {
    enTitle: 'Reuse connections',
    zhTitle: '复用长连接',
    en: 'Keep one SDK client alive to avoid repeated DNS, TCP, and TLS handshakes.',
    zh: '复用 SDK 客户端，避免重复 DNS、TCP 和 TLS 握手。'
  },
  {
    enTitle: 'Retry safely',
    zhTitle: '安全重试',
    en: 'Retry 429 and 5xx responses with 1s, 2s, 4s backoff and a capped retry count.',
    zh: '遇到 429 和 5xx 时按 1 秒、2 秒、4 秒退避，并限制重试次数。'
  },
  {
    enTitle: 'Keep prompts stable',
    zhTitle: '保持提示词稳定',
    en: 'Put reusable instructions before dynamic content to improve cache reuse and debugging.',
    zh: '将可复用指令放在动态内容之前，提升缓存复用率并便于调试。'
  },
  {
    enTitle: 'Batch independent work',
    zhTitle: '并发处理独立任务',
    en: 'Use Promise.all or asyncio.gather instead of waiting for independent requests serially.',
    zh: '独立请求使用 Promise.all 或 asyncio.gather 并发处理。'
  }
]

const faqs = [
  {
    enQ: 'How do I configure Claude Code?',
    zhQ: 'Claude Code 怎么配置？',
    enA: `Set the API Base URL to ${API_BASE_URL}/v1, add your WeThink key, and choose ${DEFAULT_MODEL}.`,
    zhA: `将 API Base URL 设为 ${API_BASE_URL}/v1，填入 WeThink Key，并选择 ${DEFAULT_MODEL}。`
  },
  {
    enQ: 'Can I use the OpenAI SDK?',
    zhQ: '可以使用 OpenAI SDK 吗？',
    enA: 'Yes. Use the /v1 endpoint with the official Python, Node.js, Go, or Java client.',
    zhA: '可以。使用 /v1 接口配合官方 Python、Node.js、Go 或 Java 客户端即可。'
  },
  {
    enQ: 'Where should I store my API key?',
    zhQ: 'API Key 应该保存在哪里？',
    enA: 'Store it in a server-side environment variable or secret manager. Never expose it in browser code.',
    zhA: '请保存到服务端环境变量或密钥管理器中，不要暴露在浏览器代码里。'
  },
  {
    enQ: 'What should I do when I receive a 429?',
    zhQ: '收到 429 应该怎么办？',
    enA: 'Pause briefly, retry with exponential backoff, and check your plan quota and concurrency limits.',
    zhA: '短暂等待后指数退避重试，同时检查套餐额度和并发限制。'
  },
  {
    enQ: 'Does streaming work with existing SDKs?',
    zhQ: '现有 SDK 支持流式输出吗？',
    enA: 'Most OpenAI-compatible and Anthropic-compatible SDKs support stream: true.',
    zhA: '大多数 OpenAI 和 Anthropic 兼容 SDK 都支持 stream: true。'
  },
  {
    enQ: 'Which model should I use?',
    zhQ: '应该选择哪个模型？',
    enA: `Use ${DEFAULT_MODEL} for complex coding and reasoning, and a faster model for simple high-volume tasks.`,
    zhA: `复杂编程和推理优先使用 ${DEFAULT_MODEL}；简单高并发任务选择更快的模型。`
  }
]

const onPageItems = computed(() => [
  { id: 'quickstart', label: copy.value.quickstart },
  { id: 'endpoint', label: copy.value.endpointTitle },
  { id: 'authentication', label: copy.value.authTitle },
  { id: 'request', label: copy.value.requestTitle },
  { id: 'response', label: copy.value.responseTitle },
  { id: 'models', label: language.value === 'zh' ? '模型列表' : 'Models' },
  ...sdkSections.map((section) => ({
    id: section.id,
    label: language.value === 'zh' ? section.zhTitle : section.title
  })),
  { id: 'streaming', label: language.value === 'zh' ? '流式输出' : 'Streaming' },
  { id: 'errors', label: copy.value.errorsTitle },
  { id: 'tools-overview', label: language.value === 'zh' ? '接入工具' : 'Tools' },
  ...tools.map((tool) => ({ id: tool.id, label: tool.name })),
  { id: 'performance', label: language.value === 'zh' ? '性能优化' : 'Performance' },
  { id: 'faq', label: language.value === 'zh' ? '常见问题' : 'FAQ' }
])

const navGroups = computed(() => [
  {
    title: language.value === 'zh' ? '快速开始' : 'Get started',
    items: [
      { id: 'quickstart', label: copy.value.quickstart },
      { id: 'models', label: language.value === 'zh' ? '模型列表' : 'Models' }
    ]
  },
  {
    title: language.value === 'zh' ? 'SDK 与 API' : 'SDKs & API',
    items: [
      { id: 'endpoint', label: copy.value.endpointTitle },
      { id: 'authentication', label: copy.value.authTitle },
      { id: 'request', label: copy.value.requestTitle },
      { id: 'response', label: copy.value.responseTitle },
      ...sdkSections.map((section) => ({
        id: section.id,
        label: language.value === 'zh' ? section.zhTitle : section.title
      })),
      { id: 'streaming', label: language.value === 'zh' ? '流式输出' : 'Streaming' },
      { id: 'errors', label: copy.value.errorsTitle }
    ]
  },
  {
    title: language.value === 'zh' ? '接入工具' : 'Tools',
    items: [
      { id: 'tools-overview', label: language.value === 'zh' ? '接入概览' : 'Overview' },
      ...tools.map((tool) => ({ id: tool.id, label: tool.name, child: true }))
    ]
  },
  {
    title: language.value === 'zh' ? '最佳实践' : 'Best practices',
    items: [
      {
        id: 'performance',
        label: language.value === 'zh' ? '延迟优化与性能调优' : 'Latency and performance'
      },
      { id: 'faq', label: language.value === 'zh' ? '常见问题' : 'FAQ' }
    ]
  }
])

const errors = computed(() =>
  language.value === 'zh'
    ? [
        { code: '400', meaning: '请求参数格式错误', action: '检查模型名和消息结构', tone: 'warn' },
        { code: '401', meaning: 'API Key 无效或过期', action: '创建或更换 Key', tone: 'bad' },
        { code: '403', meaning: '模型或功能未开通', action: '检查套餐权限', tone: 'bad' },
        { code: '429', meaning: '触发速率或额度限制', action: '指数退避后重试', tone: 'warn' },
        { code: '502 / 503', meaning: '上游服务暂时不可用', action: '重试一次后退避', tone: 'bad' },
        { code: '504', meaning: '网关超时', action: '缩小请求或增加超时', tone: 'bad' }
      ]
    : [
        { code: '400', meaning: 'Invalid request parameters', action: 'Check model and message shape', tone: 'warn' },
        { code: '401', meaning: 'Invalid or expired API key', action: 'Create or rotate a key', tone: 'bad' },
        { code: '403', meaning: 'Model or feature is not enabled', action: 'Check plan permissions', tone: 'bad' },
        { code: '429', meaning: 'Rate limit or quota exceeded', action: 'Retry with backoff', tone: 'warn' },
        { code: '502 / 503', meaning: 'Upstream temporarily unavailable', action: 'Retry once, then back off', tone: 'bad' },
        { code: '504', meaning: 'Gateway timeout', action: 'Reduce request or increase timeout', tone: 'bad' }
      ]
)

function toggleTheme() {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

async function copyCode(code: string, id: string) {
  if (!(await writeClipboardText(code))) return

  copiedCode.value = id
  if (copyResetTimer !== undefined) window.clearTimeout(copyResetTimer)
  copyResetTimer = window.setTimeout(() => {
    if (copiedCode.value === id) copiedCode.value = ''
    copyResetTimer = undefined
  }, 1600)
}

function legacyCopyText(text: string) {
  const textarea = document.createElement('textarea')
  const activeElement = document.activeElement instanceof HTMLElement
    ? document.activeElement
    : null

  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.inset = '0 auto auto -9999px'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  textarea.setSelectionRange(0, text.length)

  try {
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    textarea.remove()
    activeElement?.focus({ preventScroll: true })
  }
}

async function writeClipboardText(text: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Fall through for HTTP contexts or denied clipboard permissions.
    }
  }

  return legacyCopyText(text)
}

function createSectionObserver() {
  sectionObserver?.disconnect()
  sectionObserver = undefined

  if (!docsRoot.value || typeof IntersectionObserver === 'undefined') return

  const sections = docsRoot.value.querySelectorAll<HTMLElement>('.docs-section')
  const observer = new IntersectionObserver(
    (entries) => {
      const entry = entries
        .filter((candidate) => candidate.isIntersecting)
        .sort((left, right) => left.boundingClientRect.top - right.boundingClientRect.top)[0]
      if (entry) activeSection.value = entry.target.id
    },
    { rootMargin: '-20% 0px -65% 0px' }
  )
  sections.forEach((section) => observer.observe(section))
  return observer
}

let sectionObserver: IntersectionObserver | undefined
let copyResetTimer: number | undefined

onMounted(() => {
  if (!appStore.publicSettingsLoaded) {
    void appStore.fetchPublicSettings()
  }
  sectionObserver = createSectionObserver()
})

onUnmounted(() => {
  sectionObserver?.disconnect()
  sectionObserver = undefined
  if (copyResetTimer !== undefined) window.clearTimeout(copyResetTimer)
})
</script>

<template>
  <div ref="docsRoot" class="docs-shell" :class="{ 'is-dark': isDark }">
    <div class="docs-grid" aria-hidden="true"></div>

    <header class="docs-header">
      <div class="docs-header-inner">
        <router-link to="/home" class="brand-lockup" aria-label="WeThink home">
          <span class="brand-mark"><img :src="siteLogo || '/logo.svg'" alt="" /></span>
          <span class="brand-name">{{ siteName }}</span>
          <span class="brand-divider"></span>
          <span class="brand-section">{{ copy.docs }}</span>
        </router-link>

        <div class="header-actions">
          <router-link
            class="header-link"
            :to="{ name: 'Keys' }"
            target="_blank"
            rel="noopener noreferrer"
            :title="copy.openConsole"
            :aria-label="copy.openConsole"
          >
            <span class="header-link-label">{{ copy.openConsole }}</span>
            <Icon name="externalLink" size="xs" />
          </router-link>
          <div class="language-switch" role="group" :aria-label="copy.language">
            <button type="button" :class="{ active: language === 'en' }" @click="language = 'en'">EN</button>
            <button type="button" :class="{ active: language === 'zh' }" @click="language = 'zh'">中文</button>
          </div>
          <button
            class="icon-button"
            type="button"
            :title="isDark ? copy.lightMode : copy.darkMode"
            :aria-label="isDark ? copy.lightMode : copy.darkMode"
            @click="toggleTheme"
          >
            <Icon :name="isDark ? 'sun' : 'moon'" size="sm" />
          </button>
        </div>
      </div>
    </header>

    <div class="docs-layout">
      <aside class="docs-sidebar">
        <div class="sidebar-label">{{ copy.guide }}</div>
        <nav aria-label="Documentation navigation">
          <div v-for="group in navGroups" :key="group.title" class="nav-group">
            <div class="nav-group-title">{{ group.title }}</div>
            <a
              v-for="item in group.items"
              :key="item.id"
              :href="`#${item.id}`"
              :class="{ active: activeSection === item.id, child: 'child' in item && item.child }"
              @click="activeSection = item.id"
            >
              {{ item.label }}
            </a>
          </div>
        </nav>
        <div class="sidebar-status">
          <span class="status-dot"></span>
          <div>
            <strong>{{ copy.apiStatus }}</strong>
            <small>{{ copy.operational }}</small>
          </div>
        </div>
      </aside>

      <main class="docs-main">
        <div class="docs-breadcrumb">
          <span>{{ copy.docs }}</span>
          <Icon name="chevronRight" size="xs" />
          <strong>{{ copy.quickstart }}</strong>
        </div>

        <section id="quickstart" class="docs-hero docs-section">
          <div class="section-kicker"><span class="kicker-dot"></span>WETHINK / API REFERENCE</div>
          <h1>{{ copy.title }}</h1>
          <p class="hero-description">{{ copy.intro }}</p>
          <div class="hero-meta">
            <span><Icon name="checkCircle" size="sm" />{{ copy.productionReady }}</span>
            <span><Icon name="bolt" size="sm" />{{ copy.lowLatency }}</span>
            <span><Icon name="globe" size="sm" />{{ copy.globalEndpoint }}</span>
          </div>
        </section>

        <section id="endpoint" class="docs-section">
          <div class="section-heading">
            <span class="section-number">01</span>
            <div><h2>{{ copy.endpointTitle }}</h2><p>{{ copy.endpointIntro }}</p></div>
          </div>
          <div class="endpoint-card">
            <div class="endpoint-card-top">
              <span class="method">POST</span>
              <code>{{ API_BASE_URL }}/v1/messages</code>
              <span class="secure-chip"><Icon name="lock" size="xs" /> HTTPS</span>
            </div>
            <div class="endpoint-details">
              <div><span>{{ copy.baseUrl }}</span><code>{{ API_BASE_URL }}</code></div>
              <div><span>{{ copy.defaultModel }}</span><code>{{ DEFAULT_MODEL }}</code></div>
              <div><span>{{ copy.protocol }}</span><strong>Anthropic Messages API</strong></div>
            </div>
          </div>
        </section>

        <section id="authentication" class="docs-section">
          <div class="section-heading">
            <span class="section-number">02</span>
            <div><h2>{{ copy.authTitle }}</h2><p>{{ copy.authIntro }}</p></div>
          </div>
          <div class="callout">
            <span class="callout-mark"><Icon name="key" size="sm" /></span>
            <div><strong>{{ copy.authNoteTitle }}</strong><p>{{ copy.authNote }}</p></div>
          </div>
        </section>

        <section id="request" class="docs-section">
          <div class="section-heading">
            <span class="section-number">03</span>
            <div><h2>{{ copy.requestTitle }}</h2><p>{{ copy.requestIntro }}</p></div>
          </div>
          <div class="code-window">
            <div class="code-window-bar">
              <span class="window-dots"><i></i><i></i><i></i></span>
              <span>request.sh</span>
              <button
                type="button"
                class="copy-button"
                :title="copiedCode === 'request' ? copy.copied : copy.copy"
                :aria-label="copiedCode === 'request' ? copy.copied : copy.copy"
                aria-live="polite"
                @click="copyCode(requestSnippet, 'request')"
              >
                <Icon :name="copiedCode === 'request' ? 'check' : 'copy'" size="xs" />
                {{ copiedCode === 'request' ? copy.copied : copy.copy }}
              </button>
            </div>
            <pre><code><span class="syntax-muted">curl</span> {{ API_BASE_URL }}/v1/messages \
  <span class="syntax-flag">--header</span> <span class="syntax-string">'x-api-key: YOUR_API_KEY'</span> \
  <span class="syntax-flag">--header</span> <span class="syntax-string">'anthropic-version: 2023-06-01'</span> \
  <span class="syntax-flag">--header</span> <span class="syntax-string">'content-type: application/json'</span> \
  <span class="syntax-flag">--data</span> <span class="syntax-string">'{"model":"claude-opus-5","max_tokens":1024,"messages":[{"role":"user","content":"Hello, WeThink"}]}'</span></code></pre>
          </div>
        </section>

        <section id="response" class="docs-section">
          <div class="section-heading">
            <span class="section-number">04</span>
            <div><h2>{{ copy.responseTitle }}</h2><p>{{ copy.responseIntro }}</p></div>
          </div>
          <div class="code-window response-window">
            <div class="code-window-bar">
              <span class="window-dots"><i></i><i></i><i></i></span>
              <span>response.json</span>
              <button
                type="button"
                class="copy-button"
                :title="copiedCode === 'response' ? copy.copied : copy.copy"
                :aria-label="copiedCode === 'response' ? copy.copied : copy.copy"
                aria-live="polite"
                @click="copyCode(responseSnippet, 'response')"
              >
                <Icon :name="copiedCode === 'response' ? 'check' : 'copy'" size="xs" />
                {{ copiedCode === 'response' ? copy.copied : copy.copy }}
              </button>
            </div>
            <pre><code><span class="syntax-brace">{</span>
  <span class="syntax-key">"id"</span>: <span class="syntax-string">"msg_01WeThink"</span>,
  <span class="syntax-key">"type"</span>: <span class="syntax-string">"message"</span>,
  <span class="syntax-key">"model"</span>: <span class="syntax-string">"{{ DEFAULT_MODEL }}"</span>,
  <span class="syntax-key">"role"</span>: <span class="syntax-string">"assistant"</span>,
  <span class="syntax-key">"content"</span>: <span class="syntax-brace">[{</span>
    <span class="syntax-key">"type"</span>: <span class="syntax-string">"text"</span>,
    <span class="syntax-key">"text"</span>: <span class="syntax-string">"Hello! How can I help you today?"</span>
  <span class="syntax-brace">}]</span>,
  <span class="syntax-key">"stop_reason"</span>: <span class="syntax-string">"end_turn"</span>
<span class="syntax-brace">}</span></code></pre>
          </div>
        </section>

        <section id="models" class="docs-section">
          <div class="section-heading">
            <span class="section-number">05</span>
            <div>
              <h2>{{ language === 'zh' ? '模型列表' : 'Available models' }}</h2>
              <p>{{ language === 'zh' ? '在请求的 model 参数中填入以下模型 ID。默认路由为 claude-opus-5。' : 'Pass one of these model IDs in the model parameter. The default route is claude-opus-5.' }}</p>
            </div>
          </div>
          <div class="callout">
            <span class="callout-mark"><Icon name="infoCircle" size="sm" /></span>
            <div>
              <strong>{{ language === 'zh' ? '模型可用性与限额' : 'Model availability and limits' }}</strong>
              <p>{{ language === 'zh' ? '具体可用模型、并发和额度以控制台当前套餐为准。' : 'Available models, concurrency, and quotas depend on your current plan in the console.' }}</p>
            </div>
          </div>
          <div class="model-table">
            <div class="model-row model-head">
              <span>MODEL ID</span><span>{{ language === 'zh' ? '系列' : 'FAMILY' }}</span><span>{{ language === 'zh' ? '适用场景' : 'BEST FOR' }}</span>
            </div>
            <div v-for="model in models" :key="model.id" class="model-row">
              <code>{{ model.id }}</code>
              <span class="family-pill" :class="model.family">{{ model.family }}</span>
              <span class="muted-cell">{{ language === 'zh' ? model.zh : model.en }}</span>
            </div>
          </div>
        </section>

        <section v-for="sdk in sdkSections" :id="sdk.id" :key="sdk.id" class="docs-section">
          <div class="section-heading">
            <span class="section-number">{{ sdk.index }}</span>
            <div><h2>{{ language === 'zh' ? sdk.zhTitle : sdk.title }}</h2><p>{{ language === 'zh' ? sdk.zhDescription : sdk.description }}</p></div>
          </div>
          <div class="sdk-layout">
            <div class="sdk-copy">
              <h3>{{ language === 'zh' ? '接入说明' : 'Getting started' }}</h3>
              <p>{{ language === 'zh' ? sdk.zhInstall : sdk.install }}</p>
              <div class="sdk-settings">
                <span>Base URL</span><code>{{ API_BASE_URL }}/v1</code>
                <span>{{ language === 'zh' ? '模型' : 'Model' }}</span><code>{{ DEFAULT_MODEL }}</code>
              </div>
              <p class="sdk-note">{{ language === 'zh' ? sdk.zhNote : sdk.note }}</p>
            </div>
            <div class="code-window">
              <div class="code-window-bar">
                <span class="window-dots"><i></i><i></i><i></i></span>
                <span>{{ sdk.file }}</span>
                <button
                  type="button"
                  class="copy-button"
                  :title="copiedCode === sdk.id ? copy.copied : copy.copy"
                  :aria-label="copiedCode === sdk.id ? copy.copied : copy.copy"
                  aria-live="polite"
                  @click="copyCode(sdk.code, sdk.id)"
                >
                  <Icon :name="copiedCode === sdk.id ? 'check' : 'copy'" size="xs" />
                  {{ copiedCode === sdk.id ? copy.copied : copy.copy }}
                </button>
              </div>
              <pre><code>{{ sdk.code }}</code></pre>
            </div>
          </div>
        </section>

        <section id="streaming" class="docs-section">
          <div class="section-heading">
            <span class="section-number">10</span>
            <div>
              <h2>{{ language === 'zh' ? '流式输出（Streaming）' : 'Streaming responses' }}</h2>
              <p>{{ language === 'zh' ? '使用 Server-Sent Events 让长文本生成更快展示首个 Token，并保持界面响应。' : 'Use server-sent events to show the first token quickly and keep long responses responsive.' }}</p>
            </div>
          </div>
          <div class="callout">
            <span class="callout-mark"><Icon name="bolt" size="sm" /></span>
            <div>
              <strong>{{ language === 'zh' ? '在请求体中加入 stream: true' : 'Add stream: true to the request body' }}</strong>
              <p>{{ language === 'zh' ? '每个 data 事件包含一段增量消息。收到结束事件后关闭连接。' : 'Each data event contains a partial message delta. Close the connection after the stop event.' }}</p>
            </div>
          </div>
          <div class="code-window">
            <div class="code-window-bar">
              <span class="window-dots"><i></i><i></i><i></i></span>
              <span>streaming.py</span>
              <button
                type="button"
                class="copy-button"
                :title="copiedCode === 'streaming' ? copy.copied : copy.copy"
                :aria-label="copiedCode === 'streaming' ? copy.copied : copy.copy"
                aria-live="polite"
                @click="copyCode(streamingSnippet, 'streaming')"
              >
                <Icon :name="copiedCode === 'streaming' ? 'check' : 'copy'" size="xs" />
                {{ copiedCode === 'streaming' ? copy.copied : copy.copy }}
              </button>
            </div>
            <pre><code>{{ streamingSnippet }}</code></pre>
          </div>
          <ul class="practice-list">
            <li>{{ language === 'zh' ? '边接收边渲染文本，无需等待完整响应。' : 'Render text as events arrive instead of waiting for the full response.' }}</li>
            <li>{{ language === 'zh' ? '长文本生成建议将读取超时设置为至少 120 秒。' : 'Keep a read timeout of at least 120 seconds for long generations.' }}</li>
            <li>{{ language === 'zh' ? '断线时记录 request id，便于在控制台排查。' : 'Keep the request id when a stream closes unexpectedly for easier debugging.' }}</li>
          </ul>
        </section>

        <section id="errors" class="docs-section">
          <div class="section-heading">
            <span class="section-number">11</span>
            <div><h2>{{ copy.errorsTitle }}</h2><p>{{ copy.errorsIntro }}</p></div>
          </div>
          <div class="error-table">
            <div class="error-row error-head"><span>{{ copy.status }}</span><span>{{ copy.meaning }}</span><span>{{ copy.action }}</span></div>
            <div v-for="error in errors" :key="error.code" class="error-row">
              <code :class="`status-${error.tone}`">{{ error.code }}</code>
              <span>{{ error.meaning }}</span><span class="muted-cell">{{ error.action }}</span>
            </div>
          </div>
          <div class="callout">
            <span class="callout-mark"><Icon name="clock" size="sm" /></span>
            <div>
              <strong>{{ language === 'zh' ? '生产环境超时建议' : 'Production timeout recommendation' }}</strong>
              <p>{{ language === 'zh' ? '连接超时 5 秒，读取超时 120 秒；对幂等请求使用指数退避，不要无限重试。' : 'Use a 5s connection timeout and a 120s read timeout. Retry idempotent requests with exponential backoff and cap the retry count.' }}</p>
            </div>
          </div>
        </section>

        <section id="tools-overview" class="docs-section">
          <div class="section-heading">
            <span class="section-number">12</span>
            <div>
              <h2>{{ language === 'zh' ? '接入客户端与开发工具' : 'Connect your favorite tools' }}</h2>
              <p>{{ language === 'zh' ? '为常用 AI 编程客户端统一配置入口、Key 和模型。' : 'Configure your preferred AI coding clients with the same endpoint, key, and model.' }}</p>
            </div>
          </div>
          <div class="tool-grid">
            <a v-for="tool in tools" :key="tool.id" :href="`#${tool.id}`" class="tool-card">
              <span class="tool-icon">{{ tool.name.slice(0, 1) }}</span>
              <span><strong>{{ tool.name }}</strong><small>{{ language === 'zh' ? tool.zh : tool.en }}</small></span>
              <Icon name="arrowRight" size="xs" />
            </a>
          </div>
        </section>

        <section v-for="tool in tools" :id="tool.id" :key="tool.id" class="docs-section tool-section">
          <div class="tool-heading">
            <span class="tool-icon large">{{ tool.name.slice(0, 1) }}</span>
            <div>
              <span class="section-kicker">{{ language === 'zh' ? '工具接入' : 'TOOL SETUP' }}</span>
              <h2>{{ tool.name }}</h2>
              <p>{{ language === 'zh' ? tool.zh : tool.en }}</p>
            </div>
          </div>
          <div class="tool-layout">
            <ol class="tool-steps">
              <li v-for="(step, index) in tool.steps" :key="index"><b>{{ index + 1 }}</b><span>{{ language === 'zh' ? step.zh : step.en }}</span></li>
            </ol>
            <div class="config-card">
              <span>{{ language === 'zh' ? '配置参数' : 'CONFIGURATION' }}</span>
              <div><small>Base URL</small><code>{{ API_BASE_URL }}/v1</code></div>
              <div><small>API Key</small><code>YOUR_API_KEY</code></div>
              <div><small>Model</small><code>{{ DEFAULT_MODEL }}</code></div>
            </div>
          </div>
        </section>

        <section id="performance" class="docs-section">
          <div class="section-heading">
            <span class="section-number">33</span>
            <div>
              <h2>{{ language === 'zh' ? '延迟优化与性能调优' : 'Latency and performance' }}</h2>
              <p>{{ language === 'zh' ? '以下配置对感知速度和生产稳定性影响最大。' : 'These request and network choices make the largest difference in perceived speed and production stability.' }}</p>
            </div>
          </div>
          <div class="practice-grid">
            <article v-for="(tip, index) in performanceTips" :key="tip.en">
              <span class="tip-index">0{{ index + 1 }}</span>
              <h3>{{ language === 'zh' ? tip.zhTitle : tip.enTitle }}</h3>
              <p>{{ language === 'zh' ? tip.zh : tip.en }}</p>
            </article>
          </div>
        </section>

        <section id="faq" class="docs-section last-section">
          <div class="section-heading">
            <span class="section-number">34</span>
            <div>
              <h2>{{ language === 'zh' ? '常见问题' : 'Frequently asked questions' }}</h2>
              <p>{{ language === 'zh' ? '关于 WeThink API 平台的常见问题与解答。' : 'Answers to the questions we hear most often when setting up WeThink.' }}</p>
            </div>
          </div>
          <div class="faq-list">
            <details v-for="faq in faqs" :key="faq.enQ">
              <summary>{{ language === 'zh' ? faq.zhQ : faq.enQ }}</summary>
              <p>{{ language === 'zh' ? faq.zhA : faq.enA }}</p>
            </details>
          </div>
        </section>

        <footer class="docs-footer">
          <span>© {{ currentYear }} {{ siteName }}</span><span class="footer-rule"></span><span>{{ copy.footer }}</span>
        </footer>
      </main>

      <aside class="on-page">
        <span class="sidebar-label">{{ copy.onThisPage }}</span>
        <a v-for="item in onPageItems" :key="`aside-${item.id}`" :href="`#${item.id}`">{{ item.label }}</a>
        <router-link
          class="api-link"
          :to="{ name: 'Keys' }"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ copy.openConsole }} <Icon name="arrowRight" size="xs" />
        </router-link>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.docs-shell {
  --ink: #101918;
  --muted: #687674;
  --line: rgba(16, 25, 24, 0.12);
  --accent: #14a88c;
  --card: rgba(255, 255, 255, 0.76);
  min-height: 100dvh;
  overflow-x: clip;
  background: #f5f8f6;
  color: var(--ink);
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.docs-shell.is-dark {
  --ink: #eef7f3;
  --muted: #9aa9a4;
  --line: rgba(220, 240, 234, 0.14);
  --card: rgba(20, 34, 31, 0.82);
  background: #0b1211;
}

.docs-grid {
  position: fixed;
  inset: 0;
  pointer-events: none;
  opacity: 0.5;
  background-image:
    linear-gradient(rgba(16, 25, 24, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(16, 25, 24, 0.035) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: linear-gradient(to bottom, #000, transparent 80%);
}

.is-dark .docs-grid {
  background-image:
    linear-gradient(rgba(220, 240, 234, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(220, 240, 234, 0.035) 1px, transparent 1px);
}

.docs-header {
  position: sticky;
  top: 0;
  z-index: 20;
  border-bottom: 1px solid var(--line);
  background: color-mix(in srgb, var(--card) 88%, transparent);
  backdrop-filter: blur(18px);
}

.docs-header-inner {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  max-width: 1480px;
  min-height: 72px;
  margin: auto;
  padding: 14px clamp(20px, 4vw, 64px);
}

.brand-lockup {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  color: var(--ink);
  text-decoration: none;
}

.brand-mark {
  display: grid;
  place-items: center;
  flex: none;
  width: 30px;
  height: 30px;
  overflow: hidden;
  border: 1px solid rgba(20, 168, 140, 0.45);
  border-radius: 7px;
  background: rgba(20, 168, 140, 0.12);
}

.brand-mark img {
  width: 21px;
  height: 21px;
  object-fit: contain;
}

.brand-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 780;
  letter-spacing: 0;
}

.brand-divider {
  width: 1px;
  height: 18px;
  margin: 0 3px;
  background: var(--line);
}

.brand-section {
  color: var(--muted);
  font-size: 13px;
}

.header-actions {
  display: flex;
  align-items: center;
  flex: none;
  gap: 16px;
}

.header-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--muted);
  font-size: 12px;
  text-decoration: none;
}

.header-link:hover {
  color: var(--accent);
}

.language-switch {
  display: flex;
  padding: 3px;
  border: 1px solid var(--line);
  border-radius: 7px;
  background: color-mix(in srgb, var(--card) 88%, transparent);
}

.language-switch button {
  padding: 5px 8px;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: var(--muted);
  font: 10px ui-monospace, SFMono-Regular, Menlo, monospace;
  cursor: pointer;
}

.language-switch button.active {
  background: var(--accent);
  color: #fff;
}

.icon-button {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--line);
  border-radius: 7px;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
}

.icon-button:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.docs-layout {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 210px minmax(0, 780px) 150px;
  gap: clamp(30px, 5vw, 84px);
  max-width: 1480px;
  margin: auto;
  padding: 42px clamp(20px, 4vw, 64px) 0;
}

.docs-sidebar {
  position: sticky;
  top: 114px;
  align-self: start;
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: calc(100vh - 156px);
}

.sidebar-label {
  color: var(--muted);
  font: 10px ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: 0.13em;
}

.docs-sidebar nav {
  flex: 1;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  margin-top: 13px;
  padding-right: 7px;
  scrollbar-color: color-mix(in srgb, var(--muted) 35%, transparent) transparent;
  scrollbar-width: thin;
}

.nav-group {
  padding: 0 0 14px;
}

.nav-group-title {
  display: block;
  padding: 10px 9px 6px;
  color: var(--ink);
  font-size: 11px;
  font-weight: 700;
}

.nav-group a {
  display: block;
  min-height: 29px;
  padding: 6px 9px;
  border-left: 1px solid transparent;
  color: var(--muted);
  font-size: 11px;
  line-height: 1.45;
  text-decoration: none;
}

.nav-group a.child {
  padding-left: 23px;
  color: color-mix(in srgb, var(--muted) 88%, transparent);
  font-size: 10px;
}

.nav-group a:hover,
.nav-group a.active {
  border-left-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 7%, transparent);
  color: var(--ink);
}

.sidebar-status {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-top: auto;
  padding: 12px 0;
  border-top: 1px solid var(--line);
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #28b58e;
  box-shadow: 0 0 0 4px rgba(40, 181, 142, 0.12);
}

.sidebar-status strong,
.sidebar-status small {
  display: block;
}

.sidebar-status strong {
  font-size: 11px;
}

.sidebar-status small {
  margin-top: 3px;
  color: var(--muted);
  font-size: 10px;
}

.docs-main {
  min-width: 0;
}

.docs-breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--muted);
  font-size: 11px;
}

.docs-breadcrumb strong {
  color: var(--ink);
  font-weight: 600;
}

.docs-hero {
  padding: 56px 0 72px;
  border-bottom: 1px solid var(--line);
}

.section-kicker {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--accent);
  font: 10px ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: 0.12em;
}

.kicker-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 0 4px rgba(20, 168, 140, 0.12);
}

.docs-hero h1 {
  max-width: 680px;
  margin: 18px 0 14px;
  font-size: clamp(38px, 5vw, 66px);
  line-height: 1.02;
  letter-spacing: 0;
}

.hero-description {
  max-width: 600px;
  margin: 0;
  color: var(--muted);
  font-size: 17px;
  line-height: 1.65;
}

.hero-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  margin-top: 28px;
  color: var(--muted);
  font-size: 11px;
}

.hero-meta span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.hero-meta svg {
  color: var(--accent);
}

.docs-section {
  padding: 56px 0;
  border-bottom: 1px solid var(--line);
  scroll-margin-top: 104px;
}

.section-heading {
  display: flex;
  gap: 17px;
  margin-bottom: 23px;
}

.section-number {
  padding-top: 5px;
  color: var(--accent);
  font: 11px ui-monospace, SFMono-Regular, Menlo, monospace;
}

.section-heading h2 {
  margin: 0;
  font-size: 24px;
  letter-spacing: 0;
}

.section-heading p {
  margin: 7px 0 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.6;
}

.endpoint-card,
.callout,
.code-window,
.error-table {
  max-width: 100%;
  border: 1px solid var(--line);
  border-radius: 7px;
  background: var(--card);
  box-shadow: 0 13px 30px rgba(20, 50, 40, 0.05);
}

.endpoint-card-top {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 18px;
  border-bottom: 1px solid var(--line);
}

.method {
  padding: 5px 7px;
  border-radius: 4px;
  background: rgba(20, 168, 140, 0.12);
  color: var(--accent);
  font: 700 10px ui-monospace, SFMono-Regular, Menlo, monospace;
}

.endpoint-card code {
  min-width: 0;
  overflow-wrap: anywhere;
  color: var(--ink);
  font: 12px ui-monospace, SFMono-Regular, Menlo, monospace;
}

.secure-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-left: auto;
  color: #28b58e;
  font: 10px ui-monospace, SFMono-Regular, Menlo, monospace;
}

.endpoint-details {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
  padding: 19px 18px;
}

.endpoint-details span,
.endpoint-details code,
.endpoint-details strong {
  display: block;
}

.endpoint-details span {
  margin-bottom: 7px;
  color: var(--muted);
  font-size: 10px;
}

.endpoint-details code,
.endpoint-details strong {
  font-size: 11px;
  font-weight: 600;
}

.callout {
  display: flex;
  gap: 13px;
  padding: 17px 19px;
  border-left: 3px solid var(--accent);
}

.callout-mark {
  color: var(--accent);
}

.callout strong {
  font-size: 12px;
}

.callout p {
  margin: 5px 0 0;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.6;
}

.code-window {
  min-width: 0;
  overflow: hidden;
  background: #12201d;
  color: #d9ece5;
}

.is-dark .code-window {
  background: #08110f;
}

.code-window-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 13px;
  border-bottom: 1px solid rgba(220, 240, 234, 0.11);
  color: #8da59d;
  font: 10px ui-monospace, SFMono-Regular, Menlo, monospace;
}

.code-window-bar > span:nth-child(2) {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.window-dots {
  display: flex;
  flex: none;
  gap: 4px;
}

.window-dots i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #436258;
}

.copy-button {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-left: auto;
  flex: none;
  padding: 4px 7px;
  border: 1px solid rgba(220, 240, 234, 0.14);
  border-radius: 4px;
  background: transparent;
  color: #a9c1b8;
  font: 10px ui-monospace, SFMono-Regular, Menlo, monospace;
  cursor: pointer;
}

.copy-button:hover {
  border-color: #54c5a6;
  color: #75d6be;
}

.code-window pre {
  box-sizing: border-box;
  max-width: 100%;
  overflow: auto;
  margin: 0;
  padding: 22px 20px;
  font: 12px/1.8 ui-monospace, SFMono-Regular, Menlo, monospace;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.syntax-muted {
  color: #75d6be;
}

.syntax-flag {
  color: #f1ba72;
}

.syntax-string {
  color: #b8d889;
}

.syntax-key {
  color: #80b7e9;
}

.syntax-brace {
  color: #e6f2ed;
}

.response-window pre {
  color: #cadbd5;
}

.error-table {
  overflow: hidden;
}

.error-row {
  display: grid;
  grid-template-columns: 90px 1fr 1fr;
  align-items: center;
  gap: 16px;
  min-height: 50px;
  padding: 0 17px;
  border-top: 1px solid var(--line);
  font-size: 12px;
}

.error-row:first-child {
  border-top: 0;
}

.error-head {
  min-height: 37px;
  color: var(--muted);
  font: 10px ui-monospace, SFMono-Regular, Menlo, monospace;
}

.error-row code {
  min-width: 0;
  overflow-wrap: anywhere;
  font: 700 11px ui-monospace, SFMono-Regular, Menlo, monospace;
}

.error-row > span {
  min-width: 0;
  overflow-wrap: anywhere;
}

.status-warn {
  color: #d8994c;
}

.status-bad {
  color: #df796c;
}

.muted-cell {
  color: var(--muted);
}

.last-section {
  border-bottom: 0;
}

.on-page {
  position: sticky;
  top: 114px;
  align-self: start;
  display: grid;
  gap: 12px;
  max-height: calc(100vh - 156px);
  min-height: 0;
  overflow-y: auto;
  padding-top: 2px;
  padding-right: 7px;
  scrollbar-color: color-mix(in srgb, var(--muted) 35%, transparent) transparent;
  scrollbar-width: thin;
}

.on-page a {
  color: var(--muted);
  font-size: 11px;
  text-decoration: none;
}

.on-page a:hover {
  color: var(--accent);
}

.on-page .api-link {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  color: var(--accent);
}

.docs-footer {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 30px 0 42px;
  color: var(--muted);
  font-size: 10px;
}

.footer-rule {
  width: 34px;
  height: 1px;
  background: var(--line);
}

.model-table {
  max-width: 100%;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 7px;
  background: var(--card);
}

.model-row {
  display: grid;
  grid-template-columns: 1.35fr 0.8fr 1.35fr;
  align-items: center;
  gap: 16px;
  min-height: 46px;
  padding: 0 15px;
  border-top: 1px solid var(--line);
  font-size: 10px;
}

.model-row:first-child {
  border-top: 0;
}

.model-head {
  min-height: 36px;
  background: color-mix(in srgb, var(--muted) 5%, transparent);
  color: var(--muted);
  font: 10px ui-monospace, SFMono-Regular, Menlo, monospace;
}

.model-row code {
  min-width: 0;
  overflow-wrap: anywhere;
  font: 9px ui-monospace, SFMono-Regular, Menlo, monospace;
}

.model-row > span {
  min-width: 0;
  overflow-wrap: anywhere;
}

.family-pill {
  width: max-content;
  padding: 3px 6px;
  border-radius: 4px;
  background: rgba(20, 168, 140, 0.11);
  color: var(--accent);
  font: 10px ui-monospace, SFMono-Regular, Menlo, monospace;
}

.sdk-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.sdk-copy,
.config-card,
.tool-card,
.practice-grid article {
  border: 1px solid var(--line);
  border-radius: 7px;
  background: var(--card);
}

.sdk-copy {
  padding: 18px;
}

.sdk-copy h3 {
  margin: 0 0 7px;
  font-size: 14px;
}

.sdk-copy p {
  margin: 0;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.65;
}

.sdk-settings {
  display: grid;
  grid-template-columns: 72px 1fr;
  gap: 9px 10px;
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid var(--line);
}

.sdk-settings span {
  color: var(--muted);
  font-size: 10px;
}

.sdk-settings code {
  overflow-wrap: anywhere;
  color: var(--ink);
  font: 10px ui-monospace, SFMono-Regular, Menlo, monospace;
}

.sdk-note {
  margin-top: 18px !important;
  font-size: 10px !important;
}

.practice-list {
  display: grid;
  gap: 9px;
  margin: 18px 0 0;
  padding: 0;
  color: var(--muted);
  font-size: 12px;
  list-style: none;
}

.practice-list li {
  position: relative;
  padding-left: 18px;
}

.practice-list li::before {
  position: absolute;
  left: 0;
  color: var(--accent);
  content: '✓';
}

.tool-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.tool-card {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
  padding: 12px;
  color: var(--ink);
  text-decoration: none;
  transition: transform 0.2s, border-color 0.2s;
}

.tool-card:hover {
  border-color: var(--accent);
  transform: translateY(-2px);
}

.tool-card > span:nth-child(2) {
  min-width: 0;
}

.tool-card strong,
.tool-card small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tool-card strong {
  font-size: 11px;
}

.tool-card small {
  display: none;
  margin-top: 2px;
  color: var(--muted);
  font-size: 9px;
}

.tool-card > svg {
  flex: none;
  margin-left: auto;
  color: var(--muted);
}

.tool-icon {
  display: grid;
  place-items: center;
  flex: none;
  width: 28px;
  height: 28px;
  border-radius: 7px;
  background: rgba(20, 168, 140, 0.12);
  color: var(--accent);
  font: 700 12px ui-monospace, SFMono-Regular, Menlo, monospace;
}

.tool-icon.large {
  width: 42px;
  height: 42px;
  border-radius: 9px;
  font-size: 17px;
}

.tool-heading {
  display: flex;
  align-items: center;
  gap: 13px;
  margin-bottom: 20px;
}

.tool-heading h2 {
  margin: 4px 0 3px;
  font-size: 23px;
}

.tool-heading p {
  margin: 0;
  color: var(--muted);
  font-size: 12px;
}

.tool-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.tool-steps {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.tool-steps li {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.6;
}

.tool-steps b {
  display: grid;
  place-items: center;
  flex: none;
  width: 21px;
  height: 21px;
  border-radius: 5px;
  background: rgba(20, 168, 140, 0.12);
  color: var(--accent);
  font: 10px ui-monospace, SFMono-Regular, Menlo, monospace;
}

.config-card {
  padding: 16px;
}

.config-card > span {
  display: block;
  margin-bottom: 11px;
  color: var(--muted);
  font: 10px ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: 0.1em;
}

.config-card div {
  display: grid;
  grid-template-columns: 65px 1fr;
  gap: 8px;
  padding: 8px 0;
  border-top: 1px solid var(--line);
}

.config-card small {
  color: var(--muted);
  font-size: 10px;
}

.config-card code {
  overflow-wrap: anywhere;
  color: var(--ink);
  font: 10px ui-monospace, SFMono-Regular, Menlo, monospace;
}

.practice-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.practice-grid article {
  padding: 17px;
}

.tip-index {
  color: var(--accent);
  font: 10px ui-monospace, SFMono-Regular, Menlo, monospace;
}

.practice-grid h3 {
  margin: 14px 0 7px;
  font-size: 14px;
}

.practice-grid p {
  margin: 0;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.7;
}

.faq-list {
  border-top: 1px solid var(--line);
}

.faq-list details {
  padding: 17px 0;
  border-bottom: 1px solid var(--line);
}

.faq-list summary {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  font-weight: 650;
  list-style: none;
  cursor: pointer;
}

.faq-list summary::-webkit-details-marker {
  display: none;
}

.faq-list summary::before {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 5px;
  background: var(--accent);
  color: #fff;
  content: 'Q';
  font: 11px ui-monospace, SFMono-Regular, Menlo, monospace;
}

.faq-list summary::after {
  margin-left: auto;
  color: var(--muted);
  content: '+';
  font-size: 18px;
}

.faq-list details[open] summary::after {
  transform: rotate(45deg);
}

.faq-list p {
  margin: 12px 32px 0;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.8;
}

@media (max-width: 1100px) {
  .docs-layout {
    grid-template-columns: 180px minmax(0, 1fr);
    gap: 35px;
  }

  .on-page {
    display: none;
  }
}

@media (max-width: 700px) {
  .docs-header-inner {
    gap: 8px;
    min-height: 64px;
    padding: 11px 17px;
  }

  .brand-section,
  .brand-divider {
    display: none;
  }

  .header-link {
    display: grid;
    place-items: center;
    flex: none;
    width: 32px;
    height: 32px;
    border: 1px solid var(--line);
    border-radius: 7px;
  }

  .header-link:hover {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 7%, transparent);
  }

  .header-link-label {
    display: none;
  }

  .brand-lockup {
    flex: 1;
  }

  .brand-name {
    flex: 1;
  }

  .header-actions {
    gap: 8px;
  }

  .docs-layout {
    display: block;
    padding: 0 17px;
  }

  .docs-sidebar {
    position: sticky;
    top: 64px;
    z-index: 10;
    height: auto;
    padding: 12px 0;
    border-bottom: 1px solid var(--line);
    background: color-mix(in srgb, var(--card) 95%, transparent);
    backdrop-filter: blur(16px);
  }

  .docs-sidebar nav {
    display: flex;
    flex: initial;
    gap: 4px;
    min-height: auto;
    overflow-x: auto;
    overflow-y: hidden;
    margin: 8px -2px 0;
    padding-right: 0;
    padding-bottom: 2px;
  }

  .nav-group {
    display: contents;
  }

  .nav-group-title {
    display: none;
  }

  .docs-sidebar nav a,
  .nav-group a.child {
    flex: none;
    min-height: 28px;
    padding: 0 8px;
    border-left: 0;
    border-bottom: 1px solid transparent;
    font-size: 11px;
    white-space: nowrap;
  }

  .docs-sidebar nav a:hover,
  .docs-sidebar nav a.active {
    border-bottom-color: var(--accent);
  }

  .sidebar-status {
    display: none;
  }

  .docs-hero {
    padding: 40px 0 48px;
  }

  .docs-hero h1 {
    font-size: 42px;
  }

  .hero-description {
    font-size: 15px;
  }

  .hero-meta {
    gap: 10px 14px;
  }

  .docs-section {
    padding: 42px 0;
  }

  .section-heading h2 {
    font-size: 21px;
  }

  .endpoint-details {
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .endpoint-card-top {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .secure-chip {
    width: 100%;
    margin-left: 0;
  }

  .error-row {
    grid-template-columns: 60px 1fr;
    gap: 8px;
    padding: 11px 13px;
  }

  .error-row span:last-child {
    grid-column: 2;
  }

  .error-head {
    display: none;
  }

  .docs-footer {
    flex-wrap: wrap;
  }
}

@media (max-width: 430px) {
  .tool-grid,
  .practice-grid {
    grid-template-columns: 1fr;
  }

  .model-row {
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    padding: 10px;
  }

  .model-head {
    display: none;
  }

  .model-row span:last-child {
    grid-column: 2;
  }
}
</style>
