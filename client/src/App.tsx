import React, {  useState } from 'react';
import './App.scss';
import axios, { AxiosResponse } from 'axios';

interface ApiResponse {
  index: number;
  delay: string;
}

function App() {
  const [concurrency, setConcurrency] = useState<number>(10);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [results, setResults] = useState<ApiResponse[]>([]);

  const inputChange = (value: number): void => {
    if (value >= 0 && value <= 100) {
      setConcurrency(value);
    }
  };

  const start = async (): Promise<void> => {
    setIsRunning(true);
    setResults([]);
    await sendRequests(concurrency);
  };

  const sendRequests = async (maxPerSec: number): Promise<void> => {
    let requestIndex = 0;
    const activeRequests: Promise<ApiResponse | null>[] = [];
    const totalRequests = 1000;
    let currPerSec = 0;

    const sendSingleRequest = async (index: number): Promise<ApiResponse | null> => {
      requestIndex++;
      try {
        const response: AxiosResponse<ApiResponse> = await axios.post('http://localhost:8080/api', { index });
        const data = response.data;
        setResults(prev => [...prev, data]);
        return data;
      } catch (e:any) {
        setIsRunning(false);
        console.error(e);
        return null;
      }
    };

    const intervalId = setInterval(() => {
      currPerSec = 0;
    }, 1000);

    const addRequest = (): void => {
      if (requestIndex < totalRequests) {
        const request = sendSingleRequest(requestIndex);
        activeRequests.push(request);
        currPerSec++;

        request.finally(() => {
          activeRequests.splice(activeRequests.indexOf(request), 1);
        });
      }
    };

    const manageRequests = async (): Promise<void> => {
      console.log('currPerSec', currPerSec, 'activeRequests', activeRequests.length);

      if (currPerSec >= maxPerSec) {
        console.log('max per sec reached', currPerSec);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (activeRequests.length >= maxPerSec) {
        await Promise.race(activeRequests);
      }

      addRequest();

      if (requestIndex === totalRequests) {
        clearInterval(intervalId);
        setIsRunning(false);
        console.log('clear interval');
      }

      if (requestIndex < totalRequests && activeRequests.length >= 0) {
        await manageRequests();
      }
    };

    manageRequests();
  };


  return (
    <div className="App">
      <div className="container">
        <div className="input-container">
          <input value={concurrency} onChange={e => inputChange(Number(e.target.value))} className='main-input' type="text" />
          <button disabled={isRunning} onClick={() => start()}>{!isRunning ? 'Start' : 'Run'}</button>
        </div>

        <div className="result-list">
          {results.length > 0 && <p>Total: {results.length}</p>}
          {results.map((result: ApiResponse) => (
            <div className='result-item' key={result.index}>
              index: {result.index} <span>({result.delay}s)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
