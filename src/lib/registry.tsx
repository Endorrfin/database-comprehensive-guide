import type { ComponentType } from 'react';
import { BTreeSim } from '../components/sims/BTreeSim';
// CHANGED (S2): M2 embedded families map.
import { FamiliesMap } from '../components/sims/FamiliesMap';
import { BTreeNodeAnatomy } from '../components/figures/BTreeNodeAnatomy';
// CHANGED (S2): M1 + M3 figures.
import { FilesVsDbms } from '../components/figures/FilesVsDbms';
import { SqlNoSqlQuadrant } from '../components/figures/SqlNoSqlQuadrant';

/*
 * Registry — content references figures and sims by KEY (CLAUDE.md §4), resolved here.
 * Keeps the data layer declarative and widgets reusable. New sims/figures register here.
 */
export const sims: Record<string, ComponentType> = {
  btree: BTreeSim,
  'families-map': FamiliesMap, // CHANGED (S2)
};

export const figures: Record<string, ComponentType> = {
  'btree-node-anatomy': BTreeNodeAnatomy,
  'files-vs-dbms': FilesVsDbms, // CHANGED (S2)
  'sql-nosql-quadrant': SqlNoSqlQuadrant, // CHANGED (S2)
};

export const getSim = (key: string): ComponentType | undefined => sims[key];
export const getFigure = (key: string): ComponentType | undefined => figures[key];
