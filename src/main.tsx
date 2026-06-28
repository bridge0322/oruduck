import { createRoot } from "react-dom/client";
import "@phosphor-icons/web/regular";
import "@phosphor-icons/web/bold";
import "@phosphor-icons/web/fill";
import "./tokens.css";
import { App } from "./features/tracker/App";

createRoot(document.getElementById("root")!).render(<App />);
