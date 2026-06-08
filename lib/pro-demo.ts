export type ProDemoState = {
  isPro: boolean;
  dailyRecommendationRuns: number;
  lastRunDate: string;
};

export const freeRecommendationRunLimit = 2;
export const freeRecommendationResultLimit = 3;
export const proRecommendationResultLimit = 5;
export const freeSavedMealLimit = 3;

export const defaultProDemoState: ProDemoState = {
  isPro: false,
  dailyRecommendationRuns: 0,
  lastRunDate: new Date().toISOString().slice(0, 10),
};

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function normalizeProDemoState(state: ProDemoState): ProDemoState {
  const today = todayKey();
  if (state.lastRunDate !== today) {
    return { ...state, dailyRecommendationRuns: 0, lastRunDate: today };
  }
  return state;
}

export function canGenerateRecommendations(state: ProDemoState) {
  const normalized = normalizeProDemoState(state);
  return normalized.isPro || normalized.dailyRecommendationRuns < freeRecommendationRunLimit;
}

export function recordRecommendationRun(state: ProDemoState): ProDemoState {
  const normalized = normalizeProDemoState(state);
  if (normalized.isPro) return normalized;
  return {
    ...normalized,
    dailyRecommendationRuns: normalized.dailyRecommendationRuns + 1,
  };
}

export function recommendationResultLimit(state: ProDemoState) {
  return state.isPro ? proRecommendationResultLimit : freeRecommendationResultLimit;
}
