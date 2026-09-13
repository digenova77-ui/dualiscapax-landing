/** DualisCapax early public board — seats 11 to 100
 *  Data only. Does NOT touch the HUD clock, Onboard, or live copy.
 *  Locked matrix: access CLOSED, earned CAD $0, clocks from index.html.
 */
window.DC_FOUNDING = {
  house: [1, 10],
  early: [11, 100],
  fuel11: 1000,
  fuel100: 100,
  fuelAt: function (n) {
    n = Number(n);
    if (n < 11 || n > 100) return 0;
    return Math.round(1000 - (n - 11) * 900 / 89);
  }
};
