/**
 * Table.js
 * Represents a table in the cafe with a fixed position, type, and seats.
 * Seat positions are stored as offsets relative to the table centre.
 */

export class Table {
  /**
   * @param {number} id   - Unique table ID
   * @param {number} x    - Centre X on canvas
   * @param {number} y    - Centre Y on canvas
   * @param {string} type - 'round2' | 'square4' | 'long6'
   */
  constructor(id, x, y, type) {
    this.id   = id;
    this.x    = x;
    this.y    = y;
    this.type = type;

    // Build seat list based on table type
    this.seats = Table._buildSeats(type);

    // groupId of the customers currently occupying this table (null when empty)
    this.groupId = null;
  }

  // ─── Static helpers ────────────────────────────────────────────────────────

  static _buildSeats(type) {
    const makeSeats = (offsets) =>
      offsets.map(([ox, oy]) => ({ ox, oy, occupied: false, customer: null }));

    switch (type) {
      case 'round2':
        return makeSeats([[-35, 20], [35, 20]]);

      case 'square4':
        return makeSeats([[-40, -15], [40, -15], [-40, 20], [40, 20]]);

      case 'long6':
        return makeSeats([
          [-50, -20], [0, -20], [50, -20],
          [-50,  20], [0,  20], [50,  20],
        ]);

      default:
        return makeSeats([[-30, 0], [30, 0]]);
    }
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  /** Returns true when at least one seat is free. */
  isAvailable() {
    return this.seats.some((s) => !s.occupied);
  }

  /**
   * Returns true when the table can accept a customer with the given groupId.
   * - Completely empty tables are available to any group.
   * - Partially occupied tables are only available to the same group.
   * @param {string|null} groupId
   * @param {number} [needed=1] - number of free seats required (for group spawning)
   */
  isAvailableForGroup(groupId, needed = 1) {
    const freeSeats = this.seats.filter((s) => !s.occupied).length;
    if (freeSeats < needed) return false;
    // Fully empty — anyone can sit
    if (this.groupId === null) return true;
    // Partially occupied — only the same group
    return this.groupId === groupId;
  }

  /** Returns the index of the first free seat, or -1 if none. */
  getSeat() {
    return this.seats.findIndex((s) => !s.occupied);
  }

  /**
   * Mark a seat as occupied by a customer.
   * @param {number}   idx      - Seat index
   * @param {Customer} customer - Customer instance
   */
  occupy(idx, customer) {
    if (idx < 0 || idx >= this.seats.length) return;
    this.seats[idx].occupied = true;
    this.seats[idx].customer = customer;
    // Lock the table to this customer's group when first person sits down
    if (this.groupId === null) {
      this.groupId = customer.groupId ?? null;
    }
  }

  /**
   * Free a seat.
   * @param {number} idx - Seat index
   */
  vacate(idx) {
    if (idx < 0 || idx >= this.seats.length) return;
    this.seats[idx].occupied = false;
    this.seats[idx].customer = null;
    // Reset groupId when the table is completely empty
    if (this.seats.every((s) => !s.occupied)) {
      this.groupId = null;
    }
  }

  /** World-space X of a given seat index. */
  seatX(idx) {
    return this.x + this.seats[idx].ox;
  }

  /** World-space Y of a given seat index. */
  seatY(idx) {
    return this.y + this.seats[idx].oy;
  }
}
