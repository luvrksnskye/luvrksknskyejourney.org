import { createForms } from './forms.js?v=2';

self.onmessage = e => {
  const job = e.data || {};
  if (job.type !== 'run') return;
  const forms = createForms(job.side, job.graph || { nodes: [], edges: [] });
  job.names.forEach((name, i) => {
    const data = forms.make(name);
    self.postMessage({ type: 'form', run: job.run, index: i, data: data }, [data.buffer]);
  });
  self.postMessage({ type: 'done', run: job.run });
};
