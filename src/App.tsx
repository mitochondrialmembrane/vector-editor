import Toolbar from './components/Toolbar';
import CanvasContainer from './components/CanvasContainer';
import Sidebar from './components/Sidebar';
import './App.css';

function App() {
  return (
    <div className="app">
      <Toolbar />
      <div className="workspace">
        <CanvasContainer />
        <Sidebar />
      </div>
    </div>
  );
}

export default App;
