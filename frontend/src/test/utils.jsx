import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { createStore } from "../store/reducers/store";

const signedOut = { token: null, user: null, loading: false };

export const signedIn = (roles = ["ROLE_USER"]) => ({
  token: "test-token",
  user: { id: 1, username: "tester", email: "tester@example.com", roles },
  loading: false,
});

/** Renders with a fresh Redux store and an in-memory router. */
export function renderWithProviders(ui, { auth = signedOut, route = "/", preloadedState = {} } = {}) {
  const store = createStore({ auth, ...preloadedState });
  const view = render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </Provider>,
  );
  return { store, ...view };
}
