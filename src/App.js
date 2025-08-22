import React, { useState } from 'react';
import TableSearch from './Components/TableSearch';
import MapViewer from './Components/MapViewer';
import { tableMap } from './utils/mapCoordinates';

import { pdfjs } from 'react-pdf';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.js?worker';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import './App.css';

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

function App() {
  const [enteredTable, setEnteredTable] = useState(null);
  const [showMap, setShowMap] = useState(false);

  const handleSearch = (tableNum) => {
    setEnteredTable(tableNum.trim());
    setShowMap(true);
  };

  const tableKey = enteredTable?.trim().toString();
  const highlight = tableMap[tableKey] || null;

  return (
    <div className="App" style={{ textAlign: 'center', padding: '2rem' }}>
      <h1>Find Your Table</h1>
      <TableSearch onSubmit={handleSearch} />

      {!showMap && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: '2rem',
          }}
        >
          <img
            src="/gotsole.png"
            alt="Got Sole"
            style={{
              maxWidth: '200px',
              height: 'auto',
            }}
          />
        </div>
      )}

      {showMap && enteredTable && (
        <div style={{ marginTop: '2rem' }}>
          <p>
            Showing map for table: <strong>{enteredTable}</strong>{' '}
            {!highlight && <span style={{ color: 'red' }}>(Not Found)</span>}
          </p>

          <div style={{ position: 'relative', display: 'inline-block' }}>
            <MapViewer
              file="/floorplan.pdf"
              highlight={highlight}
              tableNumber={parseInt(enteredTable, 10)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
