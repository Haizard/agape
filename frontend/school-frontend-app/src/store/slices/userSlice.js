import { createSlice } from '@reduxjs/toolkit';

const userSlice = createSlice({
  name: 'user',
  initialState: {
    user: null,
    loading: false,
    error: null,
  },
  reducers: {
    setUser: (state, action) => {
      console.log('Setting user in Redux store:', action.payload);
      state.user = action.payload;
    },
    clearUser: (state) => {
      console.log('Clearing user from Redux store');
      state.user = null;
    },
    logout: (state) => {
      state.user = null;
      state.loading = false;
      state.error = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },
});

export const { setUser, clearUser, logout } = userSlice.actions;
export default userSlice.reducer;
