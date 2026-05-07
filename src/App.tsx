import Toolbar from './components/Toolbar';
import CanvasContainer from './components/CanvasContainer';
import Sidebar from './components/Sidebar';
import { ActiveToolProvider } from './context/ActiveToolContext';
import { DocumentProvider } from './context/DocumentContext';
import './App.css';


function App() {
  return (
    <DocumentProvider>
      <ActiveToolProvider>
        <div className="app">
          <Toolbar />
          <div className="workspace">
            <CanvasContainer />
            <Sidebar />
          </div>
        </div>
      </ActiveToolProvider>
    </DocumentProvider>
  );
}

export default App;
