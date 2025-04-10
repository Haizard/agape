import { configureStore } from '@reduxjs/toolkit';

const initialState = {
  user: {
    user: null,
  },
};

const rootReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        user: {
          ...state.user,
          user: action.payload,
        },
      };
    case 'CLEAR_USER':
      return {
        ...state,
        user: {
          ...state.user,
          user: null,
        },
      };
    default:
      return state;
  }
};

const store = configureStore({
  reducer: rootReducer,
});

export default store;
