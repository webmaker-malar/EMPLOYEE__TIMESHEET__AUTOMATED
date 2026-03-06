import React, { useEffect, useState } from "react";
import axios from "axios";

export default function PurchasePage() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
      const res = await axios.get("http://localhost:5000/api/orders");
      // Show orders with status approved or rejected
      setOrders(res.data.filter((o) => o.status === "forwarded"));
    } catch {
      alert("Failed to fetch orders");
    }
  }

  async function approvePurchase(id) {
    try {
      await axios.post("http://localhost:5000/api/orders/approve", {
        id,
      });
      fetchOrders();
    } catch {
      alert("Failed to approve purchase");
    }
  }

  async function rejectPurchase(id) {
    try {
      await axios.post("http://localhost:5000/api/orders/reject", {
        id,
      });
      fetchOrders();
    } catch {
      alert("Failed to reject purchase");
    }
  }

  return (
    <div>
      <h2>Purchase Page</h2>
      <table>
        <thead>
          <tr>
            <th>Username</th>
            <th>Item</th>
            <th>Cost</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 ? (
            <tr>
              <td colSpan="5">No orders for purchase team</td>
            </tr>
          ) : (
            orders.map((order) => (
              <tr key={order.id}>
                <td>{order.username}</td>
                <td>{order.itemName}</td>
                <td>{order.cost}</td>
                <td>{order.status}</td>
                <td>
                  {order.status === "pending" ? (
                    <>
                      <button onClick={() => approvePurchase(order.id)}>
                        Approve
                      </button>
                      <button onClick={() => rejectPurchase(order.id)}>
                        Reject
                      </button>
                    </>
                  ) : (
                    <em>No actions available</em>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
