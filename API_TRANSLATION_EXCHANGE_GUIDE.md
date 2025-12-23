# 🌍 翻译和汇率API对接指南

本项目已集成翻译和汇率转换功能，支持多种API服务。

---

## 📦 已创建的服务文件

### 1. **翻译服务** 
`/services/translation.ts`

### 2. **汇率服务**
`/services/exchangeRate.ts`

---

## 🔧 配置步骤

### 一、翻译API配置

#### 方案1：Google Translate API（推荐）

**优点**：准确度高，支持100+语言
**价格**：前500万字符免费，之后$20/百万字符

**配置步骤**：
1. 访问 https://console.cloud.google.com/
2. 创建项目并启用 "Cloud Translation API"
3. 创建API密钥
4. 在 `services/translation.ts` 中填入：
   ```typescript
   const GOOGLE_TRANSLATE_API_KEY = 'YOUR_API_KEY_HERE';
   const CURRENT_ENGINE: TranslationEngine = 'google';
   ```

#### 方案2：Microsoft Translator（备选）

**优点**：质量好，Azure生态
**价格**：每月200万字符免费

**配置步骤**：
1. 访问 https://azure.microsoft.com/
2. 创建 "Translator" 资源
3. 获取密钥
4. 在 `services/translation.ts` 中填入：
   ```typescript
   const MICROSOFT_TRANSLATOR_KEY = 'YOUR_KEY_HERE';
   const CURRENT_ENGINE: TranslationEngine = 'microsoft';
   ```

#### 方案3：LibreTranslate（免费开源）

**优点**：完全免费，无需API密钥
**缺点**：准确度较低，公共实例有请求限制

**配置步骤**：
1. 在 `services/translation.ts` 中设置：
   ```typescript
   const CURRENT_ENGINE: TranslationEngine = 'libretranslate';
   ```
2. 或者自建实例：https://github.com/LibreTranslate/LibreTranslate

#### 方案4：Mock模式（演示）

**用途**：开发测试，无需API
**限制**：仅支持预定义的常用词汇

**配置步骤**：
```typescript
const CURRENT_ENGINE: TranslationEngine = 'mock'; // 默认已设置
```

---

### 二、汇率API配置

#### 方案1：ExchangeRate-API（推荐）

**优点**：免费，无需注册即可使用
**价格**：免费版1500请求/月，付费$9/月无限制

**配置步骤（可选）**：
1. 访问 https://www.exchangerate-api.com/
2. 注册获取API密钥（可选，免费版也能用）
3. 在 `services/exchangeRate.ts` 中填入：
   ```typescript
   const EXCHANGERATE_API_KEY = 'YOUR_API_KEY_HERE';
   const CURRENT_ENGINE: ExchangeEngine = 'exchangerate';
   ```

#### 方案2：Open Exchange Rates

**优点**：数据准确，更新频率高
**价格**：每月1000次免费，之后$12/月

**配置步骤**：
1. 访问 https://openexchangerates.org/
2. 注册获取APP ID
3. 在 `services/exchangeRate.ts` 中填入：
   ```typescript
   const OPENEXCHANGE_APP_ID = 'YOUR_APP_ID_HERE';
   const CURRENT_ENGINE: ExchangeEngine = 'openexchange';
   ```

#### 方案3：Fixer.io

**优点**：欧洲银行数据
**价格**：每月100次免费

**配置步骤**：
1. 访问 https://fixer.io/
2. 注册获取API密钥
3. 在 `services/exchangeRate.ts` 中填入：
   ```typescript
   const FIXER_API_KEY = 'YOUR_API_KEY_HERE';
   const CURRENT_ENGINE: ExchangeEngine = 'fixer';
   ```

#### 方案4：Mock模式（演示）

**用途**：开发测试，离线工作
**限制**：使用固定汇率，不实时更新

**配置步骤**：
```typescript
const CURRENT_ENGINE: ExchangeEngine = 'mock'; // 默认已设置
```

---

## 💻 使用示例

### 翻译功能

```typescript
import { translate, translateBatch } from './services/translation';

// 单个翻译
const translated = await translate('Add to Cart', 'es'); // "Añadir al carrito"

// 批量翻译
const texts = ['Checkout', 'Search', 'New Arrivals'];
const results = await translateBatch(texts, 'fr');
// { 'Checkout': 'Commander', 'Search': 'Rechercher', ... }
```

### 汇率转换

```typescript
import { getExchangeRates, convertPrice, formatPrice } from './services/exchangeRate';

// 获取汇率
const rates = await getExchangeRates('USD');

// 转换价格
const priceInEUR = await convertPrice(100, 'USD', 'EUR'); // ~92.00

// 格式化显示
const formatted = formatPrice(100, 'EUR', 'fr-FR'); // "100,00 €"
```

### 在商品页面中使用

```typescript
// 在App.tsx中
const [selectedCurrency, setSelectedCurrency] = useState('USD');
const [selectedLanguage, setSelectedLanguage] = useState('EN');

// 显示价格时
const displayPrice = await convertPrice(
  product.price, 
  'USD', 
  selectedCurrency
);

// 显示文本时
const buttonText = await translate('Add to Cart', selectedLanguage);
```

---

## 🎯 建议的实施方案

### 阶段1：演示模式（当前状态）
- ✅ 翻译：Mock模式（预定义常用词）
- ✅ 汇率：Mock模式（固定汇率）
- 优点：无需配置，立即可用
- 适用：开发测试、演示展示

### 阶段2：免费方案
- 🔄 翻译：LibreTranslate（完全免费）
- 🔄 汇率：ExchangeRate-API 免费版（1500次/月）
- 优点：零成本，实时更新
- 适用：小型网站、个人项目

### 阶段3：专业方案
- 💎 翻译：Google Translate（前500万字符免费）
- 💎 汇率：ExchangeRate-API 付费版（$9/月无限）
- 优点：高质量，无请求限制
- 适用：商业项目、生产环境

---

## 📊 功能特性

### 翻译服务特性
- ✅ 支持13种语言
- ✅ 翻译缓存（减少API调用）
- ✅ 批量翻译（提升性能）
- ✅ 自动降级（API失败返回原文）
- ✅ 多引擎切换

### 汇率服务特性
- ✅ 支持15种货币
- ✅ 自动缓存（1小时）
- ✅ 批量转换
- ✅ 多种格式化选项
- ✅ 自动降级（失败使用缓存）

---

## 🔍 调试命令

### 检查翻译状态
```typescript
import { getTranslationEngineStatus } from './services/translation';
console.log(getTranslationEngineStatus());
```

### 检查汇率状态
```typescript
import { getExchangeEngineStatus } from './services/exchangeRate';
console.log(getExchangeEngineStatus());
```

### 清除缓存
```typescript
import { clearTranslationCache } from './services/translation';
import { clearExchangeCache } from './services/exchangeRate';

clearTranslationCache();
clearExchangeCache();
```

---

## 🌟 下一步集成

### 在App.tsx中集成

1. **导入服务**
```typescript
import { translate } from './services/translation';
import { convertPrice, formatPrice } from './services/exchangeRate';
```

2. **在SettingsModal保存时更新全局状态**
```typescript
const handleSaveSettings = () => {
  localStorage.setItem('user_language', selectedLanguage);
  localStorage.setItem('user_currency', selectedCurrency);
  // 触发重新渲染
};
```

3. **在商品展示时应用**
```typescript
// 价格转换
const displayPrice = await convertPrice(product.price, 'USD', userCurrency);

// 文本翻译
const translatedName = await translate(product.name, userLanguage);
```

---

## 💡 性能优化建议

1. **预加载汇率**：应用启动时加载常用货币
2. **使用缓存**：避免重复翻译相同内容
3. **批量操作**：一次翻译多个文本
4. **懒加载**：只在需要时调用API

---

## ⚠️ 注意事项

1. **API密钥安全**：
   - 不要提交到Git
   - 使用环境变量
   - 考虑后端代理

2. **请求限制**：
   - 免费API有调用次数限制
   - 使用缓存减少请求
   - 考虑升级付费版

3. **错误处理**：
   - API失败自动降级
   - 显示原文而非错误
   - 记录错误日志

---

## 📝 总结

✅ **已完成**：
- 创建翻译服务（translation.ts）
- 创建汇率服务（exchangeRate.ts）
- 支持多种API引擎
- Mock模式可直接使用

🔄 **待集成**：
- 在App.tsx中使用服务
- 连接SettingsModal
- 应用到商品展示
- 添加加载状态

💎 **可选升级**：
- 配置真实API密钥
- 添加后端代理
- 实现智能缓存策略
- 添加翻译质量检测

---

## 🎓 API获取地址汇总

| 服务 | 地址 | 费用 |
|------|------|------|
| Google Translate | https://console.cloud.google.com/ | 前500万字符免费 |
| Microsoft Translator | https://azure.microsoft.com/ | 每月200万字符免费 |
| ExchangeRate-API | https://www.exchangerate-api.com/ | 1500次/月免费 |
| Open Exchange Rates | https://openexchangerates.org/ | 1000次/月免费 |
| LibreTranslate | https://libretranslate.com/ | 完全免费 |

---

**当前状态**：✅ 服务已创建，Mock模式可直接使用，无需配置！
