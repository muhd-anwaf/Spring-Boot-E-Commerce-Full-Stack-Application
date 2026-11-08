import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api, { TOKEN_KEY, USER_KEY, getErrorMessage, readStorage, writeStorage } from "../../api/api";

const loadUser = () => {
  try {
    return JSON.parse(readStorage(USER_KEY));
  } catch {
    return null;
  }
};

const token = readStorage(TOKEN_KEY);

const initialState = {
  token,
  user: token ? loadUser() : null,
  loading: false,
};

const persist = (token, user) => {
  writeStorage(TOKEN_KEY, token);
  writeStorage(USER_KEY, user ? JSON.stringify(user) : null);
};

export const login = createAsyncThunk("auth/login", async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await api.post("/auth/signin", credentials);
    const { jwtToken, ...user } = data;
    return { token: jwtToken, user };
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Could not sign in. Please try again."));
  }
});

export const register = createAsyncThunk("auth/register", async (form, { dispatch, rejectWithValue }) => {
  try {
    await api.post("/auth/signup", {
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password,
    });
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Could not create your account."));
  }
  // Account created: sign in straight away
  const result = await dispatch(login({ username: form.username.trim(), password: form.password }));
  if (login.rejected.match(result)) {
    return rejectWithValue("Account created. Please sign in.");
  }
  return result.payload;
});

export const refreshUser = createAsyncThunk("auth/refreshUser", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/users/me");
    return data;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const logout = createAsyncThunk("auth/logout", async () => {
  try {
    await api.post("/auth/signout");
  } catch {
    /* the local session is cleared either way */
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    /** Called when the API answers 401: the session is gone. */
    sessionExpired(state) {
      state.token = null;
      state.user = null;
      persist(null, null);
    },
    userUpdated(state, action) {
      state.user = { ...state.user, ...action.payload };
      persist(state.token, state.user);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        persist(state.token, state.user);
      })
      .addCase(login.rejected, (state) => {
        state.loading = false;
      })
      .addCase(register.pending, (state) => {
        state.loading = true;
      })
      .addCase(register.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(register.rejected, (state) => {
        state.loading = false;
      })
      .addCase(refreshUser.fulfilled, (state, action) => {
        state.user = action.payload;
        persist(state.token, state.user);
      })
      .addCase(logout.fulfilled, (state) => {
        state.token = null;
        state.user = null;
        persist(null, null);
      });
  },
});

export const { sessionExpired, userUpdated } = authSlice.actions;

export const selectIsAuthenticated = (state) => Boolean(state.auth.token);
export const selectIsAdmin = (state) => Boolean(state.auth.user?.roles?.includes("ROLE_ADMIN"));

export default authSlice.reducer;
