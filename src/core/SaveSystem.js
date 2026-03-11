/**
 * SaveSystem.js
 * Persistent game state via localStorage.
 *
 * Save schema:
 * {
 *   money:             number,
 *   totalEarned:       number,
 *   dayNumber:         number,
 *   reputation:        number,
 *   purchasedUpgrades: string[],   // array of upgrade IDs (non-stackable)
 *   purchaseCounts:    object,     // { upgradeId: count } for stackable upgrades
 *   tableCount:        number,     // how many tables exist (2 base + extras)
 *   saveTime:          string,     // new Date().toLocaleString('zh-CN')
 * }
 */

export class SaveSystem {
  static KEY = 'weiweiCafeGameSave';

  /**
   * Serialise game state to localStorage.
   * @param {Game} game
   */
  static save(game) {
    try {
      const data = {
        money             : game.economySystem.money,
        totalEarned       : game.economySystem.totalEarned ?? 0,
        dayNumber         : game.daySystem.dayNumber,
        reputation        : game.reputationSystem.reputation,
        purchasedUpgrades : [...(game.upgradeShop.purchasedIds ?? new Set())],
        purchaseCounts    : { ...(game.upgradeShop.purchaseCounts ?? {}) },
        tableCount        : game.tables.length,
        saveTime          : new Date().toLocaleString('zh-CN'),
      };
      localStorage.setItem(SaveSystem.KEY, JSON.stringify(data));
    } catch (e) {
      // Silently fail if localStorage is unavailable
    }
  }

  /**
   * Restore game state from localStorage.
   * @param {Game} game
   * @returns {boolean} true if a save was found and applied
   */
  static load(game) {
    try {
      const raw = localStorage.getItem(SaveSystem.KEY);
      if (!raw) return false;

      const data = JSON.parse(raw);

      if (typeof data.money === 'number') {
        game.economySystem.money = data.money;
      }
      if (typeof data.totalEarned === 'number') {
        game.economySystem.totalEarned = data.totalEarned;
      }
      if (typeof data.dayNumber === 'number') {
        game.daySystem.dayNumber = data.dayNumber;
      }
      if (typeof data.reputation === 'number') {
        game.reputationSystem.reputation = data.reputation;
      }

      // Restore purchased upgrades
      if (Array.isArray(data.purchasedUpgrades)) {
        data.purchasedUpgrades.forEach((id) => {
          game.upgradeShop.purchasedIds.add(id);
        });
      }
      if (data.purchaseCounts && typeof data.purchaseCounts === 'object') {
        Object.assign(game.upgradeShop.purchaseCounts, data.purchaseCounts);
      }

      // Restore extra tables beyond the 2 base tables
      if (typeof data.tableCount === 'number' && data.tableCount > game.tables.length) {
        const extra = data.tableCount - game.tables.length;
        for (let i = 0; i < extra; i++) {
          game._addTable();
        }
      }

      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Delete the saved game.
   */
  static reset() {
    try {
      localStorage.removeItem(SaveSystem.KEY);
    } catch (e) {
      // ignore
    }
  }

  /**
   * @returns {boolean} true if a save slot exists
   */
  static hasSave() {
    try {
      return localStorage.getItem(SaveSystem.KEY) !== null;
    } catch (e) {
      return false;
    }
  }
}
