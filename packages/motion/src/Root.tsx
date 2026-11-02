import React from 'react';
import { Composition } from 'remotion';
import sample from '../data/grubik-2026-11-07.json';
import { MatchProps } from './match';
import { TEMPLATES } from './templates';
import { Film, filmLength } from './templates/shared';

// Każdy wzór to osobna kompozycja 1080×1920, 30 kl./s; długość wynika z ujęć dla danych meczu.
export const Root: React.FC = () => (
  <>
    {TEMPLATES.map((t) => (
      <Composition
        key={t.id}
        id={t.id}
        component={({ match }: { match: MatchProps }) => <Film m={match} template={t} />}
        defaultProps={{ match: sample as MatchProps }}
        calculateMetadata={({ props }) => {
          const missing = t.requires(props.match);
          if (missing) throw new Error(`Wzór ${t.id}: ${missing}`);
          return { durationInFrames: filmLength(t.shots(props.match)) };
        }}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
      />
    ))}
  </>
);
