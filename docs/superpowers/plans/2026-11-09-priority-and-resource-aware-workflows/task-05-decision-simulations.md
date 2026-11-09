# Task 5: Decision simulations

**Purpose:** Semantic acceptance. Check that agents following the new text make the intended decisions, and that agents following the old text show the problems the change targets. This tests decisions, not wording.

**Executor:** the orchestrator runs this node itself, because the simulations dispatch fresh subagents and an implementer subagent cannot dispatch its own. It still files its output like any other task node.

**Reuse:** the spec's "Acceptance and verification" scenarios. `skills/writing-skills/testing-skills-with-subagents.md` (as updated by task 03) for the baseline versus with-skill method. For the baseline text, record the change id the run started from at graph start, then read the old skill files with `jj file show -r <start-id> <path>`. That is reading text, not checking out or building a revision.

**Interfaces and Invariants:**
- Run at most three dispatches per arm (baseline, then with-policy), each covering several scenarios. Do not dispatch one run per file.
- Each scenario prompt gives the situation and asks the agent what it does next and why. The relevant skill text goes into the prompt. Agents are read-only and run no commands.
- Scenarios (one positive and one boundary case per class, from the spec):
  1. Sorting: a mixed backlog with polish, a blocker, substantive work, an explicitly requested wording fix, three symptoms of one cause, an interface its consumers need, and a speculative foundation.
  2. Interruption: cosmetic reports during a blocking fix; a triaged production outage; an explicit user redirect.
  3. Batching and evidence: several compatible fixes that share an expensive check, with current output already identifying the failures; a specific unresolved regression question.
  4. Risk calibration: a README typo; a change to destructive database behavior or a shared concurrent API.
  5. Graph contract: walk the updated `project-network-validation-scenarios.md`, including the API producer before its consumers and non-overlapping tasks sharing a verify node, and check that the derived gates match the expected behavior written there.
- `evaluation.md` records, per scenario: the expected decision, what the baseline did, what the with-policy run did, pass or fail, and notes. End with a limits section saying the simulations show intended decisions and don't prove real-world compliance.

**Subtasks:**
- [ ] Write the scenario prompts (in `evaluation.md` or inline in the dispatches).
- [ ] Run the baseline and with-policy dispatches.
- [ ] Record the results in `evaluation.md`.
- [ ] Report any with-policy failure as `DONE_WITH_CONCERNS`, naming the skill text that caused it. Do not edit skills in this task; the orchestrator routes fixes to the owning task.
