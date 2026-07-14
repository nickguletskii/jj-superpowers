# Model Reference

Volatile facts: which models exist, what effort they take, what they cost, how well they do. **When models change, only this file changes.** The decision procedure lives in `SKILL.md`.

## Effort Levels

`low` · `medium` · `high` · `xhigh` · `max` — available on every model below, in both harnesses.

## Classes

A **class** is a tier *within a family*. It is **not a parity claim across families.**

| Class | Claude Code | Codex (via MCP) |
|---|---|---|
| sonnet-class | `claude-sonnet-5` | `gpt-5.6-luna` |
| opus-class | `claude-opus-4.8` | `gpt-5.6-terra` |
| fable-class | `claude-fable-5` — **rationed** | `gpt-5.6-sol` |

**`gpt-5.6-terra` is not an Opus equivalent.** On DeepSWE, `terra[medium]` scores 35% where `opus[medium]` scores 49%. Never substitute across families expecting a wash — read the numbers.

## Availability

- **`claude-fable-5` is rationed** and often unavailable. The provenance rule in `SKILL.md` governs it: dispatch it only if the orchestrator is already running it.
- **Any model may be unavailable at any time.** Degrade to the nearest available option, announce the substitution, never substitute upward without permission.

## Benchmarks

Two benchmarks below. **They disagree with each other.** A finding that holds in *both* is a rule. A finding in only one is context. This distinction is the most important thing on this page — see "How to read this" at the bottom.

Costs are **average cost per task on that benchmark**, not a price list. They fold in how many steps and tokens a model burns to finish, which is why a cheap-per-token model can be expensive per task.

### DeepSWE — hard agentic SWE, pass@1

| Model | Effort | Pass@1 | Avg cost | Out tok | Steps |
|---|---|---|---|---|---|
| `claude-sonnet-5` | low | 31% | $2.19 | 36k | 77 |
| | medium | 40% | $4.08 | 57k | 108 |
| | high | 48% | $7.43 | 87k | 147 |
| | xhigh | 50% | $11.89 | 121k | 186 |
| | max | 54% | $26.40 | 214k | 268 |
| `claude-opus-4.8` | low | 41% | $2.29 | 29k | 54 |
| | medium | 49% | $3.44 | 41k | 66 |
| | high | 52% | $4.28 | 50k | 73 |
| | xhigh | 54% | $8.01 | 86k | 95 |
| | max | 59% | $13.22 | 135k | 120 |
| `claude-fable-5` | low | 60% | $3.76 | 25k | 38 |
| | medium | 65% | $6.09 | 40k | 48 |
| | high | 69% | $9.18 | 57k | 59 |
| | xhigh | 70% | $13.41 | 80k | 68 |
| | max | 70% | $21.63 | 119k | 88 |
| `gpt-5.6-luna` | low | 2% | $0.07 | 3.1k | 12 |
| | medium | 11% | $0.22 | 8.2k | 24 |
| | high | 44% | $0.78 | 26k | 49 |
| | xhigh | 57% | $1.54 | 45k | 71 |
| | max | 67% | $3.03 | 73k | 102 |
| `gpt-5.6-terra` | low | 24% | $0.43 | 8.6k | 21 |
| | medium | 35% | $0.58 | 12k | 25 |
| | high | 54% | $1.13 | 22k | 34 |
| | xhigh | 60% | $2.13 | 40k | 43 |
| | max | 70% | $4.95 | 72k | 76 |
| `gpt-5.6-sol` | low | 45% | $1.07 | 11k | 23 |
| | medium | 61% | $1.86 | 18k | 31 |
| | high | 69% | $3.47 | 28k | 37 |
| | xhigh | 71% | $4.70 | 41k | 44 |
| | max | 73% | $8.39 | 60k | 61 |

### CursorBench

| Model | Effort | Score | Avg cost | Out tok | Steps |
|---|---|---|---|---|---|
| `claude-sonnet-5` | low | 47.7% | $1.30 | 16k | 33 |
| | medium | 52.4% | $2.16 | 26k | 46 |
| | high | 56.9% | $3.19 | 39k | 57 |
| | xhigh | 58.7% | $4.16 | 53k | 67 |
| | max | 61.5% | $6.45 | 93k | 86 |
| `claude-opus-4.8` | low | 53.1% | $2.02 | 20k | 27 |
| | medium | 56.1% | $2.81 | 28k | 32 |
| | high | 58.0% | $3.15 | 34k | 33 |
| | xhigh | 59.4% | $4.50 | 51k | 40 |
| | max | 62.3% | $5.77 | 71k | 44 |
| `claude-fable-5` | low | 62.1% | $4.46 | 18k | 31 |
| | medium | 65.2% | $6.80 | 30k | 41 |
| | high | 66.5% | $8.77 | 44k | 48 |
| | xhigh | 68.4% | $11.73 | 65k | 56 |
| | max | 70.5% | $17.32 | 104k | 72 |
| `gpt-5.6-luna` | low | 37.6% | $0.16 | 3.2k | 17 |
| | medium | 47.7% | $0.39 | 7.1k | 28 |
| | high | 56.8% | $0.82 | 15k | 40 |
| | xhigh | 57.7% | $1.14 | 22k | 48 |
| | max | 61.1% | $1.97 | 88k | 61 |
| `gpt-5.6-terra` | low | 46.9% | $0.53 | 5.3k | 19 |
| | medium | 50.3% | $0.61 | 6.2k | 20 |
| | high | 54.2% | $0.89 | 9.5k | 23 |
| | xhigh | 59.2% | $1.44 | 16k | 29 |
| | max | 64.9% | $2.89 | 33k | 47 |
| `gpt-5.6-sol` | low | 52.6% | $1.01 | 5.1k | 19 |
| | medium | 60.0% | $1.95 | 9.7k | 27 |
| | high | 63.5% | $2.79 | 14k | 32 |
| | xhigh | 64.5% | $3.88 | 20k | 38 |
| | max | 67.2% | $5.69 | 28k | 48 |

## Findings Robust Across Both Benchmarks

These are **rules**. They hold in both tables.

1. **Sonnet is only worth it at `low`.** At `medium` and above, some Opus configuration is cheaper *and* better.
   - DeepSWE: `sonnet[medium]` 40% / $4.08 vs `opus[medium]` 49% / **$3.44**
   - CursorBench: `sonnet[medium]` 52.4% / $2.16 vs `opus[low]` 53.1% / **$2.02**

2. **Maxing out Opus is pointless whenever Fable is reachable.** `opus[max]` is, at best, matched by `fable[low]` — at higher cost.
   - DeepSWE: `opus[max]` 59% / $13.22 vs `fable[low]` 60% / **$3.76**
   - CursorBench: `opus[max]` 62.3% / $5.77 vs `fable[low]` 62.1% / **$4.46**

3. **Diminishing returns above `high`** on every model. The `high → xhigh → max` steps cost the most and buy the least.

4. **Sonnet flails.** It runs 2–5× the steps of Opus for a lower score (DeepSWE `sonnet[max]`: 268 steps, 214k tokens, $26.40 — the most expensive configuration in either table, at 54%). This is *why* it has no cost advantage: cheap per token, expensive per task.

5. **`gpt-5.6-sol` is the most cost-efficient model in either table.** It is the reason Codex is worth calling — see the external-harness gate in `SKILL.md` before you act on this.

## Benchmark-Specific — Do NOT Generalize

These appear in one table and are **contradicted** by the other. Do not turn them into rules.

- **"Sonnet is dominated at every rung."** True on DeepSWE; **false** on CursorBench, where `sonnet[low]` (47.7% / $1.30) is the cheapest Claude option available and sits on the frontier. DeepSWE measures *hard* tasks, so it systematically understates cheap models on easy work.
- **"Fable's effort curve is flat; `xhigh` and `max` are waste."** True on DeepSWE (`fable[xhigh]` = `fable[max]` = 70%); **false** on CursorBench, where Fable climbs all the way to `max` (62.1 → 65.2 → 66.5 → 68.4 → 70.5).

## How to Read This

**Do not memorize one column.** Find the cheapest configuration whose score clears your task's bar, then check that it is not **dominated**.

> A configuration is **dominated** if another scores **≥** at **≤** cost. Never pick a dominated configuration — you are paying more for less by definition.

And note what the two lists above demonstrate: reasoning confidently from a *single* benchmark produces conclusions the *other* benchmark flatly refutes. Both of the "Do NOT generalize" items were derived, and stated with confidence, from one table before the second one arrived. Check both before you turn a number into a rule.
