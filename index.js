import { useEffect, useReducer } from 'react';

function dataFetchReducer(state, action) {
  const handlers = {
    fetchInit() {
      return {
        ...state,
        res: null,
        isLoading: true,
        isError: false
      };
    },
    fetchSuccess() {
      return {
        ...state,
        isLoading: false,
        isError: false,
        res: action.payload.res,
        data: action.payload.data,
      };
    },
    fetchError() {
      return {
        ...state,
        isLoading: false,
        isError: true,
        res: action.payload.res,
        data: action.payload.data
      };
    },
    fetchFailure() {
      return {
        ...state,
        isLoading: false,
        isError: true,
      };
    }
  };

  if (handlers.hasOwnProperty(action.type)) {
    return handlers[action.type]();
  }

  throw new Error(`No handler for ${action.type}`);
}

/**
* @param {object} options.  Corresponds to a typical request object.
*
* If any of the following options change, then fetch will be re-run.
* - url
* - method
* - body
*
*/
export default function useFetch({
  url,
  method,
  headers,
  body
} = {}) {

  const [ state, dispatch ] = useReducer(dataFetchReducer, {
    isLoading: true,
    isError: false,
    res: null,
    data: null,
  });

  const appliedBody = body
    ? {body: JSON.stringify(body)}
    : {};

  const bodyMethods = {
    post: true,
    patch: true,
    put: true
  };

  const appliedHeaders = bodyMethods[method.toLowerCase()]
    ? {headers: {'Content-Type': 'application/json', ...headers}}
    : headers
      ? {headers}
      : {};

  useEffect(() => {
    let didCancel = false;

    async function fetchData() {
      dispatch({type: 'fetchInit'});
      try {
        const res = await fetch(url, {
          method,
          ...appliedHeaders,
          ...appliedBody
        });

        if (!didCancel && res.ok) {
          const data = await res.json();

          dispatch({
            type: 'fetchSuccess',
            payload: {res, data}
          });

        } else if (!didCancel) {
          const data = await res.json();

          dispatch({
            type: 'fetchError',
            payload: {res, data}
          });
        }

      } catch (err) {
        if (!didCancel) {
          dispatch({type: 'fetchFailure'});
        }
      }
    }

    if (url) {
      fetchData();
    }

    return () => {
      didCancel = true;
    };

  }, [url, method, body]);

  return state;
};