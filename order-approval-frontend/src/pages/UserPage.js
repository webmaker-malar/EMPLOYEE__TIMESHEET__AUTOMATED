import React, { useEffect, useState } from "react";
import axios from "axios";

export default function UserPage() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [budget, setBudget] = useState(0);
  const [pending, setPending] = useState(0);
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState({ itemName: "", cost: "" });

  useEffect(() => {
    fetchUsers();
    fetchOrders();
  }, []);

  async function fetchUsers() {
    try {
      const res = await axios.get("http://localhost:5000/api/users");
      setUsers(res.data);
      if (res.data.length > 0) {
        setSelectedUser(res.data[0].username);
        setBudget(res.data[0].budget);
        setPending(res.data[0].pending);
      }
    } catch {
      alert("Failed to fetch users");
    }
  }

  async function fetchOrders() {
    try {
      const res = await axios.get("http://localhost:5000/api/orders");
      setOrders(res.data);
    } catch {
      alert("Failed to fetch orders");
    }
  }

  function handleUserChange(e) {
    const username = e.target.value;
    setSelectedUser(username);
    const user = users.find((u) => u.username === username);
    if (user) {
      setBudget(user.budget);
      setPending(user.pending);
    }
  }

  function handleInputChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.itemName || !form.cost) {
      alert("Fill all order fields");
      return;
    }

    if (Number(form.cost) > pending) {
      alert("Insufficient pending budget to place this order");
      return;
    }

    try {
      await axios.post("http://localhost:5000/api/orders", {
        username: selectedUser,
        itemName: form.itemName,
        cost: Number(form.cost),
      });
      alert("Order placed");
      setForm({ itemName: "", cost: "" });
      fetchOrders();
    } catch (e) {
      alert(e.response?.data?.error || "Failed to place order");
    }
  }

  async function cancelOrder(id) {
    try {
      await axios.post("http://localhost:5000/api/orders/update", {
        id,
        status: "cancelled",
      });
      fetchOrders();
    } catch {
      alert("Failed to cancel order");
    }
  }

  const userOrders = orders.filter((o) => o.username === selectedUser);

  return (
    <div>
      <h2>User Page - Create Order</h2>
      <div>
        <label>
          Select User:
          <select value={selectedUser} onChange={handleUserChange}>
            {users.map((u) => (
              <option key={u.username} value={u.username}>
                {u.username}
              </option>
            ))}
          </select>
        </label>
        <p>
          <b>Budget:</b> {budget} &nbsp;&nbsp; <b>Pending Budget:</b> {pending}{" "}
          ;<b>Spent Amount:</b> {budget - pending}
        </p>
      </div>

      <h3>Add Order</h3>
      <form onSubmit={handleSubmit}>
        <input
          name="itemName"
          placeholder="Item Name"
          value={form.itemName}
          onChange={handleInputChange}
          required
        />
        <input
          name="cost"
          type="number"
          min="0"
          placeholder="Cost"
          value={form.cost}
          onChange={handleInputChange}
          required
        />
        <button type="submit">Submit Order</button>
      </form>

      <h3>Orders for {selectedUser}</h3>
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Cost</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {userOrders.length === 0 ? (
            <tr>
              <td colSpan="4">No orders found</td>
            </tr>
          ) : (
            userOrders.map((order) => (
              <tr key={order.id}>
                <td>{order.itemName}</td>
                <td>{order.cost}</td>
                <td>{order.status}</td>
                <td>
                  {order.status === "pending" && (
                    <button onClick={() => cancelOrder(order.id)}>
                      Cancel
                    </button>
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
