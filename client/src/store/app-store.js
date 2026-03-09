import { create } from 'zustand';
import { calcBMR, calcTDEE, calcTargetCalories, calcMacros, calcLeanMass } from '../utils/calculations.js';

export const useAppStore = create((set, get) => ({
  profile: null,
  latestBodyLog: null,
  derived: null,

  setProfile(profile) {
    set({ profile });
    get()._recalc();
  },

  setLatestBodyLog(log) {
    set({ latestBodyLog: log });
    get()._recalc();
  },

  _recalc() {
    const { profile, latestBodyLog } = get();
    if (!profile?.birthDate || !latestBodyLog?.weight) {
      set({ derived: null });
      return;
    }
    const age = new Date().getFullYear() - new Date(profile.birthDate).getFullYear();
    const bmr = calcBMR(latestBodyLog.weight, profile.height, age, profile.sex);
    const tdee = calcTDEE(bmr, profile.activityLevel);
    const targetCalories = calcTargetCalories(tdee, profile.currentMode);
    const leanMass = latestBodyLog.bodyFat
      ? calcLeanMass(latestBodyLog.weight, latestBodyLog.bodyFat)
      : Math.round(latestBodyLog.weight * 0.82 * 10) / 10;
    const macros = calcMacros(targetCalories, leanMass, latestBodyLog.weight, profile.currentMode);
    set({ derived: { bmr, tdee, targetCalories, macros, leanMass } });
  },
}));
