import { MistakeRecord } from '../types';
import { INITIAL_SAMPLE_MISTAKES } from '../data/sampleMistakes';

const STORAGE_KEY = 'jiujiu_planet_mistakes_v1';

export function getStoredMistakes(): MistakeRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Seed with initial high-quality samples so the user immediately has data
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SAMPLE_MISTAKES));
      return INITIAL_SAMPLE_MISTAKES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_SAMPLE_MISTAKES;
  } catch (err) {
    console.error('Failed to read from localStorage:', err);
    return INITIAL_SAMPLE_MISTAKES;
  }
}

export function saveMistakes(records: MistakeRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

export function addMistakeRecord(record: MistakeRecord): MistakeRecord[] {
  const current = getStoredMistakes();
  // Put newest at the front
  const updated = [record, ...current.filter((r) => r.id !== record.id)];
  saveMistakes(updated);
  return updated;
}

export function updateMistakeRecord(record: MistakeRecord): MistakeRecord[] {
  const current = getStoredMistakes();
  const updated = current.map((item) => (item.id === record.id ? record : item));
  saveMistakes(updated);
  return updated;
}

export function deleteMistakeRecord(id: string): MistakeRecord[] {
  const current = getStoredMistakes();
  const updated = current.filter((item) => item.id !== id);
  saveMistakes(updated);
  return updated;
}

export function deleteMultipleMistakes(ids: string[]): MistakeRecord[] {
  const current = getStoredMistakes();
  const idSet = new Set(ids);
  const updated = current.filter((item) => !idSet.has(item.id));
  saveMistakes(updated);
  return updated;
}

export function resetToSampleMistakes(): MistakeRecord[] {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SAMPLE_MISTAKES));
  return INITIAL_SAMPLE_MISTAKES;
}
