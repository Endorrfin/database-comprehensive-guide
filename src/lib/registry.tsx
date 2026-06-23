import type { ComponentType } from 'react';
import { BTreeSim } from '../components/sims/BTreeSim';
import { BTreeNodeAnatomy } from '../components/figures/BTreeNodeAnatomy';

/*
 * Registry — content references figures and sims by KEY (CLAUDE.md §4), resolved here.
 * Keeps the data layer declarative and widgets reusable. New sims/figures register here.
 */
export const sims: Record<string, ComponentType> = {
  btree: BTreeSim,
};

export const figures: Record<string, ComponentType> = {
  'btree-node-anatomy': BTreeNodeAnatomy,
};

export const getSim = (key: string): ComponentType | undefined => sims[key];
export const getFigure = (key: string): ComponentType | undefined => figures[key];
