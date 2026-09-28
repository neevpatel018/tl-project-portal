
"use client";

import Link from "next/link";
import { useState } from "react";
import type { FormEvent, InputHTMLAttributes } from "react";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

function Field({ label, className = "", ...props }: FieldProps) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-700">
        {label}
        {props.required && <span className="text-red-500"> *</span>}
      </span>

      <input
        {...props}
        className={`w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 ${className}`}
      />
    </label>
  );
}

export default function RegisterProject() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const form = e.currentTarget;
    setBusy(true);
    setMessage("");
    setSuccess(false);

    const payload = Object.fromEntries(
      new FormData(form).entries()
    );

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Project submission failed. Please try again."
        );
      }

      setSuccess(true);
      setMessage(
        `Project submitted successfully. Reference: ${result.reference}. Save this reference for your records.`
      );

      form.reset();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="text-sm font-medium text-sky-700 hover:text-sky-900"
        >
          ← Home
        </Link>

        <header className="mt-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-sky-700">
            Tinkerers&apos; Lab · Ahmedabad University
          </p>

          <h1 className="mt-4 text-3xl font-bold text-tl-navy">
            Register a project
          </h1>

          <p className="mt-2 leading-6 text-slate-600">
            Submit your project proposal for review by Tinkerers&apos; Lab.
            You do not need an account to submit. Do not include confidential
            or sensitive information.
          </p>
        </header>

        <form
          onSubmit={submit}
          className="mt-7 space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >
          {message && (
            <div
              role="status"
              aria-live="polite"
              className={`rounded-lg p-4 text-sm ${
                success
                  ? "border border-green-200 bg-green-50 text-green-800"
                  : "border border-red-200 bg-red-50 text-red-800"
              }`}
            >
              {message}
            </div>
          )}

          <section>
            <h2 className="mb-4 text-lg font-semibold text-tl-navy">
              Project details
            </h2>

            <div className="space-y-4">
              <Field
                label="Project title"
                name="title"
                placeholder="Enter your project title"
                required
                maxLength={150}
              />

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Project description *
                </span>
                <textarea
                  name="description"
                  required
                  minLength={20}
                  maxLength={5000}
                  rows={5}
                  placeholder="Describe your project, how it works, and what you plan to build."
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Problem statement and objectives
                </span>
                <textarea
                  name="problem_statement"
                  rows={3}
                  maxLength={3000}
                  placeholder="What problem does your project aim to solve?"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                />
              </label>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold text-tl-navy">
              Team information
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Lead name"
                name="lead_name"
                placeholder="Full name"
                autoComplete="name"
                required
                maxLength={120}
              />

              <Field
                label="Lead email"
                name="lead_email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                required
                maxLength={254}
              />

              <div className="sm:col-span-2">
                <Field
                  label="University / organization"
                  name="organization"
                  placeholder="Ahmedabad University"
                  required
                  maxLength={200}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Team members (names and emails)
                  </span>
                  <textarea
                    name="team_members"
                    rows={3}
                    maxLength={3000}
                    placeholder={"Enter one team member per line"}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  />
                </label>
              </div>
            </div>
          </section>

          <div className="rounded-lg bg-sky-50 p-4 text-sm leading-6 text-slate-700">
            Submitting this form sends your proposal for review. Submission
            does not mean your project has been approved. You can request
            tools or materials through the portal if that feature is enabled.
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-sky-700 px-5 py-3 font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Submitting project..." : "Submit project"}
          </button>
        </form>

        <footer className="mt-6 text-center text-xs text-slate-500">
          Tinkerers&apos; Lab · Ahmedabad University
        </footer>
      </div>
    </main>
  );
}