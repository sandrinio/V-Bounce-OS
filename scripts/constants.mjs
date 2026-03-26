#!/usr/bin/env node

/**
 * constants.mjs
 * Shared constants for V-Bounce Engine scripts.
 * Single source of truth for story states and terminal states.
 */

/** All valid story states in lifecycle order. */
export const VALID_STATES = [
  'Draft', 'Refinement', 'Ready to Bounce', 'Bouncing',
  'QA Passed', 'Architect Passed', 'Done', 'Escalated', 'Parking Lot'
];

/** Terminal states — stories that are no longer active. */
export const TERMINAL_STATES = ['Done', 'Escalated', 'Parking Lot'];
