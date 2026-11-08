import { useCallback, useEffect, useRef, useState } from "react";
import { getErrorMessage } from "../api/api";

/**
 * Runs an async loader and tracks {data, loading, error}. Call reload() to run it again.
 * The loader is re-run whenever `deps` change; stale responses are ignored.
 */
export default function useAsync(loader, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const requestId = useRef(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableLoader = useCallback(loader, deps);

  const run = useCallback(async () => {
    const id = ++requestId.current;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await stableLoader();
      if (id === requestId.current) setState({ data, loading: false, error: null });
    } catch (error) {
      if (id === requestId.current) {
        setState((prev) => ({ ...prev, loading: false, error: getErrorMessage(error), status: error.response?.status }));
      }
    }
  }, [stableLoader]);

  useEffect(() => {
    run();
    const ids = requestId;
    return () => {
      ids.current++; // ignore a response that arrives after unmount or after deps changed
    };
  }, [run]);

  return { ...state, reload: run };
}
