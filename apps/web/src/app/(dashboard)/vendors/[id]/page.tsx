"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import type { BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
} from "@/components/ui/table";
import {
  apiClient,
  type VendorDetail,
  type VendorRiskTier,
  type VendorStatus,
  type DpaStatus,
  type VendorContact,
  type VendorAssessmentItem,
  type VendorResearchItem,
  type VendorDocumentItem,
  type VendorDocumentType,
  type ResearchFrequency,
  type UpdateVendorInput,
  type CreateVendorContactInput,
} from "@/lib/api-client";
import { VendorTierSuggestionBanner } from "@/components/ai/vendor-tier-suggestion-banner";

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

const RISK_TIER_OPTIONS = [
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "under_review", label: "Under Review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "offboarded", label: "Offboarded" },
];

const CATEGORY_OPTIONS = [
  "Cloud Infrastructure",
  "CRM",
  "Collaboration",
  "Identity & Access",
  "Observability",
  "Communications",
  "Payment Processing",
  "Data Analytics",
  "Security",
  "HR & People",
  "Developer Tools",
  "Marketing",
  "Legal & Compliance",
  "Customer Support",
  "Finance & Accounting",
  "AI & Machine Learning",
  "Other",
].map((c) => ({ value: c, label: c }));

const RISK_BADGE: Record<VendorRiskTier, { variant: BadgeVariant; label: string }> = {
  critical: { variant: "danger", label: "Critical" },
  high: { variant: "warning", label: "High" },
  medium: { variant: "info", label: "Medium" },
  low: { variant: "success", label: "Low" },
};

const STATUS_BADGE: Record<VendorStatus, { variant: BadgeVariant; label: string }> = {
  active: { variant: "success", label: "Active" },
  under_review: { variant: "warning", label: "Under Review" },
  approved: { variant: "info", label: "Approved" },
  rejected: { variant: "danger", label: "Rejected" },
  offboarded: { variant: "neutral", label: "Offboarded" },
};

const RESEARCH_FREQUENCY_OPTIONS = [
  { value: "none", label: "No automatic research" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

const DPA_STATUS_OPTIONS = [
  { value: "not_required", label: "Not Required" },
  { value: "not_started", label: "Not Started" },
  { value: "requested", label: "Requested" },
  { value: "received", label: "Received" },
  { value: "approved", label: "Approved" },
  { value: "expired", label: "Expired" },
];

const DPA_BADGE: Record<DpaStatus, { variant: BadgeVariant; label: string }> = {
  not_required: { variant: "neutral", label: "Not Required" },
  not_started: { variant: "neutral", label: "Not Started" },
  requested: { variant: "warning", label: "Requested" },
  received: { variant: "info", label: "Received" },
  approved: { variant: "success", label: "Approved" },
  expired: { variant: "danger", label: "Expired" },
};

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function ScoreBadge({ score, label }: { score: number | null; label: string }) {
  if (score == null) return null;
  const variant = score >= 80 ? "success" : score >= 60 ? "warning" : "danger";
  return (
    <div className="flex items-center justify-between">
      <dt className="text-neutral-500">{label}</dt>
      <dd>
        <Badge variant={variant as any}>{score}/100</Badge>
      </dd>
    </div>
  );
}

// ──────────────────────────────────────────────
// Vendor Detail Page
// ──────────────────────────────────────────────

export default function VendorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const vendorId = params.id as string;

  const [vendor, setVendor] = useState<VendorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [editContact, setEditContact] = useState<VendorContact | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VendorContact | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [statusChanging, setStatusChanging] = useState(false);

  const fetchVendor = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.getVendor(vendorId);
      setVendor(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load vendor");
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    fetchVendor();
  }, [fetchVendor]);

  async function handleStatusChange(newStatus: VendorStatus) {
    if (!vendor) return;
    setStatusChanging(true);
    try {
      await apiClient.updateVendor(vendor.id, { status: newStatus });
      fetchVendor();
    } catch {
      /* ignore */
    } finally {
      setStatusChanging(false);
    }
  }

  async function handleDeleteContact() {
    if (!deleteTarget || !vendor) return;
    setDeleting(true);
    try {
      await apiClient.deleteVendorContact(vendor.id, deleteTarget.id);
      setDeleteTarget(null);
      fetchVendor();
    } catch {
      /* ignore */
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <svg className="h-6 w-6 animate-spin text-blue-600" viewBox="0 0 24 24" fill="none">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="py-24 text-center">
        <p className="text-neutral-500 dark:text-neutral-400">{error || "Vendor not found"}</p>
        <Button className="mt-4" variant="secondary" onClick={() => router.push("/vendors")}>
          Back to Vendors
        </Button>
      </div>
    );
  }

  const rb = RISK_BADGE[vendor.riskTier];
  const sb = STATUS_BADGE[vendor.status];

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div>
        <button
          onClick={() => router.push("/vendors")}
          className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Vendors
        </button>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{vendor.name}</h1>
              <Badge variant={sb.variant}>{sb.label}</Badge>
              <Badge variant={rb.variant}>{rb.label} Risk</Badge>
            </div>
            {vendor.website && (
              <a
                href={
                  vendor.website.startsWith("http") ? vendor.website : `https://${vendor.website}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
              >
                {vendor.website.replace(/^https?:\/\//, "")}
              </a>
            )}
            {vendor.description && (
              <p className="mt-2 max-w-2xl text-sm text-neutral-600 dark:text-neutral-400">
                {vendor.description}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setEditOpen(true)}>
              Edit
            </Button>
            {vendor.status === "active" && (
              <Button
                variant="secondary"
                onClick={() => handleStatusChange("under_review")}
                loading={statusChanging}
              >
                Start Review
              </Button>
            )}
            {vendor.status === "under_review" && (
              <>
                <Button onClick={() => handleStatusChange("approved")} loading={statusChanging}>
                  Approve
                </Button>
                <Button
                  variant="danger"
                  onClick={() => handleStatusChange("rejected")}
                  loading={statusChanging}
                >
                  Reject
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <VendorTierSuggestionBanner
        vendorId={vendor.id}
        currentTier={vendor.riskTier}
        onApply={async (tier) => {
          await apiClient.updateVendor(vendor.id, { riskTier: tier });
          await fetchVendor();
        }}
      />

      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <h3 className="mb-3 text-sm font-semibold text-neutral-800 dark:text-neutral-200">
            Details
          </h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-neutral-500">Category</dt>
              <dd className="text-neutral-900 dark:text-white">{vendor.category || "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Risk Tier</dt>
              <dd>
                <Badge variant={rb.variant}>{rb.label}</Badge>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Data Processing</dt>
              <dd>
                {vendor.dataProcessing ? (
                  <span className="font-medium text-red-600 dark:text-red-400">Yes</span>
                ) : (
                  "No"
                )}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Subprocessor</dt>
              <dd>{vendor.isSubprocessor ? <Badge variant="info">Yes</Badge> : "No"}</dd>
            </div>
            {vendor.isSubprocessor && vendor.subprocessorPurpose && (
              <div className="flex justify-between">
                <dt className="text-neutral-500">Purpose</dt>
                <dd className="text-neutral-900 dark:text-white text-right max-w-[10rem] truncate">
                  {vendor.subprocessorPurpose}
                </dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-neutral-500">DPA Status</dt>
              <dd>
                <Badge variant={DPA_BADGE[vendor.dpaStatus]?.variant ?? "neutral"}>
                  {DPA_BADGE[vendor.dpaStatus]?.label ?? vendor.dpaStatus}
                </Badge>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Assessments</dt>
              <dd className="text-neutral-900 dark:text-white">
                {vendor.assessments?.length ?? 0}
              </dd>
            </div>
          </dl>
        </Card>

        <Card>
          <h3 className="mb-3 text-sm font-semibold text-neutral-800 dark:text-neutral-200">
            Contract
          </h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-neutral-500">Start Date</dt>
              <dd className="text-neutral-900 dark:text-white">
                {formatDate(vendor.contractStartDate)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">End Date</dt>
              <dd className="text-neutral-900 dark:text-white">
                {formatDate(vendor.contractEndDate)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Added</dt>
              <dd className="text-neutral-900 dark:text-white">{formatDate(vendor.createdAt)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Last Updated</dt>
              <dd className="text-neutral-900 dark:text-white">{formatDate(vendor.updatedAt)}</dd>
            </div>
          </dl>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
              Primary Contact
            </h3>
          </div>
          {(vendor.contacts?.length ?? 0) > 0 ? (
            (() => {
              const primary = vendor.contacts!.find((c) => c.isPrimary) || vendor.contacts![0];
              return (
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-neutral-500">Name</dt>
                    <dd className="text-neutral-900 dark:text-white">{primary.name}</dd>
                  </div>
                  {primary.email && (
                    <div className="flex justify-between">
                      <dt className="text-neutral-500">Email</dt>
                      <dd>
                        <a
                          href={`mailto:${primary.email}`}
                          className="text-blue-600 hover:underline dark:text-blue-400"
                        >
                          {primary.email}
                        </a>
                      </dd>
                    </div>
                  )}
                  {primary.role && (
                    <div className="flex justify-between">
                      <dt className="text-neutral-500">Role</dt>
                      <dd className="text-neutral-900 dark:text-white">{primary.role}</dd>
                    </div>
                  )}
                  {primary.phone && (
                    <div className="flex justify-between">
                      <dt className="text-neutral-500">Phone</dt>
                      <dd className="text-neutral-900 dark:text-white">{primary.phone}</dd>
                    </div>
                  )}
                </dl>
              );
            })()
          ) : (
            <p className="text-sm text-neutral-400">No contacts added yet.</p>
          )}
        </Card>
      </div>

      {/* Contacts Section */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
            Contacts ({vendor.contacts?.length ?? 0})
          </h3>
          <Button
            size="sm"
            onClick={() => {
              setEditContact(null);
              setContactOpen(true);
            }}
          >
            Add Contact
          </Button>
        </div>
        {!vendor.contacts?.length ? (
          <p className="py-6 text-center text-sm text-neutral-400">
            No contacts. Add a contact to track your vendor relationship.
          </p>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Name</TableHeader>
                <TableHeader>Email</TableHeader>
                <TableHeader>Role</TableHeader>
                <TableHeader>Phone</TableHeader>
                <TableHeader>Primary</TableHeader>
                <TableHeader className="w-20" />
              </TableRow>
            </TableHead>
            <TableBody>
              {vendor.contacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium">{contact.name}</TableCell>
                  <TableCell>
                    {contact.email ? (
                      <a
                        href={`mailto:${contact.email}`}
                        className="text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {contact.email}
                      </a>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>{contact.role || "—"}</TableCell>
                  <TableCell>{contact.phone || "—"}</TableCell>
                  <TableCell>
                    {contact.isPrimary && <Badge variant="info">Primary</Badge>}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <button
                        className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
                        title="Edit"
                        onClick={() => {
                          setEditContact(contact);
                          setContactOpen(true);
                        }}
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        className="rounded p-1 text-neutral-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
                        title="Delete"
                        onClick={() => setDeleteTarget(contact)}
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Documents Section */}
      <DocumentsSection vendor={vendor} onRefresh={fetchVendor} />

      {/* Research & Assessment Section */}
      <ResearchSection vendor={vendor} onRefresh={fetchVendor} />

      {/* Assessments Section */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
            Assessments ({vendor.assessments?.length ?? 0})
          </h3>
        </div>
        {!vendor.assessments?.length ? (
          <p className="py-6 text-center text-sm text-neutral-400">
            No assessments yet. Assessments will be auto-generated from research, or added manually.
          </p>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Date</TableHeader>
                <TableHeader>Assessed By</TableHeader>
                <TableHeader>Score</TableHeader>
                <TableHeader>Findings</TableHeader>
                <TableHeader>Next Review</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {vendor.assessments.map((assessment) => (
                <TableRow key={assessment.id}>
                  <TableCell>{formatDate(assessment.createdAt)}</TableCell>
                  <TableCell>{assessment.assessedBy.name}</TableCell>
                  <TableCell>
                    {assessment.score != null ? (
                      <Badge
                        variant={
                          assessment.score >= 80
                            ? "success"
                            : assessment.score >= 60
                              ? "warning"
                              : "danger"
                        }
                      >
                        {assessment.score}/100
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="max-w-xs truncate text-sm">{assessment.findings || "—"}</span>
                  </TableCell>
                  <TableCell>{formatDate(assessment.nextReviewDate)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Edit Vendor Modal */}
      <EditVendorModal
        open={editOpen}
        vendor={vendor}
        onClose={() => setEditOpen(false)}
        onSaved={() => {
          setEditOpen(false);
          fetchVendor();
        }}
      />

      {/* Contact Form Modal */}
      <ContactFormModal
        open={contactOpen}
        vendorId={vendor.id}
        contact={editContact}
        onClose={() => {
          setContactOpen(false);
          setEditContact(null);
        }}
        onSaved={() => {
          setContactOpen(false);
          setEditContact(null);
          fetchVendor();
        }}
      />

      {/* Delete Contact Confirmation */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Contact">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Are you sure you want to remove <strong>{deleteTarget?.name}</strong> from this
          vendor&apos;s contacts?
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteContact} loading={deleting}>
            Delete Contact
          </Button>
        </div>
      </Modal>
    </div>
  );
}

// ──────────────────────────────────────────────
// Edit Vendor Modal
// ──────────────────────────────────────────────

function EditVendorModal({
  open,
  vendor,
  onClose,
  onSaved,
}: {
  open: boolean;
  vendor: VendorDetail;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [category, setCategory] = useState("");
  const [riskTier, setRiskTier] = useState<VendorRiskTier>("medium");
  const [status, setStatus] = useState<VendorStatus>("active");
  const [dataProcessing, setDataProcessing] = useState(false);
  const [isSubprocessor, setIsSubprocessor] = useState(false);
  const [subprocessorPurpose, setSubprocessorPurpose] = useState("");
  const [dataTypesShared, setDataTypesShared] = useState("");
  const [dataLocations, setDataLocations] = useState("");
  const [vendorDpaStatus, setVendorDpaStatus] = useState<DpaStatus>("not_required");
  const [dpaExpiresAt, setDpaExpiresAt] = useState("");
  const [contractStartDate, setContractStartDate] = useState("");
  const [contractEndDate, setContractEndDate] = useState("");

  useEffect(() => {
    if (open) {
      setName(vendor.name);
      setDescription(vendor.description ?? "");
      setWebsite(vendor.website ?? "");
      setCategory(vendor.category ?? "");
      setRiskTier(vendor.riskTier);
      setStatus(vendor.status);
      setDataProcessing(vendor.dataProcessing);
      setIsSubprocessor(vendor.isSubprocessor ?? false);
      setSubprocessorPurpose(vendor.subprocessorPurpose ?? "");
      setDataTypesShared((vendor.dataTypesShared ?? []).join(", "));
      setDataLocations((vendor.dataLocations ?? []).join(", "));
      setVendorDpaStatus(vendor.dpaStatus ?? "not_required");
      setDpaExpiresAt(
        vendor.dpaExpiresAt ? new Date(vendor.dpaExpiresAt).toISOString().split("T")[0] : "",
      );
      setContractStartDate(
        vendor.contractStartDate
          ? new Date(vendor.contractStartDate).toISOString().split("T")[0]
          : "",
      );
      setContractEndDate(
        vendor.contractEndDate ? new Date(vendor.contractEndDate).toISOString().split("T")[0] : "",
      );
      setError(null);
    }
  }, [open, vendor]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Vendor name is required");
      return;
    }
    setSaving(true);
    setError(null);

    const parseCsv = (v: string) =>
      v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

    try {
      await apiClient.updateVendor(vendor.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        website: website.trim() || undefined,
        category: category.trim() || undefined,
        riskTier,
        status,
        dataProcessing,
        isSubprocessor,
        subprocessorPurpose: isSubprocessor ? subprocessorPurpose.trim() || null : null,
        dataTypesShared: parseCsv(dataTypesShared),
        dataLocations: parseCsv(dataLocations),
        dpaStatus: vendorDpaStatus,
        dpaExpiresAt: dpaExpiresAt || null,
        contractStartDate: contractStartDate || null,
        contractEndDate: contractEndDate || null,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update vendor");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit Vendor" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        <fieldset className="space-y-4">
          <legend className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Vendor Information
          </legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              id="edit-name"
              label="Vendor Name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              id="edit-website"
              label="Website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>
          <Textarea
            id="edit-description"
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
          <Select
            id="edit-category"
            label="Category"
            options={CATEGORY_OPTIONS}
            placeholder="Select..."
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Risk & Status
          </legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              id="edit-risk"
              label="Risk Tier"
              options={RISK_TIER_OPTIONS}
              value={riskTier}
              onChange={(e) => setRiskTier(e.target.value as VendorRiskTier)}
            />
            <Select
              id="edit-status"
              label="Status"
              options={STATUS_OPTIONS}
              value={status}
              onChange={(e) => setStatus(e.target.value as VendorStatus)}
            />
          </div>
          <label className="flex items-center gap-3 text-sm text-neutral-700 dark:text-neutral-300">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500 dark:border-neutral-600"
              checked={dataProcessing}
              onChange={(e) => setDataProcessing(e.target.checked)}
            />
            This vendor processes personal or sensitive data
          </label>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Subprocessor & Data Processing
          </legend>
          <label className="flex items-center gap-3 text-sm text-neutral-700 dark:text-neutral-300">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500 dark:border-neutral-600"
              checked={isSubprocessor}
              onChange={(e) => setIsSubprocessor(e.target.checked)}
            />
            This vendor is a subprocessor (processes data on our behalf)
          </label>
          {isSubprocessor && (
            <Input
              id="edit-sp-purpose"
              label="Purpose"
              placeholder="e.g. Cloud hosting, Email delivery"
              value={subprocessorPurpose}
              onChange={(e) => setSubprocessorPurpose(e.target.value)}
            />
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              id="edit-data-types"
              label="Data Types Shared"
              placeholder="PII, Financial, Health"
              value={dataTypesShared}
              onChange={(e) => setDataTypesShared(e.target.value)}
            />
            <Input
              id="edit-data-locations"
              label="Data Locations"
              placeholder="US, EU, IN"
              value={dataLocations}
              onChange={(e) => setDataLocations(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              id="edit-dpa-status"
              label="DPA Status"
              options={DPA_STATUS_OPTIONS}
              value={vendorDpaStatus}
              onChange={(e) => setVendorDpaStatus(e.target.value as DpaStatus)}
            />
            <Input
              id="edit-dpa-expires"
              label="DPA Expiry"
              type="date"
              value={dpaExpiresAt}
              onChange={(e) => setDpaExpiresAt(e.target.value)}
            />
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Contract
          </legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              id="edit-start"
              label="Contract Start"
              type="date"
              value={contractStartDate}
              onChange={(e) => setContractStartDate(e.target.value)}
            />
            <Input
              id="edit-end"
              label="Contract End"
              type="date"
              value={contractEndDate}
              onChange={(e) => setContractEndDate(e.target.value)}
            />
          </div>
        </fieldset>

        <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ──────────────────────────────────────────────
// Contact Form Modal (Create + Edit)
// ──────────────────────────────────────────────

function ContactFormModal({
  open,
  vendorId,
  contact,
  onClose,
  onSaved,
}: {
  open: boolean;
  vendorId: string;
  contact: VendorContact | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!contact;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [phone, setPhone] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);

  useEffect(() => {
    if (open) {
      setName(contact?.name ?? "");
      setEmail(contact?.email ?? "");
      setRole(contact?.role ?? "");
      setPhone(contact?.phone ?? "");
      setIsPrimary(contact?.isPrimary ?? false);
      setError(null);
    }
  }, [open, contact]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Contact name is required");
      return;
    }
    setSaving(true);
    setError(null);

    const payload: CreateVendorContactInput = {
      name: name.trim(),
      email: email.trim() || undefined,
      role: role.trim() || undefined,
      phone: phone.trim() || undefined,
      isPrimary,
    };

    try {
      if (isEdit) {
        await apiClient.updateVendorContact(vendorId, contact.id, payload);
      } else {
        await apiClient.createVendorContact(vendorId, payload);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save contact");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Contact" : "Add Contact"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        <Input
          id="contact-name"
          label="Name *"
          placeholder="Contact name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          id="contact-email"
          label="Email"
          placeholder="email@vendor.com"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            id="contact-role"
            label="Role"
            placeholder="e.g. Account Manager"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
          <Input
            id="contact-phone"
            label="Phone"
            placeholder="+1 555-0123"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <label className="flex items-center gap-3 text-sm text-neutral-700 dark:text-neutral-300">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500 dark:border-neutral-600"
            checked={isPrimary}
            onChange={(e) => setIsPrimary(e.target.checked)}
          />
          Set as primary contact
        </label>

        <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {isEdit ? "Save" : "Add Contact"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ──────────────────────────────────────────────
// Documents Section
// ──────────────────────────────────────────────

const DOCUMENT_TYPE_LABELS: Record<VendorDocumentType, string> = {
  agreement: "Agreement",
  nda: "NDA",
  sla: "SLA",
  dpa: "DPA",
  sow: "Statement of Work",
  msa: "MSA",
  insurance_certificate: "Insurance Certificate",
  security_assessment: "Security Assessment",
  compliance_report: "Compliance Report",
  other: "Other",
};

const DOCUMENT_TYPE_OPTIONS = Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DocumentsSection({ vendor, onRefresh }: { vendor: VendorDetail; onRefresh: () => void }) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<VendorDocumentItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);

  async function handleDownload(doc: VendorDocumentItem) {
    setDownloading(doc.id);
    try {
      const res = await apiClient.getVendorDocumentDownloadUrl(vendor.id, doc.id);
      window.open(res.data.url, "_blank");
    } catch {
      /* ignore */
    } finally {
      setDownloading(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiClient.deleteVendorDocument(vendor.id, deleteTarget.id);
      setDeleteTarget(null);
      onRefresh();
    } catch {
      /* ignore */
    } finally {
      setDeleting(false);
    }
  }

  const docs = vendor.documents ?? [];

  return (
    <>
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
            Documents ({docs.length})
          </h3>
          <Button size="sm" onClick={() => setUploadOpen(true)}>
            Upload Document
          </Button>
        </div>
        {docs.length === 0 ? (
          <p className="py-6 text-center text-sm text-neutral-400">
            No documents uploaded yet. Upload agreements, NDAs, SLAs, and more.
          </p>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Title</TableHeader>
                <TableHeader>Type</TableHeader>
                <TableHeader>File</TableHeader>
                <TableHeader>Size</TableHeader>
                <TableHeader>Expires</TableHeader>
                <TableHeader>Uploaded</TableHeader>
                <TableHeader className="w-24" />
              </TableRow>
            </TableHead>
            <TableBody>
              {docs.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div>
                      <span className="font-medium text-neutral-900 dark:text-white">
                        {doc.title}
                      </span>
                      {doc.description && (
                        <p className="mt-0.5 text-xs text-neutral-400 truncate max-w-xs">
                          {doc.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral">
                      {DOCUMENT_TYPE_LABELS[doc.documentType] ?? doc.documentType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-neutral-500 truncate max-w-[10rem] inline-block">
                      {doc.fileName}
                    </span>
                  </TableCell>
                  <TableCell>{formatFileSize(doc.fileSize)}</TableCell>
                  <TableCell>
                    {doc.expiresAt ? (
                      <span
                        className={
                          new Date(doc.expiresAt) < new Date()
                            ? "text-red-600 dark:text-red-400"
                            : ""
                        }
                      >
                        {formatDate(doc.expiresAt)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-xs">
                      <div>{formatDate(doc.createdAt)}</div>
                      <div className="text-neutral-400">{doc.uploadedBy.name}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <button
                        className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-blue-600 dark:hover:bg-neutral-800 dark:hover:text-blue-400"
                        title="Download"
                        onClick={() => handleDownload(doc)}
                        disabled={downloading === doc.id}
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                          />
                        </svg>
                      </button>
                      <button
                        className="rounded p-1 text-neutral-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
                        title="Delete"
                        onClick={() => setDeleteTarget(doc)}
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <UploadDocumentModal
        open={uploadOpen}
        vendorId={vendor.id}
        onClose={() => setUploadOpen(false)}
        onUploaded={() => {
          setUploadOpen(false);
          onRefresh();
        }}
      />

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Document">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Are you sure you want to delete <strong>{deleteTarget?.title}</strong>? This will
          permanently remove the file.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={deleting}>
            Delete Document
          </Button>
        </div>
      </Modal>
    </>
  );
}

// ──────────────────────────────────────────────
// Upload Document Modal
// ──────────────────────────────────────────────

function UploadDocumentModal({
  open,
  vendorId,
  onClose,
  onUploaded,
}: {
  open: boolean;
  vendorId: string;
  onClose: () => void;
  onUploaded: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [documentType, setDocumentType] = useState<VendorDocumentType>("other");
  const [expiresAt, setExpiresAt] = useState("");

  useEffect(() => {
    if (open) {
      setFile(null);
      setTitle("");
      setDescription("");
      setDocumentType("other");
      setExpiresAt("");
      setError(null);
    }
  }, [open]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
    if (selected && !title.trim()) {
      setTitle(selected.name.replace(/\.[^/.]+$/, ""));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Please select a file");
      return;
    }
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      await apiClient.uploadVendorDocument(vendorId, file, {
        documentType,
        title: title.trim(),
        description: description.trim() || undefined,
        expiresAt: expiresAt || undefined,
      });
      onUploaded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload document");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Upload Document" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="doc-file"
            className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
          >
            File *
          </label>
          <input
            id="doc-file"
            type="file"
            onChange={handleFileChange}
            className="block w-full text-sm text-neutral-500 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100 dark:text-neutral-400 dark:file:bg-blue-950 dark:file:text-blue-300"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg,.gif,.zip"
          />
          {file && (
            <p className="mt-1 text-xs text-neutral-400">
              {file.name} ({formatFileSize(file.size)})
            </p>
          )}
        </div>

        <Input
          id="doc-title"
          label="Title *"
          placeholder="e.g. Service Agreement 2026"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <Select
          id="doc-type"
          label="Document Type"
          options={DOCUMENT_TYPE_OPTIONS}
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value as VendorDocumentType)}
        />

        <Textarea
          id="doc-description"
          label="Description"
          placeholder="Optional notes about this document..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />

        <Input
          id="doc-expires"
          label="Expiry Date"
          type="date"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
        />

        <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={uploading}>
            Upload
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ──────────────────────────────────────────────
// Research Section
// ──────────────────────────────────────────────

function ResearchSection({ vendor, onRefresh }: { vendor: VendorDetail; onRefresh: () => void }) {
  const [triggering, setTriggering] = useState(false);
  const [updatingFreq, setUpdatingFreq] = useState(false);
  const [expandedResearch, setExpandedResearch] = useState<string | null>(null);

  const latestResearch = vendor.researches?.find((r) => r.status === "completed") ?? null;
  const pendingResearch = vendor.researches?.find(
    (r) => r.status === "pending" || r.status === "in_progress",
  );

  async function handleTriggerResearch() {
    setTriggering(true);
    try {
      await apiClient.triggerVendorResearch(vendor.id);
      onRefresh();
    } catch {
      /* ignore */
    } finally {
      setTriggering(false);
    }
  }

  async function handleFrequencyChange(freq: ResearchFrequency) {
    setUpdatingFreq(true);
    try {
      await apiClient.updateResearchSettings(vendor.id, freq);
      onRefresh();
    } catch {
      /* ignore */
    } finally {
      setUpdatingFreq(false);
    }
  }

  const freqLabel =
    RESEARCH_FREQUENCY_OPTIONS.find((o) => o.value === vendor.researchFrequency)?.label ??
    "Not set";

  return (
    <>
      {/* Research Settings + Latest Score */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
              Research Settings
            </h3>
            <Button
              size="sm"
              onClick={handleTriggerResearch}
              loading={triggering}
              disabled={!!pendingResearch}
            >
              {pendingResearch ? "Research in Progress..." : "Run Research Now"}
            </Button>
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-neutral-500">Frequency</dt>
              <dd>
                <Select
                  id="research-freq"
                  options={RESEARCH_FREQUENCY_OPTIONS}
                  value={vendor.researchFrequency}
                  onChange={(e) => handleFrequencyChange(e.target.value as ResearchFrequency)}
                />
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Last Researched</dt>
              <dd className="text-neutral-900 dark:text-white">
                {formatDate(vendor.lastResearchedAt)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Next Research</dt>
              <dd className="text-neutral-900 dark:text-white">
                {vendor.researchFrequency === "none"
                  ? "Disabled"
                  : formatDate(vendor.nextResearchAt)}
              </dd>
            </div>
            {vendor.knownVendor && (
              <div className="flex justify-between">
                <dt className="text-neutral-500">Known Vendor</dt>
                <dd className="text-blue-600 dark:text-blue-400">{vendor.knownVendor.name}</dd>
              </div>
            )}
          </dl>
        </Card>

        {latestResearch && (
          <Card>
            <h3 className="mb-3 text-sm font-semibold text-neutral-800 dark:text-neutral-200">
              Latest Research Score
            </h3>
            <dl className="space-y-2 text-sm">
              <ScoreBadge score={latestResearch.overallScore} label="Overall" />
              <ScoreBadge score={latestResearch.securityScore} label="Security" />
              <ScoreBadge score={latestResearch.complianceScore} label="Compliance" />
              <ScoreBadge score={latestResearch.reputationScore} label="Reputation" />
              <ScoreBadge score={latestResearch.financialScore} label="Financial" />
            </dl>
          </Card>
        )}

        {!latestResearch && !pendingResearch && (
          <Card>
            <div className="flex h-full flex-col items-center justify-center py-6">
              <p className="text-sm text-neutral-500">
                No research data yet. Click &quot;Run Research Now&quot; to trigger an AI-powered
                deep assessment.
              </p>
            </div>
          </Card>
        )}

        {!latestResearch && pendingResearch && (
          <Card>
            <div className="flex h-full flex-col items-center justify-center py-6">
              <svg
                className="mb-2 h-6 w-6 animate-spin text-blue-600"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              <p className="text-sm text-neutral-500">Deep research is in progress...</p>
            </div>
          </Card>
        )}
      </div>

      {/* Research Summary (if completed) */}
      {latestResearch?.summary && (
        <Card>
          <h3 className="mb-3 text-sm font-semibold text-neutral-800 dark:text-neutral-200">
            Research Summary
          </h3>
          <p className="whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-300">
            {latestResearch.summary}
          </p>
          {latestResearch.recommendations && (
            <>
              <h4 className="mt-4 mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Recommendations
              </h4>
              <p className="whitespace-pre-wrap text-sm text-neutral-600 dark:text-neutral-400">
                {latestResearch.recommendations}
              </p>
            </>
          )}
        </Card>
      )}

      {/* Research Findings */}
      {latestResearch?.findings &&
        Array.isArray(latestResearch.findings) &&
        latestResearch.findings.length > 0 && (
          <Card>
            <h3 className="mb-4 text-sm font-semibold text-neutral-800 dark:text-neutral-200">
              Research Findings ({(latestResearch.findings as any[]).length})
            </h3>
            <div className="space-y-3">
              {(latestResearch.findings as any[]).map((finding: any, idx: number) => {
                const severityBadge: Record<string, any> = {
                  critical: "danger",
                  high: "warning",
                  medium: "info",
                  low: "success",
                  info: "neutral",
                };
                return (
                  <div
                    key={idx}
                    className="rounded-lg border border-neutral-200 px-4 py-3 dark:border-neutral-700"
                  >
                    <div className="flex items-start gap-2">
                      <Badge variant={severityBadge[finding.severity] ?? "neutral"}>
                        {finding.severity}
                      </Badge>
                      <Badge variant="neutral">{finding.category}</Badge>
                      <span className="flex-1 text-sm font-medium text-neutral-900 dark:text-white">
                        {finding.title}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                      {finding.description}
                    </p>
                    {finding.source && (
                      <p className="mt-1 text-xs text-neutral-400">Source: {finding.source}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        )}

      {/* Research History */}
      {(vendor.researches?.length ?? 0) > 0 && (
        <Card>
          <h3 className="mb-4 text-sm font-semibold text-neutral-800 dark:text-neutral-200">
            Research History ({vendor.researches?.length ?? 0})
          </h3>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Date</TableHeader>
                <TableHeader>Type</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Score</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {vendor.researches?.map((r) => (
                <TableRow
                  key={r.id}
                  className="cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                  onClick={() => setExpandedResearch(expandedResearch === r.id ? null : r.id)}
                >
                  <TableCell>{formatDate(r.completedAt || r.createdAt)}</TableCell>
                  <TableCell>
                    {r.researchType === "deep_research" ? "Deep Research" : "Periodic Update"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        r.status === "completed"
                          ? "success"
                          : r.status === "failed"
                            ? "danger"
                            : r.status === "in_progress"
                              ? "warning"
                              : "neutral"
                      }
                    >
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {r.overallScore != null ? (
                      <Badge
                        variant={
                          r.overallScore >= 80
                            ? "success"
                            : r.overallScore >= 60
                              ? "warning"
                              : "danger"
                        }
                      >
                        {r.overallScore}/100
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </>
  );
}
