import { createContext, useContext, useMemo, useReducer } from 'react';

const initialState = {
  selectedAccountId: '',
  selectedTemplateName: '',
  lastMessageResult: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'setSelectedAccountId':
      return { ...state, selectedAccountId: action.payload };
    case 'setSelectedTemplateName':
      return { ...state, selectedTemplateName: action.payload };
    case 'setLastMessageResult':
      return { ...state, lastMessageResult: action.payload };
    default:
      return state;
  }
}

const WhatsAppCloudContext = createContext(null);

export function WhatsAppCloudProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const value = useMemo(
    () => ({
      ...state,
      setSelectedAccountId: (value) => dispatch({ type: 'setSelectedAccountId', payload: value }),
      setSelectedTemplateName: (value) => dispatch({ type: 'setSelectedTemplateName', payload: value }),
      setLastMessageResult: (value) => dispatch({ type: 'setLastMessageResult', payload: value }),
    }),
    [state],
  );

  return <WhatsAppCloudContext.Provider value={value}>{children}</WhatsAppCloudContext.Provider>;
}

export function useWhatsAppCloudState() {
  const context = useContext(WhatsAppCloudContext);
  if (!context) {
    throw new Error('useWhatsAppCloudState must be used within WhatsAppCloudProvider');
  }
  return context;
}
