/**
 * DualisCapax — payment gateway config (built-in)
 *
 * WHEN YOU HAVE STRIPE ACCESS:
 * 1. Test mode ON → create 4 Payment Links
 * 2. Paste full https URLs below (replace empty strings)
 * 3. Deploy / push this file
 * 4. Buttons on /participate.html enable automatically
 *
 * Lanes (do not rename keys):
 *   cost_reduction — waterfall #1 residual plane cost
 *   capacity       — enterprise prepaid
 *   fuel           — escalate-only depth
 *   ubi            — waterfall #2 after cost
 *
 * Never put sk_test_ / sk_live_ secret keys in this file.
 */
window.DC_PAYMENTS = {
  cost_reduction: "",
  capacity: "",
  fuel: "",
  ubi: "",
  /* optional: set true only after counsel for crypto lane */
  crypto_enabled: false
};
