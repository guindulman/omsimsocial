import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type OnboardingState = {
  demoSeen: boolean;
  createdCircle: boolean;
  inviteCount: number;
  postedMemory: boolean;
  markDemoSeen: () => void;
  markCircleCreated: () => void;
  addInvite: () => void;
  markPostedMemory: () => void;
  reset: () => void;
};

const initialState = {
  demoSeen: false,
  createdCircle: false,
  inviteCount: 0,
  postedMemory: false,
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      ...initialState,
      markDemoSeen: () => set({ demoSeen: true }),
      markCircleCreated: () => set({ createdCircle: true }),
      addInvite: () => set((state) => ({ inviteCount: state.inviteCount + 1 })),
      markPostedMemory: () => set({ postedMemory: true }),
      reset: () => set(initialState),
    }),
    {
      name: 'omsim-onboarding',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export const useOnboardingProgress = () => {
  const createdCircle = useOnboardingStore((state) => state.createdCircle);
  const inviteCount = useOnboardingStore((state) => state.inviteCount);
  const postedMemory = useOnboardingStore((state) => state.postedMemory);

  const completed = [createdCircle, inviteCount >= 3, postedMemory].filter(Boolean).length;

  return {
    createdCircle,
    inviteCount,
    postedMemory,
    completed,
    total: 3,
  };
};
