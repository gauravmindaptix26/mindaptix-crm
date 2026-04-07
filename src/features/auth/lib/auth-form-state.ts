export type AuthFormState = {
  error?: string;
  success?: string;
  fieldErrors?: {
    fullName?: string;
    email?: string;
    password?: string;
  };
  values?: {
    fullName?: string;
    email?: string;
  };
};

export const INITIAL_AUTH_FORM_STATE: AuthFormState = {};
