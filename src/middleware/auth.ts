import { Request, Response, NextFunction } from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.user) {
    res.redirect("/login");
    return;
  }
  next();
}

export function requireRole(role: "PROFESSOR" | "STUDENT") {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.session.user) {
      res.redirect("/login");
      return;
    }
    if (req.session.user.role !== role) {
      res.status(403).render("error", { message: "Forbidden. Wrong role." });
      return;
    }
    next();
  };
}

export function requirePasswordResetHandled(req: Request, res: Response, next: NextFunction): void {
  const user = req.session.user;
  if (!user) {
    res.redirect("/login");
    return;
  }
  if (user.mustChangePassword && req.path !== "/change-password") {
    res.redirect("/change-password");
    return;
  }
  next();
}
