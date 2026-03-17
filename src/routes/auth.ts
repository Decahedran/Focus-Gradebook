import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma";
import { hashPassword, verifyPassword } from "../utils/auth";
import { requireAuth } from "../middleware/auth";

export const authRouter = Router();

authRouter.get("/login", (req, res) => {
  if (req.session.user) {
    res.redirect("/");
    return;
  }
  res.render("auth/login", { error: null });
});

authRouter.post("/login", async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).render("auth/login", { error: "Invalid credentials format." });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!user) {
    res.status(401).render("auth/login", { error: "Invalid email or password." });
    return;
  }

  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) {
    res.status(401).render("auth/login", { error: "Invalid email or password." });
    return;
  }

  req.session.user = {
    id: user.id,
    email: user.email,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
  };

  res.redirect("/");
});

authRouter.get("/change-password", requireAuth, (req, res) => {
  res.render("auth/change-password", { error: null });
});

authRouter.post("/change-password", requireAuth, async (req, res) => {
  const schema = z
    .object({
      password: z.string().min(8, "Password must be at least 8 characters."),
      confirmPassword: z.string().min(8),
    })
    .refine((v) => v.password === v.confirmPassword, {
      message: "Passwords do not match.",
      path: ["confirmPassword"],
    });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid password data.";
    res.status(400).render("auth/change-password", { error: message });
    return;
  }

  const userId = req.session.user!.id;
  const passwordHash = await hashPassword(parsed.data.password);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash, mustChangePassword: false },
  });

  req.session.user!.mustChangePassword = false;
  res.redirect("/");
});

authRouter.post("/logout", requireAuth, (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});
