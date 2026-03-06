import React, { useEffect, useState } from "react";
import axios from "axios";

export default function ApproverPage() {
  const [approvers, setApprovers] = useState([]);
  const [selectedApprover, setSelectedApprover] = useState(null);
  const [orders, setOrders] = useState([]);
  const [budgetInput, setBudgetInput] = useState("");

  useEffect(() => {
    fetchApprovers();
    fetchOrders();
  }, []);

  // Fetch all approvers
  const fetchApprovers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/approvers");
      setApprovers(res.data);
    } catch {
      alert("Failed to fetch approvers");
    }
  };

  // Fetch all pending orders
  const fetchOrders = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/orders");
      setOrders(res.data.filter((o) => o.status === "pending"));
    } catch {
      alert("Failed to fetch orders");
    }
  };

  // Handle approver dropdown change
  const handleApproverSelect = (e) => {
    const name = e.target.value;
    const approver = approvers.find((a) => a.name === name);
    setSelectedApprover(approver);
  };

  // Set or update budget for selected approver
  const setBudget = async () => {
    if (!selectedApprover || !budgetInput) return;
    try {
      await axios.post("http://localhost:5000/api/approvers", {
        name: selectedApprover.name,
        budget: Number(budgetInput),
        domain: selectedApprover.domain || "General",
      });
      await fetchApprovers(); // refresh updated data
      setBudgetInput(""); // reset input
    } catch (err) {
      alert(err.response?.data?.error || "Failed to set budget");
    }
  };

  // Approve an order
  const approveOrder = async (order) => {
    try {
      await axios.post("http://localhost:5000/api/orders/approve", {
        id: order.id,
        approverName: selectedApprover.name,
      });
      fetchOrders();
      fetchApprovers();
    } catch (e) {
      alert(e.response?.data?.error || "Approve failed");
    }
  };

  // Reject an order
  const rejectOrder = async (order) => {
    try {
      await axios.post("http://localhost:5000/api/orders/reject", {
        id: order.id,
      });
      fetchOrders();
    } catch {
      alert("Reject failed");
    }
  };

  // Forward an order
  const forwardOrder = async (order) => {
    try {
      await axios.post("http://localhost:5000/api/orders/forward", {
        id: order.id,
      });
      fetchOrders();
    } catch {
      alert("Forward failed");
    }
  };

  return (
    <div>
      <h2>Approver Dashboard</h2>

      {/* Approver Selection Dropdown */}
      <select onChange={handleApproverSelect}>
        <option value="">Select Approver</option>
        {approvers.map((a) => (
          <option key={a.id} value={a.name}>
            {a.name}
          </option>
        ))}
      </select>

      {/* Budget Management */}
      {selectedApprover && (
        <div style={{ marginTop: "15px" }}>
          <p>Total Budget: ₹{selectedApprover.budget}</p>
          <p>Remaining Budget: ₹{selectedApprover.remaining}</p>

          <input
            type="number"
            placeholder="Set new budget"
            value={budgetInput}
            onChange={(e) => setBudgetInput(e.target.value)}
          />
          <button onClick={setBudget}>Set Budget</button>
        </div>
      )}

      {/* Orders Table */}
      <h3 style={{ marginTop: "25px" }}>Pending Orders</h3>
      {selectedApprover ? (
        <table border="1" cellPadding="8" cellSpacing="0">
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Cost (₹)</th>
              <th>User</th>
              <th>Approver</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>{order.itemName}</td>
                <td>{order.cost}</td>
                <td>{order.username}</td>
                <td>{selectedApprover.name}</td>
                <td>
                  <button onClick={() => approveOrder(order)}>Approve</button>{" "}
                  <button onClick={() => rejectOrder(order)}>Reject</button>{" "}
                  <button onClick={() => forwardOrder(order)}>Forward</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>Please select an approver to view orders.</p>
      )}
    </div>
  );
}
