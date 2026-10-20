let accessToken: string | null = null;

export const tokenStore = {
  get: () => accessToken,
  set: (value: string | null) => {
    accessToken = value;
  },
};
