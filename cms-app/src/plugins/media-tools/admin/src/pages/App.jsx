import { Routes, Route } from 'react-router-dom';
import RotatePage from './RotatePage';

const App = () => (
  <Routes>
    <Route index element={<RotatePage />} />
    <Route path="*" element={<div>Nie znaleziono strony</div>} />
  </Routes>
);

export default App;
