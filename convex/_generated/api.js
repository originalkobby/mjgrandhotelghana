/* eslint-disable */
/**
 * Generated `api` utility.
 */
const makeAnyApi = () => {
  return new Proxy({}, {
    get(target, prop) {
      if (prop === 'components') return () => makeAnyApi();
      return makeAnyApi();
    }
  });
};

export const api = makeAnyApi();
export const internal = makeAnyApi();
