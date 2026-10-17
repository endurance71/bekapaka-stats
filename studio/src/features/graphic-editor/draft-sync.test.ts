import { describe, expect, it } from 'vitest';
import { newPostProject, projectTemplateVersion } from '../../lib/contracts';
import type { Project } from '../../lib/types';
import { engineMismatch, needsSave, payloadKey } from './draft-sync';

const project = newPostProject('matchday') as Project;
const current = projectTemplateVersion(project);
// What the API stores when it runs a different engine build than this bundle.
const otherEngine = current.replace(/engine-[0-9a-f]+/, 'engine-000000000000');
const reversed = (value: unknown): unknown =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? Object.fromEntries(
        Object.entries(value)
          .reverse()
          .map(([k, v]) => [k, reversed(v)]),
      )
    : value;

describe('autosave decision', () => {
  it('saves an edited payload', () => {
    const edited = { ...project, name: 'Inna nazwa' };
    expect(needsSave({ latest: edited, server: { payload: project, templateVersion: current }, accepted: null })).toBe(
      true,
    );
  });

  it('does not save an unchanged payload with the current design key', () => {
    expect(needsSave({ latest: project, server: { payload: project, templateVersion: current }, accepted: null })).toBe(
      false,
    );
  });

  it('ignores key order from JSONB', () => {
    const server = { payload: reversed(project) as Project, templateVersion: current };
    expect(payloadKey(server.payload)).toBe(payloadKey(project));
    expect(needsSave({ latest: project, server, accepted: null })).toBe(false);
  });

  it('re-saves a stale design key once, then stops even if the server keeps a different engine key', () => {
    const server = { payload: project, templateVersion: otherEngine };
    expect(needsSave({ latest: project, server, accepted: null })).toBe(true);
    // The server accepted this exact payload and still answers with its own engine key:
    // the old loop PUT it again forever, creating a new identical revision each time.
    expect(needsSave({ latest: project, server, accepted: payloadKey(project) })).toBe(false);
    expect(engineMismatch(server)).toBe(true);
  });

  it('does not re-send an accepted payload the server normalised differently', () => {
    const server = { payload: { ...project, name: `${project.name} ` }, templateVersion: current };
    expect(needsSave({ latest: project, server, accepted: payloadKey(project) })).toBe(false);
  });

  it('saves again after a new edit following an accepted save', () => {
    const edited = { ...project, name: 'Po zapisie' };
    expect(
      needsSave({
        latest: edited,
        server: { payload: project, templateVersion: current },
        accepted: payloadKey(project),
      }),
    ).toBe(true);
  });
});
