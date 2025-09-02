import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface HomePageStore {
  // Model selection
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  
  // Demo text content
  textContent: string;
  setTextContent: (text: string) => void;
  
  // Setup wizard step
  currentSetupStep: number;
  setSetupStep: (step: number) => void;
  nextSetupStep: () => void;
  previousSetupStep: () => void;
  
  // Reset all state
  reset: () => void;
}

const initialState = {
  selectedModel: '@cf/meta/llama-3.1-70b-instruct',
  textContent: '',
  currentSetupStep: 1,
};

export const useHomePageStore = create<HomePageStore>()(
  devtools(
    (set) => ({
      // Initial state
      ...initialState,
      
      // Model actions
      setSelectedModel: (model) => 
        set({ selectedModel: model }, false, 'setSelectedModel'),
      
      // Demo text actions
      setTextContent: (text) => 
        set({ textContent: text }, false, 'setTextContent'),
      
      // Setup step actions
      setSetupStep: (step) => 
        set({ currentSetupStep: step }, false, 'setSetupStep'),
      
      nextSetupStep: () => 
        set(
          (state) => ({ currentSetupStep: state.currentSetupStep + 1 }), 
          false, 
          'nextSetupStep'
        ),
      
      previousSetupStep: () => 
        set(
          (state) => ({ currentSetupStep: Math.max(1, state.currentSetupStep - 1) }), 
          false, 
          'previousSetupStep'
        ),
      
      // Reset action
      reset: () => set(initialState, false, 'reset'),
    }),
    {
      name: 'homepage-store', // name for devtools
    }
  )
);