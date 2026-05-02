import type { Request, Response } from "express";
import { isSignupEnabled } from "../services/settings.service";

export const getSignupStatus = async (_req: Request, res: Response) => {
  try {
    const signupEnabled = await isSignupEnabled();
    return res.json({ data: { signupEnabled } });
  } catch {
    // Fail-open
    return res.json({ data: { signupEnabled: true } });
  }
};
