import type { GesturePriority } from './types';

export type GestureCandidate = {
  owner: string;
  priority: GesturePriority;
  onCancel?: () => void;
};

type PointerArena = {
  candidates: Map<string, GestureCandidate>;
  owner: string | null;
};

const PRIORITY: Record<GesturePriority, number> = {
  passive: 0,
  default: 1,
  content: 2,
  system: 3,
};

export class GestureArena {
  private readonly pointers = new Map<number, PointerArena>();

  register(pointerId: number, candidate: GestureCandidate) {
    const arena = this.pointers.get(pointerId) ?? {
      candidates: new Map<string, GestureCandidate>(),
      owner: null,
    };

    arena.candidates.set(candidate.owner, candidate);
    this.pointers.set(pointerId, arena);

    return () => this.unregister(pointerId, candidate.owner);
  }

  claim(pointerId: number, owner: string) {
    const arena = this.pointers.get(pointerId);
    const candidate = arena?.candidates.get(owner);

    if (!arena || !candidate) {
      return false;
    }

    if (arena.owner === owner) {
      return true;
    }

    if (arena.owner === null) {
      arena.owner = owner;
      this.cancelLosingCandidates(arena, candidate);
      return true;
    }

    const current = arena.candidates.get(arena.owner);
    if (!current) {
      arena.owner = owner;
      this.cancelLosingCandidates(arena, candidate);
      return true;
    }

    if (PRIORITY[candidate.priority] > PRIORITY[current.priority]) {
      arena.owner = owner;
      this.cancelLosingCandidates(arena, candidate);
      return true;
    }

    return false;
  }

  owns(pointerId: number, owner: string) {
    return this.pointers.get(pointerId)?.owner === owner;
  }

  release(pointerId: number, owner: string) {
    const arena = this.pointers.get(pointerId);
    if (!arena) {
      return;
    }

    if (arena.owner === owner) {
      arena.owner = null;
    }

    arena.candidates.delete(owner);
    if (arena.candidates.size === 0) {
      this.pointers.delete(pointerId);
    }
  }

  cancel(pointerId: number, owner: string) {
    const arena = this.pointers.get(pointerId);
    const candidate = arena?.candidates.get(owner);

    candidate?.onCancel?.();
    this.release(pointerId, owner);
  }

  dispose() {
    const candidates = [...this.pointers.values()].flatMap((arena) => [
      ...arena.candidates.values(),
    ]);
    this.pointers.clear();
    for (const candidate of candidates) candidate.onCancel?.();
  }

  private unregister(pointerId: number, owner: string) {
    const arena = this.pointers.get(pointerId);
    if (!arena) {
      return;
    }

    arena.candidates.delete(owner);

    if (arena.owner === owner) {
      arena.owner = null;
    }

    if (arena.candidates.size === 0) {
      this.pointers.delete(pointerId);
    }
  }

  private cancelLosingCandidates(arena: PointerArena, winner: GestureCandidate) {
    const winnerPriority = PRIORITY[winner.priority];
    const losers = [...arena.candidates.values()].filter(
      (candidate) =>
        candidate.owner !== winner.owner && PRIORITY[candidate.priority] <= winnerPriority,
    );

    for (const candidate of losers) {
      arena.candidates.delete(candidate.owner);
      candidate.onCancel?.();
    }
  }
}
