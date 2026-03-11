/**
 * GoalSystem.js
 * Generates and tracks daily goals. Rewards money on completion.
 */

const GOAL_TYPES = [
  {
    id: 'earn_money',
    make: () => {
      const X = [80, 100, 120, 150, 200][Math.floor(Math.random() * 5)];
      return { id: 'earn_money', desc: `赚到 $${X}`, target: X,
        check: (s) => s.moneyEarned >= X, getProgress: (s) => s.moneyEarned,
        reward: 30 };
    },
  },
  {
    id: 'serve_count',
    make: () => {
      const X = [5, 6, 7, 8, 10][Math.floor(Math.random() * 5)];
      return { id: 'serve_count', desc: `服务 ${X} 位顾客`, target: X,
        check: (s) => s.customersServed >= X, getProgress: (s) => s.customersServed,
        reward: 20 };
    },
  },
  {
    id: 'five_stars',
    make: () => {
      const X = [2, 3, 4, 5][Math.floor(Math.random() * 4)];
      return { id: 'five_stars', desc: `获得 ${X} 个五星`, target: X,
        check: (s) => s.fiveStars >= X, getProgress: (s) => s.fiveStars,
        reward: 40 };
    },
  },
  {
    id: 'serve_streamer',
    make: () => ({ id: 'serve_streamer', desc: '让主播满意', target: 1,
      check: (s) => s.streamersServed >= 1, getProgress: (s) => s.streamersServed,
      reward: 50 }),
  },
  {
    id: 'no_angry',
    make: () => ({ id: 'no_angry', desc: '无顾客生气离开', target: 0,
      check: (s) => s.angryLeaves === 0, getProgress: (s) => s.angryLeaves,
      reward: 35 }),
  },
];

export class GoalSystem {
  constructor() {
    this.goals = [];
    this.stats = this._emptyStats();
    this._onReward = null; // callback(amount) for money reward
    this._onGoalComplete = null; // callback for sound
    this._completedGoals = new Set();
    this._generateGoals();
  }

  _emptyStats() {
    return {
      moneyEarned: 0,
      customersServed: 0,
      fiveStars: 0,
      totalStars: 0,
      streamersServed: 0,
      angryLeaves: 0,
    };
  }

  _generateGoals() {
    // Pick 2-3 unique goals
    const shuffled = [...GOAL_TYPES].sort(() => Math.random() - 0.5);
    const count = 2 + Math.floor(Math.random() * 2); // 2 or 3
    this.goals = shuffled.slice(0, count).map((g) => g.make());
    this._completedGoals = new Set();
  }

  getDailyGoals() { return this.goals; }
  getStats() { return this.stats; }

  onMoneyEarned(amount) {
    this.stats.moneyEarned += amount;
    this._checkGoals();
  }

  onCustomerServed(stars, isStreamer = false) {
    this.stats.customersServed++;
    this.stats.totalStars += stars;
    if (stars === 5) this.stats.fiveStars++;
    if (isStreamer) this.stats.streamersServed++;
    this._checkGoals();
  }

  onAngryLeave() {
    this.stats.angryLeaves++;
    this._checkGoals();
  }

  _checkGoals() {
    for (const goal of this.goals) {
      // 'no_angry' is finalized only at end of day in Game._showDaySummary
      if (goal.id === 'no_angry') continue;
      if (!this._completedGoals.has(goal.id) && goal.check(this.stats)) {
        this._completedGoals.add(goal.id);
        goal.completed = true;
        if (this._onGoalComplete) this._onGoalComplete();
        if (this._onReward) this._onReward(goal.reward);
      }
    }
  }

  resetForNewDay() {
    this.stats = this._emptyStats();
    this._generateGoals();
  }
}
