"use client";

import { useState } from "react";
import { Moon, Sun, Globe, ChevronDown, User } from "lucide-react";

const CURRENCIES = ["INR", "USD", "AED", "GBP"];
const LANGUAGES = ["EN", "TA", "HI"];

export function Header() {
  const [dark, setDark] = useState(false);
  const [currency, setCurrency] = useState("INR");
  const [language, setLanguage] = useState("EN");

  const toggleDark = () => {
    setDark((v) => !v);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-6">
      <div>
        <h1 className="text-lg font-semibold">Overview</h1>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() =>
            setCurrency(
              CURRENCIES[(CURRENCIES.indexOf(currency) + 1) % CURRENCIES.length]
            )
          }
          className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-sm font-medium hover:bg-muted"
        >
          {currency}
          <ChevronDown className="h-3.5 w-3.5" />
        </button>

        <button
          onClick={() =>
            setLanguage(
              LANGUAGES[(LANGUAGES.indexOf(language) + 1) % LANGUAGES.length]
            )
          }
          className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-sm font-medium hover:bg-muted"
        >
          <Globe className="h-3.5 w-3.5" />
          {language}
        </button>

        <button
          onClick={toggleDark}
          aria-label="Toggle theme"
          className="rounded-lg border border-border p-2 hover:bg-muted"
        >
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <button className="flex items-center gap-2 rounded-lg border border-border px-2.5 py-1.5 hover:bg-muted">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            <User className="h-3.5 w-3.5" />
          </span>
          <span className="text-sm font-medium">Prasanth</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
    </header>
  );
}
