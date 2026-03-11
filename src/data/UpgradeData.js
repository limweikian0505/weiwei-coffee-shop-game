/**
 * UpgradeData.js
 * Configuration data for all upgrades available in the upgrade shop.
 */

export const UPGRADES = [
  {
    id: 'coffee_machine_2',
    name: '咖啡机 Lv.2',
    desc: '准备时间 -30%',
    emoji: '☕',
    cost: 80,
    requires: null,
    effect: { prepTimeMultiplier: 0.7 },
  },
  {
    id: 'coffee_machine_3',
    name: '咖啡机 Lv.3',
    desc: '准备时间 -60%',
    emoji: '☕☕',
    cost: 150,
    requires: 'coffee_machine_2',
    effect: { prepTimeMultiplier: 0.4 },
  },
  {
    id: 'table_3',
    name: '加一张桌子',
    desc: '桌位 +4 席',
    emoji: '🪑',
    cost: 120,
    requires: null,
    effect: { addTable: true },
  },
  {
    id: 'table_4',
    name: '再加一张桌子',
    desc: '桌位 +4 席',
    emoji: '🪑🪑',
    cost: 200,
    requires: 'table_3',
    effect: { addTable: true },
  },
  {
    id: 'menu_cake',
    name: '新菜单：蛋糕',
    desc: '解锁 蛋糕🎂 $15',
    emoji: '🎂',
    cost: 100,
    requires: null,
    effect: { unlockMenuItem: 'cake' },
  },
  {
    id: 'menu_juice',
    name: '新菜单：果汁',
    desc: '解锁 果汁🧃 $10',
    emoji: '🧃',
    cost: 80,
    requires: null,
    effect: { unlockMenuItem: 'juice' },
  },
  {
    id: 'patience_up',
    name: '顾客耐心 +15秒',
    desc: '顾客等待更久',
    emoji: '⏳',
    cost: 60,
    requires: null,
    effect: { patienceBonus: 15 },
    maxPurchase: 3,
  },
];
