"""Does TabPFN combine the warning signs better than the hand-picked weights?

Train on the Zenodo set (CC BY), test on the Pakistan SMS and UrduStack sets, and compare with
the plain rule score. Uses the same TabPFN install as pricecheck (CPU, TABPFN_TOKEN in env).

python scripts/tabpfn_weights.py   (run from the repo root, after node scripts/features.mjs)
"""
import csv
import os
import sys

import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score


def load(name):
    with open(f"data/results/features-{name}.csv", encoding="utf-8") as f:
        rows = list(csv.reader(f))
    head, body = rows[0], np.array(rows[1:], dtype=float)
    return head, body[:, :-1], body[:, -1]


def report(name, y, p, cut):
    flagged = p >= cut
    scams, nots = y == 1, y == 0
    print(f"  {name:<22} AUC {roc_auc_score(y, p):.3f} | caught {flagged[scams].mean():.1%} | false alarms {flagged[nots].mean():.1%}")


def main():
    head, Xtr, ytr = load("zenodo")
    tests = {n: load(n)[1:] for n in ["pk-sms", "urdustack"] if os.path.exists(f"data/results/features-{n}.csv")}
    score_col = head.index("rule_score")

    from tabpfn import TabPFNClassifier  # heavy import (torch), so only here

    tab = TabPFNClassifier(device="cpu", random_state=0).fit(Xtr, ytr)
    logit = LogisticRegression(max_iter=2000).fit(Xtr, ytr)

    for n, (X, y) in tests.items():
        print(f"\n== {n}: {len(y)} messages, {int(y.sum())} scams (trained on zenodo only)")
        # Rule score: "be careful" starts at 2, the page's own threshold.
        report("rule score (>=2)", y, X[:, score_col] / 20, 2 / 20)
        report("logistic regression", y, logit.predict_proba(X)[:, 1], 0.5)
        report("TabPFN", y, tab.predict_proba(X)[:, 1], 0.5)


if __name__ == "__main__":
    sys.exit(main())
