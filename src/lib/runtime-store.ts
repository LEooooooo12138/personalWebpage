import { baseProjects, initialGuestNotes } from "@/lib/portfolio-data";
import { GuestNote } from "@/types/portfolio";

type RuntimeStore = {
  projectClaps: Record<string, number>;
  guestNotes: GuestNote[];
};

declare global {
  var __v3Store: RuntimeStore | undefined;
}

const createStore = (): RuntimeStore => ({
  projectClaps: Object.fromEntries(baseProjects.map((p) => [p.id, 0])),
  guestNotes: [...initialGuestNotes],
});

export const getRuntimeStore = (): RuntimeStore => {
  if (!globalThis.__v3Store) {
    globalThis.__v3Store = createStore();
  }
  return globalThis.__v3Store;
};
