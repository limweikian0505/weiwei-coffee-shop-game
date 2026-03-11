/**
 * MenuData.js
 * Static data for menu items, TikTok streamer Easter eggs, and special customers.
 * All data is exported as constants for use throughout the game.
 */

// ─── Menu Items ──────────────────────────────────────────────────────────────
export const MENU_ITEMS = [
  { id: 'americano', name: 'Americano ☕', price: 8,  prepTime: 5, emoji: '☕', color: '#8B4513', unlocked: true },
  { id: 'latte',     name: 'Latte 🥛',    price: 12, prepTime: 8, emoji: '🥛', color: '#D2B48C', unlocked: true },
  { id: 'croissant', name: 'Croissant 🥐', price: 6, prepTime: 3, emoji: '🥐', color: '#DAA520', unlocked: true },
  { id: 'cake',      name: '蛋糕 🎂',      price: 15, prepTime: 6, emoji: '🎂', color: '#FF69B4', unlocked: false },
  { id: 'juice',     name: '果汁 🧃',      price: 10, prepTime: 4, emoji: '🧃', color: '#7CFC00', unlocked: false },
];

/** Returns only unlocked menu items. */
export function getActiveMenuItems() {
  return MENU_ITEMS.filter((item) => item.unlocked);
}

// ─── TikTok Streamer Easter Eggs ─────────────────────────────────────────────
export const STREAMERS = [
  {
    id: 'sangye',
    name: '桑杰',
    platform: '抖音',
    color: '#FF6B9D',
    quotes: ['哥哥们，点个关注！', '今天吃什么？', '主播饿了！打钱！', '这咖啡绝了！', '老板！再来一杯！'],
    isStreamer: true,
    tip: 50,
  },
  {
    id: 'liziqi',
    name: '李子柒',
    platform: '抖音',
    color: '#90EE90',
    quotes: ['田园生活真美好～', '这咖啡香气扑鼻', '用心做每一件事'],
    isStreamer: true,
    tip: 40,
  },
];

// ─── Special Customers ────────────────────────────────────────────────────────
export const SPECIAL_CUSTOMERS = [
  { id: 'vip',      name: 'VIP客人',    color: '#FFD700', tip: 20, quotes: ['服务不错！', '给你好评！'] },
  { id: 'critic',   name: '美食评论家', color: '#9370DB', tip: 30, quotes: ['嗯...还行', '有点意思'] },
  { id: 'birthday', name: '生日客人🎂', color: '#FF69B4', tip: 40, isBirthday: true,
    quotes: ['今天是我的生日！', '要有蛋糕才行！', '生日快乐～'], requiresItem: 'cake' },
  { id: 'blogger',  name: '美食博主',   color: '#9370DB', tip: -10, isBlogger: true,
    quotes: ['这服务也太慢了', '给你差评！', '网上见！'], angryPenalty: 5 },
  { id: 'family',   name: '亲子家庭',   color: '#87CEEB', tip: 35, isFamily: true,
    quotes: ['小朋友要吃蛋糕！', '全家都来啦！'], groupSize: 2 },
];

// ─── Normal Customer Name Pool ────────────────────────────────────────────────
export const NORMAL_NAMES = ['小明', '小红', '阿华', '小兰', '大宝', '小雪', '阿龙', '小慧', '大毛', '小鱼'];

// ─── Normal Customer Pastel Colors ───────────────────────────────────────────
export const PASTEL_COLORS = [
  '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF',
  '#E8BAFF', '#FFB3F7', '#B3FFEC', '#FFD9B3', '#C9B3FF',
];

// ─── Happy eating quotes (shown during EATING state) ─────────────────────────
export const HAPPY_QUOTES = [
  '好吃！😋', '太香了！', '再来一份！', '五星好评！⭐',
  '美味！', '不错不错～', '老板手艺好！', '幸福～',
];
