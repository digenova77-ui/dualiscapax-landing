/** DualisCapax early public board — seats 11 to 100
 *  Seats 1-10 are the house and are never displaced.
 *  Fuel is prepaid time, not equity.
 *  F(n) = round(1000 - (n-11) * 900 / 89)
 *  F(11)=1000  F(100)=100
 *  Page prints only the two ends.
 */
window.DC_FOUNDING = {
  house: [1,10],
  early: [11,100],
  fuel11: 1000,
  fuel100: 100,
  fuelAt: function(n){
    n=Number(n);
    if(n<11||n>100) return 0;
    return Math.round(1000 - (n-11)*900/89);
  }
};
