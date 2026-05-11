declare namespace JSX {
  interface Element {}
  interface IntrinsicElements {
    [elemName: string]: unknown;
  }
}

type Context = Record<string, unknown>;
type Guardrail = (ctx: Context) => boolean;
type Workflow = (ctx: Context) => unknown;
type Template = JSX.Element | null;

type SkillPseudo = {
  source: string;
  workflow?: Workflow;
  guardrails?: Guardrail[];
  template?: Template;
};

function defineSkill(skill: SkillPseudo): SkillPseudo {
  return skill;
}

declare function invokeSkill(name: string, ctx: Context): unknown;
declare function dispatch(agent: string, input: unknown): unknown;
declare function askUser(prompt: string): unknown;
declare function waitForUser(): unknown;
declare function fail(message: string): never;
declare function done(summary?: string): unknown;
declare function review(output: unknown): unknown;
declare function verify(command: string): { ok: boolean; output: string };

function announce(message: string): void {
  void message;
}

function exploreProjectContext(_: Context): void {}
function ideaIsUnderstood(_: Context): boolean { return true; }
function scopeIsTooLarge(_: Context): boolean { return false; }
function decomposeIntoSubprojects(_: Context): void {}
function focusFirstSubproject(_: Context): void {}
function askExactlyOneClarifyingQuestion(_: Context): void {}
function presentApproaches(_: Context, __: Context): void {}
function brainstormApiSurfaceAndAbstractions(_: Context): void {}
function presentNextDesignSection(_: Context): void {}
function designApproved(_: Context): boolean { return true; }
function writeDesignDoc(_: Context, __: string): void {}
function selfReviewSpec(_: Context): void {}
function userRequestedSpecChanges(_: Context): boolean { return false; }
function questionCount(_: Context): number { return 0; }
function proposedComplexity(_: Context): number { return 0; }
function requiredComplexity(_: Context): number { return 0; }
function isDirectoryPath(_: unknown): boolean { return false; }
function confirmPrimaryScope(_: Context, __: unknown): void {}
function dispatchParallelExplorers(_: Context, __: unknown): void {}
function presentSemanticMatches(_: Context): void {}
function runForgottenCodeCheck(_: Context): void {}
function confirmFinalFileSet(_: Context): void {}
function createCodeMapSession(_: Context): string { return ""; }
function mapDirectoriesInParallel(_: Context, __: string): void {}
function consolidateMaps(_: Context, __: string): void {}
function reviewMaps(_: Context, __: string): void {}
function analyzeGroupsInParallel(_: Context, __: string): void {}
function reviewAnalysis(_: Context, __: string): void {}
function presentConsolidatedFindings(_: Context): void {}
function confirmDeletionList(_: Context): void {}
function runDeletionAgent(_: Context): void {}
function reviewDeletion(_: Context): void {}
function synthesizeRefactoringRequest(_: Context): void {}
function hasRunForgottenCodeCheck(_: Context): boolean { return true; }
function onlyOrchestratorTalksToUser(_: Context): boolean { return true; }
function everyDeadCodeClaimHasGrepEvidence(_: Context): boolean { return true; }
function inventoryApisStateAndEffects(_: Context): void {}
function identifyTrueAxesOfVariation(_: Context): void {}
function modelInvariantsWithTypesFirst(_: Context): void {}
function chooseDispatchBoundaryDeliberately(_: Context): void {}
function makeOwnershipCleanupAndFallbackExplicit(_: Context): void {}
function invariantsEncodedInTypes(_: Context): boolean { return true; }
function introducedSilentFallbacks(_: Context): boolean { return false; }
function abstractionCost(_: Context): number { return 0; }
function scopeNeed(_: Context): number { return 1; }
function partitionIntoIndependentProblemDomains(_: Context): unknown[] { return []; }
function domainsAreIndependent(_: unknown[]): boolean { return true; }
function runSingleInvestigation(_: Context): unknown { return null; }
function canWorkInParallel(_: unknown[]): boolean { return true; }
function runSequentialAgents(_: Context, __: unknown[]): unknown { return null; }
function buildFocusedPrompt(domain: unknown): unknown { return domain; }
function verifyIntegratedResult(_: Context): void {}
function noAgentSpansMultipleUnrelatedDomains(_: Context): boolean { return true; }
function everyAgentPromptHasScopeGoalAndConstraints(_: Context): boolean { return true; }
function parallelTasksShareMutableState(_: Context): boolean { return false; }
function currentTimestamp(): string { return "YYYY-MM-DDTHHMMSS"; }
function chooseSlug(_: Context): string { return "<slug>"; }
function writeDocWishlistEntry(_: Context, __: string, ___: string): void {}
function continueMainTask(_: Context): unknown { return null; }
function filesReadCount(_: Context): number { return 2; }
function tracedAcrossModules(_: Context): boolean { return true; }
function taskContinuesAfterWishlistWrite(_: Context): boolean { return true; }
function parseDotFile(_: Context): void {}
function loadAnchorMap(_: Context): void {}
function topologicallySortNodes(_: Context): void {}
function creationOrder(_: Context): Array<{ type: string }> { return []; }
function createJjNode(_: Context, __: unknown, ___: Context): void {}
function captureChangeId(_: Context, __: unknown): void {}
function verifyDagShape(_: Context): void {}
function emitAnnotatedDot(_: Context): void {}
function unknownNodeTypes(_: Context): unknown[] { return []; }
function everyJjNewUsesNoEdit(_: Context): boolean { return true; }
function verificationRan(_: Context, __: string): boolean { return true; }
function loadPlan(_: Context): { tasks: unknown[]; contextDocs: unknown[] } { return { tasks: [], contextDocs: [] }; }
function reviewPlanCritically(_: unknown): unknown[] { return []; }
function raiseConcernsWithPartner(_: Context, __: unknown[]): void {}
function createTodoListFromPlan(_: unknown): void {}
function markInProgress(_: unknown): void {}
function readTaskAndContext(_: unknown, __: unknown[]): void {}
function followTaskStepsExactly(_: unknown): void {}
function runTaskVerifications(_: unknown): void {}
function markComplete(_: unknown): void {}
function isBlocked(_: Context): boolean { return false; }
function planIsClearEnoughToExecute(_: Context): boolean { return true; }
function everyTaskVerificationRan(_: Context): boolean { return true; }
function runPreflightDagChecks(_: Context): void {}
function preflightPassed(_: Context): boolean { return true; }
function hasToorgCommits(_: Context): boolean { return false; }
function showCurrentHistory(_: Context): void {}
function userChoseReorg(_: Context): boolean { return false; }
function runProjectTests(_: Context): void {}
function testsPassed(_: Context): boolean { return true; }
function identifyIntegrationChanges(_: Context): void {}
function requestUserReviewForEachImplementationCommit(_: Context): void {}
function renameReviewCommitsToSemanticDescriptions(_: Context): void {}
function presentIntegrationOptions(_: Context, __: string[]): void {}
function executeChosenIntegrationPath(_: Context): void {}
function cleanupScopeArtifactsIfNeeded(_: Context): void {}
function userConfirmedReviewedCommits(_: Context): boolean { return true; }
function discardRequested(_: Context): boolean { return false; }
function exactDiscardConfirmationReceived(_: Context): boolean { return true; }
function detectPlatformSpecificJjConfigDir(_: Context): string { return "<jj-config-dir>"; }
function ensureDirectoryExists(_: string): void {}
function writeJjSuperpowersToml(_: string): void {}
function explainRequiredEnvironmentVariable(_: Context): void {}
function wroteConfigToSupportedJjConfigDir(_: Context): boolean { return true; }
function jjEditorIsNonInteractive(_: Context): boolean { return true; }
function recordStartingOperationId(_: Context): string { return "<op-id>"; }
function workingCopyIsEmpty(_: Context): boolean { return true; }
function analyzeRangeForMixedConcerns(_: Context): unknown[] { return []; }
function presentSplitCandidates(_: Context, __: unknown[]): void {}
function confirmedSplitTargets(_: Context): unknown[] { return []; }
function needsParallelTopology(_: unknown): boolean { return false; }
function verifyHistoryOnlyChanged(_: string, __: Context): void {}
function targetRevision(_: Context): string { return "@-"; }
function usesOpRestore(_: Context): boolean { return false; }
function userExplicitlyApprovedOpRestore(_: Context): boolean { return false; }
function workingTreeContentUnchanged(_: Context): boolean { return true; }
function listHunks(_: Context): unknown { return null; }
function buildSelectionSpec(_: Context, __: unknown): unknown { return null; }
function previewSelection(_: Context, __: unknown): void {}
function requestedAction(_: Context): string { return "split"; }
function runJjHunkSplit(_: Context, __: unknown): unknown { return null; }
function runJjHunkCommit(_: Context, __: unknown): unknown { return null; }
function runJjHunkSquash(_: Context, __: unknown): unknown { return null; }
function unknownSelectedHunkIds(_: Context): unknown[] { return []; }
function specHasDefaultPolicy(_: Context): boolean { return true; }
function listedHunksBeforeMutation(_: Context): boolean { return true; }
function listToorgCommits(_: Context): unknown[] { return []; }
function inspectFilesAndGroupDependencies(_: Context, __: unknown[]): Record<string, { files: string[]; sourceIds: string[] }> { return {}; }
function composeDagDot(_: unknown): string { return "digraph {}"; }
function presentDag(_: string, __: unknown): void {}
function anchorMap(_: Context): unknown { return {}; }
function verifySourceToorgIsEmpty(_: Context, __: string[]): void {}
function abandonEmptyToorgCommits(_: Context, __: unknown[]): void {}
function verifyReorganizedDag(_: Context): void {}
function jjCommandsFollowSafetyFlags(_: Context): boolean { return true; }
function userApprovedDag(_: Context): boolean { return true; }
function everyToorgDiffIsEmpty(_: Context): boolean { return true; }
function createSplitSessionDir(_: Context): string { return "<session-dir>"; }
function resolveTargetRevision(_: Context, fallback: string): string { return fallback; }
function gatherDiffInfo(_: Context, __: string, ___: unknown, ____: string): unknown { return null; }
function proposeGroupings(_: Context, __: unknown): void {}
function writeSplitConfig(_: Context, __: Context): unknown { return null; }
function runSplitScript(_: Context, __: unknown): void {}
function siblingsNeedingRefinement(_: Context): string[] { return []; }
function refineSiblingByHunk(_: Context, __: string): void {}
function verifyParallelSplitResult(_: Context): void {}
function desiredTopology(_: Context): string { return "parallel-siblings"; }
function allRegexesRespectReMatchSemantics(_: Context): boolean { return true; }
function splitFailed(_: Context): boolean { return false; }
function jjUndoRan(_: Context): boolean { return true; }
function repoUsesJj(_: Context): boolean { return true; }
function userExplicitlyRequestedJj(_: Context): boolean { return false; }
function replaceGitWorkflowWithJjWorkflow(_: Context): void {}
function forceNonInteractiveJjForms(_: Context): void {}
function needsRepositorySetup(_: Context): boolean { return false; }
function gatherRepoFacts(_: Context): void {}
function updateClaudeMdWithJjGuidance(_: Context): void {}
function rewritingHistory(_: Context): boolean { return false; }
function captureOldWorkingCopyCommit(_: Context): void {}
function performRewrite(_: Context): void {}
function verifyGraphShapeAndContentStability(_: Context): void {}
function usesRawGit(_: Context): boolean { return false; }
function userExplicitlyRequestedGit(_: Context): boolean { return false; }
function movesWorkingCopy(_: Context): boolean { return false; }
function userExplicitlyAllowedMovingAt(_: Context): boolean { return false; }
function allJjMutationsHaveMessageFlags(_: Context): boolean { return true; }
function readFeedbackCompletely(_: Context): void {}
function understandOrAskForClarification(_: Context): void {}
function hasUnclearItems(_: Context): boolean { return false; }
function askForClarificationOnAllUnclearItems(_: Context): void {}
function verifyFeedbackAgainstCodebaseReality(_: Context): void {}
function evaluateEachSuggestionTechnically(_: Context): void {}
function reviewItems(_: Context): unknown[] { return []; }
function feedbackIsCorrect(_: unknown): boolean { return true; }
function implementOneItemAtATime(_: Context, __: unknown): void {}
function testItem(_: Context, __: unknown): void {}
function pushBackWithTechnicalReasoning(_: Context, __: unknown): void {}
function verifyNoRegressions(_: Context): void {}
function containsPerformativeAgreement(_: Context): boolean { return false; }
function everyImplementedItemWasVerified(_: Context): boolean { return true; }
function askedForClarificationFirst(_: Context): boolean { return true; }
function currentToreviewChangeId(_: Context): string { return "<change-id>"; }
function whatWasImplemented(_: Context): string { return "<implemented>"; }
function planOrRequirements(_: Context): string { return "<requirements>"; }
function shortDescription(_: Context): string { return "<description>"; }
function actOnReviewerFeedback(_: Context): void {}
function atMandatoryBoundary(_: Context): boolean { return true; }
function reviewWasRequested(_: Context): boolean { return true; }
function importantIssues(_: Context): unknown[] { return []; }
function importantIssuesFixed(_: Context): boolean { return true; }
function reviewerCheckedFileDecomposition(_: Context): boolean { return true; }
function dispatchImplementer(_: Context, __: unknown): { type: string } { return { type: "DONE" }; }
function provideMissingContext(_: Context, __: unknown): void {}
function resolveBlockedStatus(_: Context, __: unknown, ___: unknown): void {}
function assessImplementerConcerns(_: Context, __: unknown): void {}
function loopUntilSpecApproved(_: Context, __: unknown): void {}
function loopUntilQualityApproved(_: Context, __: unknown): void {}
function summarizeWholeImplementation(_: Context): unknown { return {}; }
function taskAgentsAreNotReusedAcrossTasks(_: Context): boolean { return true; }
function reviewSequence(_: Context): string[] { return ["spec", "quality"]; }
function implementerJjCommands(_: Context): string[] { return ["jj commit"]; }
function blockedRetriedUnchanged(_: Context): boolean { return false; }
function runDebugPhase(_: Context, __: string): void {}
function phaseCompleted(_: Context, __: string): boolean { return true; }
function fixAttemptCount(_: Context): number { return 0; }
function bugResolved(_: Context): boolean { return true; }
function questionArchitecture(_: Context): void {}
function rootCauseInvestigated(_: Context): boolean { return true; }
function concurrentHypothesisCount(_: Context): number { return 1; }
function architectureDiscussionOccurred(_: Context): boolean { return true; }
function hasNextBehaviorToImplement(_: Context): boolean { return false; }
function writeOneMinimalFailingTest(_: Context): void {}
function verifyTestFailsForExpectedReason(_: Context): void {}
function writeMinimalProductionCode(_: Context): void {}
function verifyTargetTestPasses(_: Context): void {}
function verifyRelevantSuiteStillPasses(_: Context): void {}
function refactorWithoutChangingBehavior(_: Context): void {}
function verifySuiteStillGreen(_: Context): void {}
function productionCodeWritten(_: Context): boolean { return false; }
function sawTestFailFirst(_: Context): boolean { return true; }
function testsRealBehavior(_: Context): boolean { return true; }
function testsOnlyRuntimeBehaviorOrProvenBoundaryRisk(_: Context): boolean { return true; }
function showRawToorgHistory(_: Context): void {}
function showOrganizedDagShape(_: Context): void {}
function cleanReviewableHistoryMatters(_: Context): boolean { return false; }
function attemptsDetailedReorgWithoutDelegating(_: Context): boolean { return false; }
function alreadyBrainstormed(_: Context): boolean { return false; }
function aboutToDoCreativeWork(_: Context): boolean { return true; }
function mightAnySkillApply(_: Context): boolean { return true; }
function discoverRelevantSkills(_: Context): string[] { return []; }
function announceSkillUsage(_: string): void {}
function skillHasChecklist(_: string): boolean { return false; }
function createTodosFromChecklist(_: string): void {}
function checkedForSkillsBeforeAction(_: Context): boolean { return true; }
function skillApplicabilityChance(_: Context): boolean { return true; }
function invokedRelevantSkill(_: Context): boolean { return true; }
function containsRationalization(_: Context): boolean { return false; }
function isOneOffScript(_: Context): boolean { return true; }
function preferUvRunWithPep723(_: Context): void {}
function needsProjectEnvironment(_: Context): boolean { return false; }
function createVenvAndInstallWithUv(_: Context): void {}
function permissionDeniedFromCache(_: Context): boolean { return false; }
function redirectUvCacheOrAdjustSandbox(_: Context): void {}
function isStandaloneScript(_: Context): boolean { return true; }
function usesUvRun(_: Context): boolean { return true; }
function cacheHandlingConfigured(_: Context): boolean { return true; }
function pendingClaim(_: Context): string { return "<claim>"; }
function identifyProofCommand(_: Context, __: string): string { return "echo verify"; }
function reportActualStatusWithEvidence(_: Context, __: { ok: boolean; output: string }): void {}
function stateClaimWithEvidence(_: Context, __: string, ___: { ok: boolean; output: string }): void {}
function isMakingCompletionClaim(_: Context): boolean { return true; }
function freshVerificationExists(_: Context): boolean { return true; }
function isClaimingFullSuccess(_: Context): boolean { return true; }
function fullVerificationRan(_: Context): boolean { return true; }
function usesDelegatedWork(_: Context): boolean { return false; }
function independentVerificationRan(_: Context): boolean { return true; }
function writeWishIHadEntry(_: Context, __: string, ___: string): void {}
function repetitiveManualWorkExists(_: Context): boolean { return true; }
function toolAlreadyExists(_: Context): boolean { return false; }
function taskContinuesAfterWishIHadWrite(_: Context): boolean { return true; }
function issueWasOnlyRecallFailure(_: Context): boolean { return false; }
function writeWishIKnewEntry(_: Context, __: string, ___: string): void {}
function issueWasClearlyDocumentedAndForgotten(_: Context): boolean { return false; }
function hasContentGap(_: Context): boolean { return true; }
function hasClarityGap(_: Context): boolean { return false; }
function classifyWorkflowType(_: Context): void {}
function mapFileStructureBeforeTasks(_: Context): void {}
function writeSharedContextDocs(_: Context): void {}
function writePlanIndex(_: Context): void {}
function writeTaskFilesWithConcreteStepsAndCommands(_: Context): void {}
function selfReviewPlanAgainstSpec(_: Context): void {}
function offerExecutionChoice(_: Context, __: string[]): void {}
function planFrontmatterHasWorkflowType(_: Context): boolean { return true; }
function placeholderCount(_: Context): number { return 0; }
function allCodeStepsContainCodeBlocks(_: Context): boolean { return true; }
function testPlacementMatchesImplementationRoute(_: Context): boolean { return true; }
function runPressureScenarioWithoutSkill(_: Context): void {}
function documentHowTheAgentFailed(_: Context): void {}
function writeMinimalSkillToCloseObservedGap(_: Context): void {}
function runPressureScenarioWithSkill(_: Context): void {}
function refineSkillToCloseNewLoopholes(_: Context): void {}
function skillReliablyChangesBehavior(_: Context): boolean { return true; }
function packageSupportingFilesOnlyWhenNeeded(_: Context): void {}
function observedFailureWithoutSkill(_: Context): boolean { return true; }
function descriptionFocus(_: Context): string { return "triggering conditions"; }
function skillContentIsReferenceLike(_: Context): boolean { return true; }
function reusableAcrossProjects(_: Context): boolean { return true; }
function notMechanicallyEnforceable(_: Context): boolean { return true; }
