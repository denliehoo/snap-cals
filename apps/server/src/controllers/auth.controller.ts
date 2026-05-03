import {
  EMAIL_MAX_LENGTH,
  type ForgotPasswordRequest,
  type GoogleAuthRequest,
  type LoginRequest,
  PASSWORD_MAX_LENGTH,
  type ResendVerificationRequest,
  type ResetPasswordRequest,
  type SignupRequest,
  type VerifyEmailRequest,
} from "@snap-cals/shared";
import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";
import {
  sendPasswordResetCode,
  sendVerificationCode,
} from "../services/email.service";
import { isSignupEnabled } from "../services/settings.service";
import { generateOtp, hashOtp, verifyOtp } from "../utils/otp";

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const SIGNUPS_CLOSED_MSG =
  "We're not accepting new sign-ups at the moment. Please check back later.";

const DEACTIVATED_MSG =
  "Your account has been deactivated. Please contact the admin.";

const signToken = (userId: string) =>
  jwt.sign({ sub: userId }, process.env.JWT_SECRET ?? "", { expiresIn: "7d" });

const userResponse = (user: {
  id: string;
  email: string;
  status: string;
  subscriptionTier: string;
  createdAt: Date;
}) => ({
  id: user.id,
  email: user.email,
  status: user.status,
  subscriptionTier: user.subscriptionTier,
  createdAt: user.createdAt,
});

export const signup = async (
  req: Request<{}, {}, SignupRequest>,
  res: Response,
) => {
  try {
    const { email, password } = req.body;

    if (!(await isSignupEnabled())) {
      return res.status(403).json({ message: SIGNUPS_CLOSED_MSG });
    }

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }
    if (email.length > EMAIL_MAX_LENGTH) {
      return res.status(400).json({
        message: `Email must be ${EMAIL_MAX_LENGTH} characters or less`,
      });
    }
    if (password.length < 6 || password.length > PASSWORD_MAX_LENGTH) {
      return res.status(400).json({
        message: `Password must be 6–${PASSWORD_MAX_LENGTH} characters`,
      });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, passwordHash },
    });

    const code = generateOtp();
    const codeHash = await hashOtp(code);
    await prisma.otp.create({
      data: {
        userId: user.id,
        codeHash,
        type: "EMAIL_VERIFICATION",
        expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
      },
    });

    await sendVerificationCode(email, code);

    return res.status(201).json({
      data: { userId: user.id, status: "UNVERIFIED" },
    });
  } catch (_err) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (
  req: Request<{}, {}, LoginRequest>,
  res: Response,
) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    if (
      email.length > EMAIL_MAX_LENGTH ||
      password.length > PASSWORD_MAX_LENGTH
    ) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.status === "DEACTIVATED") {
      return res.status(403).json({ message: DEACTIVATED_MSG });
    }

    if (user.status === "UNVERIFIED") {
      return res.json({
        data: { userId: user.id, status: "UNVERIFIED" },
      });
    }

    const token = signToken(user.id);
    return res.json({
      data: { token, user: userResponse(user) },
    });
  } catch (_err) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const verifyEmail = async (
  req: Request<{}, {}, VerifyEmailRequest>,
  res: Response,
) => {
  try {
    const { userId, code } = req.body;

    if (!userId || !code) {
      return res.status(400).json({ message: "User ID and code are required" });
    }

    const otp = await prisma.otp.findFirst({
      where: { userId, type: "EMAIL_VERIFICATION", used: false },
      orderBy: { createdAt: "desc" },
    });

    if (!otp) {
      return res.status(400).json({ message: "No pending verification code" });
    }

    if (otp.expiresAt < new Date()) {
      return res.status(400).json({ message: "Verification code has expired" });
    }

    const valid = await verifyOtp(code, otp.codeHash);
    if (!valid) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    await prisma.$transaction([
      prisma.otp.update({ where: { id: otp.id }, data: { used: true } }),
      prisma.user.update({
        where: { id: userId },
        data: { status: "VERIFIED" },
      }),
    ]);

    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const token = signToken(user.id);

    return res.json({
      data: { token, user: userResponse(user) },
    });
  } catch (_err) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const resendVerification = async (
  req: Request<{}, {}, ResendVerificationRequest>,
  res: Response,
) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    if (user.status !== "UNVERIFIED") {
      return res.status(400).json({ message: "Email already verified" });
    }

    await prisma.otp.updateMany({
      where: { userId, type: "EMAIL_VERIFICATION", used: false },
      data: { used: true },
    });

    const code = generateOtp();
    const codeHash = await hashOtp(code);
    await prisma.otp.create({
      data: {
        userId,
        codeHash,
        type: "EMAIL_VERIFICATION",
        expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
      },
    });

    await sendVerificationCode(user.email, code);

    return res.json({ message: "Verification code sent" });
  } catch (_err) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const forgotPassword = async (
  req: Request<{}, {}, ForgotPasswordRequest>,
  res: Response,
) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return 200 to prevent email enumeration
    if (user?.passwordHash) {
      const code = generateOtp();
      const codeHash = await hashOtp(code);
      await prisma.otp.create({
        data: {
          userId: user.id,
          codeHash,
          type: "PASSWORD_RESET",
          expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
        },
      });
      await sendPasswordResetCode(email, code);
    }

    return res.json({
      message: "If an account exists, a reset code has been sent",
    });
  } catch (_err) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const resetPassword = async (
  req: Request<{}, {}, ResetPasswordRequest>,
  res: Response,
) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res
        .status(400)
        .json({ message: "Email, code, and new password are required" });
    }
    if (newPassword.length < 6 || newPassword.length > PASSWORD_MAX_LENGTH) {
      return res.status(400).json({
        message: `Password must be 6–${PASSWORD_MAX_LENGTH} characters`,
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: "Invalid reset code" });
    }

    const otp = await prisma.otp.findFirst({
      where: { userId: user.id, type: "PASSWORD_RESET", used: false },
      orderBy: { createdAt: "desc" },
    });

    if (!otp) {
      return res.status(400).json({ message: "Invalid reset code" });
    }

    if (otp.expiresAt < new Date()) {
      return res.status(400).json({ message: "Reset code has expired" });
    }

    const valid = await verifyOtp(code, otp.codeHash);
    if (!valid) {
      return res.status(400).json({ message: "Invalid reset code" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.$transaction([
      prisma.otp.update({ where: { id: otp.id }, data: { used: true } }),
      prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
    ]);

    return res.json({ message: "Password reset successfully" });
  } catch (_err) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

let googleClient: OAuth2Client;

function getGoogleClient() {
  if (!googleClient) googleClient = new OAuth2Client();
  return googleClient;
}

const GOOGLE_CLIENT_IDS = [
  process.env.GOOGLE_IOS_CLIENT_ID,
  process.env.GOOGLE_ANDROID_CLIENT_ID,
].filter(Boolean) as string[];

export const googleAuth = async (
  req: Request<{}, {}, GoogleAuthRequest>,
  res: Response,
) => {
  try {
    const { code, idToken } = req.body;

    if (!code && !idToken) {
      return res
        .status(400)
        .json({ message: "Authorization code or ID token is required" });
    }

    let email: string;
    let sub: string;

    if (code) {
      // Exchange authorization code for tokens
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          client_id: req.body.clientId,
          redirect_uri: req.body.redirectUri,
          grant_type: "authorization_code",
        }),
      });
      const tokenData = (await tokenRes.json()) as { id_token?: string };
      if (!tokenData.id_token) {
        return res
          .status(401)
          .json({ message: "Failed to exchange authorization code" });
      }
      const ticket = await getGoogleClient().verifyIdToken({
        idToken: tokenData.id_token,
        audience: GOOGLE_CLIENT_IDS,
      });
      const payload = ticket.getPayload();
      if (!payload?.email || !payload.email_verified || !payload.sub) {
        return res.status(401).json({ message: "Invalid Google token" });
      }
      email = payload.email;
      sub = payload.sub;
    } else {
      // Direct id_token verification (for future use)
      const ticket = await getGoogleClient().verifyIdToken({
        idToken: idToken as string,
        audience: GOOGLE_CLIENT_IDS,
      });
      const payload = ticket.getPayload();
      if (!payload?.email || !payload.email_verified || !payload.sub) {
        return res.status(401).json({ message: "Invalid Google token" });
      }
      email = payload.email;
      sub = payload.sub;
    }

    // 1. Check if this Google account is already linked
    const existingProvider = await prisma.authProvider.findUnique({
      where: {
        provider_providerUserId: { provider: "GOOGLE", providerUserId: sub },
      },
      include: { user: true },
    });

    if (existingProvider) {
      if (existingProvider.user.status === "DEACTIVATED") {
        return res.status(403).json({ message: DEACTIVATED_MSG });
      }
      const token = signToken(existingProvider.user.id);
      return res.json({
        data: { token, user: userResponse(existingProvider.user) },
      });
    }

    // 2. Check if a user with this email exists — link Google to them
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      if (existingUser.status === "DEACTIVATED") {
        return res.status(403).json({ message: DEACTIVATED_MSG });
      }

      await prisma.authProvider.create({
        data: {
          userId: existingUser.id,
          provider: "GOOGLE",
          providerUserId: sub,
        },
      });

      if (existingUser.status === "UNVERIFIED") {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { status: "VERIFIED" },
        });
      }

      const updated = await prisma.user.findUniqueOrThrow({
        where: { id: existingUser.id },
      });
      const token = signToken(updated.id);
      return res.json({
        data: { token, user: userResponse(updated) },
      });
    }

    // 3. Create new user + provider
    if (!(await isSignupEnabled())) {
      return res.status(403).json({ message: SIGNUPS_CLOSED_MSG });
    }

    const newUser = await prisma.user.create({
      data: {
        email,
        status: "VERIFIED",
        authProviders: {
          create: { provider: "GOOGLE", providerUserId: sub },
        },
      },
    });

    const token = signToken(newUser.id);
    return res.json({
      data: { token, user: userResponse(newUser) },
    });
  } catch (_err) {
    return res.status(401).json({ message: "Invalid Google token" });
  }
};
