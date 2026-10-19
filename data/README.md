# Test data

Used only to measure how well the checks work. Nothing here is sent anywhere.

| Folder | Source | License |
|---|---|---|
| `zenodo-21810885/` | *Roman Urdu Phishing SMS Dataset for Smishing Detection Research*, Zenodo, DOI [10.5281/zenodo.21810885](https://doi.org/10.5281/zenodo.21810885). 1,000 messages (405 phishing). `messages.json` is a conversion of the original `.xlsx`. | CC BY 4.0 |
| `urdustack/` | `tests/eval_dataset.csv` and `tests/adversarial_results_heldout.csv` from [munazat/UrduStack](https://github.com/munazat/UrduStack). | MIT |

A third set, [usamabhatti1998/pakistan_sms_classification](https://github.com/usamabhatti1998/pakistan_sms_classification) (4,895 messages), is used for local testing only. It has no license, so it is not included here; `scripts/eval_rules.mjs` skips it when it is missing.

Run `node scripts/eval_rules.mjs` to score the rule check on whatever is present.
