# 翻译和货币转换 API 对接指南

## 📋 概述

本项目已集成**自动翻译**和**货币汇率转换**功能，支持多语言和多货币显示。

---

## 🌐 一、翻译 API 配置

### 推荐方案 1：LibreTranslate（免费开源）

**优点**：
- ✅ 完全免费
- ✅ 开源可自托管
- ✅ 无需 API Key（公共实例）
- ✅ 支持多种语言

**配置步骤**：

1. **使用公共实例**（无需注册）：
   ```env
   VITE_TRANSLATE_API_URL=https://libretranslate.com/translate
   VITE_TRANSLATE_API_KEY=
   ```

2. **或自托管**（更稳定）：
   ```bash
   # 使用 Docker 部署
   docker run -ti --rm -p 5000:5000 libretranslate/libretranslate
   ```
   
   然后配置：
   ```env
   VITE_TRANSLATE_API_URL=http://localhost:5000/translate
   ```

**官网**：https://libretranslate.com/

---

### 推荐方案 2：Google Translate API（付费，质量最高）

**优点**：
- ✅ 翻译质量最佳
- ✅ 支持语言最多
- ✅ 稳定可靠

**价格**：$20 / 100万字符

**配置步骤**：

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建项目并启用 **Cloud Translation API**
3. 创建 API 密钥
4. 在 `.env.local` 中配置：
   ```env
   VITE_GOOGLE_TRANSLATE_API_KEY=your_google_api_key_here
   ```

5. 修改 `src/utils/translate.ts` 使用 Google API（需要修改代码）

---

### 推荐方案 3：DeepL API（质量高，有免费额度）

**优点**：
- ✅ 翻译质量接近 Google
- ✅ 免费套餐：50万字符/月
- ✅ 支持欧洲语言效果极佳

**配置步骤**：

1. 前往 [DeepL API](https://www.deepl.com/pro-api)
2. 注册免费账户
3. 获取 API Key
4. 配置环境变量（需要修改代码集成）

**官网**：https://www.deepl.com/pro-api

---

## 💱 二、货币汇率 API 配置

### 推荐方案 1：ExchangeRate-API（推荐）

**优点**：
- ✅ 免费套餐：1500 请求/月
- ✅ 支持 161 种货币
- ✅ 每日更新汇率
- ✅ 简单易用

**配置步骤**：

1. **注册账户**：
   前往 https://www.exchangerate-api.com/ 注册

2. **获取 API Key**：
   注册后会立即获得免费 API Key

3. **配置环境变量**：
   在 `.env.local` 中添加：
   ```env
   VITE_EXCHANGE_RATE_API_KEY=your_api_key_here
   VITE_EXCHANGE_RATE_API_URL=https://v6.exchangerate-api.com/v6
   ```

4. **测试连接**：
   ```bash
   curl https://v6.exchangerate-api.com/v6/YOUR_API_KEY/latest/USD
   ```

---

### 推荐方案 2：Fixer.io

**优点**：
- ✅ 免费套餐：1000 请求/月
- ✅ 数据准确
- ✅ 欧洲央行数据源

**价格**：免费套餐 → $9.99/月

**配置**：https://fixer.io/

---

### 推荐方案 3：Open Exchange Rates

**优点**：
- ✅ 免费套餐：1000 请求/月
- ✅ 实时汇率
- ✅ 历史数据

**配置**：https://openexchangerates.org/

---

## 🔧 三、使用方法

### 1. 翻译功能

```typescript
import { translateText, translateBatch } from './utils/translate';

// 单个文本翻译
const translated = await translateText('Hello World', 'zh'); // 翻译成中文
console.log(translated); // "你好世界"

// 批量翻译
const texts = ['Hello', 'Welcome', 'Shop Now'];
const translated = await translateBatch(texts, 'ja'); // 翻译成日语
```

### 2. 货币转换功能

```typescript
import { convertCurrency, formatCurrency } from './utils/currency';

// 货币转换
const usdAmount = 100;
const jpyAmount = await convertCurrency(100, 'USD', 'JPY');
console.log(jpyAmount); // 约 14950

// 格式化显示
const formatted = formatCurrency(100, 'EUR', 'de-DE');
console.log(formatted); // "100,00 €"
```

### 3. 在组件中使用

```typescript
// 示例：商品价格显示
function ProductCard({ product }) {
  const [price, setPrice] = useState(product.price);
  const currency = 'USD'; // 从用户设置获取

  useEffect(() => {
    convertCurrency(product.price, 'USD', currency)
      .then(converted => setPrice(converted));
  }, [currency]);

  return (
    <div>
      <h3>{product.name}</h3>
      <p>{formatCurrency(price, currency)}</p>
    </div>
  );
}
```

---

## ⚡ 四、性能优化

### 1. 翻译缓存
- 已内置翻译缓存，相同文本不会重复请求

### 2. 汇率缓存
- 汇率数据缓存 1 小时
- 减少 API 调用次数

### 3. 备用方案
- 翻译失败时返回原文
- 汇率 API 不可用时使用静态汇率

---

## 📊 五、API 用量监控

### ExchangeRate-API 查看用量：
1. 登录 https://www.exchangerate-api.com/
2. Dashboard → Usage

### 建议：
- 生产环境建议升级到付费套餐
- 监控 API 调用次数
- 实现更长的缓存时间（如 6-12 小时）

---

## 🚀 六、快速开始

1. **安装依赖**（已完成）

2. **配置 API Key**：
   ```bash
   # 编辑 .env.local
   VITE_EXCHANGE_RATE_API_KEY=你的密钥
   ```

3. **重启开发服务器**：
   ```bash
   npm run dev
   ```

4. **测试功能**：
   - 切换语言测试翻译
   - 切换货币测试价格转换

---

## 🔒 七、安全注意事项

⚠️ **重要**：
- ✅ API Key 仅存储在 `.env.local` 中
- ✅ 不要将 `.env.local` 提交到 Git
- ✅ 生产环境使用服务器端 API（避免暴露 Key）

---

## 📞 八、支持的语言和货币

### 支持的语言
- 英语 (en)
- 中文 (zh)
- 日语 (ja)
- 西班牙语 (es)
- 法语 (fr)
- 德语 (de)
- 韩语 (ko)

### 支持的货币
- USD ($) - 美元
- EUR (€) - 欧元
- GBP (£) - 英镑
- JPY (¥) - 日元
- CNY (¥) - 人民币
- KRW (₩) - 韩元
- 及更多...

---

## ✅ 推荐配置（免费方案）

```env
# .env.local 文件

# 翻译 API（使用免费的 LibreTranslate）
VITE_TRANSLATE_API_URL=https://libretranslate.com/translate
VITE_TRANSLATE_API_KEY=

# 汇率 API（注册免费账户）
VITE_EXCHANGE_RATE_API_KEY=你的ExchangeRate-API密钥
VITE_EXCHANGE_RATE_API_URL=https://v6.exchangerate-api.com/v6
```

**获取免费 API Key**：
👉 https://www.exchangerate-api.com/ （注册后立即获得）

---

## 🎯 下一步

1. ✅ 配置 API Key
2. ✅ 测试翻译和货币转换
3. ✅ 在设置面板中集成语言和货币切换
4. ✅ 监控 API 用量
