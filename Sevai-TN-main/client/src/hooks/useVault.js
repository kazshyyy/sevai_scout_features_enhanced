import { useEffect, useState, useCallback } from 'react';
import { loadVault, saveVault, vaultExists, EMPTY_VAULT, clearVault } from '../utils/vaultEncryption.js';

// Single source of truth for the vault, backed by encrypted localStorage.
export const useVault = () => {
  const [vault, setVaultState] = useState(() => loadVault() || EMPTY_VAULT);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const existing = loadVault();
    if (existing) setVaultState(existing);
    setReady(true);
  }, []);

  const setVault = useCallback((patch) => {
    setVaultState((prev) => {
      const next = typeof patch === 'function' ? patch(prev) : { ...prev, ...patch };
      saveVault(next);
      return next;
    });
  }, []);

  const resetVault = useCallback(() => {
    clearVault();
    setVaultState(EMPTY_VAULT);
  }, []);

  return { vault, setVault, resetVault, ready, hasVault: vaultExists() };
};
