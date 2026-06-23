import type { ComponentType } from 'react';
import { BTreeSim } from '../components/sims/BTreeSim';
// CHANGED (S2): M2 embedded families map.
import { FamiliesMap } from '../components/sims/FamiliesMap';
// CHANGED (S3): M5 query-lifecycle stepper.
import { QueryLifecycleSim } from '../components/sims/QueryLifecycleSim';
// CHANGED (S4): M6 ER explorer + M7 normalization stepper.
import { ErExplorer } from '../components/sims/ErExplorer';
import { NormalizationSim } from '../components/sims/NormalizationSim';
import { BTreeNodeAnatomy } from '../components/figures/BTreeNodeAnatomy';
// CHANGED (S2): M1 + M3 figures.
import { FilesVsDbms } from '../components/figures/FilesVsDbms';
import { SqlNoSqlQuadrant } from '../components/figures/SqlNoSqlQuadrant';
// CHANGED (S3): M4 relational-model figure.
import { RelationalModel } from '../components/figures/RelationalModel';
// CHANGED (S4): M6 ER-notation legend + M7 update-anomalies figure.
import { ErNotation } from '../components/figures/ErNotation';
import { UpdateAnomalies } from '../components/figures/UpdateAnomalies';
// CHANGED (S5): M8 referential-actions + M9 float-trap figures.
import { ReferentialActions } from '../components/figures/ReferentialActions';
import { FloatTrap } from '../components/figures/FloatTrap';
// CHANGED (S6): M10 window-frame + M11 view-vs-matview figures.
import { WindowFrame } from '../components/figures/WindowFrame';
import { ViewVsMatview } from '../components/figures/ViewVsMatview';

/*
 * Registry — content references figures and sims by KEY (CLAUDE.md §4), resolved here.
 * Keeps the data layer declarative and widgets reusable. New sims/figures register here.
 */
export const sims: Record<string, ComponentType> = {
  btree: BTreeSim,
  'families-map': FamiliesMap, // CHANGED (S2)
  'query-lifecycle': QueryLifecycleSim, // CHANGED (S3)
  'er-explorer': ErExplorer, // CHANGED (S4)
  'normalization-stepper': NormalizationSim, // CHANGED (S4)
};

export const figures: Record<string, ComponentType> = {
  'btree-node-anatomy': BTreeNodeAnatomy,
  'files-vs-dbms': FilesVsDbms, // CHANGED (S2)
  'sql-nosql-quadrant': SqlNoSqlQuadrant, // CHANGED (S2)
  'relational-model': RelationalModel, // CHANGED (S3)
  'er-notation': ErNotation, // CHANGED (S4)
  'update-anomalies': UpdateAnomalies, // CHANGED (S4)
  'referential-actions': ReferentialActions, // CHANGED (S5)
  'float-trap': FloatTrap, // CHANGED (S5)
  'window-frame': WindowFrame, // CHANGED (S6)
  'view-vs-matview': ViewVsMatview, // CHANGED (S6)
};

export const getSim = (key: string): ComponentType | undefined => sims[key];
export const getFigure = (key: string): ComponentType | undefined => figures[key];
