import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.routes.js";
import { outletsRouter } from "./routes/outlets.routes.js";
import { membersRouter } from "./routes/members.routes.js";
import { plansRouter } from "./routes/plans.routes.js";
import { expensesRouter } from "./routes/expenses.routes.js";
import { enquiriesRouter } from "./routes/enquiries.routes.js";
import { transactionsRouter } from "./routes/transactions.routes.js";
import { attendanceRouter } from "./routes/attendance.routes.js";
import { reminderTemplatesRouter } from "./routes/reminderTemplates.routes.js";
import { subscriptionsRouter } from "./routes/subscriptions.routes.js";
import { staffRouter } from "./routes/staff.routes.js";
import { publicInvoiceRouter } from "./routes/publicInvoice.routes.js";

export const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") ?? "*" }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api/outlets", outletsRouter);
app.use("/api/members", membersRouter);
app.use("/api/plans", plansRouter);
app.use("/api/expenses", expensesRouter);
app.use("/api/enquiries", enquiriesRouter);
app.use("/api/transactions", transactionsRouter);
app.use("/api/attendance", attendanceRouter);
app.use("/api/reminder-templates", reminderTemplatesRouter);
app.use("/api/subscriptions", subscriptionsRouter);
app.use("/api/staff", staffRouter);
app.use("/api/public", publicInvoiceRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});
