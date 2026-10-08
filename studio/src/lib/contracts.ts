// The only place where the browser imports backend Studio modules.
// These files are fingerprinted by backend/studio/design-manifest.json and take part in
// design approval keys: never edit them for UI needs, adapt here instead.
export { formats, projectSchema, visualStyles, postTypes, newPostProject } from '../../../backend/studio/contracts.js';
export {
  migrateDesign,
  DESIGN_VERSION,
  designFormats,
  compositionLabel,
  projectTemplateVersion,
} from '../../../backend/studio/post-types.js';
export { materialCompatible } from '../../../backend/studio/material-context.js';

import { formats } from '../../../backend/studio/contracts.js';
export type FormatId = keyof typeof formats;
export const formatSpec = (format: string) => formats[format as FormatId];
