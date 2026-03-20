import passport from "passport";
import { ExtractJwt, Strategy as JwtStrategy } from "passport-jwt";
import prisma from "../lib/prisma";

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET ?? "",
};

passport.use(
  new JwtStrategy(opts, async (payload, done) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
      });
      return done(null, user || false);
    } catch (err) {
      return done(err, false);
    }
  }),
);

export default passport;
