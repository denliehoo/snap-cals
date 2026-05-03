import { createContext, useContext } from "react";

export const SignupStatusContext = createContext(true);

export function useSignupEnabled() {
  return useContext(SignupStatusContext);
}
