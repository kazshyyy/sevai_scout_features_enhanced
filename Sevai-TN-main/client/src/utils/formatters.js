// Small formatting helpers used across cards and the feed.
export const formatRupees = (n) => {
  if (n == null) return '—';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n}`;
};

export const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m} min ${s} sec`;
};

export const formatTimeTa = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m} நிமிடம் ${s} விநாடி`;
};

export const deadlineColor = (daysLeft) => {
  if (daysLeft <= 7) return '#E53935'; // red (pressure)
  if (daysLeft <= 21) return '#FB8C00'; // amber
  return '#43A047'; // green
};

export const categoryEmoji = (cat) =>
  ({
    farming: '🌾',
    education: '📚',
    housing: '🏠',
    health: '💊',
    women: '👩',
  }[cat] || '📋');

export const occupationKey = (o) =>
  ({
    Farmer: 'farmer',
    Student: 'student',
    'Daily Wage Worker': 'daily_wage',
    'Small Business': 'small_business',
    Homemaker: 'homemaker',
    Other: 'other',
  }[o] || o);

export const incomeBandToMax = (band) =>
  ({
    'under_1l': 80000,
    '1_2_5l': 180000,
    '2_5_5l': 400000,
    'above_5l': 800000,
  }[band] ?? 100000);

export const ageBandToNumber = (band) =>
  ({
    'under_18': 16,
    '18_25': 22,
    '26_40': 33,
    '41_60': 50,
    '60_plus': 65,
  }[band] ?? 30);
