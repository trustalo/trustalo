"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  apiClient,
  type MyPolicyItem,
  type MyTrainingItem,
  type PersonListItem,
} from "@/lib/api-client";

/**
 * Self-service portal for the `member` role (and anyone with `self:read`):
 * view + acknowledge assigned policies and complete assigned training. Every
 * call is scoped to the caller's own records server-side.
 */
export default function MyCompliancePage() {
  const [person, setPerson] = useState<PersonListItem | null>(null);
  const [policies, setPolicies] = useState<MyPolicyItem[]>([]);
  const [training, setTraining] = useState<MyTrainingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [me, pol, tr] = await Promise.all([
        apiClient.getMyPerson(),
        apiClient.listMyPolicies(),
        apiClient.listMyTraining(),
      ]);
      setPerson(me.data);
      setPolicies(pol.data.items);
      setTraining(tr.data.items);
    } catch (err) {
      setError((err as Error)?.message || "Failed to load your compliance items");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function acknowledge(policyId: string) {
    setBusyId(policyId);
    try {
      await apiClient.acknowledgeMyPolicy(policyId);
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function complete(completionId: string) {
    setBusyId(completionId);
    try {
      await apiClient.completeMyTraining(completionId);
      await load();
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <div className="py-12 text-center text-sm text-neutral-500">Loading…</div>;
  if (error) return <div className="py-12 text-center text-sm text-red-600">{error}</div>;

  const outstandingPolicies = policies.filter((p) => !p.acknowledgedCurrent).length;
  const outstandingTraining = training.filter((t) => t.status !== "completed").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          My Compliance
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          {person ? `${person.fullName} · ` : ""}
          {outstandingPolicies + outstandingTraining === 0
            ? "You're all caught up."
            : `${outstandingPolicies} policy + ${outstandingTraining} training item(s) outstanding.`}
        </p>
      </div>

      <Card padding="lg">
        <h2 className="mb-3 text-lg font-medium">Policies to acknowledge</h2>
        {policies.length === 0 ? (
          <p className="text-sm text-neutral-500">No published policies.</p>
        ) : (
          <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {policies.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="font-medium">{p.title}</div>
                  {p.category && <div className="text-xs text-neutral-500">{p.category}</div>}
                </div>
                {p.acknowledgedCurrent ? (
                  <Badge variant="success">Acknowledged</Badge>
                ) : (
                  <Button size="sm" onClick={() => acknowledge(p.id)} disabled={busyId === p.id}>
                    {busyId === p.id ? "Saving…" : "Acknowledge"}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card padding="lg">
        <h2 className="mb-3 text-lg font-medium">My training</h2>
        {training.length === 0 ? (
          <p className="text-sm text-neutral-500">No training assigned.</p>
        ) : (
          <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {training.map((t) => (
              <li key={t.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="font-medium">{t.trainingProgram.title}</div>
                  <div className="text-xs capitalize text-neutral-500">
                    {t.trainingProgram.type.replace(/_/g, " ")}
                    {t.trainingProgram.isRequired ? " · required" : ""}
                  </div>
                </div>
                {t.status === "completed" ? (
                  <Badge variant="success">Completed</Badge>
                ) : (
                  <Button size="sm" onClick={() => complete(t.id)} disabled={busyId === t.id}>
                    {busyId === t.id ? "Saving…" : "Mark complete"}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
