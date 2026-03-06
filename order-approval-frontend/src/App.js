import React, { useState } from "react";
import AdminPage from "./pages/AdminPage";
import UserPage from "./pages/UserPage";
import ApproverPage from "./pages/ApproverPage";
import PurchasePage from "./pages/PurchasePage";

export default function App() {
  const [page, setPage] = useState("admin");

  return (
    <div>
      <nav className="navbar">
        <button onClick={() => setPage("admin")}>Admin</button>
        <button onClick={() => setPage("user")}>User</button>
        <button onClick={() => setPage("approver")}>Approver</button>
        <button onClick={() => setPage("purchase")}>Purchase</button>
      </nav>

      <div className="page-container">
        {page === "admin" && <AdminPage />}
        {page === "user" && <UserPage />}
        {page === "approver" && <ApproverPage />}
        {page === "purchase" && <PurchasePage />}
      </div>
    </div>
  );
}
