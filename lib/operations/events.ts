/**
 * BGMI Tournament Control Center — Provider-Neutral Domain Events
 * Decoupled event emitter system supporting in-memory pub/sub, audit trail logging,
 * and future streaming bridges (WebSockets, SSE, Kafka, Webhooks).
 */

import {
  DomainEventEnvelope,
  DomainEventHandler,
  DomainEventTopic,
} from './types';

export interface EventFilter {
  topic?: DomainEventTopic | string;
  aggregateType?: DomainEventEnvelope['aggregateType'];
  aggregateId?: string;
  since?: string | Date;
  limit?: number;
}

export interface AuditLogDto {
  action: string;
  entityType: string;
  entityId: string;
  beforeState?: string | null;
  afterState?: string | null;
  reason?: string | null;
  userId?: string | null;
}

export class DomainEventBus {
  private handlers = new Map<string, Set<DomainEventHandler<any>>>();
  private history: DomainEventEnvelope[] = [];
  private maxHistorySize: number;

  constructor(maxHistorySize = 500) {
    this.maxHistorySize = maxHistorySize;
  }

  /**
   * Subscribe to a specific topic or '*' for all operational events.
   * Returns an unsubscribe function.
   */
  subscribe<T = unknown>(
    topic: DomainEventTopic | '*',
    handler: DomainEventHandler<T>
  ): () => void {
    if (!this.handlers.has(topic)) {
      this.handlers.set(topic, new Set());
    }
    this.handlers.get(topic)!.add(handler);

    return () => {
      this.handlers.get(topic)?.delete(handler);
      if (this.handlers.get(topic)?.size === 0) {
        this.handlers.delete(topic);
      }
    };
  }

  /**
   * Publish a typed domain event envelope to all registered subscribers.
   */
  async emit<T = unknown>(
    topic: DomainEventTopic,
    aggregateType: DomainEventEnvelope['aggregateType'],
    aggregateId: string,
    payload: T,
    actorUserId?: string | null
  ): Promise<DomainEventEnvelope<T>> {
    const envelope: DomainEventEnvelope<T> = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      topic,
      aggregateType,
      aggregateId,
      timestamp: new Date().toISOString(),
      payload,
      actorUserId: actorUserId ?? null,
      version: 1,
    };

    // Store in internal circular history
    this.history.push(envelope as DomainEventEnvelope);
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }

    // Notify exact topic subscribers
    const exactSubscribers = this.handlers.get(topic);
    if (exactSubscribers) {
      for (const handler of Array.from(exactSubscribers)) {
        try {
          await handler(envelope);
        } catch (err) {
          console.error(`[DomainEventBus] Handler error for topic "${topic}":`, err);
        }
      }
    }

    // Notify wildcard subscribers ('*')
    const wildcardSubscribers = this.handlers.get('*');
    if (wildcardSubscribers) {
      for (const handler of Array.from(wildcardSubscribers)) {
        try {
          await handler(envelope);
        } catch (err) {
          console.error(`[DomainEventBus] Wildcard handler error for topic "${topic}":`, err);
        }
      }
    }

    return envelope;
  }

  /**
   * Query event history with optional filters (useful for replay, audit review, or status testing).
   */
  getHistory(filter?: EventFilter): DomainEventEnvelope[] {
    let result = [...this.history];

    if (!filter) return result;

    if (filter.topic) {
      result = result.filter((e) => e.topic === filter.topic);
    }
    if (filter.aggregateType) {
      result = result.filter((e) => e.aggregateType === filter.aggregateType);
    }
    if (filter.aggregateId) {
      result = result.filter((e) => e.aggregateId === filter.aggregateId);
    }
    if (filter.since) {
      const sinceDate = new Date(filter.since).getTime();
      result = result.filter((e) => new Date(e.timestamp).getTime() >= sinceDate);
    }
    if (filter.limit && filter.limit > 0) {
      result = result.slice(-filter.limit);
    }

    return result;
  }

  /**
   * Convert a DomainEventEnvelope into a standardized AuditLog format for Prisma persistence.
   */
  toAuditLogDto(event: DomainEventEnvelope, reason?: string): AuditLogDto {
    return {
      action: event.topic,
      entityType: event.aggregateType,
      entityId: event.aggregateId,
      afterState: JSON.stringify(event.payload),
      reason: reason ?? null,
      userId: event.actorUserId ?? null,
    };
  }

  /**
   * Clear event history (e.g. for test isolation).
   */
  clearHistory(): void {
    this.history = [];
  }

  /**
   * Reset all subscriber listeners.
   */
  clearSubscribers(): void {
    this.handlers.clear();
  }
}

// Global singleton instance for operational event dispatch
export const domainEventBus = new DomainEventBus();

// ---------------------------------------------------------------------------
// Convenience domain event emitter helpers
// ---------------------------------------------------------------------------

export async function emitMatchStarting(
  matchId: string,
  details: { matchNumber: number; title: string; map: string; roomId?: string | null },
  operatorUserId?: string | null
): Promise<DomainEventEnvelope> {
  return domainEventBus.emit('match.starting', 'MATCH', matchId, details, operatorUserId);
}

export async function emitTeamAbsent(
  matchId: string | null,
  teamId: string,
  details: { tournamentId: string; teamName?: string; reason?: string },
  operatorUserId?: string | null
): Promise<DomainEventEnvelope> {
  return domainEventBus.emit('team.absent', 'TEAM', teamId, { ...details, matchId }, operatorUserId);
}

export async function emitResultSubmitted(
  matchId: string,
  details: { scoresCount: number; submittedBy?: string },
  operatorUserId?: string | null
): Promise<DomainEventEnvelope> {
  return domainEventBus.emit('result.submitted', 'RESULT', matchId, details, operatorUserId);
}

export async function emitResultVerified(
  matchId: string,
  details: { verifiedBy: string; scoreCount: number },
  operatorUserId?: string | null
): Promise<DomainEventEnvelope> {
  return domainEventBus.emit('result.verified', 'RESULT', matchId, details, operatorUserId);
}

export async function emitResultPublished(
  matchId: string,
  details: { publishedBy: string; wwcdTeamId: string; totalPointsAwarded: number },
  operatorUserId?: string | null
): Promise<DomainEventEnvelope> {
  return domainEventBus.emit('result.published', 'RESULT', matchId, details, operatorUserId);
}

export async function emitPenaltyIssued(
  penaltyId: string,
  details: { tournamentId: string; teamId: string; matchId?: string | null; pointsDeducted: number; reason: string },
  operatorUserId?: string | null
): Promise<DomainEventEnvelope> {
  return domainEventBus.emit('penalty.issued', 'PENALTY', penaltyId, details, operatorUserId);
}

export async function emitDisputeCreated(
  disputeId: string,
  details: { tournamentId: string; teamId: string; matchId?: string | null; category: string; description: string },
  operatorUserId?: string | null
): Promise<DomainEventEnvelope> {
  return domainEventBus.emit('dispute.created', 'DISPUTE', disputeId, details, operatorUserId);
}

export async function emitDisputeResolved(
  disputeId: string,
  details: { tournamentId: string; teamId: string; status: string; resolutionNotes?: string | null },
  operatorUserId?: string | null
): Promise<DomainEventEnvelope> {
  return domainEventBus.emit('dispute.resolved', 'DISPUTE', disputeId, details, operatorUserId);
}
