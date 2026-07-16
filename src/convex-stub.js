export const anyApi = new Proxy({}, { get: () => anyApi });
export const componentsGeneric = () => new Proxy({}, { get: () => componentsGeneric });
