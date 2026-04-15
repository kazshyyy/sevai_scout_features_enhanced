// Application persistence (localStorage). One "rejected" status is seeded for demo.
const APPS_KEY = 'sevai_applications';

export const loadApplications = () => {
  try {
    return JSON.parse(localStorage.getItem(APPS_KEY) || '[]');
  } catch {
    return [];
  }
};

export const saveApplications = (apps) => {
  localStorage.setItem(APPS_KEY, JSON.stringify(apps));
};

export const addApplication = (app) => {
  const apps = loadApplications();
  // Replace if same scheme already applied (re-submit path)
  const idx = apps.findIndex((a) => a.scheme_id === app.scheme_id);
  if (idx >= 0) apps[idx] = { ...apps[idx], ...app };
  else apps.push(app);
  saveApplications(apps);
  return app;
};

export const updateApplicationStatus = (scheme_id, status, extra = {}) => {
  const apps = loadApplications();
  const idx = apps.findIndex((a) => a.scheme_id === scheme_id);
  if (idx < 0) return null;
  apps[idx] = { ...apps[idx], status, ...extra };
  saveApplications(apps);
  return apps[idx];
};

export const REMINDER_KEY = 'sevai_reminders';
export const saveReminder = (scheme_id) => {
  let rem = [];
  try {
    rem = JSON.parse(localStorage.getItem(REMINDER_KEY) || '[]');
  } catch {}
  if (!rem.includes(scheme_id)) rem.push(scheme_id);
  localStorage.setItem(REMINDER_KEY, JSON.stringify(rem));
};
export const hasReminder = (scheme_id) => {
  try {
    return JSON.parse(localStorage.getItem(REMINDER_KEY) || '[]').includes(scheme_id);
  } catch {
    return false;
  }
};
