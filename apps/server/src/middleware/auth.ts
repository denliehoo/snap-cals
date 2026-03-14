import { Request, Response, NextFunction } from "express";
import passport from "./passport";
import { User } from "@prisma/client";

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  passport.authenticate(
    "jwt",
    { session: false },
    (err: Error, user: User) => {
      if (err || !user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      req.user = user;
      next();
    }
  )(req, res, next);
};
