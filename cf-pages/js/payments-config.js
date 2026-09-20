/** DualisCapax payment rails. Card = Stripe Payment Links. Never invent URLs. */
window.DC_PAYMENTS = {
  /* Option C sibling: DONATE_OPEN gates Interac/EFT/crypto advertise+pay.
     CHECKOUT_OPEN / stripe_enabled gate Stripe grant. Both false under freeze. */
  donate_open: false,
  interac_enabled: false,
  eft_enabled: false,
  sri_enabled: true,
  fuel_enabled: true,
  onboard_enabled: true,
  stripe_enabled: false,
  jacket_open: false,
  research: "",
  cost_reduction: "",
  capacity: "",
  fuel: "",
  fuel_links: {
    fuel_10: null,
    fuel_40: "",
    fuel_120: "",
    fuel_320: "",
    fuel_1000: null
  },
  leaf: "",
  field: "",
  trunk: "",
  branch: null,
  atlas: null,
  edu_leaf: null,
  crypto_enabled: false,
  fulfill_worker: "https://dualiscapax-stripe-fulfill-v2.digenova77.workers.dev/",
  thanks: "/pay/thanks.html",
  /* Addresses blanked while donate_open=false (Option C park). Restore only under DONATE_OPEN YES. */
  research_btc: "",
  research_eth: "",
  research_sol: ""
};
