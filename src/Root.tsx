import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "antd-mobile/es/global";
import "./styles/global.css";
import PwaUpdater from "./components/PwaUpdater";

export default function Root() {
  return (
    <BrowserRouter>
      <App />
      <PwaUpdater />
    </BrowserRouter>
  );
}
