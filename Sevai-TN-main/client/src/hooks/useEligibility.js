import { useMemo } from 'react';
import { evaluateAll, totalBenefitValue } from '../utils/eligibilityEngine.js';

// Re-runs on every vault change. No API call — pure function over mock data.
export const useEligibility = (vault) => {
  return useMemo(() => {
    const { eligible, close_matches } = evaluateAll(vault);
    return {
      eligible,
      close_matches,
      totalCount: eligible.length,
      totalValue: totalBenefitValue(eligible),
    };
  }, [vault]);
};
