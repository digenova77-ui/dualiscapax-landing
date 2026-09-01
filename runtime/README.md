# Dualis runtime

Invited software layer. If a machine can run code, it can run Dualis.
It does not sit down until someone asks.

## Law

Their data stays with them.
The agreement binds a hash of the books, not the books.
Dualis operators do not see the file.
Models may compute after bind.
A missing number is a hole, not zero.

Local bind is live on the device.
A public-chain write is still WAIT_GRANT.

## Run

Browser (Android, Apple Safari, Windows, Linux):

```html
<script src="/runtime/agreement.js"></script>
<script src="/runtime/dualis.js"></script>
```

Then call `DCRuntime.invite({ invite: true })` after `DCL2` has seated a sheet.

Python desk or invited controller:

```bash
python3 runtime/dualis.py --invite --file ./books.csv
```

The file never leaves the machine. The printout is a receipt.

## Not this

Not an implant.
Not a safety-rated PLC.
Not a claim that Dualis is already on every controller on Earth.
Not a mined smart-contract settlement until chain write is granted.
