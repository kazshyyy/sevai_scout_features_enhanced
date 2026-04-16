// 3 hardcoded beneficiary profiles the Sahayak can "scan" via code.
// Audit log lives in localStorage under 'sevai_audit_log'.

export const SAHAYAK_PIN = '9999';

export const BENEFICIARIES = {
  '100100': {
    id: '100100',
    name: 'Muthulakshmi Pandian',
    age: 34,
    gender: 'female',
    caste: 'OBC',
    occupation: 'homemaker',
    annual_income: 65000,
    district: 'madurai',
    taluk: 'Madurai South',
    land_acres: 0,
    ration_card_number: 'TNMDU000100100',
    aadhaar_last4: '1234',
  },
  '200200': {
    id: '200200',
    name: 'Rajan Velusamy',
    age: 52,
    gender: 'male',
    caste: 'SC',
    occupation: 'farmer',
    annual_income: 120000,
    district: 'thanjavur',
    taluk: 'Kumbakonam',
    land_acres: 1.5,
    ration_card_number: 'TNTNJ000200200',
    aadhaar_last4: '5678',
  },
  '300300': {
    id: '300300',
    name: 'Kavitha Selvan',
    age: 19,
    gender: 'female',
    caste: 'SC',
    occupation: 'student',
    annual_income: 90000,
    district: 'coimbatore',
    taluk: 'Pollachi',
    land_acres: 0,
    ration_card_number: 'TNCBE000300300',
    aadhaar_last4: '9012',
  },
};

const AUDIT_KEY = 'sevai_audit_log';

export const getAuditLog = () => {
  try {
    return JSON.parse(localStorage.getItem(AUDIT_KEY) || '[]');
  } catch {
    return [];
  }
};

export const appendAudit = (entry) => {
  const log = getAuditLog();
  log.unshift({ timestamp: Date.now(), ...entry });
  localStorage.setItem(AUDIT_KEY, JSON.stringify(log.slice(0, 100)));
};

export const clearAudit = () => localStorage.removeItem(AUDIT_KEY);
