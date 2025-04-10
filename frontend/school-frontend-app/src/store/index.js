import { configureStore, createSlice } from '@reduxjs/toolkit';

const userSlice = createSlice({
  name: 'user',
  initialState: {
    user: JSON.parse(localStorage.getItem('user')) || null,
    isAuthenticated: false,
    isLoading: true,
    error: null
  },
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
      // localStorage.setItem('user', JSON.stringify(action.payload)); // Remove localStorage
      // if (action.payload?.token) { // Remove localStorage
      //   localStorage.setItem('token', action.payload.token); // Remove localStorage
      // }
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
      // localStorage.removeItem('token'); // Remove localStorage
      // localStorage.removeItem('user'); // Remove localStorage
    }
  }
});

// Export actions
export const { setUser, setLoading, setError, logout } = userSlice.actions;

// Export reducer
const store = configureStore({
  reducer: {
    user: userSlice.reducer
  }
});

export default store;
