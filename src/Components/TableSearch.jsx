import React, { useState } from 'react';

export default function TableSearch({ onSubmit }) {
  const [table, setTable] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (table.trim()) {
      onSubmit(table.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Enter Table Number"
        value={table}
        onChange={(e) => setTable(e.target.value)}
        className="p-2 border rounded"
      />
      <button type="submit" className="ml-2 p-2 bg-blue-600 text-white rounded">
        Go
      </button>
    </form>
  );
}
