# Crypto Gateway Legal Notes — Source Record

These notes preserve the external sources consulted while designing the crypto-only gateway. They are not legal advice.

## Official sources

- FINTRAC/CANAFE, Money services businesses: https://fintrac-canafe.canada.ca/msb-esm/msb-eng
  - The guidance describes virtual-currency exchange and transfer services, remitting/transmitting funds, and payment services for goods or services. Avoiding CAD does not by itself determine whether a service is outside Canadian obligations.
- CRA, Crypto-asset income guidance: https://www.canada.ca/en/revenue-agency/programs/about-canada-revenue-agency/compliance/cryptocurrency-guide/income-crypto-transactions.html
  - Crypto received for property or services can have tax/accounting consequences; the gateway must not assume a crypto-only rail is consequence-free.

## Product interpretation

The requested model is recorded as a hypothesis and technical design, not a proven economic fact:

- Unity token: sellable settlement asset.
- eFuse token: non-sellable covenant/backing reference; no sale, transfer, or redemption path.
- Fuel unit: non-transferable decision base unit for metered Depth usage.
- Unity peg basis: global-cost-reduction index.
- eFuse backing status: DESIGN_ONLY until reserve meaning, methodology, data sources, governance, and independent verification exist.

The public site must say `UNSET` or `WAIT_GRANT` where live evidence is missing. It must not claim that eFuse backing prevents free-market collapse or that Unity has a live value peg without evidence.
