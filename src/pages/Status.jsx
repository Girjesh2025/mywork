import React from 'react';
import { Th, Td, Progress } from '../components/ui';
import { niceDate, badgeFor } from '../utils/helpers';

export default function StatusPage({ projects }) {
  return (
    <section className="mt-6">
      <h2 className="text-2xl font-bold">Status</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm bg-white/5 rounded-2xl overflow-hidden">
          <thead className="bg-white/10">
            <tr className="text-left">
              <Th>Project</Th>
              <Th>Status</Th>
              <Th>Progress</Th>
              <Th>Updated</Th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.id} className="border-t border-white/10">
                <Td className="font-medium">{p.name}</Td>
                <Td><span className={`px-2 py-1 rounded-lg text-xs font-semibold ${badgeFor(p.status)}`}>{p.status}</span></Td>
                <Td><Progress value={p.progress} /></Td>
                <Td>{niceDate(p.updatedAt)}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
