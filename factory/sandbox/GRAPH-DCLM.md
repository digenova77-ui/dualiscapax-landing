# DCLM — document vs graph (100 friction)

The store is not the truth. The edge is the truth.

## Floor

A node without an openable URL is a hole.
An edge that cannot be fetched is a costume.
A hop that invents a child, a team, or a saving is vetoed.

## Two cabinets, one law

DOCUMENT = the pack a human can open (INDEX.json, ice.html).
GRAPH = the arrows inside and between packs (cite, beside, hole, promote).

DCLM does not pick a vendor. It picks the *question*.

- "Show me OWHA" → document.
- "What does OWHA hang from, and what hangs from it?" → graph walk on those documents.

If you stand up Neo4j to answer the first question, you paid rent for a filing cabinet you already have.

## Hop law (acuity)

Hop 0  Plate URL. 200 or hole. No graph needed.
Hop 1  File SHA on main. Document.
Hop 2  cite.url + fetched_at + title_echo. First real edge.
Hop 3  Member → OHF. Only if both cites live.
Hop 4  OHF → Hockey Canada. Hole until that page is fetched.
Hop 5  Hockey Canada → IIHF. Hole.
Hop n  Stop. Do not walk past a hole by guessing the next building.

Amplitude does not mean more hops. It means the hop you take is load-bearing.

## Friction tests (fail closed)

1. Can a stranger open the cite without Dualis? If no, not an edge.
2. Does the title_echo contain the member name we claimed? If no, anomaly — keep, don't tidy away.
3. Is the destination the same as the source? That is the Ice 308. Not a graph. A loop.
4. Would this edge name a minor? Veto. Seat first, public cite second, never scrape a child.
5. Does promoting this node require a third ice path? Veto.

## Affinity +1

Document and graph agree when:
- the JSON pack SHA matches what landscape.json drew
- every drawer is `book` or `hole`, never `probably`
- Merge can ship one file without walking the whole Earth

+1 is one extra check: after the walk, curl the plate. If Home is not 200, the graph is trivia.

## What bots may write

Edges into landscape.json and ANOMALIES.json.
Not a new database.
Not Cypher on the lander.
Not a pretty force-layout that hides holes as islands.

## Verdict

Stay documents-with-edges until hop 4 has more cites than holes.
Then a two-table D1 (nodes, edges) is allowed.
A hosted graph product is allowed only when that table is too slow *and* Ice is 200.
Until then the network is git. The truth is the URL. The rest is amplitude without a load.
