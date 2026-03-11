## 📝 Additional Requirements from Owner

Please make sure ALL of the following are applied to the entire game:

### 🇨🇳 Full Chinese Language UI
**Every single piece of visible text in the game must be in Chinese (Simplified).** This includes:

**HUD / Bottom Bar:**
- 💰 金币: ¥XX (not "Money $XX")
- 💾 保存 (not "Save")
- 🔄 重置 (not "Reset")
- ✅ 已保存！(not "Saved!")
- 提示：点击���待中的客人来接单 (not English instruction)
- 第一阶段 · 体验版 (not "Phase 1 · MVP")

**Order Panel (popup):**
- 顾客点单 (not "Order Panel")
- 开始制作 ☕ (not "Prepare")
- 上菜 🍽️ (not "Serve")
- 关闭 ✕ (not "Close")
- 正在制作中... (not "Preparing...")
- 制作完成！(not "Ready!")
- 📱 正在直播 (not "Live Streaming")

**Menu Items — rename to Chinese:**
- 'Americano ☕' → '美式咖啡 ☕'
- 'Latte 🥛' → '拿铁咖啡 🥛'
- 'Croissant 🥐' → '牛角包 🥐'

**Cafe Background labels:**
- '☕ 吧台' (keep as is — already Chinese)
- '入口 →' (keep as is — already Chinese)
- Counter label: '咖啡机' (not "Coffee Machine")
- Window label: '窗户'

**Streamer Easter Egg Banner:**
- '⭐ 抖音主播驾到！[名字] 开始直播啦！' (keep as is)

**Customer chat bubble quotes — all must be Chinese:**
- Seated: '嗯...看看菜单～'
- After ordering: '我要一杯[菜单名]！'
- While waiting: '老板快点～', '好期待哦！', '等得有点久了...'
- Eating happy quotes: '好吃！', '太香了！', '下次还来！', '满分！', '美味～'
- Paying: '谢谢老板！', '下次再来哦！', '味道不错！'
- No table available: '今天太挤了...'

**Normal customer names — already Chinese (keep):**
['小明', '小红', '阿华', '小兰', '大宝', '小雪', '阿龙', '小慧', '大毛', '小鱼']

**Loading screen text:**
- '微微咖啡馆 ☕' as title
- '加载中...' (not "Loading...")
- '点击开始游戏' (not "Click to Start")

**Save system notifications:**
- '✅ 游戏已保存！' (not "Game Saved!")
- '🔄 存档已重置' (not "Save Reset")
- '上次保存：[时间]' (not "Last saved: [time]")

**SaveSystem.js localStorage key:** `'weiweiCafeGameSave'`

**Save/Load schema must include `saveTime` stored as Chinese date format:**
```js
saveTime: new Date().toLocaleString('zh-CN')
```

### 💾 Save System Requirements
- Add `src/core/SaveSystem.js`
- Auto-save every 10 seconds AND whenever money changes
- Auto-load on game start
- Manual 保存 button in HUD
- 重置 button in HUD
- Show '✅ 游戏已保存！' toast for 2 seconds after saving
- Save: money, totalEarned, tables array, phase number, saveTime

### ⚠️ Important
- JavaScript variable names, function names, and code comments can remain in English
- ONLY the visible in-game text shown to the player must be in Chinese
- All button labels, tooltips, notifications, chat messages, menu item names must be Chinese