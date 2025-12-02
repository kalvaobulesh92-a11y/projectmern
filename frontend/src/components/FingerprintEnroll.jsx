import React, { useState } from 'react';
import API from '../api';

export default function FingerprintEnroll() {
  const [status, setStatus] = useState('idle');
  const [fpId, setFpId] = useState(null);

  const startEnroll = async () => {
    setStatus('starting');
    try {
      const res = await API.post('/fingerprint/start-enroll');
      setFpId(res.data.fpId);
      setStatus('place-step-1');
    } catch (err) {
      setStatus('error');
    }
  };

  const doStep = async (step) => {
    setStatus(`waiting-step-${step}`);
    try {
      const res = await API.post('/fingerprint/enroll-step', { step, fpId });
      console.log('step result', res.data);
      if (step === 3) {
        // finalize
        await API.post('/fingerprint/finalize-enroll', { fpId });
        setStatus('done');
      } else {
        setStatus(`place-step-${step+1}`);
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  return (
    <div>
      <h3>Fingerprint Enroll</h3>
      <p>Status: {status}</p>
      {status === 'idle' && <button onClick={startEnroll}>Start Enroll</button>}
      {status === 'place-step-1' && <button onClick={() => doStep(1)}>Capture Step 1</button>}
      {status === 'place-step-2' && <button onClick={() => doStep(2)}>Capture Step 2</button>}
      {status === 'place-step-3' && <button onClick={() => doStep(3)}>Capture Step 3 (Finalize)</button>}
      {status === 'done' && <p>Fingerprint enrolled successfully.</p>}
    </div>
  );
}