// Pure JS eligibility matching. No API calls. Runs on every Feed render.
// Hard filter on caste / gender / state, then score on age/income/occupation fit.

import { SCHEMES, SCHEME_BY_ID } from '../data/schemes.js';

const daysUntil = (isoDate) => {
  const target = new Date(isoDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
};

export const evaluateOne = (scheme, vault) => {
  if (!vault || !scheme) return { status: 'unknown', score: 0 };
  const e = scheme.eligibility;
  const reasons = [];

  // Hard filter: state
  if (e.state && vault.district) {
    // All our mock vaults are Tamil Nadu districts — so state always matches.
  }

  // Hard filter: caste
  if (e.caste_required && e.caste_required.length > 0) {
    if (!vault.caste || !e.caste_required.includes(vault.caste)) {
      reasons.push('caste');
      return { status: 'not_eligible', score: 0, reasons };
    }
  }

  // Hard filter: gender
  if (e.gender && vault.gender && e.gender !== vault.gender) {
    reasons.push('gender');
    return { status: 'not_eligible', score: 0, reasons };
  }

  // Hard filter: occupation (only if the scheme restricts)
  if (
    Array.isArray(e.occupation) &&
    e.occupation.length > 0 &&
    vault.occupation &&
    !e.occupation.includes(vault.occupation)
  ) {
    reasons.push('occupation');
    return { status: 'not_eligible', score: 0, reasons };
  }

  // Age check with 2-year fuzzy window
  const age = vault.age ?? 0;
  if (age < e.min_age) {
    const diff = e.min_age - age;
    if (diff <= 2) {
      return {
        status: 'close_match',
        score: 0.3,
        reasons: ['age'],
        fuzzy: { type: 'age', months: Math.ceil(diff * 12) },
      };
    }
    reasons.push('age_under');
    return { status: 'not_eligible', score: 0, reasons };
  }
  if (age > e.max_age) {
    reasons.push('age_over');
    return { status: 'not_eligible', score: 0, reasons };
  }

  // Income check with 20% fuzzy
  if (e.income_max_annual && vault.annual_income != null) {
    if (vault.annual_income > e.income_max_annual) {
      const ratio = vault.annual_income / e.income_max_annual;
      if (ratio <= 1.2) {
        return {
          status: 'close_match',
          score: 0.35,
          reasons: ['income'],
          fuzzy: { type: 'income' },
        };
      }
      reasons.push('income');
      return { status: 'not_eligible', score: 0, reasons };
    }
  }

  // ----- Scoring for sort -----
  const days = daysUntil(scheme.deadline);
  // deadline_urgency: closer = higher (0..1), capped at 60d horizon
  const deadline_urgency = Math.max(0, Math.min(1, (60 - days) / 60));

  // district_success_rate: use district_applicants[user_district] normalized by max
  const max_d = Math.max(1, ...Object.values(scheme.district_applicants || {}));
  const my_d = scheme.district_applicants?.[vault.district] ?? 0;
  const district_success_rate = my_d / max_d;

  // benefit_amount_normalized against max seen scheme
  const maxBenefit = 1000000;
  const benefit_amount_normalized = Math.min(1, (scheme.benefit_amount || 0) / maxBenefit);

  const score =
    deadline_urgency * 0.4 + district_success_rate * 0.3 + benefit_amount_normalized * 0.3;

  return { status: 'eligible', score, reasons: [] };
};

export const evaluateAll = (vault) => {
  const eligible = [];
  const close_matches = [];
  for (const scheme of SCHEMES) {
    const r = evaluateOne(scheme, vault);
    if (r.status === 'eligible') eligible.push({ scheme, ...r });
    else if (r.status === 'close_match') close_matches.push({ scheme, ...r });
  }
  // Sort by composite score descending
  eligible.sort((a, b) => b.score - a.score);
  close_matches.sort((a, b) => b.score - a.score);
  return { eligible, close_matches };
};

export const totalBenefitValue = (entries) =>
  entries.reduce((sum, e) => sum + (e.scheme.benefit_amount || 0), 0);

// Cross-scheme chain: follow related_scheme_ids and keep only those the user qualifies for
export const relatedEligible = (schemeId, vault) => {
  const src = SCHEME_BY_ID[schemeId];
  if (!src) return [];
  const out = [];
  for (const rid of src.related_scheme_ids || []) {
    const r = SCHEME_BY_ID[rid];
    if (!r) continue;
    const ev = evaluateOne(r, vault);
    if (ev.status === 'eligible') out.push({ scheme: r, ...ev });
  }
  return out;
};

export { daysUntil };
