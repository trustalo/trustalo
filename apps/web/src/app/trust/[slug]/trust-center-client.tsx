"use client";

import { useState } from "react";
import {
  apiClient,
  type PublicTrustCenterData,
  type TrustResource,
  type TrustResourceGating,
  type DpaStatus,
} from "@/lib/api-client";

const DPA_LABEL: Record<DpaStatus, string> = {
  not_required: "N/A",
  not_started: "Not Started",
  requested: "Requested",
  received: "Received",
  approved: "Approved",
  expired: "Expired",
};

const GATING_LABEL: Record<TrustResourceGating, string> = {
  public: "Download",
  contact_required: "Request Access",
  nda_required: "Request (NDA)",
};

interface TrustCenterClientProps {
  slug: string;
  data: PublicTrustCenterData;
}

export default function TrustCenterClient({ slug, data }: TrustCenterClientProps) {
  const [requestModal, setRequestModal] = useState<TrustResource | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ status: string; accessToken?: string } | null>(
    null,
  );

  async function handleDownload(resource: TrustResource) {
    // Beacon: record interest even when gated, so admin sees what prospects clicked.
    void apiClient
      .recordPublicTrustEvent(slug, {
        type: "resource_view",
        resourceId: resource.id,
      })
      .catch(() => undefined);

    if (resource.accessGating !== "public") {
      setRequestModal(resource);
      return;
    }
    try {
      const res = await apiClient.getPublicTrustResourceDownloadUrl(slug, resource.id);
      window.open(res.data.url, "_blank");
    } catch {
      /* ignore */
    }
  }

  async function handleTokenDownload(accessToken: string) {
    try {
      const res = await apiClient.downloadWithAccessToken(accessToken);
      window.open(res.data.url, "_blank");
    } catch {
      /* ignore */
    }
  }

  const brandColor = data.config.brandColor || "#3B82F6";
  const generatedAt = new Date(data.generatedAt);
  const snapshotAt = data.snapshotPublishedAt ? new Date(data.snapshotPublishedAt) : null;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <header
        className="border-b px-6 py-12 text-center"
        style={{ borderColor: brandColor + "33" }}
      >
        <div className="mx-auto max-w-3xl">
          {data.config.logoUrl && (
            <img
              src={data.config.logoUrl}
              alt={data.organization.name}
              className="mx-auto mb-4 h-12 w-auto"
            />
          )}
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
            {data.organization.name}
          </h1>
          <p className="mt-1 text-lg" style={{ color: brandColor }}>
            Trust Center
          </p>
          {data.config.description && (
            <p className="mx-auto mt-4 max-w-2xl text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap">
              {data.config.description}
            </p>
          )}
          {data.verifiedBadge && (
            <div
              className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium"
              style={{ backgroundColor: brandColor + "1A", color: brandColor }}
              title="Independently audited and certified"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 1.5l2.598 5.262 5.804.843-4.2 4.094.991 5.78L10 14.75l-5.193 2.728.99-5.78L1.6 7.605l5.804-.843L10 1.5z" />
              </svg>
              Verified · {data.verifiedBadge.framework} {data.verifiedBadge.version}
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10 space-y-10">
        {/* Posture summary */}
        <section className="grid gap-4 sm:grid-cols-3">
          <PostureCard
            label="Controls implemented"
            value={`${data.controlPosture.scorePercent}%`}
            sub={`${data.controlPosture.implemented} of ${data.controlPosture.total - data.controlPosture.notApplicable} in scope`}
            brandColor={brandColor}
          />
          <PostureCard
            label="Evidence current"
            value={
              data.evidenceFreshness.total === 0
                ? "—"
                : `${Math.round((data.evidenceFreshness.fresh / data.evidenceFreshness.total) * 100)}%`
            }
            sub={
              data.evidenceFreshness.expired > 0
                ? `${data.evidenceFreshness.expired} expired`
                : data.evidenceFreshness.expiringSoon > 0
                  ? `${data.evidenceFreshness.expiringSoon} expiring soon`
                  : `${data.evidenceFreshness.fresh} fresh`
            }
            brandColor={brandColor}
          />
          <PostureCard
            label="Active frameworks"
            value={String(data.frameworks.length)}
            sub={
              data.frameworks
                .filter((f) => f.status === "certified")
                .map((f) => f.frameworkType.toUpperCase())
                .join(" · ") || "In progress"
            }
            brandColor={brandColor}
          />
        </section>

        {/* Frameworks */}
        {data.frameworks.length > 0 && (
          <section>
            <h2 className="mb-4 text-xl font-semibold text-neutral-900 dark:text-white">
              Compliance Frameworks
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {data.frameworks.map((fw) => (
                <div
                  key={fw.id}
                  className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <div>
                    <div className="font-medium text-neutral-900 dark:text-white">
                      {fw.name} <span className="text-xs text-neutral-400">v{fw.version}</span>
                    </div>
                    {fw.targetMaturityLevel && (
                      <div className="mt-0.5 text-xs text-neutral-500">
                        Target: {fw.targetMaturityLevel.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <FrameworkStatusBadge
                    status={fw.status}
                    certifiedAt={fw.certifiedAt}
                    brandColor={brandColor}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Policies */}
        {data.policies.length > 0 && (
          <section>
            <h2 className="mb-4 text-xl font-semibold text-neutral-900 dark:text-white">
              Published Policies
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {data.policies.map((policy) => {
                const summary = policy.publicSummary ?? policy.description ?? null;
                return (
                  <div
                    key={policy.id}
                    className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
                  >
                    <div className="font-medium text-neutral-900 dark:text-white">
                      {policy.title}
                    </div>
                    {summary ? (
                      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                        {summary}
                      </p>
                    ) : null}
                    <p className="mt-2 text-xs text-neutral-400">
                      Updated {new Date(policy.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Resources */}
        {data.resources.length > 0 && (
          <section>
            <h2 className="mb-4 text-xl font-semibold text-neutral-900 dark:text-white">
              Compliance Resources
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {data.resources.map((resource) => (
                <div
                  key={resource.id}
                  className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
                          style={{ backgroundColor: brandColor + "1A", color: brandColor }}
                        >
                          {resource.resourceType.charAt(0).toUpperCase() +
                            resource.resourceType.slice(1)}
                        </span>
                        {resource.accessGating === "nda_required" && (
                          <span className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                            NDA Required
                          </span>
                        )}
                        {resource.accessGating === "contact_required" && (
                          <span className="inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            Info Required
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-neutral-900 dark:text-white">
                        {resource.title}
                      </h3>
                      {resource.description && (
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                          {resource.description}
                        </p>
                      )}
                      {resource.frameworkType && (
                        <p className="mt-1 text-xs text-neutral-400">{resource.frameworkType}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDownload(resource)}
                      className="ml-3 shrink-0 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    >
                      {GATING_LABEL[resource.accessGating]}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Subprocessors */}
        {data.subprocessors.length > 0 && (
          <section>
            <h2 className="mb-4 text-xl font-semibold text-neutral-900 dark:text-white">
              Subprocessors
            </h2>
            <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
              The following third-party service providers may process data on behalf of{" "}
              {data.organization.name}.
            </p>
            <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 dark:bg-neutral-900">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-400">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-400">
                      Purpose
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-400">
                      Data Types
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-400">
                      Location
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-400">
                      DPA
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 bg-white dark:divide-neutral-800 dark:bg-neutral-950">
                  {data.subprocessors.map((sp) => (
                    <tr key={sp.id}>
                      <td className="px-4 py-3">
                        <span className="font-medium text-neutral-900 dark:text-white">
                          {sp.name}
                        </span>
                        {sp.website && (
                          <a
                            href={
                              sp.website.startsWith("http") ? sp.website : `https://${sp.website}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-1 text-xs hover:underline"
                            style={{ color: brandColor }}
                          >
                            {sp.website.replace(/^https?:\/\//, "")}
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                        {sp.subprocessorPurpose || "—"}
                      </td>
                      <td className="px-4 py-3">
                        {sp.dataTypesShared.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {sp.dataTypesShared.map((dt) => (
                              <span
                                key={dt}
                                className="inline-block rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                              >
                                {dt}
                              </span>
                            ))}
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                        {sp.dataLocations.length > 0 ? sp.dataLocations.join(", ") : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                            sp.dpaStatus === "approved"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : sp.dpaStatus === "expired"
                                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                          }`}
                        >
                          {DPA_LABEL[sp.dpaStatus] ?? sp.dpaStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* FAQs */}
        {Array.isArray(data.config.faqs) && (data.config.faqs as unknown[]).length > 0 && (
          <section>
            <h2 className="mb-4 text-xl font-semibold text-neutral-900 dark:text-white">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {(data.config.faqs as { question: string; answer: string }[]).map((faq, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <h3 className="font-medium text-neutral-900 dark:text-white">{faq.question}</h3>
                  <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 px-6 py-6 text-center text-sm text-neutral-400 dark:border-neutral-800">
        <div>
          &copy; {new Date().getFullYear()} {data.organization.name}. All rights reserved.
        </div>
        <div className="mt-1 text-xs">
          {snapshotAt ? (
            <>Snapshot published {snapshotAt.toLocaleString()}</>
          ) : (
            <>Last updated {generatedAt.toLocaleString()}</>
          )}
          {" · Powered by Trustalo"}
        </div>
      </footer>

      {/* Access Request Modal */}
      {requestModal && !successInfo && (
        <AccessRequestModal
          slug={slug}
          resource={requestModal}
          brandColor={brandColor}
          onClose={() => setRequestModal(null)}
          onSuccess={(result) => {
            setSuccessInfo(result);
          }}
        />
      )}

      {/* Success Modal */}
      {successInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-neutral-900">
            {successInfo.status === "approved" || successInfo.status === "already_approved" ? (
              <>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                  <svg
                    className="h-6 w-6 text-green-600 dark:text-green-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                  Access Granted
                </h3>
                <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                  Your access has been approved. Click below to download the resource.
                </p>
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => {
                      if (successInfo.accessToken) handleTokenDownload(successInfo.accessToken);
                    }}
                    className="flex-1 rounded-lg px-4 py-2 text-sm font-medium text-white"
                    style={{ backgroundColor: brandColor }}
                  >
                    Download Now
                  </button>
                  <button
                    onClick={() => {
                      setSuccessInfo(null);
                      setRequestModal(null);
                    }}
                    className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                  >
                    Close
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                  <svg
                    className="h-6 w-6 text-blue-600 dark:text-blue-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                  {successInfo.status === "already_pending"
                    ? "Request Already Submitted"
                    : "Request Submitted"}
                </h3>
                <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                  Your access request has been submitted and is pending review. You will be
                  contacted once it has been reviewed.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => {
                      setSuccessInfo(null);
                      setRequestModal(null);
                    }}
                    className="w-full rounded-lg px-4 py-2 text-sm font-medium text-white"
                    style={{ backgroundColor: brandColor }}
                  >
                    OK
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ────── Posture cards ──────

function PostureCard({
  label,
  value,
  sub,
  brandColor,
}: {
  label: string;
  value: string;
  sub: string;
  brandColor: string;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        {label}
      </div>
      <div className="mt-2 text-3xl font-bold" style={{ color: brandColor }}>
        {value}
      </div>
      <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{sub}</div>
    </div>
  );
}

function FrameworkStatusBadge({
  status,
  certifiedAt,
  brandColor,
}: {
  status: "not_started" | "in_progress" | "ready_for_audit" | "certified";
  certifiedAt: string | null;
  brandColor: string;
}) {
  if (status === "certified") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
        style={{ backgroundColor: brandColor + "1A", color: brandColor }}
      >
        Certified{certifiedAt ? ` · ${new Date(certifiedAt).getFullYear()}` : ""}
      </span>
    );
  }
  const STATUS_LABEL: Record<string, string> = {
    not_started: "Not Started",
    in_progress: "In Progress",
    ready_for_audit: "Ready for Audit",
  };
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

// ────── Access Request Modal ──────

function AccessRequestModal({
  slug,
  resource,
  brandColor,
  onClose,
  onSuccess,
}: {
  slug: string;
  resource: TrustResource;
  brandColor: string;
  onClose: () => void;
  onSuccess: (result: { status: string; accessToken?: string }) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");
  const [reason, setReason] = useState("");
  const [ndaAccepted, setNdaAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isNda = resource.accessGating === "nda_required";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await apiClient.submitAccessRequest(slug, {
        resourceId: resource.id,
        requesterName: name,
        requesterEmail: email,
        requesterCompany: company,
        requesterTitle: title || undefined,
        reason: reason || undefined,
        ndaAccepted: isNda ? ndaAccepted : undefined,
      });
      onSuccess(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 dark:bg-neutral-900">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Request Access</h3>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            {isNda
              ? `"${resource.title}" requires NDA acceptance. Fill out the form and accept the NDA terms to submit your request for review.`
              : `Provide your information to access "${resource.title}".`}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Work Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                placeholder="john@company.com"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Company <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                placeholder="Acme Inc."
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Job Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                placeholder="Security Engineer"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Reason for Access
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              placeholder="Vendor due diligence, compliance review, etc."
            />
          </div>

          {isNda && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ndaAccepted}
                  onChange={(e) => setNdaAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-amber-800 dark:text-amber-200">
                  I acknowledge that accessing this resource requires a Non-Disclosure Agreement. By
                  checking this box, I agree to treat all information contained in this resource as
                  confidential and not to disclose it to any third party without prior written
                  consent.
                </span>
              </label>
            </div>
          )}

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting || (isNda && !ndaAccepted)}
              className="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: brandColor }}
            >
              {submitting ? "Submitting..." : isNda ? "Submit Request" : "Get Access"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
