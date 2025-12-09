# React Documentation Repository

React is a JavaScript library for building user interfaces that focuses on component-based architecture and declarative programming. This documentation repository contains comprehensive guides, API references, and learning materials covering React's core concepts from basic components to advanced patterns like hooks, concurrent rendering, and server components. The library emphasizes composability, enabling developers to create reusable UI elements that combine markup, logic, and styling within component boundaries.

The documentation is structured to serve both newcomers learning React fundamentals and experienced developers implementing production applications. It covers essential topics including JSX syntax, state management with hooks, side effects, performance optimization through memoization, and integration with modern full-stack frameworks. With over 100,000 React components at Meta validating each release and a community of millions worldwide, React represents both a mature library and an evolving ecosystem for building web and native applications.

## Components

### Creating React Components

React components are JavaScript functions that return JSX markup to describe UI elements. Components must start with capital letters and can accept props for customization.

```javascript
// Basic functional component
function Profile() {
  return (
    <img
      src="https://i.imgur.com/MK3eW3As.jpg"
      alt="Katherine Johnson"
    />
  );
}

// Component composition
export default function Gallery() {
  return (
    <section>
      <h1>Amazing scientists</h1>
      <Profile />
      <Profile />
      <Profile />
    </section>
  );
}
```

### Rendering Lists with Map

Transform arrays into component lists using JavaScript's `map()` method. Each list item requires a unique `key` prop for React's reconciliation algorithm.

```javascript
const people = [
  'Creola Katherine Johnson: mathematician',
  'Mario José Molina-Pasquel Henríquez: chemist',
  'Mohammad Abdus Salam: physicist',
  'Percy Lavon Julian: chemist',
  'Subrahmanyan Chandrasekhar: astrophysicist'
];

export default function List() {
  const listItems = people.map((person, index) =>
    <li key={index}>{person}</li>
  );
  return <ul>{listItems}</ul>;
}
```

## Hooks API

### useState Hook

Declares state variables that persist between renders. Returns current state and updater function. State updates trigger component re-renders.

```javascript
import { useState } from 'react';

function ImageGallery() {
  const [index, setIndex] = useState(0);
  const [items, setItems] = useState([]);

  const handleNext = () => {
    setIndex(prevIndex => prevIndex + 1);
  };

  const handleAdd = (item) => {
    setItems(prevItems => [...prevItems, item]);
  };

  return (
    <div>
      <p>Current index: {index}</p>
      <button onClick={handleNext}>Next</button>
      <button onClick={() => handleAdd('New Item')}>Add Item</button>
      <p>Total items: {items.length}</p>
    </div>
  );
}
```

### useEffect Hook

Synchronizes components with external systems like network connections, browser APIs, or third-party libraries. Accepts setup function and dependency array.

```javascript
import { useState, useEffect } from 'react';
import { createConnection } from './chat.js';

function ChatRoom({ roomId }) {
  const [serverUrl, setServerUrl] = useState('https://localhost:1234');

  useEffect(() => {
    const connection = createConnection(serverUrl, roomId);
    connection.connect();

    return () => {
      connection.disconnect();
    };
  }, [serverUrl, roomId]);

  return (
    <>
      <label>
        Server URL:{' '}
        <input
          value={serverUrl}
          onChange={e => setServerUrl(e.target.value)}
        />
      </label>
      <h1>Welcome to the {roomId} room!</h1>
    </>
  );
}
```

### useEffect Data Fetching Pattern

Fetch data with proper race condition handling using cleanup functions and ignore flags to prevent stale updates.

```javascript
import { useState, useEffect } from 'react';
import { fetchBio } from './api.js';

export default function Page() {
  const [person, setPerson] = useState('Alice');
  const [bio, setBio] = useState(null);

  useEffect(() => {
    let ignore = false;
    setBio(null);

    async function startFetching() {
      const result = await fetchBio(person);
      if (!ignore) {
        setBio(result);
      }
    }

    startFetching();

    return () => {
      ignore = true;
    };
  }, [person]);

  return (
    <>
      <select value={person} onChange={e => setPerson(e.target.value)}>
        <option value="Alice">Alice</option>
        <option value="Bob">Bob</option>
        <option value="Taylor">Taylor</option>
      </select>
      <hr />
      <p><i>{bio ?? 'Loading...'}</i></p>
    </>
  );
}
```

### useContext Hook

Reads and subscribes to React context values, enabling data sharing across component trees without prop drilling.

```javascript
import { useContext, createContext } from 'react';

const ThemeContext = createContext('light');

function Button() {
  const theme = useContext(ThemeContext);
  const className = `button-${theme}`;

  return (
    <button className={className}>
      Click me
    </button>
  );
}

export default function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Button />
    </ThemeContext.Provider>
  );
}
```

### useCallback Hook

Memoizes function definitions to prevent unnecessary re-renders when passing callbacks to optimized child components.

```javascript
import { useState, useCallback } from 'react';
import { memo } from 'react';

const ExpensiveComponent = memo(({ onClick }) => {
  console.log('ExpensiveComponent rendered');
  return <button onClick={onClick}>Click</button>;
});

export default function Parent() {
  const [count, setCount] = useState(0);
  const [other, setOther] = useState(0);

  const handleClick = useCallback(() => {
    setCount(c => c + 1);
  }, []);

  return (
    <div>
      <p>Count: {count}</p>
      <p>Other: {other}</p>
      <ExpensiveComponent onClick={handleClick} />
      <button onClick={() => setOther(o => o + 1)}>
        Increment Other
      </button>
    </div>
  );
}
```

### useMemo Hook

Caches expensive calculation results between renders to optimize performance when dependencies haven't changed.

```javascript
import { useMemo, useState } from 'react';

function TodoList({ todos, tab, theme }) {
  const [filter, setFilter] = useState('');

  const visibleTodos = useMemo(() => {
    console.log('Filtering todos...');
    return todos
      .filter(todo => todo.tab === tab)
      .filter(todo => todo.text.includes(filter));
  }, [todos, tab, filter]);

  const todoCount = useMemo(() => {
    return visibleTodos.reduce((sum, todo) => {
      return sum + (todo.completed ? 0 : 1);
    }, 0);
  }, [visibleTodos]);

  return (
    <div>
      <input
        value={filter}
        onChange={e => setFilter(e.target.value)}
        placeholder="Search todos..."
      />
      <p>{todoCount} todos remaining</p>
      <ul>
        {visibleTodos.map(todo => (
          <li key={todo.id}>{todo.text}</li>
        ))}
      </ul>
    </div>
  );
}
```

### useRef Hook

Persists values between renders without triggering re-renders. Commonly used for DOM node references and mutable values.

```javascript
import { useRef, useEffect } from 'react';

function Form() {
  const inputRef = useRef(null);
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    inputRef.current?.focus();
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Input value:', inputRef.current.value);
    console.log('Render count:', renderCount.current);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input ref={inputRef} type="text" />
      <button type="submit">Submit</button>
    </form>
  );
}
```

### useTransition Hook

Marks state updates as non-blocking transitions, allowing high-priority updates to interrupt low-priority rendering work.

```javascript
import { useState, useTransition } from 'react';

function SearchResults({ query }) {
  const [results, setResults] = useState([]);
  const [isPending, startTransition] = useTransition();

  const handleSearch = (searchTerm) => {
    startTransition(() => {
      const filtered = performExpensiveSearch(searchTerm);
      setResults(filtered);
    });
  };

  return (
    <div>
      <input
        type="text"
        onChange={e => handleSearch(e.target.value)}
        placeholder="Search..."
      />
      {isPending && <p>Loading...</p>}
      <ul>
        {results.map(result => (
          <li key={result.id}>{result.name}</li>
        ))}
      </ul>
    </div>
  );
}

function performExpensiveSearch(query) {
  // Simulate expensive filtering operation
  return largeDataset.filter(item =>
    item.name.toLowerCase().includes(query.toLowerCase())
  );
}
```

### useDeferredValue Hook

Defers updating non-critical UI parts, keeping the interface responsive during expensive operations.

```javascript
import { useState, useDeferredValue, memo } from 'react';

function SearchPage() {
  const [searchText, setSearchText] = useState('');
  const deferredSearchText = useDeferredValue(searchText);

  return (
    <>
      <input
        value={searchText}
        onChange={e => setSearchText(e.target.value)}
        placeholder="Type to search..."
      />
      <SearchResults query={deferredSearchText} />
    </>
  );
}

const SearchResults = memo(({ query }) => {
  const results = performSlowSearch(query);

  return (
    <ul>
      {results.map(result => (
        <li key={result.id}>{result.title}</li>
      ))}
    </ul>
  );
});

function performSlowSearch(query) {
  const startTime = performance.now();
  while (performance.now() - startTime < 100) {
    // Artificial delay to simulate expensive operation
  }
  return query ? mockDatabase.filter(item =>
    item.title.toLowerCase().includes(query.toLowerCase())
  ) : [];
}
```

### useEffectEvent Hook

Reads latest props and state from Effects without declaring them as reactive dependencies, separating reactive from non-reactive code.

```javascript
import { useEffect, useEffectEvent } from 'react';

function Page({ url, shoppingCart }) {
  const onVisit = useEffectEvent(visitedUrl => {
    logVisit(visitedUrl, shoppingCart.length);
    sendAnalytics(visitedUrl, {
      cartSize: shoppingCart.length,
      timestamp: Date.now()
    });
  });

  useEffect(() => {
    onVisit(url);
  }, [url]);

  return <PageContent url={url} />;
}

function logVisit(url, cartSize) {
  console.log(`Visited ${url} with ${cartSize} items in cart`);
}

function sendAnalytics(url, data) {
  fetch('/api/analytics', {
    method: 'POST',
    body: JSON.stringify({ url, ...data })
  });
}
```

## Performance Optimization

### React.memo for Component Memoization

Prevents re-renders when props haven't changed. Wraps components to optimize rendering performance for expensive child components.

```javascript
import { memo, useState } from 'react';

const Greeting = memo(function Greeting({ name }) {
  console.log("Greeting rendered at", new Date().toLocaleTimeString());
  return <h3>Hello{name && ', '}{name}!</h3>;
});

export default function MyApp() {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');

  return (
    <>
      <label>
        Name:{' '}
        <input value={name} onChange={e => setName(e.target.value)} />
      </label>
      <label>
        Address:{' '}
        <input value={address} onChange={e => setAddress(e.target.value)} />
      </label>
      <Greeting name={name} />
    </>
  );
}
```

### Custom Comparison Function with memo

Provides fine-grained control over re-render decisions by specifying custom prop equality logic.

```javascript
import { memo } from 'react';

const Chart = memo(
  function Chart({ dataPoints, scale }) {
    console.log('Chart rendering with', dataPoints.length, 'points');
    return (
      <svg width={500} height={300}>
        {dataPoints.map((point, i) => (
          <circle
            key={i}
            cx={point.x * scale}
            cy={point.y * scale}
            r={3}
            fill="blue"
          />
        ))}
      </svg>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.scale === nextProps.scale &&
      prevProps.dataPoints.length === nextProps.dataPoints.length &&
      prevProps.dataPoints.every((point, i) =>
        point.x === nextProps.dataPoints[i].x &&
        point.y === nextProps.dataPoints[i].y
      )
    );
  }
);

export default function ChartContainer({ data }) {
  const [scale, setScale] = useState(1);

  return (
    <div>
      <input
        type="range"
        min="0.5"
        max="2"
        step="0.1"
        value={scale}
        onChange={e => setScale(parseFloat(e.target.value))}
      />
      <Chart dataPoints={data} scale={scale} />
    </div>
  );
}
```

### Lazy Loading with React.lazy

Code-splits components to reduce initial bundle size by loading components only when needed.

```javascript
import { lazy, Suspense, useState } from 'react';

const HeavyComponent = lazy(() => import('./HeavyComponent'));
const Dashboard = lazy(() => import('./Dashboard'));
const Settings = lazy(() => import('./Settings'));

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');

  return (
    <div>
      <nav>
        <button onClick={() => setCurrentPage('home')}>Home</button>
        <button onClick={() => setCurrentPage('dashboard')}>Dashboard</button>
        <button onClick={() => setCurrentPage('settings')}>Settings</button>
      </nav>

      <Suspense fallback={<div>Loading page...</div>}>
        {currentPage === 'home' && <HomePage />}
        {currentPage === 'dashboard' && <Dashboard />}
        {currentPage === 'settings' && <Settings />}
      </Suspense>
    </div>
  );
}

function HomePage() {
  return <h1>Welcome Home</h1>;
}
```

## Advanced Patterns

### Suspense for Data Loading

Declaratively specify loading states while components fetch data or load code-split chunks.

```javascript
import { Suspense } from 'react';

function ConferencePage({ slug }) {
  return (
    <ConferenceLayout conf={conf}>
      <Suspense fallback={<TalksLoading />}>
        <Talks confId={conf.id} />
      </Suspense>
    </ConferenceLayout>
  );
}

async function Talks({ confId }) {
  const talks = await db.Talks.findAll({ confId });
  const videos = talks.map(talk => talk.video);
  return <SearchableVideoList videos={videos} />;
}

function TalksLoading() {
  return (
    <div className="loading-container">
      <div className="spinner" />
      <p>Loading conference talks...</p>
    </div>
  );
}
```

### Custom Hooks

Encapsulates reusable stateful logic into composable functions that can be shared across components.

```javascript
import { useEffect, useState } from 'react';

function useChatRoom({ serverUrl, roomId }) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const options = { serverUrl, roomId };
    const connection = createConnection(options);

    connection.on('connected', () => setIsConnected(true));
    connection.on('error', err => setError(err));
    connection.connect();

    return () => {
      connection.disconnect();
      setIsConnected(false);
    };
  }, [roomId, serverUrl]);

  return { isConnected, error };
}

// Usage in component
function ChatRoom({ roomId }) {
  const [serverUrl, setServerUrl] = useState('https://localhost:1234');
  const { isConnected, error } = useChatRoom({ roomId, serverUrl });

  return (
    <>
      <label>
        Server URL:{' '}
        <input
          value={serverUrl}
          onChange={e => setServerUrl(e.target.value)}
        />
      </label>
      <h1>Welcome to the {roomId} room!</h1>
      {error && <p className="error">Error: {error.message}</p>}
      <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
    </>
  );
}
```

### Controlling Non-React Widgets

Integrates third-party libraries with React lifecycle using Effects to synchronize external state.

```javascript
import { useRef, useEffect } from 'react';
import { MapWidget } from './map-widget.js';

export default function Map({ zoomLevel, markers, onMarkerClick }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (mapRef.current === null) {
      mapRef.current = new MapWidget(containerRef.current);
    }

    const map = mapRef.current;
    map.setZoom(zoomLevel);
  }, [zoomLevel]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    map.clearMarkers();
    markers.forEach(marker => {
      map.addMarker(marker.lat, marker.lng, {
        onClick: () => onMarkerClick(marker)
      });
    });

    return () => {
      map.clearMarkers();
    };
  }, [markers, onMarkerClick]);

  return (
    <div
      style={{ width: 600, height: 400 }}
      ref={containerRef}
    />
  );
}
```

### Class Components (Legacy)

Legacy API for defining components as classes. Modern codebases should use function components with hooks instead.

```javascript
import { Component } from 'react';

class Counter extends Component {
  state = {
    count: 0,
    step: 1
  };

  handleIncrement = () => {
    this.setState(prevState => ({
      count: prevState.count + prevState.step
    }));
  };

  componentDidMount() {
    console.log('Counter mounted');
    document.title = `Count: ${this.state.count}`;
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.count !== this.state.count) {
      document.title = `Count: ${this.state.count}`;
    }
  }

  componentWillUnmount() {
    console.log('Counter unmounting');
  }

  render() {
    return (
      <div>
        <p>Count: {this.state.count}</p>
        <button onClick={this.handleIncrement}>
          Increment by {this.state.step}
        </button>
        <input
          type="number"
          value={this.state.step}
          onChange={e => this.setState({ step: parseInt(e.target.value) })}
        />
      </div>
    );
  }
}

export default Counter;
```

## Summary

React's documentation demonstrates a comprehensive library ecosystem centered on component composition, declarative UI patterns, and progressive enhancement. The core APIs—components, hooks, and performance utilities—provide building blocks for applications ranging from simple interactive widgets to complex full-stack frameworks. Key integration patterns include hooks for state management and side effects, memoization techniques for performance optimization, and Suspense boundaries for coordinated loading states.

Modern React development emphasizes function components with hooks over class components, leveraging patterns like custom hooks for reusable logic, memo for render optimization, and code-splitting with lazy loading for improved performance. The framework-agnostic design allows integration with various rendering strategies including client-side rendering, server-side rendering, and static generation through frameworks like Next.js and Remix. With automatic memoization through the React Compiler and concurrent features like transitions and deferred values, React continues evolving toward simpler, more performant development patterns while maintaining backward compatibility for existing applications.
