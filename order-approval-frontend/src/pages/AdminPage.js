import React, { useEffect, useState } from "react";
import axios from "axios";
// import e from "cors";

const domainOptions = ["Sales", "Marketing", "IT", "HR"];

export default function AdminPage() {
  const [role, setRole] = useState("user"); // user | approver
  const [users, setUsers] = useState([]);
  const [approvers, setApprovers] = useState([]);
  const [form, setForm] = useState({
    username: "",
    budget: "",
    domain: domainOptions[0],
    reviseAmount: 0,
  });
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchApprovers();
  }, []);

  async function fetchUsers() {
    try {
      const res = await axios.get("http://localhost:5000/api/users");
      setUsers(res.data);
    } catch (e) {
      alert("Failed to fetch users");
    }
  }

  async function fetchApprovers() {
    try {
      const res = await axios.get("http://localhost:5000/api/approvers");
      setApprovers(res.data);
    } catch (e) {
      alert("Failed to fetch approvers");
    }
  }

  function handleInputChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleReviseAmountChange(e) {
    const value = Number(e.target.value) || 0;
    setForm((prev) => ({ ...prev, reviseAmount: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.username || !form.budget || !form.domain) {
      alert("Fill all fields");
      return;
    }

    try {
      if (role === "user") {
        if (editingUser) {
          await axios.put(`http://localhost:5000/api/users/${form.username}`, {
            budget: Number(form.budget),
            domain: form.domain,
            revisedAmount: Number(form.reviseAmount),
          });
          alert("User updated");
        } else {
          await axios.post("http://localhost:5000/api/users", {
            username: form.username,
            budget: Number(form.budget),
            domain: form.domain,
            revisedAmount: 0,
          });
          alert("User created");
        }
        fetchUsers();
      } else {
        await axios.post("http://localhost:5000/api/approvers", {
          name: form.username,
          budget: Number(form.budget),
          domain: form.domain,
        });
        alert("Approver created");
        fetchApprovers();
      }

      setForm({
        username: "",
        budget: "",
        domain: domainOptions[0],
        reviseAmount: 0,
      });
      setEditingUser(null);
    } catch (e) {
      console.error(e.response?.data || e.message);
      alert("Failed to save data");
    }
  }

  function handleEdit(user) {
    setEditingUser(user);
    setForm({
      username: user.username,
      budget: user.budget,
      domain: user.domain,
      reviseAmount: user.revisedAmount || 0,
    });
  }

  return (
    <div>
      <h2>Admin Page - Create User / Approver</h2>

      <div style={{ marginBottom: "15px" }}>
        <label>Select Role:</label>
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="user">User</option>
          <option value="approver">Approver</option>
        </select>
      </div>

      <form onSubmit={handleSubmit} style={{ marginBottom: "20px" }}>
        <input
          name="username"
          value={form.username}
          placeholder={role === "user" ? "Username" : "Approver Name"}
          onChange={handleInputChange}
          disabled={!!editingUser && role === "user"}
          required
        />
        <input
          name="budget"
          type="number"
          min="0"
          value={form.budget}
          placeholder="Budget"
          onChange={handleInputChange}
          required
        />
        <select name="domain" value={form.domain} onChange={handleInputChange}>
          {domainOptions.map((d, i) => (
            <option key={i} value={d}>
              {d}
            </option>
          ))}
        </select>

        {role === "user" && editingUser && (
          <>
            <input
              type="number"
              name="reviseAmount"
              placeholder="Revise Amount"
              value={form.reviseAmount}
              onChange={handleReviseAmountChange}
              min="0"
            />
            <small>
              * Revise Amount will be added to user's pending budget only, not
              main budget
            </small>
          </>
        )}

        <button type="submit">
          {role === "user"
            ? editingUser
              ? "Update User"
              : "Create User"
            : "Create Approver"}
        </button>

        {editingUser && role === "user" && (
          <button
            type="button"
            onClick={() => {
              setEditingUser(null);
              setForm({
                username: "",
                budget: "",
                domain: domainOptions[0],
                reviseAmount: 0,
              });
            }}
          >
            Cancel
          </button>
        )}
      </form>

      {/* Users or Approvers Table */}
      {role === "user" ? (
        <>
          <h3>Users Table</h3>
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Domain</th>
                <th>Total Budget</th>
                <th>Remaining Budget</th>
                <th>Revised Amount</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="6">No users found</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.username}>
                    <td>{user.username}</td>
                    <td>{user.domain}</td>
                    <td>{user.pending}</td>
                    <td>{user.budget}</td>
                    <td>{user.revisedAmount || 0}</td>
                    <td>
                      <button onClick={() => handleEdit(user)}>
                        Update Budget
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </>
      ) : (
        <>
          <h3>Approvers Table</h3>
          <table>
            <thead>
              <tr>
                <th>Approver Name</th>
                <th>Domain</th>
                <th>Total Budget</th>
                <th>Remaining</th>
              </tr>
            </thead>
            <tbody>
              {approvers.length === 0 ? (
                <tr>
                  <td colSpan="4">No Approver found</td>
                </tr>
              ) : (
                approvers.map((a) => (
                  <tr key={a.name}>
                    <td>{a.name}</td>
                    <td>{a.domain}</td>
                    <td>{a.budget}</td>
                    <td>{a.remaining}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
