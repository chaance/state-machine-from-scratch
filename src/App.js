import React, { useState } from "react";
import "./App.css";

/**
 * A simple button for fetching some data.
 *
 * When the user clicks the button, we want to:
 *   - start fetching data
 *   - change the display of the button to indicate fetching is
 *     happening
 *   - disable the button so clicks do not work while fetching
 *
 * When the fetch is complete, we want to:
 *   - check if the data came back successfully
 *   - if so:
 *       - display the data
 *       - update the button label to show our fetch was OK
 *       - remove it from the screen since we don't need it
 *         anymore!
 *
 *   - if not:
 *       - provide an error message
 *       - reset the button label and its disabled state so
 *         the user can try again.
 */
let user = "chancestrickland";
let repo = "state-machine-from-scratch";
let url = `https://my-json-server.typicode.com/${user}/${repo}/posts/1`;

function App() {
  let [data, setData] = useState(null);
  let [error, setError] = useState(null);
  return (
    <div className="App">
      <header className="App-header">
        {data && (
          <pre
            style={{
              maxWidth: 300
            }}
          >
            {JSON.stringify(data)}
          </pre>
        )}
        <button
          className="button fetch-button"
          onClick={() => {
            fetch(url)
              .then(res => res.json())
              .then(data => setData(data))
              .catch(err => setError(err));
          }}
        >
          Get My Data!
        </button>
        <button
          className="button reset-button"
          onClick={() => {
            setData(null);
            setError(null);
          }}
        >
          Reset
        </button>
      </header>
    </div>
  );
}

export default App;
