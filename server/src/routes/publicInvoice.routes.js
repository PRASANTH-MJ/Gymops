import { Router } from "express";
import { buildInvoiceData } from "../services/invoice.js";

// Deliberately unauthenticated: this is the endpoint behind the "PDF Invoice
// Link" shared with members over WhatsApp/SMS, who have no staff login.
// Security model matches the reference app's DigitalOcean Spaces links —
// the transaction id (a uuid) is the only guard, not a login.
export const publicInvoiceRouter = Router();

publicInvoiceRouter.get("/invoices/:id", (req, res) => {
  const invoice = buildInvoiceData(req.params.id);
  if (!invoice) return res.status(404).json({ error: "Invoice not found" });
  res.json(invoice);
});
